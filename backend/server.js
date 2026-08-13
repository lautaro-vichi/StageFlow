const express = require("express");
const cors = require("cors");
const pool = require("./db");

const eventsController = require("./controllers/eventsController.js");
const artistsController = require("./controllers/artistsController.js");
const resourceController = require("./controllers/resourceController.js");
const eventArtistController = require("./controllers/eventArtistController.js");
const eventResourceController = require("./controllers/eventResourceController.js");

const eventsRoutes = require("./routes/eventsRoutes.js");
const artistsRoutes = require("./routes/artistsRoutes.js");
const resourcesRoutes = require("./routes/resourcesRoutes.js");
const eventArtistRoutes = require("./routes/eventArtistRoutes.js");
const eventResourceRoutes = require("./routes/eventResourceRoutes.js");

const app = express();

// 💡 1. CAMBIO CLAVE: Leer el puerto asignado por la nube o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use("/events", eventsRoutes);
app.use("/artists", artistsRoutes);
app.use("/resources", resourcesRoutes);
app.use("/events", eventArtistRoutes);
app.use("/events", eventResourceRoutes);

// Ruta de prueba para verificar que la API está viva en la nube
app.get("/", (req, res) => {
    res.send("API de StageFlow en ejecución 🚀");
});

async function conectarDB() {
    let intentos = 0;
    const maxIntentos = 5;

    while (intentos < maxIntentos) {
        try {
            console.log(`Intentando conectar a MySQL (Intento ${intentos + 1})...`);
            await pool.query("SELECT 1");
            console.log("¡MySQL conectado correctamente!");
            return true;
        } catch (error) {
            intentos++;
            console.error("Error conectando a MySQL:", error.message);
            if (intentos >= maxIntentos) {
                throw new Error("No se pudo conectar a la base de datos después de varios intentos.");
            }
            console.log("Reintentando en 3 segundos...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

async function iniciarServidor() {
    try {
        await conectarDB();
        app.listen(PORT, () => {
            console.log(`Servidor iniciado y escuchando en el puerto ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Fallo crítico al iniciar el servidor:", err.message);
        process.exit(1);
    }
}

iniciarServidor();