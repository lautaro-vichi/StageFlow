import { obtenerEventos } from "./api/eventsApi.js";

const eventos = await obtenerEventos();

console.log(eventos);