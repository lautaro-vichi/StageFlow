const express = require("express");
const cors = require("cors");

// 1. Importar el pool de MySQL
const pool = require("./db");

// 2. Importar rutas
const authRoutes = require("./routes/authRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const artistsRoutes = require("./routes/artistsRoutes");
const resourcesRoutes = require("./routes/resourcesRoutes");
const eventArtistRoutes = require("./routes/eventArtistRoutes");
const eventResourceRoutes = require("./routes/eventResourceRoutes");

const app = express();
const port = process.env.PORT || 3000; // Define la variable del puerto

app.use(express.json());
app.use(cors());

// 3. Montar las rutas en Express
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/artists", artistsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/events", eventArtistRoutes);
app.use("/api/events", eventResourceRoutes);

// 4. Espera activa hasta que el contenedor de MySQL esté listo
async function conectarDB() {
    while (true) {
        try {
            console.log("Intentando conectar a MySQL...");
            await pool.query("SELECT 1");
            console.log("¡MySQL conectado!");
            break;
        } catch (error) {
            console.log("MySQL todavía no está listo. Reintentando en 3 segundos...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

async function iniciarServidor() {
    await conectarDB();

    app.listen(port, () => {
        console.log(`⚡ Servidor StageFlow iniciado en el puerto ${port}`);
    });
}

iniciarServidor();
