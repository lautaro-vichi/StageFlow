import { renderEventsTable, setupEventTableEvents } from "./components/events/eventTable.js";
import { setupEventFormEvents } from "./components/events/eventForm.js";
import { setupEventModalEvents } from "./modals/modal.js";
import { setupArtistAssignmentForm } from "./modals/modalArtists.js";
import { setupResourceAssignmentForm } from "./modals/modalResources.js";

import { checkAuth } from "./utils/authGuard.js";

document.addEventListener("DOMContentLoaded", () => {

    // Si no está logueado, redirige automáticamente antes de renderizar nada
    checkAuth();
    
    // 1. Inicializar sección de Eventos
    renderEventsTable();
    setupEventTableEvents();
    setupEventFormEvents();

    // 2. Inicializar Modales de Asignación (Artistas y Recursos)
    setupEventModalEvents();
    setupArtistAssignmentForm();
    setupResourceAssignmentForm();
});