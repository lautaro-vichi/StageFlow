import { getResources } from "../api/resourceApi.js";
import { getEventResources, postEventResource, deleteEventResource } from "../api/eventApi.js";

let currentEventId = null;

export async function loadModalResources(eventId) {
    currentEventId = eventId;
    await renderAssignedResources();
    await populateResourceSelect();
}

async function renderAssignedResources() {
    const container = document.getElementById("modal-lista-recursos");
    if (!container) return;

    try {
        const assignedResources = await getEventResources(currentEventId);

        if (!assignedResources || assignedResources.length === 0) {
            container.innerHTML = `<p class="has-text-grey is-italic">No hay equipos asignados aún.</p>`;
            return;
        }

        container.innerHTML = assignedResources.map(resource => `
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background: #1a1a1a; border-radius: 4px;">
                <div>
                    <span class="has-text-white">${resource.name}</span>
                    <span class="tag is-success is-light ml-2">Cant: ${resource.quantity || 1}</span>
                </div>
                <button class="button is-small is-danger is-light btn-remove-resource" data-id="${resource.id}">Quitar</button>
            </div>
        `).join("");

        container.querySelectorAll(".btn-remove-resource").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const resourceId = e.target.dataset.id;
                await deleteEventResource(currentEventId, resourceId);
                await renderAssignedResources();
            });
        });

    } catch (error) {
        container.innerHTML = `<p class="has-text-danger is-size-7">Error al cargar recursos.</p>`;
    }
}

async function populateResourceSelect() {
    const select = document.getElementById("modal-select-recurso");
    if (!select) return;

    try {
        const allResources = await getResources();
        select.innerHTML = `<option value="">-- Elegir Recurso --</option>` + 
            allResources.map(r => `<option value="${r.id}">${r.name} (Disp: ${r.available_quantity})</option>`).join("");
    } catch (error) {
        console.error("Error al poblar selector de recursos:", error);
    }
}

export async function setupResourceAssignmentForm() {
    const form = document.getElementById("form-asignar-recurso");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const select = document.getElementById("modal-select-recurso");
        const qtyInput = document.getElementById("modal-cantidad-recurso");

        const resourceId = select.value;
        const quantity = qtyInput.value;

        if (!resourceId || !currentEventId) return;

        try {
            await postEventResource(currentEventId, resourceId, quantity);
            select.value = "";
            qtyInput.value = "1";
            await renderAssignedResources();
        } catch (error) {
            alert("Error al asignar recurso: " + error.message);
        }
    });
}