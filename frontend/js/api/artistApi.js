import { apiFetch } from "./apiFetch.js";


export async function getArtists() {
    return await apiFetch("/artists");
}


export async function postArtist(datosArtista) {
    return await apiFetch("/artists", "POST", datosArtista);
}


export async function putArtist(id, datosArtista) {
    return await apiFetch(`/artists/${id}`, "PUT", datosArtista);
}


export async function deleteArtist(id) {
    return await apiFetch(`/artists/${id}`, "DELETE");
}

