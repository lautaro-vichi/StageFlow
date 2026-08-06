const pool = require("../db");

// Controller para obtener artistas
async function getArtists(req, res) {
    try {
        const [rows] = await pool.query("SELECT * FROM artists");
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: "Error al obtener artistas"
        });
    }
}

// Controller para obtener un artista por ID
async function getArtistById(req, res) {
    const id = Number(req.params.id);

    try {
        const [rows] = await pool.query(
            "SELECT * FROM artists WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Artista no encontrado"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: "Error al obtener artista"
        });
    }
}

// Controller para añadir un artista
async function createArtist(req, res) {
    try {
        const { name, genre, description, age, nationality } = req.body;

        // Validamos que los datos obligatorios existan
        if (!name || genre === undefined || description === undefined || age === undefined || nationality === undefined) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO artists (name, genre, description, age, nationality)
             VALUES (?, ?, ?, ?, ?)`,
            [name, genre, description, age, nationality]
        );

        res.status(201).json({
            mensaje: "Artista añadido correctamente",
            id: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al añadir artista"
        });
    }
}

// Controller para modificar un artista
async function updateArtist(req, res) {
    const id = Number(req.params.id);
    const { name, genre, description, age, nationality } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM artists WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Artista no encontrado"
            });
        }

        if (!name || genre === undefined || description === undefined || age === undefined || nationality === undefined) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        await pool.query(
            `UPDATE artists
             SET name = ?, genre = ?, description = ?, age = ?, nationality
              = ?
             WHERE id = ?`,
            [name, genre, description, age, nationality
                , id]
        );

        res.json({
            mensaje: "Artista actualizado correctamente"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: "Error al actualizar artista"
        });
    }
}

// Controller para borrar un artista
async function deleteArtist(req, res) {
    const id = Number(req.params.id);

    try {
        const [rows] = await pool.query(
            "SELECT * FROM artists WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Artista no encontrado"
            });
        }

        await pool.query(
            "DELETE FROM artists WHERE id = ?",
            [id]
        );

        res.json({
            mensaje: "Artista eliminado correctamente"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: "Error al eliminar artista"
        });
    }
}

module.exports = {
    getArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
};