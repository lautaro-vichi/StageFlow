const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : `${window.location.protocol}//${window.location.hostname}:3000`;


export async function apiFetch(endpoint, method = "GET", body = null) {

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,

        headers: {
            "Content-Type": "application/json"
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