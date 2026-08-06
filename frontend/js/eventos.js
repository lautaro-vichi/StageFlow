// =========================================================================
// CONFIGURACIÓN GLOBAL Y HELPERS REUTILIZABLES
// =========================================================================
const API_URL = "http://localhost:3000";
let eventoSeleccionadoId = null;
let eventoSeleccionadoEstado = "";

// Helper genérico para peticiones HTTP
async function apiFetch(endpoint, method = "GET", body = null) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.mensaje || data.error || "Error en la operación");
    return data;
}

const formatearFechaParaInput = str => str ? new Date(String(str).replace(" ", "T")).toISOString().slice(0, 16) : "";
const formatearFecha = str => str ? new Date(String(str).replace(" ", "T")).toLocaleString() : "No especificada";

function obtenerColorTagEstado(status) {
    const colores = { confirmado: "is-success", "en curso": "is-warning", finalizado: "is-dark", cancelado: "is-danger" };
    return colores[status] || "is-info";
}

function obtenerEstadoCalculado(ev) {
    if (ev.status === "cancelado") return "cancelado";

    const ahora = new Date();
    const inicio = new Date(String(ev.start_time || ev.inicio).replace(" ", "T"));
    const fin = new Date(String(ev.end_time || ev.fin).replace(" ", "T"));

    if (ahora >= inicio && ahora <= fin) {
        return "en curso";
    } else if (ahora > fin) {
        return "finalizado";
    }
    return ev.status || "planificado";
}

// =========================================================================
// INICIALIZACIÓN Y EVENT LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarEventos();
    cargarArtistasGlobales();
    cargarCatalogoRecursos();

    document.getElementById("form-evento")?.addEventListener("submit", guardarEvento);
    document.getElementById("form-artista")?.addEventListener("submit", guardarArtista);
    document.getElementById("form-recurso")?.addEventListener("submit", guardarRecurso);
});

// =========================================================================
// 1. MÓDULO: ARTISTAS (CRUD COMPLETO)
// =========================================================================
async function cargarArtistasGlobales() {
    try {
        const artistas = await apiFetch("/artists");
        const contenedor = document.getElementById("lista-artistas");
        const selectModal = document.getElementById("modal-select-artista");

        if (contenedor) {
            contenedor.innerHTML = artistas.length === 0 ? '<p class="has-text-grey-light is-italic">No hay artistas registrados.</p>' : "";
            artistas.forEach(a => {
                const item = document.createElement("div");
                item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2";
                item.style.cssText = "background-color: #1f1f1f; border-radius: 4px;";
                item.innerHTML = `
                    <div class="is-size-7">
                        <strong class="has-text-white">${a.name}</strong> 
                        <span class="has-text-info">(${a.genre || "Sin género"})</span>
                        <br><span class="has-text-grey-light">Origen: ${a.nationality || "N/A"} | Edad/Trayectoria: ${a.age ?? "N/A"}</span>
                    </div>
                    <div>
                        <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionArtista(${JSON.stringify(a).replace(/'/g, "&apos;")})'>✏️</button>
                        <button class="button is-danger is-small py-0 px-2" onclick="eliminarArtista(${a.id})">🗑️</button>
                    </div>`;
                contenedor.appendChild(item);
            });
        }

        if (selectModal) {
            selectModal.innerHTML = '<option value="">-- Elegir Artista --</option>' + 
                artistas.map(a => `<option value="${a.id}">${a.name} (${a.genre || "Sin género"})</option>`).join("");
        }
    } catch (e) { console.error("Error al cargar artistas:", e); }
}

async function guardarArtista(e) {
    e.preventDefault();
    const id = document.getElementById("artista-id").value;
    
    const payload = {
        name: document.getElementById("nombre-artista").value.trim(),
        genre: document.getElementById("genero-artista").value.trim(),
        description: document.getElementById("descripcion-artista").value.trim(),
        age: Number(document.getElementById("edad-artista").value),
        nationality: document.getElementById("nacionalidad-artista").value.trim()
    };

    try {
        const data = await apiFetch(id ? `/artists/${id}` : "/artists", id ? "PUT" : "POST", payload);
        alert(data.mensaje || "Artista guardado correctamente.");
        cancelarEdicionArtista();
        cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

function prepararEdicionArtista(a) {
    document.getElementById("artista-id").value = a.id;
    document.getElementById("nombre-artista").value = a.name;
    document.getElementById("genero-artista").value = a.genre || "";
    document.getElementById("edad-artista").value = a.age ?? "";
    document.getElementById("nacionalidad-artista").value = a.nationality || "";
    document.getElementById("descripcion-artista").value = a.description || "";

    document.getElementById("titulo-form-artista").innerText = "✏️ Editar Artista";
    document.getElementById("btn-guardar-artista").innerText = "ACTUALIZAR ARTISTA";
    document.getElementById("btn-cancelar-artista")?.classList.remove("is-hidden");
}

function cancelarEdicionArtista() {
    document.getElementById("form-artista").reset();
    document.getElementById("artista-id").value = "";
    document.getElementById("titulo-form-artista").innerText = "✨ Agendar / Editar Artista";
    document.getElementById("btn-guardar-artista").innerText = "GUARDAR ARTISTA";
    document.getElementById("btn-cancelar-artista")?.classList.add("is-hidden");
}

async function eliminarArtista(id) {
    if (!confirm("¿Desea eliminar este artista?")) return;
    try {
        const data = await apiFetch(`/artists/${id}`, "DELETE");
        alert(data.mensaje || "Artista eliminado.");
        cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// =========================================================================
// 2. MÓDULO: RECURSOS (CRUD COMPLETO)
// =========================================================================
async function cargarCatalogoRecursos() {
    try {
        const recursos = await apiFetch("/resources");
        const contenedor = document.getElementById("lista-recursos");
        const selectModal = document.getElementById("modal-select-recurso");

        if (contenedor) {
            contenedor.innerHTML = recursos.length === 0 ? '<p class="has-text-grey-light is-italic">No hay recursos registrados.</p>' : "";
            recursos.forEach(r => {
                const item = document.createElement("div");
                item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2";
                item.style.cssText = "background-color: #1f1f1f; border-radius: 4px;";
                item.innerHTML = `
                    <div class="is-size-7">
                        <strong class="has-text-white">${r.name}</strong> 
                        <span class="tag is-info is-light py-0 px-1 ml-1">${r.type || "General"}</span><br>
                        <span class="has-text-grey-light">Total: ${r.total_quantity ?? r.quantity ?? 0} | Disp: ${r.available_quantity ?? 0}</span>
                    </div>
                    <div>
                        <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionRecurso(${JSON.stringify(r).replace(/'/g, "&apos;")})'>✏️</button>
                        <button class="button is-danger is-small py-0 px-2" onclick="eliminarRecurso(${r.id})">🗑️</button>
                    </div>`;
                contenedor.appendChild(item);
            });
        }

        if (selectModal) {
            selectModal.innerHTML = '<option value="">-- Elegir Recurso --</option>' + 
                recursos.map(r => `<option value="${r.id}">${r.name} (Disp: ${r.available_quantity ?? 0})</option>`).join("");
        }
    } catch (e) { console.error("Error al cargar recursos:", e); }
}

async function guardarRecurso(e) {
    e.preventDefault();
    const id = document.getElementById("recurso-id").value;

    const nombreVal = document.getElementById("nombre-recurso").value.trim();
    const tipoVal = document.getElementById("tipo-recurso").value.trim();
    const descVal = document.getElementById("descripcion-recurso").value.trim();
    
    const cantidadVal = id 
        ? (Number(document.getElementById("cantidad-disponible-recurso")?.value) || 0) 
        : 1;

    const payload = {
        name: nombreVal,
        type: tipoVal,
        description: descVal,
        available_quantity: cantidadVal,
        total_quantity: cantidadVal,
        quantity: cantidadVal
    };

    try {
        const url = id ? `/resources/${id}` : "/resources";
        const method = id ? "PUT" : "POST";
        
        const data = await apiFetch(url, method, payload);
        alert(data.mensaje || data.message || "Recurso guardado correctamente.");
        
        cancelarEdicionRecurso();
        cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

function prepararEdicionRecurso(r) {
    document.getElementById("recurso-id").value = r.id;
    document.getElementById("nombre-recurso").value = r.name;
    document.getElementById("tipo-recurso").value = r.type || "";
    document.getElementById("descripcion-recurso").value = r.description || "";

    const campoCantidad = document.getElementById("campo-cantidad-disponible");
    if (campoCantidad) {
        campoCantidad.classList.remove("is-hidden");
        document.getElementById("cantidad-disponible-recurso").value = r.available_quantity ?? 0;
    }

    document.getElementById("titulo-form-recurso").innerText = "✏️ Editar Recurso";
    document.getElementById("btn-guardar-recurso").innerText = "ACTUALIZAR RECURSO";
    document.getElementById("btn-cancelar-recurso")?.classList.remove("is-hidden");
}

function cancelarEdicionRecurso() {
    document.getElementById("form-recurso").reset();
    document.getElementById("recurso-id").value = "";
    document.getElementById("campo-cantidad-disponible")?.classList.add("is-hidden");
    document.getElementById("titulo-form-recurso").innerText = "🛠️ Registrar / Editar Recurso";
    document.getElementById("btn-guardar-recurso").innerText = "GUARDAR RECURSO";
    document.getElementById("btn-cancelar-recurso")?.classList.add("is-hidden");
}

async function eliminarRecurso(id) {
    if (!confirm("¿Desea eliminar este recurso?")) return;
    try {
        const data = await apiFetch(`/resources/${id}`, "DELETE");
        alert(data.mensaje || "Recurso eliminado.");
        cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// =========================================================================
// 3. MÓDULO: EVENTOS (CRUD COMPLETO)
// =========================================================================
async function cargarEventos() {
    try {
        const eventos = await apiFetch("/events");
        const contenedor = document.getElementById("contenedor-eventos");
        const mensajeVacio = document.getElementById("mensaje-vacio");

        contenedor.innerHTML = "";
        mensajeVacio.classList.toggle("is-hidden", eventos.length > 0);

        eventos.forEach(ev => {
            const estadoActual = obtenerEstadoCalculado(ev);
            const isFinalizado = estadoActual === "finalizado";

            const col = document.createElement("div");
            col.className = "column is-one-third-desktop is-half-tablet";
            col.innerHTML = `
                <div class="box">
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                        <span class="tag ${obtenerColorTagEstado(estadoActual)}">${estadoActual}</span>
                        <small class="has-text-grey-light">ID #${ev.id}</small>
                    </div>
                    <h4 class="title is-4 has-text-white mb-2">${ev.name}</h4>
                    <p class="subtitle is-6 has-text-grey-light mb-3">${ev.description || "Sin descripción"}</p>
                    <div class="is-size-7 mb-4">
                        <p><strong>📍 Lugar:</strong> ${ev.location}</p>
                        <p><strong>🕒 Inicio:</strong> ${formatearFecha(ev.start_time || ev.inicio)}</p>
                        <p><strong>🏁 Fin:</strong> ${formatearFecha(ev.end_time || ev.fin)}</p>
                    </div>
                    <button class="button is-info is-small is-fullwidth mb-2" onclick="abrirModalDetalles(${ev.id})">🔍 Gestionar Asignaciones</button>
                    ${!isFinalizado ? `
                        <div class="buttons is-flex">
                            <button class="button is-warning is-small is-flex-grow-1" onclick='prepararEdicionEvento(${JSON.stringify(ev).replace(/'/g, "&apos;")})'>✏️ Editar</button>
                            <button class="button is-danger is-small is-flex-grow-1" onclick="eliminarEvento(${ev.id})">🗑️ Eliminar</button>
                        </div>` : `<button class="button is-static is-small is-fullwidth" disabled>🔒 Evento Finalizado</button>`}
                </div>`;
            contenedor.appendChild(col);
        });
    } catch (e) { console.error("Error al cargar eventos:", e); }
}

async function guardarEvento(e) {
    e.preventDefault();
    const id = document.getElementById("evento-id").value;
    const estadoGuardar = id ? document.getElementById("estado").value : "planificado";

    const payload = {
        name: document.getElementById("nombre").value.trim(),
        description: document.getElementById("descripcion").value.trim(),
        location: document.getElementById("lugar").value.trim(),
        start_time: document.getElementById("start-time").value,
        end_time: document.getElementById("end-time").value,
        status: estadoGuardar
    };

    try {
        const data = await apiFetch(id ? `/events/${id}` : "/events", id ? "PUT" : "POST", payload);
        alert(data.mensaje || "Evento guardado.");
        cancelarEdicion();
        cargarEventos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

function prepararEdicionEvento(ev) {
    document.getElementById("evento-id").value = ev.id;
    document.getElementById("nombre").value = ev.name;
    document.getElementById("descripcion").value = ev.description;
    document.getElementById("lugar").value = ev.location;
    document.getElementById("start-time").value = formatearFechaParaInput(ev.start_time);
    document.getElementById("end-time").value = formatearFechaParaInput(ev.end_time);

    const campoEstado = document.getElementById("campo-estado-evento");
    if (campoEstado) {
        campoEstado.classList.remove("is-hidden");
        document.getElementById("estado").value = ev.status;
    }

    document.getElementById("titulo-form-evento").innerText = "✏️ Editar Evento";
    document.getElementById("btn-guardar-evento").innerText = "ACTUALIZAR EVENTO";
    document.getElementById("btn-cancelar-edicion").classList.remove("is-hidden");
    document.getElementById("form-evento").scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
    document.getElementById("form-evento").reset();
    document.getElementById("evento-id").value = "";
    document.getElementById("campo-estado-evento")?.classList.add("is-hidden");
    document.getElementById("titulo-form-evento").innerText = "🗓️ Agendar Nuevo Evento";
    document.getElementById("btn-guardar-evento").innerText = "GUARDAR EVENTO";
    document.getElementById("btn-cancelar-edicion").classList.add("is-hidden");
}

async function eliminarEvento(id) {
    if (!confirm("¿Confirma eliminar este evento?")) return;
    try {
        const data = await apiFetch(`/events/${id}`, "DELETE");
        alert(data.mensaje || "Evento eliminado.");
        cargarEventos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// =========================================================================
// 4. MÓDULO: MODAL DETALLES Y ASIGNACIONES
// =========================================================================
async function abrirModalDetalles(eventId) {
    eventoSeleccionadoId = eventId;
    try {
        const ev = await apiFetch(`/events/${eventId}`);
        eventoSeleccionadoEstado = obtenerEstadoCalculado(ev);

        document.getElementById("modal-titulo-evento").innerText = `⚡ ${ev.name}`;
        document.getElementById("modal-lugar").innerText = ev.location;
        document.getElementById("modal-horario").innerText = `${formatearFecha(ev.start_time)} - ${formatearFecha(ev.end_time)}`;
        document.getElementById("modal-descripcion").innerText = ev.description || "Sin descripción";

        const badge = document.getElementById("modal-estado");
        badge.innerText = eventoSeleccionadoEstado;
        badge.className = `tag ${obtenerColorTagEstado(eventoSeleccionadoEstado)}`;

        const isFinalizado = eventoSeleccionadoEstado === "finalizado";
        document.getElementById("form-asignar-artista").style.display = isFinalizado ? "none" : "block";
        document.getElementById("form-asignar-recurso").style.display = isFinalizado ? "none" : "block";

        await Promise.all([cargarArtistasDelEvento(), cargarRecursosDelEvento(), cargarCatalogoRecursos()]);
        document.getElementById("modal-detalle").classList.add("is-active");
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

function cerrarModal() {
    document.getElementById("modal-detalle").classList.remove("is-active");
    eventoSeleccionadoId = null;
    eventoSeleccionadoEstado = "";
}

// --- Asignaciones de Artistas ---
async function cargarArtistasDelEvento() {
    const contenedor = document.getElementById("modal-lista-artistas");
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="has-text-grey">Cargando...</p>';
    try {
        const asignados = await apiFetch(`/events/${eventoSeleccionadoId}/artists`);
        contenedor.innerHTML = asignados.length === 0 ? '<p class="has-text-grey-light is-size-7">No hay artistas vinculados.</p>' : "";
        
        asignados.forEach(art => {
            const item = document.createElement("div");
            item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2";
            item.style.cssText = "background-color: #1f1f1f; border-radius: 4px;";
            item.innerHTML = `
                <div class="is-size-7">
                    <strong class="has-text-white">${art.name}</strong><br>
                    <span class="has-text-grey-light">${art.genre || "Sin género"}</span>
                </div>
                ${eventoSeleccionadoEstado !== "finalizado" ? `<button class="button is-danger is-outlined is-small" onclick="quitarArtistaDeEvento(${art.id})">❌</button>` : ""}`;
            contenedor.appendChild(item);
        });
    } catch (e) { contenedor.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar.</p>'; }
}

async function agregarArtistaAEvento() {
    const artistId = document.getElementById("modal-select-artista").value;
    if (!artistId) return alert("Selecciona un artista.");

    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/artists`, "POST", {
            artist_id: Number(artistId),
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString()
        });
        document.getElementById("form-asignar-artista").reset();
        cargarArtistasDelEvento();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

async function quitarArtistaDeEvento(artistId) {
    if (!confirm("¿Quitar artista del evento?")) return;
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/artists/${artistId}`, "DELETE");
        cargarArtistasDelEvento();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// --- Asignaciones de Recursos ---
async function cargarRecursosDelEvento() {
    const contenedor = document.getElementById("modal-lista-recursos");
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="has-text-grey">Cargando...</p>';
    try {
        const asignados = await apiFetch(`/events/${eventoSeleccionadoId}/resources`);
        contenedor.innerHTML = asignados.length === 0 ? '<p class="has-text-grey-light is-size-7">No hay recursos asignados.</p>' : "";
        
        asignados.forEach(rec => {
            const item = document.createElement("div");
            item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2";
            item.style.cssText = "background-color: #1f1f1f; border-radius: 4px;";
            item.innerHTML = `
                <div class="is-size-7">
                    <strong class="has-text-white">${rec.name}</strong><br>
                    <span class="tag is-info is-light">Cantidad: ${rec.quantity ?? rec.cantidad ?? 1}</span>
                </div>
                ${eventoSeleccionadoEstado !== "finalizado" ? `<button class="button is-danger is-outlined is-small" onclick="quitarRecursoDeEvento(${rec.id})">❌</button>` : ""}`;
            contenedor.appendChild(item);
        });
    } catch (e) { contenedor.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar.</p>'; }
}

async function agregarRecursoAEvento() {
    const resourceId = document.getElementById("modal-select-recurso").value;
    const cantidad = document.getElementById("modal-cantidad-recurso").value;
    if (!resourceId || !cantidad) return alert("Selecciona un recurso y cantidad.");

    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/resources`, "POST", { resource_id: Number(resourceId), quantity: Number(cantidad) });
        document.getElementById("modal-cantidad-recurso").value = 1;
        document.getElementById("modal-select-recurso").value = "";
        await cargarRecursosDelEvento();
        await cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

async function quitarRecursoDeEvento(resourceId) {
    if (!confirm("¿Desvincular este recurso del show?")) return;
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/resources/${resourceId}`, "DELETE");
        await cargarRecursosDelEvento();
        await cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}