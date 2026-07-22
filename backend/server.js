const express = require("express");
const cors = require("cors");
const pool = require("./db");

const eventsController = require("./controllers/eventsController.js");
const artistsController = require("./controllers/artistsController.js");
const resourceController = require("./controllers/resourceController.js");
const eventArtistController = require("./controllers/eventArtistController.js")
const eventResourceController = require("./controllers/eventResourceController.js");

const eventsRoutes = require("./routes/eventsRoutes.js");
const artistsRoutes = require("./routes/artistsRoutes.js");
const resourcesRoutes = require("./routes/resourcesRoutes.js");
const eventArtistRoutes = require("./routes/eventArtistRoutes.js");
const eventResourceRoutes = require("./routes/eventResourceRoutes.js");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use("/events", eventsRoutes);

app.use("/artists", artistsRoutes);

app.use("/resources", resourcesRoutes);

app.use("/events", eventArtistRoutes)

app.use("/events", eventResourceRoutes);



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
        console.log(`Servidor iniciado en el puerto ${port}`);
    });
}

iniciarServidor();





