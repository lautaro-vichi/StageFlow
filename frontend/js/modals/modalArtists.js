import { getArtists } from "../api/artistApi.js";
import { getEventArtists, postEventArtist, deleteEventArtist } from "../api/eventApi.js";

let currentEventId = null;

/**
 * Carga la lista de artistas asignados y el selector de artistas disponibles.
 */
export async function loadModalArtists(eventId) {
    currentEventId = eventId;
    await renderAssignedArtists();
    await populateArtistSelect();
}

async function renderAssignedArtists() {
    const container = document.getElementById("modal-lista-artistas");
    if (!container) return;

    try {
        const assignedArtists = await getEventArtists(currentEventId);

        if (!assignedArtists || assignedArtists.length === 0) {
            container.innerHTML = `<p class="has-text-grey is-italic">No hay artistas asignados aún.</p>`;
            return;
        }

        container.innerHTML = assignedArtists.map(artist => `
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-2 p-2" style="background: #1a1a1a; border-radius: 4px;">
                <span class="has-text-white">${artist.name}</span>
                <button class="button is-small is-danger is-light btn-remove-artist" data-id="${artist.id}">Quitar</button>
            </div>
        `).join("");

        // Evento para desasignar artista
        container.querySelectorAll(".btn-remove-artist").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const artistId = e.target.dataset.id;
                await deleteEventArtist(currentEventId, artistId);
                await renderAssignedArtists();
            });
        });

    } catch (error) {
        container.innerHTML = `<p class="has-text-danger is-size-7">Error al cargar artistas.</p>`;
    }
}

async function populateArtistSelect() {
    const select = document.getElementById("modal-select-artista");
    if (!select) return;

    try {
        const allArtists = await getArtists();
        select.innerHTML = `<option value="">-- Elegir Artista --</option>` + 
            allArtists.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
    } catch (error) {
        console.error("Error al poblar selector de artistas:", error);
    }
}

/**
 * Agrega un artista al evento desde el formulario del modal.
 */
export async function setupArtistAssignmentForm() {
    const form = document.getElementById("form-asignar-artista");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const select = document.getElementById("modal-select-artista");
        const artistId = select.value;

        if (!artistId || !currentEventId) return;

        try {
            await postEventArtist(currentEventId, artistId);
            select.value = "";
            await renderAssignedArtists();
        } catch (error) {
            alert("Error al asignar el artista: " + error.message);
        }
    });
}