const jwt = require("jsonwebtoken");

/**
 * Middleware encargado de verificar el JWT
 * enviado por el cliente en el header Authorization.
*/
function autenticarToken(req, res, next) {
    // Obtener el header Authorization
    const authHeader = req.headers["authorization"];

    // El formato esperado es:
    // Authorization: Bearer TOKEN
    const token = authHeader && authHeader.split(" ")[1];

    // Si no se recibió ningún token
    if (!token) {
        return res.status(401).json({
            mensaje: "Se requiere un token de autenticación"
        });
    }

    try {
        // Verificar que el token sea válido
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guardar la información del usuario
        // dentro del objeto request
        req.user = decoded;

        // Continuar con el siguiente middleware/controlador
        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: "Token inválido o expirado"
        });
    }
}




module.exports = {
    autenticarToken,
};