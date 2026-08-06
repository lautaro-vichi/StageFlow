const API_URL = "http://localhost:3000";

let eventoSeleccionadoId = null;
let eventoSeleccionadoEstado = "";

// =========================================================================
// INICIALIZACIÓN
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarEventos();
    cargarArtistasGlobales();
    cargarCatalogoRecursos();

    const formEvento = document.getElementById("form-evento");
    if (formEvento) formEvento.addEventListener("submit", guardarEvento);

    const formArtista = document.getElementById("form-artista");
    if (formArtista) formArtista.addEventListener("submit", guardarArtista);

    const formRecurso = document.getElementById("form-recurso");
    if (formRecurso) formRecurso.addEventListener("submit", guardarRecurso);
});

// =========================================================================
// FUNCIONES AUXILIARES DE FECHA Y FORMATO
// =========================================================================
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

function formatearFecha(fechaStr) {
    if (!fechaStr) return "No especificada";
    const fechaLimpia = String(fechaStr).replace(" ", "T");
    const fecha = new Date(fechaLimpia);
    if (isNaN(fecha.getTime())) return "Fecha no válida";
    return fecha.toLocaleString();
}

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
// 1. MÓDULO: ARTISTAS (CRUD COMPLETO)
// =========================================================================

async function cargarArtistasGlobales() {
    const contenedorLista = document.getElementById("lista-artistas");
    const selectModal = document.getElementById("modal-select-artista");

    try {
        const res = await fetch(`${API_URL}/artists`);
        if (!res.ok) throw new Error("Error al obtener catálogo de artistas");
        const artistas = await res.json();

        if (contenedorLista) {
            contenedorLista.innerHTML = "";
            if (artistas.length === 0) {
                contenedorLista.innerHTML = '<p class="has-text-grey-light is-italic">No hay artistas registrados.</p>';
            } else {
                artistas.forEach(a => {
                    const item = document.createElement("div");
                    item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2 border-bottom-dark";
                    item.style.backgroundColor = "#1f1f1f";
                    item.style.borderRadius = "4px";

                    const artistaEscapado = JSON.stringify(a).replace(/'/g, "&apos;");

                    item.innerHTML = `
                        <div class="is-size-7">
                            <strong class="has-text-white">${a.name}</strong> 
                            <span class="has-text-info">(${a.genre || "Sin género"})</span>
                            ${a.national ? '<span class="tag is-small is-dark ml-1">Nacional</span>' : ''}
                        </div>
                        <div class="buttonsare">
                            <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionArtista(${artistaEscapado})'>✏️</button>
                            <button class="button is-danger is-small py-0 px-2" onclick="eliminarArtista(${a.id})">🗑️</button>
                        </div>
                    `;
                    contenedorLista.appendChild(item);
                });
            }
        }

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

async function guardarArtista(event) {
    event.preventDefault();
    const id = document.getElementById("artista-id").value;

    const payload = {
        name: document.getElementById("nombre-artista").value.trim(),
        genre: document.getElementById("genero-artista").value.trim(),
        description: document.getElementById("descripcion-artista")?.value.trim() || "",
        age: document.getElementById("edad-artista")?.value ? Number(document.getElementById("edad-artista").value) : null,
        national: document.getElementById("nacional-artista")?.checked || false
    };

    const url = id ? `${API_URL}/artists/${id}` : `${API_URL}/artists`;
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al procesar el artista");

        alert(data.mensaje || "Artista guardado correctamente.");
        cancelarEdicionArtista();
        cargarArtistasGlobales();
    } catch (error) {
        console.error("Error al guardar artista:", error);
        alert(`⚠️ ${error.message}`);
    }
}

function prepararEdicionArtista(artista) {
    document.getElementById("artista-id").value = artista.id;
    document.getElementById("nombre-artista").value = artista.name;
    document.getElementById("genero-artista").value = artista.genre || "";
    if (document.getElementById("descripcion-artista")) document.getElementById("descripcion-artista").value = artista.description || "";
    if (document.getElementById("edad-artista")) document.getElementById("edad-artista").value = artista.age || "";
    if (document.getElementById("nacional-artista")) document.getElementById("nacional-artista").checked = Boolean(artista.national);

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
    if (!confirm("¿Desea eliminar este artista del catálogo general?")) return;

    try {
        const res = await fetch(`${API_URL}/artists/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensaje || "Error al eliminar artista");

        alert(data.mensaje || "Artista eliminado con éxito.");
        cargarArtistasGlobales();
    } catch (error) {
        console.error("Error al eliminar artista:", error);
        alert(`⚠️ ${error.message}`);
    }
}

// =========================================================================
// 2. MÓDULO: RECURSOS (CRUD COMPLETO)
// =========================================================================

async function cargarCatalogoRecursos() {
    const contenedorLista = document.getElementById("lista-recursos");
    const selectModal = document.getElementById("modal-select-recurso");

    try {
        const res = await fetch(`${API_URL}/resources`);
        if (!res.ok) throw new Error("Error al obtener catálogo de recursos");
        const recursos = await res.json();

        if (contenedorLista) {
            contenedorLista.innerHTML = "";
            if (recursos.length === 0) {
                contenedorLista.innerHTML = '<p class="has-text-grey-light is-italic">No hay recursos registrados.</p>';
            } else {
                recursos.forEach(r => {
                    const item = document.createElement("div");
                    item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2 border-bottom-dark";
                    item.style.backgroundColor = "#1f1f1f";
                    item.style.borderRadius = "4px";

                    const recursoEscapado = JSON.stringify(r).replace(/'/g, "&apos;");

                    item.innerHTML = `
                        <div class="is-size-7">
                            <strong class="has-text-white">${r.name}</strong> 
                            <span class="tag is-info is-light py-0 px-1 ml-1">${r.type || "General"}</span>
                            <br><span class="has-text-grey-light">Total: ${r.total_quantity} | Disponibles: ${r.available_quantity}</span>
                        </div>
                        <div class="buttonsare">
                            <button class="button is-warning is-small py-0 px-2" onclick='prepararEdicionRecurso(${recursoEscapado})'>✏️</button>
                            <button class="button is-danger is-small py-0 px-2" onclick="eliminarRecurso(${r.id})">🗑️</button>
                        </div>
                    `;
                    contenedorLista.appendChild(item);
                });
            }
        }

        if (selectModal) {
            selectModal.innerHTML = '<option value="">-- Elegir Recurso --</option>';
            recursos.forEach(r => {
                selectModal.innerHTML += `<option value="${r.id}">${r.name} (Disp: ${r.available_quantity})</option>`;
            });
        }
    } catch (error) {
        console.error("Error al cargar catálogo de recursos:", error);
    }
}

async function guardarRecurso(event) {
    event.preventDefault();
    const id = document.getElementById("recurso-id").value;

    const cantidad = Number(document.getElementById("cantidad-recurso").value);

    // Objeto limpio enviando únicamente las columnas exactas de la BD
    const payload = {
        name: document.getElementById("nombre-recurso").value.trim(),
        type: document.getElementById("tipo-recurso").value.trim(),
        description: document.getElementById("descripcion-recurso").value.trim() || "",
        total_quantity: cantidad,
        available_quantity: cantidad
    };

    const url = id ? `${API_URL}/resources/${id}` : `${API_URL}/resources`;
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.mensaje || data.error || "Error al añadir recurso");
        }

        alert(data.mensaje || "Recurso guardado correctamente.");
        cancelarEdicionRecurso();
        cargarCatalogoRecursos();
    } catch (error) {
        console.error("Error al guardar recurso:", error);
        alert(`⚠️ ${error.message}`);
    }
}

function prepararEdicionRecurso(recurso) {
    document.getElementById("recurso-id").value = recurso.id;
    document.getElementById("nombre-recurso").value = recurso.name;
    document.getElementById("tipo-recurso").value = recurso.type || "";
    if (document.getElementById("descripcion-recurso")) document.getElementById("descripcion-recurso").value = recurso.description || "";
    document.getElementById("cantidad-recurso").value = recurso.total_quantity;

    document.getElementById("titulo-form-recurso").innerText = "✏️ Editar Recurso";
    document.getElementById("btn-guardar-recurso").innerText = "ACTUALIZAR RECURSO";
    document.getElementById("btn-cancelar-recurso")?.classList.remove("is-hidden");
}

function cancelarEdicionRecurso() {
    document.getElementById("form-recurso").reset();
    document.getElementById("recurso-id").value = "";
    document.getElementById("titulo-form-recurso").innerText = "🛠️ Registrar / Editar Recurso";
    document.getElementById("btn-guardar-recurso").innerText = "GUARDAR RECURSO";
    document.getElementById("btn-cancelar-recurso")?.classList.add("is-hidden");
}

async function eliminarRecurso(id) {
    if (!confirm("¿Desea eliminar este recurso del inventario general?")) return;

    try {
        const res = await fetch(`${API_URL}/resources/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensaje || "Error al eliminar recurso");

        alert(data.mensaje || "Recurso eliminado con éxito.");
        cargarCatalogoRecursos();
    } catch (error) {
        console.error("Error al eliminar recurso:", error);
        alert(`⚠️ ${error.message}`);
    }
}

// =========================================================================
// 3. MÓDULO: EVENTOS
// =========================================================================

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
    }
}

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
        if (!res.ok) throw new Error(data.mensaje || "Ocurrió un error al procesar la solicitud.");

        alert(data.mensaje || "Operación realizada exitosamente.");
        cancelarEdicion();
        cargarEventos();
    } catch (error) {
        console.error("Error al guardar evento:", error);
        alert(`⚠️ ${error.message}`);
    }
}

function prepararEdicionEvento(evento) {
    document.getElementById("evento-id").value = evento.id;
    document.getElementById("nombre").value = evento.name;
    document.getElementById("descripcion").value = evento.description;
    document.getElementById("lugar").value = evento.location;
    document.getElementById("start-time").value = formatearFechaParaInput(evento.start_time);
    document.getElementById("end-time").value = formatearFechaParaInput(evento.end_time);
    document.getElementById("estado").value = evento.status;

    document.getElementById("titulo-form-evento").innerText = "✏️ Editar Evento";
    document.getElementById("btn-guardar-evento").innerText = "ACTUALIZAR EVENTO";
    document.getElementById("btn-cancelar-edicion").classList.remove("is-hidden");

    document.getElementById("form-evento").scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
    document.getElementById("form-evento").reset();
    document.getElementById("evento-id").value = "";
    document.getElementById("titulo-form-evento").innerText = "🗓️ Agendar Nuevo Evento";
    document.getElementById("btn-guardar-evento").innerText = "GUARDAR EVENTO";
    document.getElementById("btn-cancelar-edicion").classList.add("is-hidden");
}

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
// 4. MÓDULO: MODAL DETALLES & ASIGNACIONES POR EVENTO
// =========================================================================

async function abrirModalDetalles(eventId) {
    eventoSeleccionadoId = eventId;

    try {
        const res = await fetch(`${API_URL}/events/${eventId}`);
        if (!res.ok) throw new Error("No se pudo cargar la información del evento.");
        const evento = await res.json();

        eventoSeleccionadoEstado = evento.status;

        document.getElementById("modal-titulo-evento").innerText = `⚡ ${evento.name}`;
        document.getElementById("modal-lugar").innerText = evento.location;
        document.getElementById("modal-horario").innerText = `${formatearFecha(evento.start_time)} - ${formatearFecha(evento.end_time)}`;
        document.getElementById("modal-descripcion").innerText = evento.description || "Sin descripción";

        const badgeEstado = document.getElementById("modal-estado");
        badgeEstado.innerText = evento.status;
        badgeEstado.className = `tag ${obtenerColorTagEstado(evento.status)}`;

        const isFinalizado = evento.status === "finalizado";
        document.getElementById("form-asignar-artista").style.display = isFinalizado ? "none" : "block";
        document.getElementById("form-asignar-recurso").style.display = isFinalizado ? "none" : "block";

        await Promise.all([
            cargarArtistasDelEvento(),
            cargarRecursosDelEvento(),
            cargarCatalogoRecursos()
        ]);

        document.getElementById("modal-detalle").classList.add("is-active");
    } catch (error) {
        console.error("Error al abrir modal:", error);
        alert(`⚠️ ${error.message}`);
    }
}

function cerrarModal() {
    document.getElementById("modal-detalle").classList.remove("is-active");
    eventoSeleccionadoId = null;
    eventoSeleccionadoEstado = "";
}

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
            item.className = "is-flex is-justify-content-space-between is-align-items-center mb-2 p-2";
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

    const payload = {
        artist_id: Number(artistId),
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString()
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

        await cargarRecursosDelEvento();
        await cargarCatalogoRecursos();
    } catch (error) {
        console.error("Error al quitar recurso:", error);
        alert(`⚠️ ${error.message}`);
    }
}