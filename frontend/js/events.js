import { renderEventsTable, setupEventTableEvents } from "./components/events/eventTable.js";
import { setupEventFormEvents } from "./components/events/eventForm.js";
import { setupEventModalEvents } from "./modals/modal.js";
import { setupArtistAssignmentForm } from "./modals/modalArtists.js";
import { setupResourceAssignmentForm } from "./modals/modalResources.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar sección de Eventos
    renderEventsTable();
    setupEventTableEvents();
    setupEventFormEvents();

    // 2. Inicializar Modales de Asignación (Artistas y Recursos)
    setupEventModalEvents();
    setupArtistAssignmentForm();
    setupResourceAssignmentForm();
});