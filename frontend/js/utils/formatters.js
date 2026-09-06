// js/utils/formatters.js

/**
 * Convierte un ISO ("2026-10-15T21:00:00") a texto legible con hora de Argentina.
 * Ejemplo salida: "15/10/2026, 09:00 p. m."
 */
export function formatDate(dateString) {
    if (!dateString) return "No especificada";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Argentina/Buenos_Aires"
    }).format(date);
}

/**
 * Convierte un ISO ("2026-10-15T21:00:00") al formato exigido por <input type="datetime-local">
 * Ejemplo salida: "2026-10-15T21:00"
 */
export function formatDateForInput(dateString) {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const pad = num => String(num).padStart(2, "0");
    
    const anio = date.getFullYear();
    const mes = pad(date.getMonth() + 1);
    const dia = pad(date.getDate());
    const horas = pad(date.getHours());
    const minutos = pad(date.getMinutes());

    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
}

/**
 * Calcula dinámicamente el estado del evento según el horario actual
 */
export function getCalculatedStatus(event) {
    if (!event) return "planificado";
    if (event.status === "cancelado") return "cancelado";
    
    const ahora = new Date();
    const inicio = new Date(event.start_time || event.inicio);
    const fin = new Date(event.end_time || event.fin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return event.status || "planificado";
    }

    if (ahora >= inicio && ahora <= fin) return "en curso";
    if (ahora > fin) return "finalizado";
    
    return event.status || event.estado || "planificado";
}