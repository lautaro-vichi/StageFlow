// =========================================================================
// CONFIGURACIÓN GLOBAL DE LA API
// =========================================================================
const API_URL = "https://stageflow-backend-p2u1.onrender.com";

let eventoSeleccionadoId = null;
let eventoSeleccionadoEstado = "";

// =========================================================================
// INICIALIZACIÓN
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Carga inicial de datos
    cargarEventos();
    cargarArtistasGlobales();
    cargarCatalogoRecursos();

    // Listeners para los formularios
    const formEvento = document.getElementById("form-evento");
    if (formEvento) {
        formEvento.addEventListener("submit", guardarEvento);
    }

    const formArtista = document.getElementById("form-artista");
    if (formArtista) {
        formArtista.addEventListener("submit", crearArtista);
    }
});

// =========================================================================
// FUNCIONES AUXILIARES DE FECHA Y FORMATO
// =========================================================================

/**
 * Convierte una fecha ISO (o de BD) a formato `YYYY-MM-DDTHH:mm` para <input type="datetime-local">
 */
function formatearFechaParaInput(dateString) {
    if (!dateString) return "";
    const date = new Date(String(dateString).replace(" ", "T"));
    if (isNaN(date.getTime())) return "";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formatea una fecha de manera segura a string legible
 */
function formatearFecha(fechaStr) {
    if (!fechaStr) return "No especificada";
    
    // Reemplaza espacios por 'T' en caso de que MySQL envíe "YYYY-MM-DD HH:MM:SS"
    const fechaLimpia = String(fechaStr).replace(" ", "T");
    const fecha = new Date(fechaLimpia);

    // Valida si la fecha devuelta es válida
    if (isNaN(fecha.getTime())) {
        return "Fecha no válida";
    }

    return fecha.toLocaleString();
}

/**
 * Devuelve la clase CSS de Bulma para los badges de estado
 */
function obtenerColorTagEstado(status) {
    switch (status) {
        case "confirmado": return "is-success";
        case "en curso": return "is-warning";
        case "finalizado": return "is-dark";
        case "cancelado": return "is-danger";
        case "planificado":
        default: return "is-info";
    }
}

// =========================================================================
// 1. MÓDULO: EVENTOS (CRUD PRINCIPAL)
// =========================================================================

/**
 * Carga todos los eventos desde el backend y los dibuja en el cronograma
 */
async function cargarEventos() {
    const contenedor = document.getElementById("contenedor-eventos");
    const mensajeVacio = document.getElementById("mensaje-vacio");

    try {
        const res = await fetch(`${API_URL}/events`);
        if (!res.ok) throw new Error("Error al obtener la lista de eventos");
        const eventos = await res.json();

        contenedor.innerHTML = "";

        if (eventos.length === 0) {
            mensajeVacio.classList.remove("is-hidden");
            return;
        }

        mensajeVacio.classList.add("is-hidden");

        eventos.forEach(ev => {
            const isFinalizado = ev.status === "finalizado";
            const tagColor = obtenerColorTagEstado(ev.status);

            // Formateo seguro de fechas
            const fechaInicio = formatearFecha(ev.start_time || ev.inicio);
            const fechaFin = formatearFecha(ev.end_time || ev.fin);

            const columna = document.createElement("div");
            columna.className = "column is-one-third-desktop is-half-tablet";
            columna.innerHTML = `
                <div class="box">
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                        <span class="tag ${tagColor} status-badge">${ev.status}</span>
                        <small class="has-text-grey-light">ID #${ev.id}</small>
                    </div>
                    
                    <h4 class="title is-4 has-text-white mb-2">${ev.name}</h4>
                    <p class="subtitle is-6 has-text-grey-light mb-3">${ev.description || "Sin descripción"}</p>
                    
                    <div class="is-size-7 mb-4">
                        <p><strong>📍 Lugar:</strong> ${ev.location}</p>
                        <p><strong>🕒 Inicio:</strong> ${fechaInicio}</p>
                        <p><strong>🏁 Fin:</strong> ${fechaFin}</p>
                    </div>

                    <div class="buttonsare">
                        <button class="button is-info is-small is-fullwidth mb-2" onclick="abrirModalDetalles(${ev.id})">
                            🔍 Gestionar Asignaciones
                        </button>
                        
                        ${!isFinalizado ? `
                            <div class="buttons is-flex">
                                <button class="button is-warning is-small is-flex-grow-1" onclick='prepararEdicionEvento(${JSON.stringify(ev).replace(/'/g, "&apos;")})'>
                                    ✏️ Editar
                                </button>
                                <button class="button is-danger is-small is-flex-grow-1" onclick="eliminarEvento(${ev.id})">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        ` : `
                            <button class="button is-static is-small is-fullwidth" disabled>
                                🔒 Evento Finalizado
                            </button>
                        `}
                    </div>
                </div>
            `;
            contenedor.appendChild(columna);
        });

    } catch (error) {
        console.error("Error al cargar eventos:", error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Guarda (Crear POST / Actualizar PUT) un evento
 */
async function guardarEvento(event) {
    event.preventDefault();

    const id = document.getElementById("evento-id").value;
    const payload = {
        name: document.getElementById("nombre").value.trim(),
        description: document.getElementById("descripcion").value.trim(),
        location: document.getElementById("lugar").value.trim(),
        start_time: document.getElementById("start-time").value,
        end_time: document.getElementById("end-time").value,
        status: document.getElementById("estado").value
    };

    const url = id ? `${API_URL}/events/${id}` : `${API_URL}/events`;
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.mensaje || "Ocurrió un error al procesar la solicitud.");
        }

        alert(data.mensaje || "Operación realizada exitosamente.");
        cancelarEdicion();
        cargarEventos();

    } catch (error) {
        console.error("Error al guardar evento:", error);
        alert(`⚠️ ${error.message}`);
    }
}

/**
 * Prepara el formulario superior para editar un evento existente
 */
function prepararEdicionEvento(evento) {
    document.getElementById("evento-id").value = evento.id;
    document.getElementById("nombre").value = evento.name;
    document.getElementById("descripcion").value = evento.description;
    document.getElementById("lugar").value = evento.location;
    document.getElementById("start-time").value = formatearFechaParaInput(evento.start_time);
    document.getElementById("end-time").value = formatearFechaParaInput(evento.end_time);
    document.getElementById("estado").value = evento.status;

    // Cambiar títulos y visibilidad de botones
    document.getElementById("titulo-form-evento").innerText = "✏️ Editar Evento";
    document.getElementById("btn-guardar-evento").innerText = "ACTUALIZAR EVENTO";
    document.getElementById("btn-cancelar-edicion").classList.remove("is-hidden");

    // Scroll hacia el formulario
    document.getElementById("form-evento").scrollIntoView({ behavior: 'smooth' });
}

/**
 * Cancela el modo edición y resetea el formulario
 */
function cancelarEdicion() {
    document.getElementById("form-evento").reset();
    document.getElementById("evento-id").value = "";
    document.getElementById("titulo-form-evento").innerText = "🗓️ Agendar Nuevo Evento";
    document.getElementById("btn-guardar-evento").innerText = "GUARDAR EVENTO";
    document.getElementById("btn-cancelar-edicion").classList.add("is-hidden");
}

/**
 * Elimina un evento de la base de datos
 */
async function eliminarEvento(id) {
    if (!confirm("¿Confirma que desea eliminar este evento?")) return;

    try {
        const res = await fetch(`${API_URL}/events/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensaje || "Error al eliminar el evento");

        alert(data.mensaje);
        cargarEventos();

    } catch (error) {
        console.error("Error al eliminar evento:", error);
        alert(`⚠️ ${error.message}`);
    }
}

// =========================================================================
// 2. MÓDULO: ARTISTAS (REGISTRO Y CATÁLOGO GLOBAL)
// =========================================================================

/**
 * Crea un nuevo artista en el catálogo general (POST /artists)
 */
async function crearArtista(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById("nombre-artista").value.trim(),
        genre: document.getElementById("genero-artista").value.trim()
    };

    try {
        const res = await fetch(`${API_URL}/artists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al registrar el artista");

        alert("Artista registrado correctamente.");
        document.getElementById("form-artista").reset();

        // Recargar catálogo
        cargarArtistasGlobales();

    } catch (error) {
        console.error("Error al crear artista:", error);
        alert(`⚠️ ${error.message}`);
    }
}

/**
 * Obtiene la lista global de artistas y llena el panel lateral + select del modal
 */
async function cargarArtistasGlobales() {
    const contenedorLista = document.getElementById("lista-artistas");
    const selectModal = document.getElementById("modal-select-artista");

    try {
        const res = await fetch(`${API_URL}/artists`);
        if (!res.ok) throw new Error("Error al obtener catálogo de artistas");
        const artistas = await res.json();

        // 1. Llenar lista lateral en HTML
        contenedorLista.innerHTML = "";
        if (artistas.length === 0) {
            contenedorLista.innerHTML = '<p class="has-text-grey-light is-italic">No hay artistas registrados.</p>';
        } else {
            const ul = document.createElement("ul");
            ul.className = "is-size-7";
            artistas.forEach(a => {
                const li = document.createElement("li");
                li.className = "mb-1 pb-1 border-bottom-dark";
                li.innerHTML = `<strong>${a.name}</strong> <span class="has-text-grey-light">(${a.genre || "Sin género"})</span>`;
                ul.appendChild(li);
            });
            contenedorLista.appendChild(ul);
        }

        // 2. Llenar select desplegable del modal
        if (selectModal) {
            selectModal.innerHTML = '<option value="">-- Elegir Artista --</option>';
            artistas.forEach(a => {
                selectModal.innerHTML += `<option value="${a.id}">${a.name} (${a.genre})</option>`;
            });
        }

    } catch (error) {
        console.error("Error al cargar lista global de artistas:", error);
    }
}

// =========================================================================
// 3. MÓDULO: RECURSOS (CATÁLOGO GLOBAL)
// =========================================================================

/**
 * Carga el catálogo general de recursos para llenar el selector del modal
 */
async function cargarCatalogoRecursos() {
    const selectModal = document.getElementById("modal-select-recurso");
    if (!selectModal) return;

    try {
        const res = await fetch(`${API_URL}/resources`);
        if (!res.ok) throw new Error("Error al obtener catálogo de recursos");
        const recursos = await res.json();

        selectModal.innerHTML = '<option value="">-- Elegir Recurso --</option>';
        recursos.forEach(r => {
            selectModal.innerHTML += `
                <option value="${r.id}">
                    ${r.name} (Disp: ${r.available_quantity})
                </option>`;
        });

    } catch (error) {
        console.error("Error al cargar catálogo de recursos:", error);
    }
}

// =========================================================================
// 4. MÓDULO: MODAL DETALLES & ASIGNACIONES POR EVENTO
// =========================================================================

/**
 * Abre el modal de detalles, carga la info del evento y sus asignaciones
 */
async function abrirModalDetalles(eventId) {
    eventoSeleccionadoId = eventId;

    try {
        // Obtener datos actualizados del evento
        const res = await fetch(`${API_URL}/events/${eventId}`);
        if (!res.ok) throw new Error("No se pudo cargar la información del evento.");
        const evento = await res.json();

        eventoSeleccionadoEstado = evento.status;

        // Inyectar datos generales en el modal
        document.getElementById("modal-titulo-evento").innerText = `⚡ ${evento.name}`;
        document.getElementById("modal-lugar").innerText = evento.location;
        document.getElementById("modal-horario").innerText = `${formatearFecha(evento.start_time)} - ${formatearFecha(evento.end_time)}`;
        document.getElementById("modal-descripcion").innerText = evento.description || "Sin descripción";

        const badgeEstado = document.getElementById("modal-estado");
        badgeEstado.innerText = evento.status;
        badgeEstado.className = `tag ${obtenerColorTagEstado(evento.status)}`;

        // Ocultar/Mostrar formularios de asignación si el evento finalizó
        const isFinalizado = evento.status === "finalizado";
        document.getElementById("form-asignar-artista").style.display = isFinalizado ? "none" : "block";
        document.getElementById("form-asignar-recurso").style.display = isFinalizado ? "none" : "block";

        // Cargar artistas y recursos asignados a este evento
        await Promise.all([
            cargarArtistasDelEvento(),
            cargarRecursosDelEvento(),
            cargarCatalogoRecursos() // Refresca disponibles en el dropdown
        ]);

        // Abrir modal de Bulma
        document.getElementById("modal-detalle").classList.add("is-active");

    } catch (error) {
        console.error("Error al abrir modal:", error);
        alert(`⚠️ ${error.message}`);
    }
}

/**
 * Cierra el modal de detalles
 */
function cerrarModal() {
    document.getElementById("modal-detalle").classList.remove("is-active");
    eventoSeleccionadoId = null;
    eventoSeleccionadoEstado = "";
}

// --- ASIGNACIÓN DE ARTISTAS ---

async function cargarArtistasDelEvento() {
    const contenedor = document.getElementById("modal-lista-artistas");
    contenedor.innerHTML = '<p class="has-text-grey">Cargando artistas...</p>';

    try {
        const res = await fetch(`${API_URL}/events/${eventoSeleccionadoId}/artists`);
        if (!res.ok) throw new Error("Error al obtener artistas asignados");
        const asignados = await res.json();

        contenedor.innerHTML = "";

        if (asignados.length === 0) {
            contenedor.innerHTML = '<p class="has-text-grey-light is-size-7">No hay artistas vinculados a este show.</p>';
            return;
        }

        const isFinalizado = eventoSeleccionadoEstado === "finalizado";

        asignados.forEach(art => {
            const item = document.createElement("div");
            item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2 style-box-item";
            item.style.backgroundColor = "#1f1f1f";
            item.style.borderRadius = "4px";

            item.innerHTML = `
                <div class="is-size-7">
                    <strong class="has-text-white">${art.name}</strong>
                    <br><span class="has-text-grey-light">${art.genre || "Sin género"}</span>
                </div>
                ${!isFinalizado ? `
                    <button class="button is-danger is-outlined is-small" onclick="quitarArtistaDeEvento(${art.id})">
                        ❌
                    </button>
                ` : ""}
            `;
            contenedor.appendChild(item);
        });

    } catch (error) {
        console.error("Error al cargar artistas asignados:", error);
        contenedor.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar asignaciones.</p>';
    }
}

async function agregarArtistaAEvento() {
    const artistId = document.getElementById("modal-select-artista").value;

    if (!artistId) {
        alert("Selecciona un artista de la lista.");
        return;
    }

    const start_time = document.getElementById("start-time").value || new Date().toISOString();
    const end_time = document.getElementById("end-time").value || new Date().toISOString();

    const payload = {
        artist_id: Number(artistId),
        start_time: start_time,
        end_time: end_time
    };

    try {
        const res = await fetch(`${API_URL}/events/${eventoSeleccionadoId}/artists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al asignar artista");

        alert("Artista asignado correctamente.");
        document.getElementById("form-asignar-artista").reset();
        cargarArtistasDelEvento();

    } catch (error) {
        console.error("Error al asignar artista:", error);
        alert(`⚠️ ${error.message}`);
    }
}

async function quitarArtistaDeEvento(artistId) {
    if (!confirm("¿Desea quitar este artista del show?")) return;

    try {
        const res = await fetch(`${API_URL}/events/${eventoSeleccionadoId}/artists/${artistId}`, {
            method: "DELETE"
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al quitar artista");

        cargarArtistasDelEvento();

    } catch (error) {
        console.error("Error al quitar artista:", error);
        alert(`⚠️ ${error.message}`);
    }
}

// --- ASIGNACIÓN DE RECURSOS ---

async function cargarRecursosDelEvento() {
    const contenedor = document.getElementById("modal-lista-recursos");
    contenedor.innerHTML = '<p class="has-text-grey">Cargando recursos...</p>';

    try {
        const res = await fetch(`${API_URL}/events/${eventoSeleccionadoId}/resources`);
        if (!res.ok) throw new Error("Error al obtener recursos asignados");
        const asignados = await res.json();

        contenedor.innerHTML = "";

        if (asignados.length === 0) {
            contenedor.innerHTML = '<p class="has-text-grey-light is-size-7">No hay recursos asignados a este show.</p>';
            return;
        }

        const isFinalizado = eventoSeleccionadoEstado === "finalizado";

        asignados.forEach(rec => {
            const item = document.createElement("div");
            item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2";
            item.style.backgroundColor = "#1f1f1f";
            item.style.borderRadius = "4px";

            item.innerHTML = `
                <div class="is-size-7">
                    <strong class="has-text-white">${rec.name}</strong>
                    <br><span class="tag is-info is-light">Cantidad: ${rec.quantity}</span>
                </div>
                ${!isFinalizado ? `
                    <button class="button is-danger is-outlined is-small" onclick="quitarRecursoDeEvento(${rec.id})">
                        ❌
                    </button>
                ` : ""}
            `;
            contenedor.appendChild(item);
        });

    } catch (error) {
        console.error("Error al cargar recursos asignados:", error);
        contenedor.innerHTML = '<p class="has-text-danger is-size-7">Error al cargar recursos.</p>';
    }
}

async function agregarRecursoAEvento() {
    const resourceId = document.getElementById("modal-select-recurso").value;
    const cantidad = document.getElementById("modal-cantidad-recurso").value;

    if (!resourceId || !cantidad) {
        alert("Selecciona un recurso y una cantidad válida.");
        return;
    }

    const payload = {
        resource_id: Number(resourceId),
        quantity: Number(cantidad)
    };

    try {
        const res = await fetch(`${API_URL}/events/${eventoSeleccionadoId}/resources`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al asignar recurso");

        alert("Recurso asignado correctamente.");
        document.getElementById("modal-cantidad-recurso").value = 1;
        document.getElementById("modal-select-recurso").value = "";

        // Refrescar ambas listas
        await cargarRecursosDelEvento();
        await cargarCatalogoRecursos();

    } catch (error) {
        console.error("Error al asignar recurso:", error);
        alert(`⚠️ ${error.message}`);
    }
}

async function quitarRecursoDeEvento(resourceId) {
    if (!confirm("¿Desea desvincular este recurso del show?")) return;

    try {
        const res = await fetch(`${API_URL}/events/${eventoSeleccionadoId}/resources/${resourceId}`, {
            method: "DELETE"
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al desvincular recurso");

        // Refrescar lista de asignados y catálogo de disponibles
        await cargarRecursosDelEvento();
        await cargarCatalogoRecursos();

    } catch (error) {
        console.error("Error al quitar recurso:", error);
        alert(`⚠️ ${error.message}`);
    }
}