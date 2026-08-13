const pool = require("../db");

// controlador para obtener todos los eventos
async function getEvents(req, res) {
    try {
        await actualizarEstadosEventos();
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
    const id = Number(req.params.id); // convertimos el id a numero 

    try {
        await actualizarEstadosEventos();
        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        } 
        res.json(rows[0]);    
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener evento"
        });
    }
} 

// controlador para crear evento
async function createEvent(req, res) {
    try {
        const { name, description, start_time, end_time, location } = req.body;

        if (!name || !description || !start_time || !end_time || !location) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if (new Date(end_time) <= new Date(start_time)) {
            return res.status(400).json({
                mensaje: "La hora de fin no puede ser menor a la hora de comienzo"
            });
        }

        const [events] = await pool.query(
            "SELECT * FROM events WHERE location = ?",
            [location]
        );

        for (const event of events) {
            if (event.status === "cancelado") continue;

            const inicioExistente = new Date(event.start_time);
            const finExistente = new Date(event.end_time);
            const inicioNuevo = new Date(start_time);
            const finNuevo = new Date(end_time);

            if (finExistente > inicioNuevo && inicioExistente < finNuevo) {
                return res.status(400).json({
                    mensaje: "Ya existe un evento en esa ubicación y horario"
                });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO events
            (name, description, start_time, end_time, location, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, start_time, end_time, location, "planificado"]
        );

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

// controlador para actualizar un evento
async function updateEvent(req, res) {
    const id = Number(req.params.id);

    const {
        name,
        description,
        start_time,
        end_time,
        location,
        status
    } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM events WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        }

        // Si el evento ya está finalizado o cancelado, no se permite su modificación
        if (
            rows[0].status === "finalizado" ||
            rows[0].status === "cancelado"
        ) {
            return res.status(400).json({
                mensaje: "El evento ya no puede modificarse"
            });
        }

        if (!name || !description || !start_time || !end_time || !location) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if (new Date(end_time) <= new Date(start_time)) {
            return res.status(400).json({
                mensaje: "La hora de fin no puede ser menor a la hora de comienzo"
            });
        }

        const [events] = await pool.query(
            "SELECT * FROM events WHERE location = ? AND id <> ?",
            [location, id]
        );

        for (const event of events) {
            if (event.status === "cancelado") continue;

            const inicioExistente = new Date(event.start_time);
            const finExistente = new Date(event.end_time);
            const inicioNuevo = new Date(start_time);
            const finNuevo = new Date(end_time);

            if (finExistente > inicioNuevo && inicioExistente < finNuevo) {
                return res.status(400).json({
                    mensaje: "Ya existe un evento en esa ubicación y horario"
                });
            }
        }

        let nuevoEstado = rows[0].status;

        // Permite cambiar a cancelado o mantener estados válidos
        if (status && status !== rows[0].status) {
            if (status === "cancelado") {
                nuevoEstado = "cancelado";
            } else if (status === "planificado" || status === "confirmado") {
                nuevoEstado = status;
            } else {
                return res.status(400).json({
                    mensaje: "El estado solo puede modificarse a cancelado, planificado o confirmado"
                });
            }
        }

        await pool.query(
            `UPDATE events
             SET name = ?,
                 description = ?,
                 start_time = ?,
                 end_time = ?,
                 location = ?,
                 status = ?
             WHERE id = ?`,
            [
                name,
                description,
                start_time,
                end_time,
                location,
                nuevoEstado,
                id
            ]
        );

        res.status(200).json({
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
        const [rows] = await pool.query(
            "SELECT * FROM events WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        }

        if (
            rows[0].status === "finalizado" ||
            rows[0].status === "cancelado"
        ) {
            return res.status(400).json({
                mensaje: "El evento ya no puede eliminarse"
            });
        }

        await pool.query(
            "DELETE FROM events WHERE id = ?",
            [id]
        );

        res.status(200).json({
            mensaje: "Evento eliminado correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar evento"
        });
    }
}

async function actualizarEstadosEventos() {
    const ahora = new Date();
    const [eventos] = await pool.query("SELECT * FROM events");


    for (const evento of eventos) {
        if (evento.status === "cancelado") {
            continue;
        }

        const inicio = new Date(evento.start_time);
        const fin = new Date(evento.end_time);

        let nuevoEstado;

        if (ahora < inicio) {
            nuevoEstado = "planificado";
        } else if (ahora <= fin) {
            nuevoEstado = "en curso";
        } else {
            nuevoEstado = "finalizado";
        }

        if (nuevoEstado !== evento.status) {
            await pool.query(
                "UPDATE events SET status = ? WHERE id = ?",
                [nuevoEstado, evento.id]
            );
        }
    }
}

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};