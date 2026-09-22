//Verifica Google Token + Genera JWT + Registra en DB
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const db = require("../db");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleLogin(req, res) {

    const {token} = req.body;

    try{

        if(!token){
            return res.status(404).json({
                mensaje: "Token de Google no proporcionado"
            });
        };

        //verificar el Token con los servidores de Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        //buscar si el usuario ya existe en MySQL
        const [users] = await db.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
        let user = users[0];

        //si no existe en la base de datos, lo registramos automáticamente como 'organizador'
        if (!user) {
            const [result] = await db.query(
                "INSERT INTO users (google_id, email, name, picture, role) VALUES (?, ?, ?, ?, 'organizador')",
                [googleId, email, name, picture]
            );

            user = {
                id: result.insertId,
                google_id: googleId,
                email,
                name,
                picture,
                role: "organizador",
            };
        }

        // firmar nuestro propio JWT de sesión para StageFlow
        const appToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        // devolvemos la respuesta al frontend
        return res.json({
            token: appToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
            },
        });

    }catch{

        return res.status(401).json({
            mensaje: "Token invalido"
        });

    }


}

module.exports = {
    googleLogin
};
