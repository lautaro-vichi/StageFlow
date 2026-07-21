const pool = require("../db");

// Formatear fechas si vienen en formato ISO/HTML (remueve la 'T')
const formatSQLDate = str => str ? str.replace("T", " ") : null;

// Helper para respuestas GET de asignaciones
async function getEntity(res, query, params = []) {
    try {
        const [rows] = await pool.query(query, params);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error en el servidor al obtener las asignaciones" });
    }
}

// Asignar Artista a Evento (POST)
async function postArtistEvent(req, res) {
    const { event_id, artist_id, start_time, end_time } = req.body;

    if (!event_id || !artist_id || !start_time || !end_time) {
        return res.status(400).json({ mensaje: "Todos los campos (evento, artista, hora inicio y fin) son obligatorios" });
    }

    const [inicio, fin] = [formatSQLDate(start_time), formatSQLDate(end_time)];

    try {
        await pool.query(
            `INSERT INTO event_artists (event_id, artist_id, start_time, end_time) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)`,
            [event_id, artist_id, inicio, fin]
        );

        return res.status(201).json({ mensaje: "Relación creada/actualizada correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error al crear la relación entre artista y evento" });
    }
}

// Obtener todos los artistas asignados a un evento
const getArtistsByEvent = (req, res) => getEntity(res, 
    `SELECT a.id, COALESCE(a.name, a.nombre) AS name, ea.start_time, ea.end_time 
     FROM artists a 
     JOIN event_artists ea ON a.id = ea.artist_id 
     WHERE ea.event_id = ?`, 
    [Number(req.params.eventId)]
);

// Desasignar Artista de un Evento (DELETE)
async function deleteArtistEvent(req, res) {
    const { eventId, artistId } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM event_artists WHERE event_id = ? AND artist_id = ?", [eventId, artistId]);
        if (!result.affectedRows) return res.status(404).json({ mensaje: "Asignación no encontrada" });
        return res.json({ mensaje: "Artista removido del evento correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error al remover el artista del evento" });
    }
}

module.exports = {
    postArtistEvent,
    getArtistsByEvent,
    deleteArtistEvent
};