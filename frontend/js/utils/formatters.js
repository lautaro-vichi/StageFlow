
// Convierte ISO ("2026-10-15T21:00:00") -> "15/10/2026, 09:00 PM"
export function formatDate(dateString) {
    if (!dateString){
        return "No especificada";
    } 
    
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Argentina/Buenos_Aires"
    }).format(date);
};


// Convierte ISO ("2026-10-15T21:00:00") -> "2026-10-15T21:00"
export function formatDateForInput(dateString) {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    if (isNaN(d.getTime())) return "";

    const pad = num => String(num).padStart(2, "0"); //ej: convierte 5 a "05"
    
    const anio = date.getFullYear();
    const mes = pad(date.getMonth() + 1); // Los meses en JS van de 0 a 11
    const dia = pad(date.getDate());
    const horas = pad(date.getHours());
    const minutos = pad(date.getMinutes());

    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
};

export function getCalculatedStatus(event) {
    if (event.status === "cancelado") {
        return "cancelado";
    }
    
    const ahora = new Date();
    const inicio = new Date(event.start_time);
    const fin = new Date(event.end_time);

    if (ahora >= inicio && ahora <= fin) return "en curso";
    if (ahora > fin) return "finalizado";
    
    return event.status || event.estado || "planificado";
};


