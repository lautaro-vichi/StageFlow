const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");

// Lectura y Creación
router.get("/", eventsController.getEvents);
router.get("/:id", eventsController.getEventById);
router.get("/:id/artists", eventsController.getEventArtists);
router.get("/:id/resources", eventsController.getEventResources);

// Asignaciones (POST)
router.post("/:id/artists", eventsController.addArtistToEvent);
router.post("/:id/resources", eventsController.addResourceToEvent);

// Desasignaciones (DELETE)
router.delete("/:id/artists/:artistId", eventsController.removeArtistFromEvent);
router.delete("/:id/resources/:resourceId", eventsController.removeResourceFromEvent);

// CRUD Eventos
router.post("/", eventsController.createEvent);
router.put("/:id", eventsController.updateEvent);
router.delete("/:id", eventsController.deleteEvent);

module.exports = router;