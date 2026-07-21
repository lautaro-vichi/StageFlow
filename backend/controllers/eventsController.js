const pool = require("../db");

// Auxiliar para formatear fechas de HTML/ISO a SQL
const formatSQLDate = str => str ? str.replace("T", " ") : null;

// Helper genérico para lecturas (GET)
async function getEntity(res, query, params = [], single = false) {
    try {
        const [rows] = await pool.query(query, params);
        if (single && !rows.length) return res.status(404).json({ mensaje: "No encontrado" });
        return res.json(single ? rows[0] : rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error en el servidor" });
    }
}

// GETs Principales y Relaciones
const getEvents = (req, res) => getEntity(res, "SELECT * FROM events");
const getEventById = (req, res) => getEntity(res, "SELECT * FROM events WHERE id = ?", [Number(req.params.id)], true);
const getEventArtists = (req, res) => getEntity(res, 
    "SELECT a.id, COALESCE(a.name, a.nombre) AS name FROM artists a JOIN event_artists ea ON a.id = ea.artist_id WHERE ea.event_id = ?", 
    [req.params.id]
);
const getEventResources = (req, res) => getEntity(res, 
    "SELECT r.id, COALESCE(r.name, r.nombre) AS name, er.quantity FROM resources r JOIN event_resources er ON r.id = er.resource_id WHERE er.event_id = ?", 
    [req.params.id]
);

// CREAR Y ACTUALIZAR EVENTO (Guardado unificado)
async function saveEvent(req, res, isUpdate = false) {
    const id = req.params.id ? Number(req.params.id) : null;
    const { name, description = "", date = null, location, status = 'planificado', equipo = "" } = req.body;
    const rawInicio = req.body.start_time || req.body.fecha_inicio;
    const rawFin = req.body.end_time || req.body.fecha_fin;

    if (!name || !location || !rawInicio || !rawFin) {
        return res.status(400).json({ mensaje: "Nombre, lugar, fecha inicio y fecha fin son obligatorios" });
    }

    const [inicio, fin] = [formatSQLDate(rawInicio), formatSQLDate(rawFin)];

    try {
        if (isUpdate) {
            const [result] = await pool.query(
                `UPDATE events SET name=?, description=?, date=?, start_time=?, end_time=?, location=?, status=?, fecha_inicio=?, fecha_fin=?, equipo=? WHERE id=?`,
                [name, description, date, inicio, fin, location, status, inicio, fin, equipo, id]
            );
            if (!result.affectedRows) return res.status(404).json({ mensaje: "Evento no encontrado" });
            return res.json({ mensaje: "Evento actualizado correctamente" });
        }

        const [result] = await pool.query(
            `INSERT INTO events (name, description, date, start_time, end_time, location, status, fecha_inicio, fecha_fin, equipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, date, inicio, fin, location, status, inicio, fin, equipo]
        );
        return res.status(201).json({ mensaje: "Evento creado correctamente", id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error al guardar evento" });
    }
}

const createEvent = (req, res) => saveEvent(req, res, false);
const updateEvent = (req, res) => saveEvent(req, res, true);

// ELIMINAR EVENTO
async function deleteEvent(req, res) {
    try {
        const [result] = await pool.query("DELETE FROM events WHERE id = ?", [Number(req.params.id)]);
        if (!result.affectedRows) return res.status(404).json({ mensaje: "Evento no encontrado" });
        return res.json({ mensaje: "Evento eliminado correctamente" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensaje: "Error al eliminar evento" });
    }
}

// ASIGNAR RECURSO (Con validación de Stock y Solapamiento)
async function addResourceToEvent(req, res) {
    const event_id = Number(req.params.id);
    const { resource_id, quantity } = req.body;
    const cantSolicitada = parseInt(quantity, 10);

    if (!resource_id || isNaN(cantSolicitada) || cantSolicitada <= 0) {
        return res.status(400).json({ error: "Seleccioná un recurso y una cantidad válida mayor a 0." });
    }

    try {
        const [[evento], [recurso]] = await Promise.all([
            pool.query("SELECT * FROM events WHERE id = ?", [event_id]).then(r => r[0]),
            pool.query("SELECT * FROM resources WHERE id = ?", [resource_id]).then(r => r[0])
        ]);

        if (!evento) return res.status(404).json({ error: "Evento no encontrado." });
        if (!recurso) return res.status(404).json({ error: "Recurso no encontrado." });

        const [inicio, fin] = [evento.fecha_inicio || evento.start_time, evento.fecha_fin || evento.end_time];
        const stockTotal = recurso.stock ?? recurso.quantity ?? 0;

        const [solapados] = await pool.query(
            `SELECT COALESCE(SUM(er.quantity), 0) AS total_reservado
             FROM event_resources er JOIN events e ON er.event_id = e.id 
             WHERE er.resource_id = ? AND er.event_id != ? AND e.fecha_inicio < ? AND e.fecha_fin > ?`,
            [resource_id, event_id, fin, inicio]
        );

        const yaReservados = parseInt(solapados[0].total_reservado, 10) || 0;
        const disponibles = stockTotal - yaReservados;

        if (cantSolicitada > disponibles) {
            const msg = disponibles <= 0 
                ? `No hay unidades disponibles de "${recurso.name || recurso.nombre}". Todo el stock (${stockTotal}) ya está reservado.` 
                : `Stock insuficiente. Solo quedan ${disponibles} unidades disponibles (de ${stockTotal}).`;
            return res.status(400).json({ error: msg });
        }

        await pool.query(
            `INSERT INTO event_resources (event_id, resource_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?`,
            [event_id, resource_id, cantSolicitada, cantSolicitada]
        );

        return res.json({ mensaje: "Recurso asignado con éxito", disponiblesRestantes: disponibles - cantSolicitada });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al verificar disponibilidad de stock." });
    }
}

// ASIGNAR ARTISTA (Con validación de Solapamiento / Agenda)
async function addArtistToEvent(req, res) {
    const event_id = Number(req.params.id);
    const { artist_id } = req.body;

    if (!artist_id) return res.status(400).json({ error: "Seleccioná un artista." });

    try {
        const [eventos] = await pool.query("SELECT * FROM events WHERE id = ?", [event_id]);
        if (!eventos.length) return res.status(404).json({ error: "Evento no encontrado." });

        const [inicio, fin] = [eventos[0].fecha_inicio || eventos[0].start_time, eventos[0].fecha_fin || eventos[0].end_time];

        const [ocupado] = await pool.query(
            `SELECT e.name FROM event_artists ea JOIN events e ON ea.event_id = e.id 
             WHERE ea.artist_id = ? AND ea.event_id != ? AND e.fecha_inicio < ? AND e.fecha_fin > ?`,
            [artist_id, event_id, fin, inicio]
        );

        if (ocupado.length) {
            return res.status(400).json({ error: `El artista ya está reservado para el evento "${ocupado[0].name}" en esas fechas.` });
        }

        await pool.query(
            `INSERT INTO event_artists (event_id, artist_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE artist_id = ?`,
            [event_id, artist_id, artist_id]
        );

        return res.json({ mensaje: "Artista asignado correctamente al evento." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al verificar la agenda del artista." });
    }
}

// QUITAR ARTISTA Y RECURSO
async function removeArtistFromEvent(req, res) {
    try {
        await pool.query("DELETE FROM event_artists WHERE event_id = ? AND artist_id = ?", [req.params.id, req.params.artistId]);
        return res.json({ mensaje: "Artista removido del evento" });
    } catch (err) {
        return res.status(500).json({ error: "Error al quitar artista del evento" });
    }
}

async function removeResourceFromEvent(req, res) {
    try {
        await pool.query("DELETE FROM event_resources WHERE event_id = ? AND resource_id = ?", [req.params.id, req.params.resourceId]);
        return res.json({ mensaje: "Recurso removido del evento" });
    } catch (err) {
        return res.status(500).json({ error: "Error al quitar recurso del evento" });
    }
}

// EXPORTACIÓN ÚNICA AL FINAL
module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventArtists,
    getEventResources,
    addResourceToEvent,
    addArtistToEvent,
    removeArtistFromEvent,
    removeResourceFromEvent
};