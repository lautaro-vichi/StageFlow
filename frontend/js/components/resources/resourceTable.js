


import { getResources, deleteResource } from "../../api/resourceApi.js";
import { loadResourceForEdit } from "./resourceForm.js";

/*
 * Renderiza el inventario de recursos en el DOM en formato de tarjetas de Bulma.
*/
export async function renderResourcesTable() {
    try {
        const container = document.getElementById("resources-list");
        if (!container) return;

        // Pedimos la lista de recursos a la API
        const resources = await getResources();

        // Caso inventario vacío
        if (!resources || resources.length === 0) {
            container.innerHTML = `<p class="has-text-centered has-text-grey-light is-italic">No hay recursos registrados.</p>`;
            return;
        }

        // Mapeamos los recursos a tarjetas visuales
        const cardsHtml = resources.map(resource => `
            <div class="box mb-3 p-3" style="background: #363636 !important; border: 1px solid #4a4a4a;">
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <div>
                        <p class="has-text-weight-bold is-size-5 has-text-white">${resource.name}</p>
                        <p class="is-size-7 has-text-success">
                            Tipo: ${resource.type || "General"} • Disponible: ${resource.available_quantity ?? "N/A"}
                        </p>
                        ${resource.description ? `<p class="is-size-7 has-text-grey-light mt-1">${resource.description}</p>` : ""}
                    </div>
                    <div class="buttonsare-wrap ml-2">
                        <button class="button is-small is-warning btn-edit-resource" data-id="${resource.id}">Editar</button>
                        <button class="button is-small is-danger btn-delete-resource" data-id="${resource.id}">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join("");

        container.innerHTML = cardsHtml;

    } catch (error) {
        console.error("Error al renderizar los recursos:", error.message);
        const container = document.getElementById("resources-list");
        if (container) {
            container.innerHTML = `<p class="has-text-danger is-size-7">Error al cargar recursos.</p>`;
        }
    }
}

/*
 * Delegación de eventos para los botones Editar y Eliminar de Recursos.
*/
export function setupResourceTableEvents() {
    const container = document.getElementById("resources-list");
    if (!container) return;

    container.addEventListener("click", async (event) => {
        // 1. Manejo del botón Eliminar
        const deleteBtn = event.target.closest(".btn-delete-resource");
        if (deleteBtn) {
            const resourceId = deleteBtn.dataset.id;
            const confirmed = confirm("¿Estás seguro de que querés eliminar este recurso del inventario?");

            if (confirmed) {
                try {
                    await deleteResource(resourceId);
                    await renderResourcesTable(); // Refrescamos la vista
                } catch (error) {
                    alert("Error al eliminar el recurso: " + error.message);
                }
            }
            return;
        }

        // 2. Manejo del botón Editar
        const editBtn = event.target.closest(".btn-edit-resource");
        if (editBtn) {
            const resourceId = editBtn.dataset.id;
            try {
                const resources = await getResources();
                const resourceToEdit = resources.find(r => r.id == resourceId);

                if (resourceToEdit) {
                    loadResourceForEdit(resourceToEdit);
                }
            } catch (error) {
                alert("Error al obtener los datos del recurso: " + error.message);
            }
        }
    });
}