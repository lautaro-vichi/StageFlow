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
    const id = Number(req.params.id); // convertimos el id a numero 

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
       const {name, description, date, start_time, end_time, location, status} = req.body;
       //validamos que los datos existen
        if(!name || !description || !date || !start_time || !end_time || !location || !status){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            })
        }

        //insertamos el evento en la base de datos
        const [result] = await pool.query("INSERT INTO events (name, description, date, start_time, end_time, location, status) VALUES (?, ?, ?, ?, ?, ?, ?)", [name, description, date, start_time, end_time, location, status]);
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
    const {name, description, date, start_time, end_time, location, status} = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        }

         if(!name || !description || !date || !start_time || !end_time || !location || !status){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            })
        }

        await pool.query("UPDATE events SET name = ?, description = ?, date = ?, start_time = ?, end_time = ?, location = ?, status = ? WHERE id = ?", [name, description, date, start_time, end_time, location, status, id]);

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