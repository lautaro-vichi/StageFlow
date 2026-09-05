/*
 * los archivos Form.js se encargan de gestionar
 * los formularios de la interfaz, permitiendo ingresar,
 * modificar y validar los datos antes de enviarlos
*/


import { postResource, putResource } from "../../api/resourceApi.js";
import { renderResourcesTable } from "./resourceTable.js";

// variable de estado interno para controlar si estamos creando (null) o editando (ID)
let currentEditingId = null;

/*
 * carga los datos de un recurso en los campos del formulario
 * y activa el modo edición visualmente.
*/
export function loadResourceForEdit(resource) {
    const form = document.getElementById("resource-form");
    if (!form) return;

    // 1. poblamos los campos de texto
    document.getElementById("resource-name").value = resource.name || "";
    document.getElementById("resource-type").value = resource.type || "";
    document.getElementById("resource-available").value = resource.available_quantity ?? "";
    document.getElementById("resource-description").value = resource.description || "";

    // cargar cantidad total en el campo si existe
    const totalInput = document.getElementById("resource-total");
    if (totalInput) {
        totalInput.value = resource.total_quantity ?? resource.available_quantity ?? "";
    }

    // 2. cuardamos el ID que estamos modificando
    currentEditingId = resource.id;
    document.getElementById("resource-id").value = resource.id;

    // 3. cambiamos la interfaz a modo edición
    const saveBtn = document.getElementById("resource-save-btn");
    const cancelBtn = document.getElementById("resource-cancel-btn");

    if (saveBtn) saveBtn.textContent = "GUARDAR CAMBIOS";
    if (cancelBtn) cancelBtn.classList.remove("is-hidden");
}

/*
 * resetea el formulario a su estado original (modo crear).
*/
export function resetResourceForm() {
    const form = document.getElementById("resource-form");
    if (form) form.reset();

    currentEditingId = null;
    document.getElementById("resource-id").value = "";

    const saveBtn = document.getElementById("resource-save-btn");
    const cancelBtn = document.getElementById("resource-cancel-btn");

    if (saveBtn) saveBtn.textContent = "GUARDAR RECURSO";
    if (cancelBtn) cancelBtn.classList.add("is-hidden");
}

/*
 * inicializa los eventos del formulario de recursos y del botón cancelar.
*/
export function setupResourceFormEvents() {
    const form = document.getElementById("resource-form");
    const cancelBtn = document.getElementById("resource-cancel-btn");
    if (!form) return;

    // escuchador para cancelar la edición
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetResourceForm();
        });
    }

    // escuchador para el envío del formulario (submit)
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // evita que la página se recargue

        const availableQty = Number(document.getElementById("resource-available").value);

        // mapeo exacto hacia la tabla 'resources' de la Base de Datos MySQL
        const resourceData = {
            name: document.getElementById("resource-name").value.trim(),
            type: document.getElementById("resource-type").value.trim(),
            available_quantity: availableQty,
            total_quantity: availableQty, // al crear, la cantidad total es igual a la disponible
            description: document.getElementById("resource-description").value.trim()
        };

        // validación básica
        if (!resourceData.name) {
            alert("El nombre del recurso es obligatorio.");
            return;
        }

        try {
            if (currentEditingId) {
                // si hay ID -> Modo Edición (PUT)
                await putResource(currentEditingId, resourceData);
                alert("Recurso actualizado con éxito.");
            } else {
                // Si es null -> modo Alta (POST)
                await postResource(resourceData);
                alert("Recurso creado con éxito.");
            }

            // limpiamos el formulario y refrescamos la tabla de recursos
            resetResourceForm();
            await renderResourcesTable();

        } catch (error) {
            console.error("Error al guardar el recurso:", error);
            alert("Ocurrió un error al guardar el recurso: " + error.message);
        }
    });
}