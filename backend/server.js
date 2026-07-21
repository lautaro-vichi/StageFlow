const express = require("express");
const cors = require("cors");
const pool = require("./db");

// Importación de rutas
const eventsRoutes = require("./routes/eventsRoutes");
const artistsRoutes = require("./routes/artistsRoutes");
const resourcesRoutes = require("./routes/resourcesRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Probar conexión a la Base de Datos
(async () => {
    try {
        await pool.query("SELECT 1");
        console.log("✅ Conexión a la base de datos exitosa.");
    } catch (err) {
        console.error("❌ Error al conectar con la base de datos:", err.message);
    }
})();

// Rutas base (API)
app.use("/events", eventsRoutes);
app.use("/artists", artistsRoutes);
app.use("/resources", resourcesRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});