// 🌐 CONFIGURACIÓN, VARIABLES Y HELPERS
const API_URL = "http://localhost:3000";
let eventoSeleccionadoId = null, eventoSeleccionadoEstado = "";

const getEl = id => document.getElementById(id);
const valEl = id => getEl(id)?.value?.trim() || "";

async function apiFetch(endpoint, method = "GET", body = null) {
    const res = await fetch(`${API_URL}${endpoint}`, { method, headers: { "Content-Type": "application/json; charset=utf-8" }, ...(body && { body: JSON.stringify(body) }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.mensaje || data.error || "Error en la operación");
    return data;
}

function componentesART(fechaISO) {
    const d = new Date(fechaISO); // acá SÍ se respeta la Z / UTC real
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
    });
    return Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
}

function parsearFechaLocal(str) {
    if (!str) return new Date();
    const [f, h] = String(str).replace(" ", "T").split("T");
    if (!f || !h) return new Date(str);
    const [y, m, d] = f.split("-").map(Number), [hr, min] = h.split(":").map(Number);
    return new Date(y, m - 1, d, hr || 0, min || 0);
}

const formatearFechaParaInput = str => {
    if (!str) return "";
    const p = componentesART(str);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

const arreglarEncoding = str => {
    if (!str) return "";
    try {
        return (/[\xC2-\xF4][\x80-\xBF]/.test(str) || str.includes("Ã")) 
            ? new TextDecoder("utf-8").decode(Uint8Array.from(str, c => c.charCodeAt(0))) 
            : str;
    } catch { return str; }
};

function formatearFecha(str) {
    if (!str) return "No especificada";
    const p = componentesART(str);
    const h = Number(p.hour);
    return `${p.day}/${p.month}/${p.year}, ${h % 12 || 12}:${p.minute} ${h >= 12 ? "PM" : "AM"}`;
}

const obtenerColorTagEstado = s => ({ confirmado: "is-success", "en curso": "is-warning", finalizado: "is-dark", cancelado: "is-danger" }[s] || "is-info");

function obtenerEstadoCalculado(ev) {
    if (ev.status === "cancelado") return "cancelado";
    const ahora = new Date(), inicio = new Date(ev.start_time || ev.inicio), fin = new Date(ev.end_time || ev.fin);
    return (ahora >= inicio && ahora <= fin) ? "en curso" : (ahora > fin ? "finalizado" : (ev.status || "planificado"));
}

function toggleFormState(prefix, isEdit, titleEdit, titleCreate, btnEdit, btnCreate) {
    const title = getEl(`titulo-form-${prefix}`), btn = getEl(`btn-guardar-${prefix}`), cancel = getEl(`btn-cancelar-${prefix}`);
    if (title) title.innerText = isEdit ? titleEdit : titleCreate;
    if (btn) { btn.innerText = isEdit ? btnEdit : btnCreate; btn.disabled = false; }
    cancel?.classList.toggle("is-hidden", !isEdit);
}

// 🚀 INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    cargarEventos(); cargarArtistasGlobales(); cargarCatalogoRecursos();
    const isoNow = formatearFechaParaInput(new Date());
    ["start-time", "end-time"].forEach(id => { if (getEl(id)) getEl(id).min = isoNow; });

    getEl("form-evento")?.addEventListener("submit", guardarEvento);
    getEl("form-artista")?.addEventListener("submit", guardarArtista);
    getEl("form-recurso")?.addEventListener("submit", guardarRecurso);
    vincularControladoresStock();
});

// 🎤 MÓDULO DE ARTISTAS
async function cargarArtistasGlobales() {
    try {
        const artistas = await apiFetch("/artists"), cont = getEl("lista-artistas"), sel = getEl("modal-select-artista");

        if (cont) {
            cont.innerHTML = !artistas.length ? '<p class="has-text-grey-light is-italic">No hay artistas registrados.</p>' :
                artistas.map(a => {
                    const nombre = a.name || a.nombre || "Sin nombre";
                    const genero = a.genre || a.genero || "Sin género";
                    
                    let origen = "N/A";
                    const natVal = a.nationality !== undefined ? a.nationality : (a.national !== undefined ? a.national : a.nacionalidad);

                    if (natVal !== undefined && natVal !== null && natVal !== "") {
                        if (natVal === true || natVal === 1 || String(natVal).toLowerCase() === "true" || String(natVal).toLowerCase().includes("nac")) {
                            origen = "Nacional";
                        } else if (natVal === false || natVal === 0 || String(natVal).toLowerCase() === "false" || String(natVal).toLowerCase().includes("inter")) {
                            origen = "Internacional";
                        } else {
                            origen = natVal;
                        }
                    }

                    const edadVal = a.age ?? a.edad;
                    const edadTrayectoria = (edadVal !== undefined && edadVal !== null && edadVal !== "") ? edadVal : "N/A";

                    return `
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                        <div class="is-size-7">
                            <strong class="has-text-white">${arreglarEncoding(nombre)}</strong> 
                            <span class="has-text-info">(${arreglarEncoding(genero)})</span><br>
                            <span class="has-text-grey-light">Origen: ${arreglarEncoding(String(origen))} | Edad/Trayectoria: ${edadTrayectoria}</span>
                        </div>
                        <div>
                            <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionArtista(${JSON.stringify(a).replace(/'/g, "&apos;")})'>✏️</button>
                            <button class="button is-danger is-small py-0 px-2" onclick="eliminarArtista(${a.id})">🗑️</button>
                        </div>
                    </div>`;
                }).join("");
        }

        if (sel) {
            sel.innerHTML = '<option value="">-- Elegir Artista --</option>';
            let ocupados = new Set();
            if (eventoSeleccionadoId) {
                const todos = await apiFetch("/events"), actual = todos.find(e => e.id === eventoSeleccionadoId);
                if (actual) {
                    const iniA = new Date(actual.start_time || actual.inicio), finA = new Date(actual.end_time || actual.fin);
                    for (const ev of todos) {
                        if (ev.id === eventoSeleccionadoId || ev.status === "cancelado") continue;
                        if (iniA < new Date(ev.end_time || ev.fin) && finA > new Date(ev.start_time || ev.inicio)) {
                            (await apiFetch(`/events/${ev.id}/artists`).catch(() => [])).forEach(art => ocupados.add(art.id));
                        }
                    }
                }
            }
            artistas.forEach(a => {
                const isBusy = ocupados.has(a.id);
                sel.innerHTML += `<option value="${a.id}" ${isBusy ? "disabled" : ""}>${arreglarEncoding(a.name || a.nombre)} (${arreglarEncoding(a.genre || a.genero || "Sin género")})${isBusy ? " 🚫 [OCUPADO]" : ""}</option>`;
            });
        }
    } catch (e) { console.error("Error al cargar artistas:", e); }
}

async function guardarArtista(e) {
    e.preventDefault();
    const id = valEl("artista-id");
    const nombre = valEl("nombre-artista");
    const genero = valEl("genero-artista");
    const descripcion = valEl("descripcion-artista");
    const edad = valEl("edad-artista");
    const nacionalidadInput = valEl("nacionalidad-artista");

    if (!nombre) {
        return alert("⚠️ El nombre del artista es obligatorio.");
    }

    try {
        const payload = {
            name: nombre,
            genre: genero || "",
            description: descripcion || "",
            age: edad ? Number(edad) : null,
            nationality: nacionalidadInput || "",
            national: nacionalidadInput || ""
        };

        const data = await apiFetch(
            id ? `/artists/${id}` : "/artists", 
            id ? "PUT" : "POST", 
            payload
        );

        alert(data.mensaje || data.message || "Artista guardado correctamente.");
        cancelarEdicionArtista(); 
        cargarArtistasGlobales();
    } catch (err) { alert(`⚠️ ${err.message}`); }
}

function prepararEdicionEvento(ev) {
    getEl("evento-id").value = ev.id;
    getEl("nombre").value = arreglarEncoding(ev.name || ev.nombre || "");
    getEl("descripcion").value = arreglarEncoding(ev.description || ev.descripcion || "");
    getEl("lugar").value = arreglarEncoding(ev.location || ev.lugar || "");
    ["start-time", "end-time"].forEach(id => getEl(id)?.removeAttribute("min"));
    getEl("start-time").value = formatearFechaParaInput(ev.start_time || ev.inicio);
    getEl("end-time").value = formatearFechaParaInput(ev.end_time || ev.fin);
    
    // Muestra el contenedor del selector de estado
    const campoEstado = getEl("campo-estado-evento");
    if (campoEstado) campoEstado.classList.remove("is-hidden");
    
    // Asigna el valor actual al select
    const selectEstado = getEl("estado");
    if (selectEstado) selectEstado.value = ev.status || ev.estado || "planificado";
    
    getEl("btn-cancelar-edicion")?.classList.remove("is-hidden");
    toggleFormState("evento", true, "✏️ Editar Evento", "", "ACTUALIZAR EVENTO", "");
    getEl("form-evento")?.scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionArtista() {
    getEl("form-artista")?.reset();
    if (getEl("artista-id")) getEl("artista-id").value = "";
    toggleFormState("artista", false, "", "✨ Agendar / Editar Artista", "", "GUARDAR ARTISTA");
}

async function eliminarArtista(id) {
    if (!confirm("¿Desea eliminar este artista?")) return;
    try {
        const data = await apiFetch(`/artists/${id}`, "DELETE");
        alert(data.mensaje || "Artista eliminado."); cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// 📦 MÓDULO DE RECURSOS E INVENTARIO
function validarStockRecurso() {
    const inpT = getEl("cantidad-total-recurso"), inpD = getEl("cantidad-disponible-recurso");
    if (!inpD) return true;
    const vD = Number(inpD.value), totalVisible = inpT && !inpT.closest('.field')?.classList.contains('is-hidden') && inpT.value !== "";
    const vT = totalVisible ? Number(inpT.value) : vD;
    const invalido = isNaN(vT) || isNaN(vD) || vD <= 0 || vT < 0 || vD > vT;

    getEl("mensaje-error-recurso")?.classList.toggle("is-hidden", !invalido);
    if (getEl("btn-guardar-recurso")) getEl("btn-guardar-recurso").disabled = invalido;
    inpD.classList.toggle("is-danger", invalido);
    return !invalido;
}

function vincularControladoresStock() {
    ["cantidad-total-recurso", "cantidad-disponible-recurso"].forEach(id => { if (getEl(id)) getEl(id).oninput = validarStockRecurso; });
}

async function cargarCatalogoRecursos() {
    try {
        const recursos = await apiFetch("/resources"), cont = getEl("lista-recursos"), sel = getEl("modal-select-recurso");
        if (cont) {
            cont.innerHTML = !recursos.length ? '<p class="has-text-grey-light is-italic">No hay recursos registrados.</p>' :
                recursos.map(r => {
                    const nombre = r.name || r.nombre || "Sin nombre";
                    const tipo = r.type || r.tipo || "General";
                    const total = r.total_quantity ?? r.quantity ?? r.cantidad_total ?? r.cantidad ?? 0;
                    const disp = r.available_quantity ?? r.cantidad_disponible ?? total;

                    return `
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                        <div class="is-size-7">
                            <strong class="has-text-white">${arreglarEncoding(nombre)}</strong> 
                            <span class="tag is-info is-light py-0 px-1 ml-1">${arreglarEncoding(tipo)}</span><br>
                            <span class="has-text-grey-light">Total: ${total} | Disp: ${disp}</span>
                        </div>
                        <div>
                            <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionRecurso(${JSON.stringify(r).replace(/'/g, "&apos;")})'>✏️</button>
                            <button class="button is-danger is-small py-0 px-2" onclick="eliminarRecurso(${r.id})">🗑️</button>
                        </div>
                    </div>`;
                }).join("");
        }
        if (sel) {
            sel.innerHTML = '<option value="">-- Elegir Recurso --</option>' + recursos.map(r => {
                const nombre = r.name || r.nombre || "Sin nombre";
                const disp = r.available_quantity ?? r.cantidad_disponible ?? r.total_quantity ?? r.quantity ?? 0;
                return `<option value="${r.id}">${arreglarEncoding(nombre)} (Disp: ${disp})</option>`;
            }).join("");
        }
    } catch (e) { console.error("Error al cargar recursos:", e); }
}

async function guardarRecurso(e) {
    e.preventDefault();
    const id = valEl("recurso-id"), cantidadInput = Number(valEl("cantidad-disponible-recurso")) || 1;
    const totalVal = id ? (Number(valEl("cantidad-total-recurso")) || cantidadInput) : cantidadInput;
    const nombre = valEl("nombre-recurso"), tipo = valEl("tipo-recurso"), descripcion = valEl("descripcion-recurso");

    try {
        const data = await apiFetch(id ? `/resources/${id}` : "/resources", id ? "PUT" : "POST", {
            name: nombre, nombre,
            type: tipo, tipo,
            description: descripcion, descripcion,
            total_quantity: totalVal, quantity: totalVal, cantidad_total: totalVal,
            available_quantity: cantidadInput, cantidad_disponible: cantidadInput
        });
        alert(data.mensaje || data.message || "Recurso guardado correctamente.");
        cancelarEdicionRecurso(); cargarCatalogoRecursos();
    } catch (err) { alert(`⚠️ ${err.message}`); }
}

function prepararEdicionRecurso(r) {
    getEl("recurso-id").value = r.id;
    getEl("nombre-recurso").value = arreglarEncoding(r.name || r.nombre || "");
    getEl("tipo-recurso").value = arreglarEncoding(r.type || r.tipo || "");
    getEl("descripcion-recurso").value = arreglarEncoding(r.description || r.descripcion || "");
    ["campo-cantidad-disponible", "campo-cantidad-total"].forEach(id => getEl(id)?.classList.remove("is-hidden"));
    if (getEl("cantidad-total-recurso")) getEl("cantidad-total-recurso").value = r.total_quantity ?? r.quantity ?? r.cantidad_total ?? 0;
    if (getEl("cantidad-disponible-recurso")) getEl("cantidad-disponible-recurso").value = r.available_quantity ?? r.cantidad_disponible ?? 0;
    vincularControladoresStock(); validarStockRecurso();
    toggleFormState("recurso", true, "✏️ Editar Recurso", "", "ACTUALIZAR RECURSO", "");
}

function cancelarEdicionRecurso() {
    getEl("form-recurso")?.reset();
    if (getEl("recurso-id")) getEl("recurso-id").value = "";
    getEl("campo-cantidad-disponible")?.classList.remove("is-hidden");
    getEl("campo-cantidad-total")?.classList.add("is-hidden");
    getEl("mensaje-error-recurso")?.classList.add("is-hidden");
    const inputDisp = getEl("cantidad-disponible-recurso");
    if (inputDisp) { inputDisp.classList.remove("is-danger"); inputDisp.value = "1"; }
    toggleFormState("recurso", false, "", "🛠️ Registrar / Editar Recurso", "", "GUARDAR RECURSO");
}

async function eliminarRecurso(id) {
    if (!confirm("¿Desea eliminar este recurso?")) return;
    try {
        const data = await apiFetch(`/resources/${id}`, "DELETE");
        alert(data.mensaje || "Recurso eliminado."); cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// 📅 MÓDULO DE EVENTOS
async function cargarEventos() {
    try {
        const eventos = await apiFetch("/events"), cont = getEl("contenedor-eventos");
        getEl("mensaje-vacio")?.classList.toggle("is-hidden", eventos.length > 0);
        if (cont) {
            cont.innerHTML = eventos.map(ev => {
                const st = obtenerEstadoCalculado(ev), isFin = st === "finalizado";
                const nombre = ev.name || ev.nombre || "Evento sin título";
                const descripcion = ev.description || ev.descripcion || "Sin descripción";
                const lugar = ev.location || ev.lugar || "Lugar no especificado";

                return `
                <div class="column is-one-third-desktop is-half-tablet">
                    <div class="box">
                        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                            <span class="tag ${obtenerColorTagEstado(st)}">${st}</span><small class="has-text-grey-light">ID #${ev.id}</small>
                        </div>
                        <h4 class="title is-4 has-text-white mb-2">${arreglarEncoding(nombre)}</h4>
                        <p class="subtitle is-6 has-text-grey-light mb-3">${arreglarEncoding(descripcion)}</p>
                        <div class="is-size-7 mb-4">
                            <p><strong>📍 Lugar:</strong> ${arreglarEncoding(lugar)}</p>
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

async function guardarEvento(e) {
    e.preventDefault();
    const id = valEl("evento-id"), start = valEl("start-time"), end = valEl("end-time");
    if (!start || !end) return alert("⚠️ Por favor selecciona ambas fechas (inicio y fin).");
    if (parsearFechaLocal(end) <= parsearFechaLocal(start)) return alert("⚠️ La fecha y hora de fin debe ser posterior a la de inicio.");
    if (!id && parsearFechaLocal(start) < new Date()) return alert("⚠️ No puedes programar un evento en fecha u hora pasada.");

    const nombre = valEl("nombre"), descripcion = valEl("descripcion"), lugar = valEl("lugar");
    
    // Captura el estado directamente del select 'estado' o 'estado-evento'
    const selectEstado = getEl("estado") || getEl("estado-evento");
    const estado = id ? (selectEstado ? selectEstado.value : "planificado") : "planificado";

    // ⚠️ ADVERTENCIA SI SE MARCA COMO CANCELADO
    if (estado === "cancelado") {
        const confirmar = confirm("⚠️ ADVERTENCIA: Si marcas este evento como 'cancelado', ya no podrás volver a editarlo ni asignarle recursos/artistas.\n\n¿Deseas confirmar la cancelación?");
        if (!confirmar) return; // Detiene el envío del formulario si presiona Cancelar
    }

    try {
        const data = await apiFetch(id ? `/events/${id}` : "/events", id ? "PUT" : "POST", {
            name: nombre, nombre,
            description: descripcion, descripcion,
            location: lugar, lugar,
            start_time: start, inicio: start,
            end_time: end, fin: end,
            status: estado, estado
        });
        alert(data.mensaje || "Evento guardado.");
        cancelarEdicionEvento(); cargarEventos();
    } catch (err) { alert(`⚠️ ${err.message}`); }
}

function prepararEdicionEvento(ev) {
    getEl("evento-id").value = ev.id;
    getEl("nombre").value = arreglarEncoding(ev.name || ev.nombre || "");
    getEl("descripcion").value = arreglarEncoding(ev.description || ev.descripcion || "");
    getEl("lugar").value = arreglarEncoding(ev.location || ev.lugar || "");
    ["start-time", "end-time"].forEach(id => getEl(id)?.removeAttribute("min"));
    getEl("start-time").value = formatearFechaParaInput(ev.start_time || ev.inicio);
    getEl("end-time").value = formatearFechaParaInput(ev.end_time || ev.fin);
    getEl("campo-estado-evento")?.classList.remove("is-hidden");
    if (getEl("estado")) getEl("estado").value = ev.status || ev.estado || "planificado";
    getEl("btn-cancelar-edicion")?.classList.remove("is-hidden");
    toggleFormState("evento", true, "✏️ Editar Evento", "", "ACTUALIZAR EVENTO", "");
    getEl("form-evento")?.scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicionEvento() {
    getEl("form-evento")?.reset();
    if (getEl("evento-id")) getEl("evento-id").value = "";
    getEl("btn-cancelar-edicion")?.classList.add("is-hidden");
    getEl("campo-estado-evento")?.classList.add("is-hidden");
    toggleFormState("evento", false, "", "📅 Registrar Nuevo Evento", "", "CREAR EVENTO");
}

const cancelarEdicion = () => cancelarEdicionEvento();

async function eliminarEvento(id) {
    if (!confirm("¿Confirma eliminar este evento?")) return;
    try {
        const data = await apiFetch(`/events/${id}`, "DELETE");
        alert(data.mensaje || "Evento eliminado."); cargarEventos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

// 🔍 MÓDULO VENTANA MODAL
async function abrirModalDetalles(eventId) {
    eventoSeleccionadoId = eventId;
    try {
        const ev = await apiFetch(`/events/${eventId}`);
        eventoSeleccionadoEstado = obtenerEstadoCalculado(ev);
        getEl("modal-titulo-evento").innerText = `⚡ ${arreglarEncoding(ev.name || ev.nombre)}`;
        getEl("modal-lugar").innerText = arreglarEncoding(ev.location || ev.lugar);
        getEl("modal-horario").innerText = `${formatearFecha(ev.start_time || ev.inicio)} - ${formatearFecha(ev.end_time || ev.fin)}`;
        getEl("modal-descripcion").innerText = arreglarEncoding(ev.description || ev.descripcion || "Sin descripción");

        const badge = getEl("modal-estado");
        if (badge) { badge.innerText = eventoSeleccionadoEstado; badge.className = `tag ${obtenerColorTagEstado(eventoSeleccionadoEstado)}`; }

        const isFin = eventoSeleccionadoEstado === "finalizado";
        if (getEl("form-asignar-artista")) getEl("form-asignar-artista").style.display = isFin ? "none" : "block";
        if (getEl("form-asignar-recurso")) getEl("form-asignar-recurso").style.display = isFin ? "none" : "block";

        await Promise.all([cargarArtistasDelEvento(), cargarRecursosDelEvento(), cargarArtistasGlobales(), cargarCatalogoRecursos()]);
        getEl("modal-detalle")?.classList.add("is-active");
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

function cerrarModal() {
    getEl("modal-detalle")?.classList.remove("is-active");
    eventoSeleccionadoId = null; eventoSeleccionadoEstado = "";
}

async function cargarArtistasDelEvento() {
    const cont = getEl("modal-lista-artistas");
    if (!cont) return;
    try {
        const list = await apiFetch(`/events/${eventoSeleccionadoId}/artists`);
        cont.innerHTML = !list.length ? '<p class="has-text-grey-light is-size-7">No hay artistas vinculados.</p>' :
            list.map(a => `
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                    <div class="is-size-7"><strong class="has-text-white">${arreglarEncoding(a.name || a.nombre)}</strong><br><span class="has-text-grey-light">${arreglarEncoding(a.genre || a.genero || "Sin género")}</span></div>
                    ${eventoSeleccionadoEstado !== "finalizado" ? `<button class="button is-danger is-outlined is-small" onclick="quitarArtistaDeEvento(${a.id})">❌</button>` : ""}
                </div>`).join("");
    } catch { cont.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar.</p>'; }
}

async function agregarArtistaAEvento() {
    const sel = getEl("modal-select-artista"), artistId = sel?.value;
    if (!artistId) return alert("Selecciona un artista.");
    if (sel.options[sel.selectedIndex].disabled) return alert("⚠️ Este artista ya se encuentra asignado a otro evento en las mismas fechas.");
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/artists`, "POST", {
            artist_id: Number(artistId),
        });
        document.getElementById("form-asignar-artista").reset();
        cargarArtistasDelEvento();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

async function quitarArtistaDeEvento(artistId) {
    if (!confirm("¿Quitar artista del evento?")) return;
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/artists/${artistId}`, "DELETE");
        await cargarArtistasDelEvento(); await cargarArtistasGlobales();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

async function cargarRecursosDelEvento() {
    const cont = getEl("modal-lista-recursos");
    if (!cont) return;
    try {
        const list = await apiFetch(`/events/${eventoSeleccionadoId}/resources`);
        cont.innerHTML = !list.length ? '<p class="has-text-grey-light is-size-7">No hay recursos asignados.</p>' :
            list.map(r => `
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background-color: #1f1f1f; border-radius: 4px;">
                    <div class="is-size-7"><strong class="has-text-white">${arreglarEncoding(r.name || r.nombre)}</strong><br><span class="tag is-info is-light">Cantidad: ${r.quantity ?? r.cantidad ?? 1}</span></div>
                    ${eventoSeleccionadoEstado !== "finalizado" ? `<button class="button is-danger is-outlined is-small" onclick="quitarRecursoDeEvento(${r.id})">❌</button>` : ""}
                </div>`).join("");
    } catch { cont.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar.</p>'; }
}

async function agregarRecursoAEvento() {
    const resId = valEl("modal-select-recurso"), cant = valEl("modal-cantidad-recurso");
    if (!resId || !cant) return alert("Selecciona un recurso y cantidad.");
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/resources`, "POST", { resource_id: Number(resId), quantity: Number(cant) });
        if (getEl("modal-cantidad-recurso")) getEl("modal-cantidad-recurso").value = 1;
        if (getEl("modal-select-recurso")) getEl("modal-select-recurso").value = "";
        await cargarRecursosDelEvento(); await cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}

async function quitarRecursoDeEvento(resourceId) {
    if (!confirm("¿Desvincular este recurso del show?")) return;
    try {
        await apiFetch(`/events/${eventoSeleccionadoId}/resources/${resourceId}`, "DELETE");
        await cargarRecursosDelEvento(); await cargarCatalogoRecursos();
    } catch (e) { alert(`⚠️ ${e.message}`); }
}