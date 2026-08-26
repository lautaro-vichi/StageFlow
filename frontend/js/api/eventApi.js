import { apiFetch } from "./apiFetch";

async function getEvents(){ 
    return await apiFetch("/events");
};

async function getEventById(id){
    return await apiFetch(`/evets/${id}`);
};

async function postEvent(event) {
    return await apiFetch("/event", "POST", event);
};

async function putEvent(id, event) {
    return await apiFetch(`/event/${id}`, "PUT", event);
};

async function deleteEvent(event) {
    return await apiFetch("/event", "DELETE", event);
};

module.export = {
    getEventById,
    getEvents,
    postEvent,
    putEvent,
    deleteEvent

}



