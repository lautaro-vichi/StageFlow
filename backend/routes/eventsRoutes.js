const express = require("express");
const router = express.Router();

const eventsController = require("../controllers/eventsController");

const { autenticarToken } = require("../middlewares/authMiddleware");
const { requerirRol } = require("../middlewares/roleMiddleware");

// Ver eventos: Accesible para cualquier usuario logueado ('admin', 'organizador', 'tecnico')
router.get("/", autenticarToken, eventsController.getEvents);
router.get("/:id", autenticarToken, eventsController.getEventById);

// Crear evento: Solo 'admin' u 'organizador'
router.post(
    "/", 
    autenticarToken, 
    requerirRol(["admin", "organizador"]), 
    eventsController.createEvent
);

// Modificar evento: Solo 'admin' u 'organizador'
router.put(
    "/:id", 
    autenticarToken, 
    requerirRol(["admin", "organizador"]), 
    eventsController.updateEvent
);

// Eliminar evento: Solo 'admin'
router.delete(
    "/:id", 
    autenticarToken, 
    requerirRol(["admin"]), 
    eventsController.deleteEvent
);

module.exports = router;


