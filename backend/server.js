const express = require("express");
const cors = require("cors");
const pool = require("./db");

const eventsController = require("./controllers/eventsController.js");
const artistsController = require("./controllers/artistsController.js");
const resourceController = require("./controllers/resourceController.js");

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

// controllers para eventos
app.get("/events", eventsController.getEvents);

app.get("/events/:id", eventsController.getEventById);

app.post("/events", eventsController.createEvent);

app.put("/events/:id", eventsController.updateEvent);

app.delete("/events/:id", eventsController.deleteEvent);


//controllers para artistas
app.get("/artists", artistsController.getArtists);

app.get("/artists/:id", artistsController.getArtistById);

app.post("/artists", artistsController.createArtist);

app.put("/artists/:id", artistsController.updateArtist);

app.delete("/artists/:id", artistsController.deleteArtist);

//controller para recursos
app.get("/resources", resourceController.getResources);


app.listen(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
});