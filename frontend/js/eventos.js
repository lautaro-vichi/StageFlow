// 🌐 CONFIGURACIÓN BASE, VARIABLES GLOBALES Y HELPERS DE CONEXIÓN
// Define la URL del servidor, variables de estado y funciones auxiliares.

const API_URL = "http://localhost:3000";
let eventoSeleccionadoId = null;
let eventoSeleccionadoEstado = "";

// Obtiene un elemento del HTML por su ID de manera rápida
const getEl = id => document.getElementById(id);

// Obtiene el valor limpio (sin espacios extra) de un input HTML por su ID
const valEl = id => getEl(id)?.value?.trim() || "";

// Conecta con el servidor Backend mediante peticiones HTTP (GET, POST, PUT, DELETE)
async function apiFetch(endpoint, method = "GET", body = null) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.mensaje || data.error || "Error en la operación");
    return data;
}

// Convierte textos con fecha en objetos de fecha navegables por JavaScript
function parsearFechaLocal(str) {
    if (!str) return new Date();
    const [f, h] = String(str).replace(" ", "T").split("T");
    if (!f || !h) return new Date(str);
    const [y, m, d] = f.split("-").map(Number);
    const [hr, min] = h.split(":").map(Number);
    return new Date(y, m - 1, d, hr || 0, min || 0);
}

// Adapta las fechas recibidas al formato que requieren los inputs de tipo "datetime-local"
const formatearFechaParaInput = str => {
    if (!str) return "";
    const d = parsearFechaLocal(str), pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Soluciona errores de tildes o caracteres raros (Mojibake / UTF-8) recibidos del servidor
const arreglarEncoding = str => {
    if (!str) return "";
    try {
        if (/[\xC2-\xF4][\x80-\xBF]/.test(str) || str.includes("Ã")) {
            const bytes = Uint8Array.from(str, c => c.charCodeAt(0));
            return new TextDecoder("utf-8").decode(bytes);
        }
        return str;
    } catch {
        return str;
    }
};

// Transforma fechas a formato legible con hora 12hs (AM/PM) para mostrar en pantalla
function formatearFecha(str) {
    if (!str) return "No especificada";
    const d = parsearFechaLocal(str), pad = n => String(n).padStart(2, "0");
    let h = d.getHours(), ampm = h >= 12 ? "PM" : "AM";
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${h % 12 || 12}:${pad(d.getMinutes())} ${ampm}`;
}

// Devuelve el color del badge según el estado del evento (confirmado, en curso, etc.)
const obtenerColorTagEstado = s => ({ confirmado: "is-success", "en curso": "is-warning", finalizado: "is-dark", cancelado: "is-danger" }[s] || "is-info");

// Calcula dinámicamente si el evento está "en curso", "finalizado" o "planificado"
function obtenerEstadoCalculado(ev) {
    if (ev.status === "cancelado") return "cancelado";
    const ahora = new Date(), inicio = parsearFechaLocal(ev.start_time || ev.inicio), fin = parsearFechaLocal(ev.end_time || ev.fin);
    return (ahora >= inicio && ahora <= fin) ? "en curso" : (ahora > fin ? "finalizado" : (ev.status || "planificado"));
}


// 🚀 INICIALIZADOR DE LA PÁGINA Y ESCUCHADORES DE FORMULARIOS
// Se ejecuta apenas la página carga: conecta los botones y llena las listas.

document.addEventListener("DOMContentLoaded", () => {
    // Carga los datos iniciales desde el backend
    cargarEventos(); 
    cargarArtistasGlobales(); 
    cargarCatalogoRecursos();

    // Establece la fecha mínima de los selectores de fecha para que no elijan el pasado
    const isoNow = formatearFechaParaInput(new Date());
    ["start-time", "end-time"].forEach(id => { if (getEl(id)) getEl(id).min = isoNow; });

    // Escucha cuando el usuario envía (Submit) cualquiera de los formularios principales
    getEl("form-evento")?.addEventListener("submit", guardarEvento);
    getEl("form-artista")?.addEventListener("submit", guardarArtista);
    getEl("form-recurso")?.addEventListener("submit", guardarRecurso);

    // Activa la validación en tiempo real para las cantidades de recursos
    vincularControladoresStock();
});


// 🎤 MÓDULO DE ARTISTAS: MUESTRA, CREA, EDITA Y ELIMINA ARTISTAS
// Se conecta con la lista `#lista-artistas` y el formulario `#form-artista`.

// Consulta los artistas al backend y dibuja las tarjetas en el HTML
async function cargarArtistasGlobales() {
    try {
        const artistas = await apiFetch("/artists");
        const cont = getEl("lista-artistas"), sel = getEl("modal-select-artista");

        if (cont) {
            cont.innerHTML = !artistas.length ? '<p class="has-text-grey-light is-italic">No hay artistas registrados.</p>' :
                artistas.map(a => `
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                        <div class="is-size-7">
                            <strong class="has-text-white">${arreglarEncoding(a.name)}</strong> 
                            <span class="has-text-info">(${arreglarEncoding(a.genre || "Sin género")})</span><br>
                            <span class="has-text-grey-light">Origen: ${a.nationality || "N/A"} | Edad/Trayectoria: ${a.age ?? "N/A"}</span>
                        </div>
                        <div>
                            <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionArtista(${JSON.stringify(a).replace(/'/g, "&apos;")})'>✏️</button>
                            <button class="button is-danger is-small py-0 px-2" onclick="eliminarArtista(${a.id})">🗑️</button>
                        </div>
                    </div>`).join("");
        }

        // Bloquea en el selector de la ventana modal a los artistas que ya estén ocupados
        if (sel) {
            sel.innerHTML = '<option value="">-- Elegir Artista --</option>';
            let ocupados = new Set();
            if (eventoSeleccionadoId) {
                const todos = await apiFetch("/events"), actual = todos.find(e => e.id === eventoSeleccionadoId);
                if (actual) {
                    const iniA = parsearFechaLocal(actual.start_time || actual.inicio), finA = parsearFechaLocal(actual.end_time || actual.fin);
                    for (const ev of todos) {
                        if (ev.id === eventoSeleccionadoId || ev.status === "cancelado") continue;
                        if (iniA < parsearFechaLocal(ev.end_time || ev.fin) && finA > parsearFechaLocal(ev.start_time || ev.inicio)) {
                            (await apiFetch(`/events/${ev.id}/artists`).catch(() => [])).forEach(art => ocupados.add(art.id));
                        }
                    }
                }
            }
            artistas.forEach(a => {
                const isBusy = ocupados.has(a.id);
                sel.innerHTML += `<option value="${a.id}" ${isBusy ? "disabled" : ""}>${arreglarEncoding(a.name)} (${arreglarEncoding(a.genre || "Sin género")})${isBusy ? " 🚫 [OCUPADO]" : ""}</option>`;
            });
        }
    } catch (e) { console.error("Error al cargar artistas:", e); }
}

// Lee los campos del formulario de artistas y envía la petición para Guardar o Actualizar
async function guardarArtista(e) {
    e.preventDefault();
    const id = valEl("artista-id");
    try {
        const data = await apiFetch(id ? `/artists/${id}` : "/artists", id ? "PUT" : "POST", {
            name: valEl("nombre-artista"), genre: valEl("genero-artista"), description: valEl("descripcion-artista"),
            age: Number(valEl("edad-artista")), nationality: valEl("nacionalidad-artista")
        });
        alert(data.mensaje || "Artista guardado correctamente.");
        cancelarEdicionArtista(); 
        cargarArtistasGlobales();
    } catch (err) { alert(`⚠️ ${err.message}`); }
}

// Pasa los datos de un artista seleccionado al formulario para ser editados
function prepararEdicionArtista(a) {
    getEl("artista-id").value = a.id;
    getEl("nombre-artista").value = arreglarEncoding(a.name);
    getEl("genero-artista").value = arreglarEncoding(a.genre || "");
    getEl("edad-artista").value = a.age ?? "";
    getEl("nacionalidad-artista").value = arreglarEncoding(a.nationality || "");
    getEl("descripcion-artista").value = arreglarEncoding(a.description || "");
    getEl("titulo-form-artista").innerText = "✏️ Editar Artista";
    getEl("btn-guardar-artista").innerText = "ACTUALIZAR ARTISTA";
    getEl("btn-cancelar-artista")?.classList.remove("is-hidden");
}

// Limpia el formulario de artistas y lo regresa a su estado inicial de creación
function cancelarEdicionArtista() {
    getEl("form-artista")?.reset();
    getEl("artista-id").value = "";
    getEl("titulo-form-artista").innerText = "✨ Agendar / Editar Artista";
    getEl("btn-guardar-artista").innerText = "GUARDAR ARTISTA";
    getEl("btn-cancelar-artista")?.classList.add("is-hidden");
}

// Borra un artista del sistema previa confirmación del usuario
async function eliminarArtista(id) {
    if (!confirm("¿Desea eliminar este artista?")) return;
    try {
        const data = await apiFetch(`/artists/${id}`, "DELETE");
        alert(data.mensaje || "Artista eliminado."); 
        cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}


// 📦 MÓDULO DE RECURSOS E INVENTARIO: CONTROLA EL STOCK Y REGISTROS
// Se conecta con `#lista-recursos`, `#form-recurso` y los inputs de stock.

// Valida que la cantidad disponible no sea mayor a la cantidad total ni negativa
function validarStockRecurso() {
    const inpT = getEl("cantidad-total-recurso"), inpD = getEl("cantidad-disponible-recurso");
    if (!inpT || !inpD) return true;
    const vT = Number(inpT.value), vD = Number(inpD.value);
    const invalido = isNaN(vT) || isNaN(vD) || vT < 0 || vD < 0 || vD > vT;
    getEl("mensaje-error-recurso")?.classList.toggle("is-hidden", !invalido);
    if (getEl("btn-guardar-recurso")) getEl("btn-guardar-recurso").disabled = invalido;
    inpD.classList.toggle("is-danger", invalido);
    return !invalido;
}

// Escucha cambios mientras el usuario escribe en los campos de cantidades de stock
function vincularControladoresStock() {
    ["cantidad-total-recurso", "cantidad-disponible-recurso"].forEach(id => { if (getEl(id)) getEl(id).oninput = validarStockRecurso; });
}

// Obtiene los recursos de la API y dibuja la lista en pantalla
async function cargarCatalogoRecursos() {
    try {
        const recursos = await apiFetch("/resources"), cont = getEl("lista-recursos"), sel = getEl("modal-select-recurso");
        if (cont) {
            cont.innerHTML = !recursos.length ? '<p class="has-text-grey-light is-italic">No hay recursos registrados.</p>' :
                recursos.map(r => `
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                        <div class="is-size-7">
                            <strong class="has-text-white">${arreglarEncoding(r.name)}</strong> 
                            <span class="tag is-info is-light py-0 px-1 ml-1">${r.type || "General"}</span><br>
                            <span class="has-text-grey-light">Total: ${r.total_quantity ?? r.quantity ?? 0} | Disp: ${r.available_quantity ?? 0}</span>
                        </div>
                        <div>
                            <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionRecurso(${JSON.stringify(r).replace(/'/g, "&apos;")})'>✏️</button>
                            <button class="button is-danger is-small py-0 px-2" onclick="eliminarRecurso(${r.id})">🗑️</button>
                        </div>
                    </div>`).join("");
        }
        if (sel) sel.innerHTML = '<option value="">-- Elegir Recurso --</option>' + recursos.map(r => `<option value="${r.id}">${arreglarEncoding(r.name)} (Disp: ${r.available_quantity ?? 0})</option>`).join("");
    } catch (e) { console.error("Error al cargar recursos:", e); }
}

// Toma la información ingresada en el formulario de recursos y la guarda en la API
async function guardarRecurso(e) {
    e.preventDefault();
    const id = valEl("recurso-id");
    let totalVal = id ? (Number(valEl("cantidad-total-recurso")) || 0) : (Number(valEl("cantidad-disponible-recurso")) || 1);
    let dispVal = id ? (Number(valEl("cantidad-disponible-recurso")) || 0) : totalVal;

    if (!validarStockRecurso()) return alert("⚠️ La cantidad disponible no puede ser mayor que la total ni ser un valor negativo.");

    try {
        const data = await apiFetch(id ? `/resources/${id}` : "/resources", id ? "PUT" : "POST", {
            name: valEl("nombre-recurso"), type: valEl("tipo-recurso"), description: valEl("descripcion-recurso"),
            total_quantity: totalVal, available_quantity: dispVal, quantity: totalVal
        });
        alert(data.mensaje || data.message || "Recurso guardado correctamente.");
        cancelarEdicionRecurso(); 
        cargarCatalogoRecursos();
    } catch (err) { alert(`⚠️ ${err.message}`); }
}

// Llena el formulario de recursos con los datos existentes para editarlos
function prepararEdicionRecurso(r) {
    getEl("recurso-id").value = r.id;
    getEl("nombre-recurso").value = arreglarEncoding(r.name);
    getEl("tipo-recurso").value = arreglarEncoding(r.type || "");
    getEl("descripcion-recurso").value = arreglarEncoding(r.description || "");

    ["campo-cantidad-disponible", "campo-cantidad-total"].forEach(id => getEl(id)?.classList.remove("is-hidden"));
    if (getEl("cantidad-total-recurso")) getEl("cantidad-total-recurso").value = r.total_quantity ?? r.quantity ?? 0;
    if (getEl("cantidad-disponible-recurso")) getEl("cantidad-disponible-recurso").value = r.available_quantity ?? 0;

    vincularControladoresStock(); 
    validarStockRecurso();
    getEl("titulo-form-recurso").innerText = "✏️ Editar Recurso";
    getEl("btn-guardar-recurso").innerText = "ACTUALIZAR RECURSO";
    getEl("btn-cancelar-recurso")?.classList.remove("is-hidden");
}

// Resetea el formulario de recursos a su estado original
function cancelarEdicionRecurso() {
    getEl("form-recurso")?.reset();
    getEl("recurso-id").value = "";
    ["campo-cantidad-disponible", "campo-cantidad-total", "mensaje-error-recurso"].forEach(id => getEl(id)?.classList.add("is-hidden"));
    const btn = getEl("btn-guardar-recurso");
    if (btn) { btn.disabled = false; btn.innerText = "GUARDAR RECURSO"; }
    getEl("titulo-form-recurso").innerText = "🛠️ Registrar / Editar Recurso";
    getEl("btn-cancelar-recurso")?.classList.add("is-hidden");
}

// Elimina un recurso del inventario general
async function eliminarRecurso(id) {
    if (!confirm("¿Desea eliminar este recurso?")) return;
    try {
        const data = await apiFetch(`/resources/${id}`, "DELETE");
        alert(data.mensaje || "Recurso eliminado."); 
        cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}


// 📅 MÓDULO DE EVENTOS: AGENDA, PROGRAMACIÓN Y GESTIÓN DE SHOWS
// Se conecta con el contenedor `#contenedor-eventos` y el formulario `#form-evento`.

// Carga y muestra todos los eventos agendados en formato de tarjetas
async function cargarEventos() {
    try {
        const eventos = await apiFetch("/events"), cont = getEl("contenedor-eventos");
        getEl("mensaje-vacio")?.classList.toggle("is-hidden", eventos.length > 0);
        if (cont) {
            cont.innerHTML = eventos.map(ev => {
                const st = obtenerEstadoCalculado(ev), isFin = st === "finalizado";
                return `
                <div class="column is-one-third-desktop is-half-tablet">
                    <div class="box">
                        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                            <span class="tag ${obtenerColorTagEstado(st)}">${st}</span><small class="has-text-grey-light">ID #${ev.id}</small>
                        </div>
                        <h4 class="title is-4 has-text-white mb-2">${arreglarEncoding(ev.name)}</h4>
                        <p class="subtitle is-6 has-text-grey-light mb-3">${arreglarEncoding(ev.description || "Sin descripción")}</p>
                        <div class="is-size-7 mb-4">
                            <p><strong>📍 Lugar:</strong> ${arreglarEncoding(ev.location)}</p>
                            <p><strong>🕒 Inicio:</strong> ${formatearFecha(ev.start_time || ev.inicio)}</p>
                            <p><strong>🏁 Fin:</strong> ${formatearFecha(ev.end_time || ev.fin)}</p>
                        </div>
                        <button class="button is-info is-small is-fullwidth mb-2" onclick="abrirModalDetalles(${ev.id})">🔍 Gestionar Asignaciones</button>
                        ${!isFin ? `<div class="buttons is-flex">
                            <button class="button is-warning is-small is-flex-grow-1" onclick='prepararEdicionEvento(${JSON.stringify(ev).replace(/'/g, "&apos;")})'>✏️ Editar</button>
                            <button class="button is-danger is-small is-flex-grow-1" onclick="eliminarEvento(${ev.id})">🗑️ Eliminar</button>
                        </div>` : `<button class="button is-static is-small is-fullwidth" disabled>🔒 Evento Finalizado</button>`}
                    </div>
                </div>`;
            }).join("");
        }
    } catch (e) { console.error("Error al cargar eventos:", e); }
}

// Procesa el envío del formulario de eventos, validando que las fechas sean correctas
async function guardarEvento(e) {
    e.preventDefault();
    const id = valEl("evento-id"), start = valEl("start-time"), end = valEl("end-time");
    if (!start || !end) return alert("⚠️ Por favor selecciona ambas fechas (inicio y fin).");

    const fIni = parsearFechaLocal(start), fFin = parsearFechaLocal(end);
    if (fFin <= fIni) return alert("⚠️ La fecha y hora de fin debe ser posterior a la fecha y hora de inicio.");
    if (!id && fIni < new Date()) return alert("⚠️ No puedes programar un nuevo evento en una fecha u hora que ya ha pasado.");

    try {
        const data = await apiFetch(id ? `/events/${id}` : "/events", id ? "PUT" : "POST", {
            name: valEl("nombre"), description: valEl("descripcion"), location: valEl("lugar"),
            start_time: start, end_time: end, status: id ? valEl("estado") : "planificado"
        });
        alert(data.mensaje || "Evento guardado.");
        cancelarEdicion(); 
        cargarEventos();
    } catch (err) { alert(`⚠️ ${err.message}`); }
}

// Coloca los datos de un evento existente dentro del formulario para modificarlo
function prepararEdicionEvento(ev) {
    getEl("evento-id").value = ev.id;
    getEl("nombre").value = arreglarEncoding(ev.name);
    getEl("descripcion").value = arreglarEncoding(ev.description || "");
    getEl("lugar").value = arreglarEncoding(ev.location);

    ["start-time", "end-time"].forEach(id => getEl(id)?.removeAttribute("min"));
    getEl("start-time").value = formatearFechaParaInput(ev.start_time || ev.inicio);
    getEl("end-time").value = formatearFechaParaInput(ev.end_time || ev.fin);

    getEl("campo-estado-evento")?.classList.remove("is-hidden");
    if (getEl("estado")) getEl("estado").value = ev.status || "planificado";

    getEl("titulo-form-evento").innerText = "✏️ Editar Evento";
    getEl("btn-guardar-evento").innerText = "ACTUALIZAR EVENTO";
    getEl("btn-cancelar-edicion")?.classList.remove("is-hidden");
    getEl("form-evento")?.scrollIntoView({ behavior: 'smooth' });
}

// Limpia el formulario de eventos
function cancelarEdicion() {
    getEl("form-evento")?.reset();
    getEl("evento-id").value = "";
    getEl("campo-estado-evento")?.classList.add("is-hidden");
    const isoNow = formatearFechaParaInput(new Date());
    ["start-time", "end-time"].forEach(id => { if (getEl(id)) getEl(id).min = isoNow; });

    getEl("titulo-form-evento").innerText = "🗓️ Agendar Nuevo Evento";
    getEl("btn-guardar-evento").innerText = "GUARDAR EVENTO";
    getEl("btn-cancelar-edicion")?.classList.add("is-hidden");
}

// Cancela/Elimina un evento de la base de datos
async function eliminarEvento(id) {
    if (!confirm("¿Confirma eliminar este evento?")) return;
    try {
        const data = await apiFetch(`/events/${id}`, "DELETE");
        alert(data.mensaje || "Evento eliminado."); 
        cargarEventos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}


// 🔍 MÓDULO VENTANA MODAL: ASIGNACIÓN DE ARTISTAS Y RECURSOS A UN EVENTO
// Se conecta con la ventana flotante `#modal-detalle` e interactúa con
// los formularios `#form-asignar-artista` y `#form-asignar-recurso`.

// Abre la ventana emergente con la información y las asignaciones del evento
async function abrirModalDetalles(eventId) {
    eventoSeleccionadoId = eventId;
    try {
        const ev = await apiFetch(`/events/${eventId}`);
        eventoSeleccionadoEstado = obtenerEstadoCalculado(ev);

        getEl("modal-titulo-evento").innerText = `⚡ ${arreglarEncoding(ev.name)}`;
        getEl("modal-lugar").innerText = arreglarEncoding(ev.location);
        getEl("modal-horario").innerText = `${formatearFecha(ev.start_time || ev.inicio)} - ${formatearFecha(ev.end_time || ev.fin)}`;
        getEl("modal-descripcion").innerText = arreglarEncoding(ev.description || "Sin descripción");

        const badge = getEl("modal-estado");
        if (badge) { badge.innerText = eventoSeleccionadoEstado; badge.className = `tag ${obtenerColorTagEstado(eventoSeleccionadoEstado)}`; }

        // Oculta las opciones de asignación si el evento ya terminó
        const isFin = eventoSeleccionadoEstado === "finalizado";
        if (getEl("form-asignar-artista")) getEl("form-asignar-artista").style.display = isFin ? "none" : "block";
        if (getEl("form-asignar-recurso")) getEl("form-asignar-recurso").style.display = isFin ? "none" : "block";

        await Promise.all([cargarArtistasDelEvento(), cargarRecursosDelEvento(), cargarArtistasGlobales(), cargarCatalogoRecursos()]);
        getEl("modal-detalle")?.classList.add("is-active");
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// Cierra la ventana emergente
function cerrarModal() {
    getEl("modal-detalle")?.classList.remove("is-active");
    eventoSeleccionadoId = null; 
    eventoSeleccionadoEstado = "";
}

// Muestra la lista de artistas vinculados a este evento en particular dentro de la modal
async function cargarArtistasDelEvento() {
    const cont = getEl("modal-lista-artistas");
    if (!cont) return;
    try {
        const list = await apiFetch(`/events/${eventoSeleccionadoId}/artists`);
        cont.innerHTML = !list.length ? '<p class="has-text-grey-light is-size-7">No hay artistas vinculados.</p>' :
            list.map(a => `
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                    <div class="is-size-7"><strong class="has-text-white">${arreglarEncoding(a.name)}</strong><br><span class="has-text-grey-light">${arreglarEncoding(a.genre || "Sin género")}</span></div>
                    ${eventoSeleccionadoEstado !== "finalizado" ? `<button class="button is-danger is-outlined is-small" onclick="quitarArtistaDeEvento(${a.id})">❌</button>` : ""}
                </div>`).join("");
    } catch { cont.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar.</p>'; }
}

// Vincula un nuevo artista al evento mediante la opción seleccionada en `#modal-select-artista`
async function agregarArtistaAEvento() {
    const sel = getEl("modal-select-artista"), artistId = sel?.value;
    if (!artistId) return alert("Selecciona un artista.");
    if (sel.options[sel.selectedIndex].disabled) return alert("⚠️ Este artista ya se encuentra asignado a otro evento en las mismas fechas.");

    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/artists`, "POST", { artist_id: Number(artistId), start_time: new Date().toISOString(), end_time: new Date().toISOString() });
        getEl("form-asignar-artista")?.reset();
        await cargarArtistasDelEvento(); 
        await cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// Desvincula a un artista del evento seleccionado
async function quitarArtistaDeEvento(artistId) {
    if (!confirm("¿Quitar artista del evento?")) return;
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/artists/${artistId}`, "DELETE");
        await cargarArtistasDelEvento(); 
        await cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// Muestra la lista de recursos asignados al evento actual dentro de la modal
async function cargarRecursosDelEvento() {
    const cont = getEl("modal-lista-recursos");
    if (!cont) return;
    try {
        const list = await apiFetch(`/events/${eventoSeleccionadoId}/resources`);
        cont.innerHTML = !list.length ? '<p class="has-text-grey-light is-size-7">No hay recursos asignados.</p>' :
            list.map(r => `
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                    <div class="is-size-7"><strong class="has-text-white">${arreglarEncoding(r.name)}</strong><br><span class="tag is-info is-light">Cantidad: ${r.quantity ?? r.cantidad ?? 1}</span></div>
                    ${eventoSeleccionadoEstado !== "finalizado" ? `<button class="button is-danger is-outlined is-small" onclick="quitarRecursoDeEvento(${r.id})">❌</button>` : ""}
                </div>`).join("");
    } catch { cont.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar.</p>'; }
}

// Asigna una cantidad de determinado recurso al evento usando `#modal-select-recurso` y `#modal-cantidad-recurso`
async function agregarRecursoAEvento() {
    const resId = valEl("modal-select-recurso"), cant = valEl("modal-cantidad-recurso");
    if (!resId || !cant) return alert("Selecciona un recurso y cantidad.");

    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/resources`, "POST", { resource_id: Number(resId), quantity: Number(cant) });
        if (getEl("modal-cantidad-recurso")) getEl("modal-cantidad-recurso").value = 1;
        if (getEl("modal-select-recurso")) getEl("modal-select-recurso").value = "";
        await cargarRecursosDelEvento(); 
        await cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// Quita un recurso del evento y lo devuelve al stock disponible
async function quitarRecursoDeEvento(resourceId) {
    if (!confirm("¿Desvincular este recurso del show?")) return;
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/resources/${resourceId}`, "DELETE");
        await cargarRecursosDelEvento(); 
        await cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}