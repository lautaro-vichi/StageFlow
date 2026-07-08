const express = require("express");
const router = express.Router();

const artistsController = require("../controllers/artistsController");

router.get("/", artistsController.getArtists);

router.get("/:id", artistsController.getArtistById);

router.post("/", artistsController.createArtist);

router.put("/:id", artistsController.updateArtist);

router.delete("/:id", artistsController.deleteArtist);

module.exports = router;

