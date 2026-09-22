const express = require("express");
const router = express.Router();

const resourceController = require("../controllers/resourceController");

const { autenticarToken } = require("../middlewares/authMiddleware");
const { requerirRol } = require("../middlewares/roleMiddleware");

// Lectura de catálogo
router.get("/", autenticarToken, resourceController.getResources);

// Operaciones de gestión: Solo 'admin' u 'organizador'
router.post("/", autenticarToken, requerirRol(["admin", "organizador"]), resourceController.createResource);
router.put("/:id", autenticarToken, requerirRol(["admin", "organizador"]), resourceController.updateResource);

// Borrado sensible: Solo 'admin'
router.delete("/:id", autenticarToken, requerirRol(["admin"]), resourceController.deleteResource);

module.exports = router;

