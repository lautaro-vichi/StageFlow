const express = require("express");
const router =  express.Router();

const eventArtistController = require("../controllers/eventArtistController");

router.get("/:id/artists", eventArtistController.getArtistByEvent);
router.post("/:id/artists",eventArtistController.postArtistEvent);
router.delete("/:eventId/artists/:artistId", eventArtistController.deleteArtistEvent);


module.exports = router;
