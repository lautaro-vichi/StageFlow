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

async function conectarDB() {
    try {
        console.log("Intentando conectar...");

        await pool.query("SELECT 1");

        console.log("Conexión exitosa.");

    } catch (error) {

        console.error(error);

    }
}

conectarDB();

app.use("/events", eventsRoutes);

app.use("/artists", artistsRoutes);

app.use("/resources", resourcesRoutes);

app.use("/events", eventArtistRoutes)

app.use("/events", eventResourceRoutes);



app.listen(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
});

