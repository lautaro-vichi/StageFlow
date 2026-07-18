const express = require("express");
const router = express.Router();

const eventResourceController = require("../controllers/eventResourceController");

// Obtener todos los recursos de un evento
router.get("/:id/resources", eventResourceController.getResourcesByEvent);

// Asignar un recurso a un evento
router.post("/:id/resources", eventResourceController.postResourceEvent);

// Eliminar un recurso de un evento
router.delete("/:eventId/resources/:resourceId", eventResourceController.deleteResourceEvent);

module.exports = router;