const pool = require("../db");

// controlador para obtener todos los eventos
async function getEvents(req, res) {
    try {
        const [rows] = await pool.query("SELECT * FROM events");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener eventos"
        });
    }
}

// obtiene un evento segun su id
async function getEventById(req, res) {
    const id = Number(req.params.id); 

    try {
        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        if (rows.length === 0 ) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            })
        } 
        res.json(rows[0]);    
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener evento"
        })
    }
} 

// controlador para crear un evento
async function createEvent(req, res) {
    try {
        // Recibimos los campos nuevos del formulario de Franco y los viejos de Lauti
        const { name, description, date, start_time, end_time, location, status, fecha_inicio, fecha_fin, equipo } = req.body;

        // Validamos solo los campos obligatorios del nuevo diseño (y mantenemos name y location)
        if (!name || !location || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                mensaje: "Nombre, lugar, fecha inicio y fecha fin son obligatorios"
            });
        }

        // Insertamos soportando ambas partes (dejamos null/valores por defecto para los que no vengan)
        const query = `
            INSERT INTO events 
            (name, description, date, start_time, end_time, location, status, fecha_inicio, fecha_fin, equipo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            name, 
            description || "", 
            date || null, 
            start_time || null, 
            end_time || null, 
            location, 
            status || 'planificado',
            fecha_inicio,
            fecha_fin,
            equipo || ""
        ]);

        res.status(201).json({
            mensaje: "Evento creado correctamente",
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al crear evento"
        });
    }
}

//controlador para actualizar un evento
async function updateEvent(req, res) {
    const id = Number(req.params.id);
    const { name, description, date, start_time, end_time, location, status, fecha_inicio, fecha_fin, equipo } = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        }

        if (!name || !location || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                mensaje: "Nombre, lugar, fecha inicio y fecha fin son obligatorios"
            });
        }

        const query = `
            UPDATE events SET 
                name = ?, description = ?, date = ?, start_time = ?, end_time = ?, 
                location = ?, status = ?, fecha_inicio = ?, fecha_fin = ?, equipo = ? 
            WHERE id = ?
        `;

        await pool.query(query, [
            name, description || "", date || null, start_time || null, end_time || null, 
            location, status || 'planificado', fecha_inicio, fecha_fin, equipo || "", id
        ]);

        res.json({
            mensaje: "Evento actualizado correctamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar evento"
        });
    }
}

// controlador para eliminar un evento
async function deleteEvent(req, res) {
    const id = Number(req.params.id);

    try {
        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        }

        await pool.query("DELETE FROM events WHERE id = ?", [id]);
        
        res.json({
            mensaje: "Evento eliminado correctamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar evento"
        });
    }
}

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};