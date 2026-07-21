const pool = require("../db");

// Helper genérico para lecturas (GET)
async function getEntity(res, query, params = [], single = false) {
    try {
        const [rows] = await pool.query(query, params);
        if (single && !rows.length) return res.status(404).json({ mensaje: "Recurso no encontrado" });
        return res.json(single ? rows[0] : rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error al obtener el/los recurso(s)" });
    }
}

// GETs
const getResources = (req, res) => getEntity(res, "SELECT * FROM resources");
const getResourceById = (req, res) => getEntity(res, "SELECT * FROM resources WHERE id = ?", [Number(req.params.id)], true);

module.exports = {
    getResources,
    getResourceById
};