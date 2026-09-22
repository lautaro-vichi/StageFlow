
import { apiFetch } from "./apiFetch.js";


export async function getResources() {
    return await apiFetch("/api/resources");
}


export async function postResource(datosRecurso) {
    return await apiFetch("/api/resources", "POST", datosRecurso);
}


export async function putResource(id, datosRecurso) {
    return await apiFetch(`/api/resources/${id}`, "PUT", datosRecurso);
}


export async function deleteResource(id) {
    return await apiFetch(`/api/resources/${id}`, "DELETE");
}
