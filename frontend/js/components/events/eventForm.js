/*
 * los archivos Form.js se encargan de gestionar
 * los formularios de la interfaz, permitiendo ingresar,
 * modificar y validar los datos antes de enviarlos
*/

import { postEvent, putEvent } from "../../api/eventApi.js";
import { renderEventsTable } from "./eventTable.js";

import { formatDateForInput } from "../../utils/formatters.js";

let currentEditingId = null;

/*
 * carga los datos de un evento en el formulario para editar
*/
export function loadEventForEdit(event) {
    const form = document.getElementById("form-evento");
    if (!form) return;

    // Llenar entradas con los valores del evento
    document.getElementById("nombre").value = event.name || "";
    document.getElementById("descripcion").value = event.description || "";
    document.getElementById("lugar").value = event.location || "";
    
    // convertir ISO string a formato exigido por input datetime-local (YYYY-MM-THH:mm)
    if (event.start_time) {
       document.getElementById("start-time").value = formatDateForInput(event.start_time);
    }
    if (event.end_time) {
        document.getElementById("end-time").value = formatDateForInput(event.end_time);
    }

    if (event.status) {
        document.getElementById("estado").value = event.status;
    }

    // Guardar ID y mostrar selector de estado y botón cancelar
    currentEditingId = event.id;
    document.getElementById("evento-id").value = event.id;

    const titleForm = document.getElementById("titulo-form-evento");
    const saveBtn = document.getElementById("btn-guardar-evento");
    const cancelBtn = document.getElementById("btn-cancelar-edicion");
    const statusField = document.getElementById("campo-estado-evento");

    if (titleForm) titleForm.textContent = "✏️ Editar Evento";
    if (saveBtn) saveBtn.textContent = "GUARDAR CAMBIOS";
    if (cancelBtn) cancelBtn.classList.remove("is-hidden");
    if (statusField) statusField.classList.remove("is-hidden");
}

/*
 * resetea el formulario al modo creación.
*/
export function resetEventForm() {
    const form = document.getElementById("form-evento");
    if (form) form.reset();

    currentEditingId = null;
    document.getElementById("evento-id").value = "";

    const titleForm = document.getElementById("titulo-form-evento");
    const saveBtn = document.getElementById("btn-guardar-evento");
    const cancelBtn = document.getElementById("btn-cancelar-edicion");
    const statusField = document.getElementById("campo-estado-evento");

    if (titleForm) titleForm.textContent = "🗓️ Agendar Nuevo Evento";
    if (saveBtn) saveBtn.textContent = "GUARDAR EVENTO";
    if (cancelBtn) cancelBtn.classList.add("is-hidden");
    if (statusField) statusField.classList.add("is-hidden");
}

/*
 * configura los eventos del formulario de eventos.
*/
export function setupEventFormEvents() {
    const form = document.getElementById("form-evento");
    const cancelBtn = document.getElementById("btn-cancelar-edicion");

    if (!form) return;

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetEventForm();
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventData = {
            name: document.getElementById("nombre").value.trim(),
            description: document.getElementById("descripcion").value.trim(),
            location: document.getElementById("lugar").value.trim(),
            start_time: document.getElementById("start-time").value,
            end_time: document.getElementById("end-time").value,
            status: currentEditingId ? document.getElementById("estado").value : "planificado"
        };

        if (!eventData.name || !eventData.start_time || !eventData.end_time) {
            alert("Por favor complete los campos obligatorios.");
            return;
        }

        try {
            if (currentEditingId) {
                await putEvent(currentEditingId, eventData);
                alert("Evento actualizado correctamente.");
            } else {
                await postEvent(eventData);
                alert("Evento agendado correctamente.");
            }

            resetEventForm();
            await renderEventsTable();

        } catch (error) {
            console.error("Error al guardar evento:", error);
            alert("Ocurrió un error al guardar el evento: " + error.message);
        }
    });
}