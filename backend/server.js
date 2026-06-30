const express = require("express");
const cors = require("cors");
const pool = require("./db");

const eventsController = require("./controllers/eventsController.js");
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

// controller para un solo evento
app.get("/events", eventsController.getEvents);

// controller para un solo evento
app.get("/events/:id", eventsController.getEventById);

// controller para crear un evento
app.post("/events", eventsController.CreateEvent);


app.listen(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
});