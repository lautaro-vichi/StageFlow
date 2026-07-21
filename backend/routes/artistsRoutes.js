const express = require("express");
const router = express.Router();
const { getArtists, getArtistById, createArtist, updateArtist, deleteArtist } = require("../controllers/artistsController");

// Ruta raíz: /api/artists
router.route("/")
    .get(getArtists)
    .post(createArtist);

// Ruta por ID: /api/artists/:id
router.route("/:id")
    .get(getArtistById)
    .put(updateArtist)
    .delete(deleteArtist);

module.exports = router;