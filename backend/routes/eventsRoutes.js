const express = require("express");
const router = express.Router();
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventArtists,
    getEventResources,
    addArtistToEvent,
    addResourceToEvent,
    removeArtistFromEvent,
    removeResourceFromEvent
} = require("../controllers/eventsController");

// --- RUTAS BASE (/api/events) ---
router.route("/")
    .get(getEvents)
    .post(createEvent);

// --- RUTAS DE EVENTO POR ID (/api/events/:id) ---
router.route("/:id")
    .get(getEventById)
    .put(updateEvent)
    .delete(deleteEvent);

// --- ARTISTAS EN EVENTO ---
router.route("/:id/artists")
    .get(getEventArtists)
    .post(addArtistToEvent);

router.delete("/:id/artists/:artistId", removeArtistFromEvent);

// --- RECURSOS EN EVENTO ---
router.route("/:id/resources")
    .get(getEventResources)
    .post(addResourceToEvent);

router.delete("/:id/resources/:resourceId", removeResourceFromEvent);

module.exports = router;