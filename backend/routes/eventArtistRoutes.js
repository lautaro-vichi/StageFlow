const express = require("express");
const eventArtistController = require("../controllers/eventArtistController");
const { autenticarToken } = require("../middlewares/authMiddleware");
const { requerirRol } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Consultar asignaciones de un evento
router.get("/:id/artists", autenticarToken, eventArtistController.getArtistByEvent);

// Asignar o remover artista de un show: Solo 'admin' u 'organizador'
router.post(
    "/:id/artists", 
    autenticarToken, 
    requerirRol(["admin", "organizador"]), 
    eventArtistController.postArtistEvent
);

router.delete(
    "/:id/artists/:artistId", 
    autenticarToken, 
    requerirRol(["admin", "organizador"]), 
    eventArtistController.deleteArtistEvent
);

module.exports = router;
