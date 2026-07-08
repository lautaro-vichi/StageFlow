const express = require("express");
const router = express.Router();

const eventsController = require("../controllers/eventsController");

// controllers para eventos
router.get("/", eventsController.getEvents);

router.get("/:id", eventsController.getEventById);

router.post("/", eventsController.createEvent);

router.put("/:id", eventsController.updateEvent);

router.delete("/:id", eventsController.deleteEvent);


module.exports = router;



