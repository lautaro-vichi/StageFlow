import { apiFetch } from "./apiFetch.js";

// --- EVENTOS (CRUD PRINCIPAL) ---

// Función para pedir la lista completa de eventos (GET)
export async function getEvents() {
    return await apiFetch("/api/events");
}

// Función para guardar un nuevo evento (POST)
export async function postEvent(eventData) {
    return await apiFetch("/api/events", "POST", eventData);
}

// Función para actualizar un evento existente (PUT)
export async function putEvent(id, eventData) {
    return await apiFetch(`/api/events/${id}`, "PUT", eventData);
}

// Función para eliminar un evento (DELETE)
export async function deleteEvent(id) {
    return await apiFetch(`/api/events/${id}`, "DELETE");
}

// --- TABLA INTERMEDIA: EVENTOS <-> ARTISTAS ---

// Obtener artistas asignados a un evento
export async function getEventArtists(eventId) {
    return await apiFetch(`/api/events/${eventId}/artists`);
}

// Asignar un artista a un evento
export async function postEventArtist(eventId, artistId) {
    return await apiFetch(`/api/events/${eventId}/artists`, "POST", { artist_id: Number(artistId) });
}

// Eliminar un artista de un evento
export async function deleteEventArtist(eventId, artistId) {
    return await apiFetch(`/api/events/${eventId}/artists/${artistId}`, "DELETE");
}

// --- TABLA INTERMEDIA: EVENTOS <-> RECURSOS ---

// Obtener recursos asignados a un evento
export async function getEventResources(eventId) {
    return await apiFetch(`/api/events/${eventId}/resources`);
}

// Asignar un recurso a un evento
export async function postEventResource(eventId, resourceId, quantity) {
    return await apiFetch(`/api/events/${eventId}/resources`, "POST", {
        resource_id: Number(resourceId), 
        quantity: Number(quantity) 
    });
}

// Eliminar un recurso de un evento
export async function deleteEventResource(eventId, resourceId) {
    return await apiFetch(`/api/events/${eventId}/resources/${resourceId}`, "DELETE");
}
