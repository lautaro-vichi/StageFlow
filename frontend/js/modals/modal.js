/*
 * La carpeta modals contiene los componentes encargados de crear y
 * gestionar las ventanas modales de la aplicación, utilizadas para
 * mostrar formularios, confirmaciones y otras acciones sin cambiar de página.
*/

import { getEvents } from "../api/eventApi.js";
import { loadModalArtists } from "./modalArtists.js";
import { loadModalResources } from "./modalResources.js";

// ✅ Importación de la utilidad de fechas
import { formatDate } from "../utils/formatters.js";

let currentModalEventId = null;

/**
 * Abre el modal y carga toda la información del evento seleccionado.
 */
export async function openEventModal(eventId) {
    const modal = document.getElementById("modal-detalle");

    if (!modal) return;

    currentModalEventId = eventId;

    try {
        // 1. Obtener datos del evento actual
        const events = await getEvents();
        const event = events.find(e => e.id == eventId);

        if (!event) {
            alert("No se encontró el evento seleccionado.");
            return;
        }

        // 2. Llenar los datos generales en el modal
        document.getElementById("modal-titulo-evento").textContent = `⚡ ${event.name}`;
        document.getElementById("modal-lugar").textContent = event.location || "No especificado";
        
        // ✅ AQUÍ ESTÁ EL CAMBIO: Se aplica formatDate a ambas fechas
        const inicioFormateado = formatDate(event.start_time);
        const finFormateado = formatDate(event.end_time);
        document.getElementById("modal-horario").textContent = `${inicioFormateado} - ${finFormateado}`;

        document.getElementById("modal-estado").textContent = event.status || "planificado";
        document.getElementById("modal-descripcion").textContent = event.description || "Sin descripción";

        // 3. Activar el modal en Bulma
        modal.classList.add("is-active");

        // 4. Cargar sub-módulos de artistas y recursos
        await loadModalArtists(eventId);
        await loadModalResources(eventId);

    } catch (error) {
        console.error("Error al abrir el modal:", error);
        alert("Ocurrió un error al obtener la información del evento.");
    }
}

/**
 * Cierra el modal de detalles.
 */
export function closeEventModal() {
    const modal = document.getElementById("modal-detalle");
    if (modal) {
        modal.classList.remove("is-active");
    }
    currentModalEventId = null;
}

/**
 * Configura los eventos de cierre del modal.
 */
export function setupEventModalEvents() {
    window.cerrarModal = closeEventModal;
}