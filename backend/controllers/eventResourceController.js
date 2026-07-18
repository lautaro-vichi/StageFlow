const pool = require("../db");

async function getResourcesByEvent(req, res) {
    const eventId = Number(req.params.id);

    try {
        const [rows] = await pool.query(
            `
            SELECT resources.*, event_resource.quantity
            FROM event_resource
            JOIN resources
            ON event_resource.resource_id = resources.id
            WHERE event_resource.event_id = ?
            `,
            [eventId]
        );

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener los recursos del evento"
        });
    }
}

async function postResourceEvent(req, res) {
    const eventId = Number(req.params.id);
    const { resource_id, quantity } = req.body;

    try {
        if (!resource_id || !quantity) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        await pool.query(
            "INSERT INTO event_resource (event_id, resource_id, quantity) VALUES (?, ?, ?)",
            [eventId, resource_id, quantity]
        );

        res.status(201).json({
            mensaje: "Recurso asignado correctamente al evento"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al asignar recurso"
        });
    }
}

async function deleteResourceEvent(req, res) {
    const eventId = Number(req.params.eventId);
    const resourceId = Number(req.params.resourceId);

    try {

        const [rows] = await pool.query(
            "SELECT * FROM event_resource WHERE event_id = ? AND resource_id = ?",
            [eventId, resourceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Relación no encontrada"
            });
        }

        await pool.query(
            "DELETE FROM event_resource WHERE event_id = ? AND resource_id = ?",
            [eventId, resourceId]
        );

        res.json({
            mensaje: "Recurso eliminado correctamente del evento"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar el recurso"
        });
    }
}

module.exports = {
    getResourcesByEvent,
    postResourceEvent,
    deleteResourceEvent
};