const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : `${window.location.protocol}//${window.location.hostname}:3000`;

/**
 * Función helper genérica para peticiones HTTP a la API.
 * Lee automáticamente el token JWT almacenado en localStorage si existe.
 */
export async function apiFetch(endpoint, method = "GET", body = null) {
    // Obtenemos el token de sesión guardado tras el login de Google
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...(token && { "Authorization": `Bearer ${token}` }) // <-- Adjunta el token JWT
        },
        ...(body && {
            body: JSON.stringify(body)
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.mensaje ||
            data.error ||
            "Error en la operación"
        );
    }

    return data;
}