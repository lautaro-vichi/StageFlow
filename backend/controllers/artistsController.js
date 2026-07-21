const pool = require("../db");

// Helper genérico para respuestas de lectura (GET)
async function getEntity(res, query, params = [], single = false) {
    try {
        const [rows] = await pool.query(query, params);
        if (single && !rows.length) return res.status(404).json({ mensaje: "Artista no encontrado" });
        return res.json(single ? rows[0] : rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error en el servidor al obtener artista(s)" });
    }
}

// GETs
const getArtists = (req, res) => getEntity(res, "SELECT * FROM artists");
const getArtistById = (req, res) => getEntity(res, "SELECT * FROM artists WHERE id = ?", [Number(req.params.id)], true);

// CREATE & UPDATE (Unificados en una sola lógica interna)
async function saveArtist(req, res, isUpdate = false) {
    const id = req.params.id ? Number(req.params.id) : null;
    const { name, genre } = req.body;

    if (!name || !genre) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    try {
        if (isUpdate) {
            const [result] = await pool.query("UPDATE artists SET name = ?, genre = ? WHERE id = ?", [name, genre, id]);
            if (!result.affectedRows) return res.status(404).json({ mensaje: "Artista no encontrado" });
            return res.json({ mensaje: "Artista actualizado correctamente" });
        }

        const [result] = await pool.query("INSERT INTO artists (name, genre) VALUES (?, ?)", [name, genre]);
        return res.status(201).json({ mensaje: "Artista añadido correctamente", id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: `Error al ${isUpdate ? 'actualizar' : 'añadir'} artista` });
    }
}

const createArtist = (req, res) => saveArtist(req, res, false);
const updateArtist = (req, res) => saveArtist(req, res, true);

// DELETE directo verificando affectedRows (evita hacer un SELECT previo innecesario)
async function deleteArtist(req, res) {
    const id = Number(req.params.id);
    try {
        const [result] = await pool.query("DELETE FROM artists WHERE id = ?", [id]);
        if (!result.affectedRows) return res.status(404).json({ mensaje: "Artista no encontrado" });
        return res.json({ mensaje: "Artista eliminado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error al eliminar artista" });
    }
}

module.exports = {
    getArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
};