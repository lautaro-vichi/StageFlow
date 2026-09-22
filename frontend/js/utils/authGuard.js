/*
 * Verifica si hay un token válido guardado en localStorage.
 * Si no hay sesión, redirige inmediatamente a la página de login 
 */
export function checkAuth() {
    const token = localStorage.getItem("token");

    // Si no existe el token de sesión, bloqueamos el acceso
    if (!token) {
        window.location.href = "index.html";
        return null;
    }

    // Retornamos los datos del usuario logueado guardados en localStorage
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

/*
 * Cierra la sesión activa eliminando las credenciales locales
 * y redirige a la pantalla de entrada.
 */
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

/*
 * Obtiene el rol del usuario actualmente autenticado ('admin', 'organizador', 'tecnico').
 */
export function getUserRole() {
    const user = checkAuth();
    return user ? user.role : null;
}