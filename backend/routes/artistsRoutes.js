const express = require("express");
const router = express.Router();

const artistsController = require("../controllers/artistsController");

const { autenticarToken } = require("../middlewares/authMiddleware");
const { requerirRol } = require("../middlewares/roleMiddleware");

// Lectura de catálogo
router.get("/", autenticarToken, artistsController.getArtists);

// Operaciones de gestión: Solo 'admin' u 'organizador'
router.post("/", autenticarToken, requerirRol(["admin", "organizador"]), artistsController.createArtist);
router.put("/:id", autenticarToken, requerirRol(["admin", "organizador"]), artistsController.updateArtist);

// Borrado sensible: Solo 'admin'
router.delete("/:id", autenticarToken, requerirRol(["admin"]), artistsController.deleteArtist);

module.exports = router;

