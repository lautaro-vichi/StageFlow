import { renderArtistsTable, setupArtistTableEvents } from "./components/artists/artistTable.js";
import { setupArtistFormEvents } from "./components/artists/artistForm.js";
import { renderResourcesTable, setupResourceTableEvents } from "./components/resources/resourceTable.js";
import { setupResourceFormEvents } from "./components/resources/resourceForm.js";
import { checkAuth } from "./utils/authGuard.js";

document.addEventListener("DOMContentLoaded", () => {

    // Si no está logueado, redirige automáticamente antes de renderizar nada
    checkAuth();

    // 1. Inicializar sección de Artistas
    renderArtistsTable();
    setupArtistTableEvents();
    setupArtistFormEvents();

    // 2. Inicializar sección de Recursos
    renderResourcesTable();
    setupResourceTableEvents();
    setupResourceFormEvents();
});                                                          