import { renderArtistsTable, setupArtistTableEvents } from "./components/artists/artistTable.js";
import { setupArtistFormEvents } from "./components/artists/artistForm.js";
import { renderResourcesTable, setupResourceTableEvents } from "./components/resources/resourceTable.js";
import { setupResourceFormEvents } from "./components/resources/resourceForm.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar sección de Artistas
    renderArtistsTable();
    setupArtistTableEvents();
    setupArtistFormEvents();

    // 2. Inicializar sección de Recursos
    renderResourcesTable();
    setupResourceTableEvents();
    setupResourceFormEvents();
});