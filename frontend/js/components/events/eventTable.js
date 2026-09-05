/*
 * los archivos Table.js su funcion principal es mostrar y gestionar
 * información en forma de tabla dentro de la interfaz
 * también pueden manejar las acciones relacionadas con los registros (borrar, editar, etc)
*/

import { getEvents, deleteEvent } from "../../api/eventApi.js";
import { loadEventForEdit } from "./eventForm.js";

/*
 * renderiza la lista de eventos en el DOM.
*/

export async function renderEventsTable() {
    try {
        const container = document.getElementById("contenedor-eventos");
        const emptyMsg = document.getElementById("mensaje-vacio");

        if (!container) return;

        const events = await getEvents();

        if (!events || events.length === 0) {
            container.innerHTML = "";
            if (emptyMsg) emptyMsg.classList.remove("is-hidden");
            return;
        }

        if (emptyMsg) emptyMsg.classList.add("is-hidden");

        const cardsHtml = events.map(event => {
            // Formatear fechas para mostrar en pantalla
            const startDate = event.start_time ? new Date(event.start_time).toLocaleString("es-AR") : "N/A";
            const endDate = event.end_time ? new Date(event.end_time).toLocaleString("es-AR") : "N/A";

            // Asignar color de etiqueta de Bulma según el estado
            let statusTagClass = "is-info";
            if (event.status === "cancelado") statusTagClass = "is-danger";
            if (event.status === "confirmado") statusTagClass = "is-success";
            if (event.status === "en curso") statusTagClass = "is-warning";
            if (event.status === "finalizado") statusTagClass = "is-dark";

            return `
                <div class="column is-half-desktop is-full-tablet">
                    <div class="box p-4" style="background: #262626 !important; border: 1px solid #363636;">
                        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                            <h4 class="title is-5 has-text-white mb-0">${event.name}</h4>
                            <span class="tag ${statusTagClass} is-capitalized">${event.status || "planificado"}</span>
                        </div>
                        
                        <p class="is-size-7 has-text-grey-light mb-1">
                            <strong>📍 Lugar:</strong> ${event.location || "No especificado"}
                        </p>
                        <p class="is-size-7 has-text-grey-light mb-2">
                            <strong>🗓️ Inicio:</strong> ${startDate} | <strong>Fin:</strong> ${endDate}
                        </p>
                        <p class="is-size-7 has-text-grey-lighter mb-3">${event.description || ""}</p>
                        
                        <div class="buttonsare-wrap">
                            <button class="button is-small is-info btn-detail-event" data-id="${event.id}">⚡ Ver Detalles</button>
                            <button class="button is-small is-warning btn-edit-event" data-id="${event.id}">Editar</button>
                            <button class="button is-small is-danger btn-delete-event" data-id="${event.id}">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = cardsHtml;

    } catch (error) {
        console.error("Error al renderizar eventos:", error.message);
    }
}

/*
 * configura la delegación de eventos para las tarjetas de eventos.
*/
export function setupEventTableEvents() {
    const container = document.getElementById("contenedor-eventos");
    if (!container) return;

    container.addEventListener("click", async (event) => {
        // 1. eliminar evento
        const deleteBtn = event.target.closest(".btn-delete-event");
        if (deleteBtn) {
            const eventId = deleteBtn.dataset.id;
            const confirmed = confirm("¿Estás seguro de que deseas eliminar este evento?");
            
            if (confirmed) {
                try {
                    await deleteEvent(eventId);
                    await renderEventsTable();
                } catch (error) {
                    alert("Error al eliminar el evento: " + error.message);
                }
            }
            return;
        }

        // 2. cargar evento para editar
        const editBtn = event.target.closest(".btn-edit-event");
        if (editBtn) {
            const eventId = editBtn.dataset.id;
            try {
                const events = await getEvents();
                const eventToEdit = events.find(e => e.id == eventId);
                
                if (eventToEdit) {
                    loadEventForEdit(eventToEdit);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            } catch (error) {
                alert("Error al obtener los datos del evento: " + error.message);
            }
            return;
        }

        // 3. abrir modal de detalles (se conectará con la lógica del modal)
        const detailBtn = event.target.closest(".btn-detail-event");
        if (detailBtn) {
            const eventId = detailBtn.dataset.id;
            console.log("Abrir modal de detalles para el evento ID:", eventId);
            // aquí llamarás a la función que abre el modal y carga asignaciones
        }
    });
}