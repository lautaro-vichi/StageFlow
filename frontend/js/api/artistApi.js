import { apiFetch } from "./apiFetch.js";


export async function getArtists() {
    return await apiFetch("/api/artists");
};


export async function createArtist(datosArtista) {
    return await apiFetch("/api/artists", "POST", datosArtista);
};


export async function updateArtist(id, datosArtista) {
    return await apiFetch(`/api/artists/${id}`, "PUT", datosArtista);
};


export async function deleteArtist(id) {
    return await apiFetch(`/api/artists/${id}`, "DELETE");
};
