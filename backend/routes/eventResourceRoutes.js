const express = require("express");
const router = express.Router();

const eventResourceController = require("../controllers/eventResourceController");

const { autenticarToken } = require("../middlewares/authMiddleware");
const { requerirRol } = require("../middlewares/roleMiddleware");

// Consultar asignaciones de un evento
router.get("/:id/resources", autenticarToken, eventResourceController.getResourcesByEvent);

// Asignar o remover recurso de un show: Solo 'admin' u 'organizador'
router.post(
    "/:id/resources", 
    autenticarToken, 
    requerirRol(["admin", "organizador"]), 
   eventResourceController.postResourceEvent
);

router.delete(
    "/:id/resources/:artistId", 
    autenticarToken, 
    requerirRol(["admin", "organizador"]), 
   eventResourceController.deleteResourceEvent
);

module.exports = router;

