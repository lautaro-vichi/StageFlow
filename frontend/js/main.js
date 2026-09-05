import { renderArtistsTable, setupArtistTableEvents } from "./components/artists/artistTable.js";
import { setupArtistFormEvents } from "./components/artists/artistForm.js";

import { renderResourcesTable, setupResourceTableEvents } from "./components/resources/resourceTable.js";
import { setupResourceFormEvents } from "./components/resources/resourceForm.js";

import { renderEventsTable, setupEventTableEvents } from "./components/events/eventTable.js";
import { setupEventFormEvents } from "./components/events/eventForm.js";

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar Artistas
    renderArtistsTable();
    setupArtistTableEvents();
    setupArtistFormEvents();

    // Inicializar Recursos
    renderResourcesTable();
    setupResourceTableEvents();
    setupResourceFormEvents();

    // Inicializar Eventos
    renderEventsTable();
    setupEventTableEvents();
    setupEventFormEvents();
});