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
       const {name, description, start_time, end_time, location, status} = req.body;
       //validamos que los datos existen
        if(!name || !description || !start_time || !end_time || !location || !status){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if(new Date(end_time) <= new Date(start_time)){
            return res.status(400).json({
                mensaje: "La hora de fin no puede ser menor a la hora de comienzo"
            });
        }

        //buscamos que no hayan 2 eventos en el mismo lugar a la misma hora
        const [events] = await pool.query("SELECT * FROM events WHERE location = ?", [location]);
        let i = 0;
        let se_superpone = false;

        while( i < events.length && !se_superpone ){
            const inicioExistente = new Date(events[i].start_time);
            const finExistente = new Date(events[i].end_time);

            const inicioNuevo = new Date(start_time);
            const finNuevo = new Date(end_time);

            if(finExistente > inicioNuevo && inicioExistente < finNuevo){
                se_superpone = true;
            }
            i++;
        }
        if(se_superpone === true){
            return res.status(400).json({
                mensaje: "Ya existe un evento en esa ubicacion y horario"
            });
        }
    
        //insertamos el evento en la base de datos
        const [result] = await pool.query("INSERT INTO events (name, description, start_time, end_time, location, status) VALUES (?, ?, ?, ?, ?, ?)", [name, description, start_time, end_time, location, status]);
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
    const {name, description, start_time, end_time, location, status} = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        //existe evento?
        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            });
        }
        //esta finalizado?
        if(rows[0].status === "finalizado"){
          return res.status(400).json({
            mensaje: "El evento ya ha finalizado"
          });
        }   

        if(!name || !description || !start_time || !end_time || !location || !status){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            })
        }
        // Si el evento pasa a finalizado, liberamos los recursos
        if (rows[0].status !== "finalizado" && status === "finalizado") {

            const [resources] = await pool.query(
         "SELECT resource_id, quantity FROM event_resource WHERE event_id = ?",
            [id]
         );

            let i = 0;

            while (i < resources.length) {

              await pool.query(
                 `UPDATE resources
                    SET available_quantity = available_quantity + ?
                 WHERE id = ?`,
                 [resources[i].quantity, resources[i].resource_id]
                );

                i++;
            }
        }

        await pool.query("UPDATE events SET name = ?, description = ?, start_time = ?, end_time = ?, location = ?, status = ? WHERE id = ?", [name, description, start_time, end_time, location, status, id]);

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

      //esta finalizado?
      if(rows[0].status === "finalizado"){
        return res.status(400).json({
          mensaje: "El evento ya ha finalizado"
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