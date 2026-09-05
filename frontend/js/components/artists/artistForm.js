/*
 * Los archivos Form.js se encargan de gestionar
 * los formularios de la interfaz, permitiendo ingresar,
 * modificar y validar los datos antes de enviarlos.
*/

import { createArtist, updateArtist } from "../../api/artistApi.js";
import { renderArtistsTable } from "./artistTable.js";

// Variable de estado interno para controlar si estamos creando (null) o editando (ID)
let currentEditingId = null;

/**
 * Carga los datos de un artista en los campos del formulario
 * y activa el modo edición visualmente.
 */
export function loadArtistForEdit(artist) {
    const form = document.getElementById("artist-form");
    if (!form) return;

    // 1. Poblamos los campos de texto
    document.getElementById("artist-name").value = artist.name || "";
    document.getElementById("artist-genre").value = artist.genre || "";
    document.getElementById("artist-age").value = artist.age || "";
    document.getElementById("artist-nationality").value = artist.nationality || "";
    document.getElementById("artist-description").value = artist.description || "";

    // 2. Guardamos el ID que estamos modificando
    currentEditingId = artist.id;
    document.getElementById("artist-id").value = artist.id;

    // 3. Cambiamos la interfaz a Modo Edición
    const saveBtn = document.getElementById("artist-save-btn");
    const cancelBtn = document.getElementById("artist-cancel-btn");
    
    if (saveBtn) saveBtn.textContent = "GUARDAR CAMBIOS";
    if (cancelBtn) cancelBtn.classList.remove("is-hidden");
}

/**
 * Resetea el formulario a su estado original (Modo Crear).
 */
export function resetArtistForm() {
    const form = document.getElementById("artist-form");
    if (form) form.reset();

    currentEditingId = null;
    document.getElementById("artist-id").value = "";

    const saveBtn = document.getElementById("artist-save-btn");
    const cancelBtn = document.getElementById("artist-cancel-btn");

    if (saveBtn) saveBtn.textContent = "GUARDAR ARTISTA";
    if (cancelBtn) cancelBtn.classList.add("is-hidden");
}

/**
 * Inicializa los eventos del formulario y del botón cancelar.
 */
export function setupArtistFormEvents() {
    const form = document.getElementById("artist-form");
    const cancelBtn = document.getElementById("artist-cancel-btn");
    if (!form) return;

    // Escuchador para cancelar edición
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetArtistForm();
        });
    }

    // Escuchador para el envío del formulario (submit)
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evita que la página se recargue

        // Extraemos y limpiamos los valores tipeados por el usuario
        const artistData = {
            name: document.getElementById("artist-name").value.trim(),
            genre: document.getElementById("artist-genre").value.trim(),
            age: document.getElementById("artist-age").value ? Number(document.getElementById("artist-age").value) : null,
            nationality: document.getElementById("artist-nationality").value.trim(),
            description: document.getElementById("artist-description").value.trim()
        };

        // Validación local básica
        if (!artistData.name) {
            alert("El nombre del artista es obligatorio.");
            return;
        }

        try {
            if (currentEditingId) {
                // Si hay ID -> Modo Edición (PUT)
                await updateArtist(currentEditingId, artistData);
                alert("Artista actualizado con éxito.");
            } else {
                // Si es null -> Modo Alta (POST)
                await createArtist(artistData);
                alert("Artista creado con éxito.");
            }

            // Limpiamos el formulario y refrescamos la tabla
            resetArtistForm();
            await renderArtistsTable();

        } catch (error) {
            console.error("Error al guardar el artista:", error);
            alert("Ocurrió un error al guardar: " + error.message);
        }
    });
}