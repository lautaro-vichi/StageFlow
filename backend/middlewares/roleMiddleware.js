
/**
 * Middleware encargado de verificar
 * si el usuario tiene uno de los roles permitidos.
 *
 * Ejemplo:
 * requerirRol(["admin", "organizador"])
*/
function requerirRol(rolesPermitidos) {

    return (req, res, next) => {

        // Comprobar que exista un usuario autenticado
        if (!req.user) {
            return res.status(401).json({
                mensaje: "Usuario no autenticado"
            });
        }

        // Comprobar si el rol del usuario
        // está dentro de los roles permitidos
        if (!rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({
                mensaje: "No tenés los permisos necesarios"
            });
        }

        // El usuario tiene permiso
        next();
    };
}

module.exports = {
    requerirRol
}