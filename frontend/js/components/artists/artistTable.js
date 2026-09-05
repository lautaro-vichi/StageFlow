/*
 * Los archivos Table.js su funcion principal es mostrar y gestionar
 * información en forma de tabla dentro de la interfaz.
 * También pueden manejar las acciones relacionadas con los registros (borrar, editar, etc).
 */

import { getArtists, deleteArtist  } from "../../api/artistApi.js";
import { loadArtistForEdit } from "./artistForm.js";

/*
 - Renderiza la lista de artistas en el DOM.
 - Capa: Vista / Componente
*/
export async function renderArtistsTable() {
    try {
        const container = document.getElementById("artists-list");

        if (!container) return;
        
        const artists = await getArtists();
        
        // Caso lista vacía
        if (!artists || artists.length === 0) {
            container.innerHTML = `<p class="has-text-centered text-muted">No hay artistas registrados.</p>`;
            return;
        }


        // Mapeamos los artistas a tarjetas fijas de Bulma
        const rowsHtml = artists.map(artist => `   
            <div class="box mb-3 p-3" style="background: #363636 !important; border: 1px solid #4a4a4a;">
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <div>
                        <p class="has-text-weight-bold is-size-5 has-text-white">${artist.name}</p>
                        <p class="is-size-7 has-text-info">
                            ${artist.genre || "Sin género"} • ${artist.age ? artist.age + " años" : "N/A"} • ${artist.nationality || "No especificada"}
                        </p>
                        ${artist.description ? `<p class="is-size-7 has-text-grey-light mt-1">${artist.description}</p>` : ""}
                    </div>
                    <div class="buttonsare-wrap ml-2">
                        <button class="button is-small is-warning btn-edit" data-id="${artist.id}">Editar</button>
                        <button class="button is-small is-danger btn-delete" data-id="${artist.id}">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join("");

        container.innerHTML = rowsHtml;

    } catch (error) {
        console.error("Error al renderizar la tabla de artistas:", error.message);
    }
}

/*
Delegación de eventos: usamos un solo listener en el contenedor 
padre para evitar sobrecargar la memoria con listeners por fila.
*/
export function setupArtistTableEvents() {
    const tableContainer = document.getElementById("artists-list");
    if (!tableContainer) return;

    tableContainer.addEventListener("click", async (event) => {
        // Detectar si fue un clic en 'Eliminar'
        const deleteBtn = event.target.closest(".btn-delete");
        if (deleteBtn) {
            const artistId = deleteBtn.dataset.id;
            const confirmed = confirm("¿Estás seguro de que querés eliminar este artista?");
            
            if (confirmed) {
                try {
                    await deleteArtist(artistId);
                    await renderArtistsTable(); // Refrescamos la vista
                } catch (error) {
                    alert("Error al eliminar el artista: " + error.message);
                }
            }
            return;
        }

        // Detectar si fue un clic en 'Editar'
        const editBtn = event.target.closest(".btn-edit");
        if (editBtn) {
            const artistId = editBtn.dataset.id;
            try {
                const artists = await getArtists();
                const artistToEdit = artists.find(a => a.id == artistId);
                
                if (artistToEdit) {
                    loadArtistForEdit(artistToEdit);
                }
            } catch (error) {
                alert("Error al obtener los datos del artista: " + error.message);
            }
        }
    });
}