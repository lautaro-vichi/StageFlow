import { loginWithGoogle } from "./api/authApi.js";

// Si el usuario ya tiene un token de sesión guardado, lo redirigimos directo al cronograma
if (localStorage.getItem("token")) {
    window.location.href = "eventos.html";
}

window.addEventListener("load", () => {
    // Verificar que el SDK de Google Identity Services haya cargado
    if (window.google && window.google.accounts) {
        // 1. Inicializar el SDK con tu Client ID de Google Cloud
        window.google.accounts.id.initialize({
            client_id: "279667060786-vau7pjpnp2sd0un5d5pfo13q1l9mjk01.apps.googleusercontent.com", 
            callback: handleCredentialResponse
        });

        // 2. Renderizar el botón oficial de Google centrado en el contenedor #google-btn
        window.google.accounts.id.renderButton(
            document.getElementById("google-btn"),
            { 
                theme: "outline", 
                size: "large", 
                type: "standard", 
                shape: "pill" 
            }
        );
    } else {
        console.error("El SDK de Google no está cargado en el documento.");
    }
});

/**
 * Función callback ejecutada automáticamente por Google
 * cuando el usuario selecciona exitosamente su cuenta.
 */
async function handleCredentialResponse(response) {
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) errorMsg.classList.add("is-hidden");

    try {
        // 1. Enviamos el idToken de Google a nuestro backend mediante authApi.js
        const result = await loginWithGoogle(response.credential);

        // 2. Guardamos la sesión generada por StageFlow (JWT + Datos de Usuario)
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        // 3. Redirigimos al cronograma principal de la plataforma
        window.location.href = "eventos.html";

    } catch (error) {
        console.error("Error al autenticar con Google:", error);
        if (errorMsg) {
            errorMsg.textContent = "Error al iniciar sesión: " + error.message;
            errorMsg.classList.remove("is-hidden");
        }
    }
}
