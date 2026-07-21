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

        //existe evento?
        const [event] = await pool.query("SELECT * FROM events WHERE id = ?",[eventId]);
        if(event.length === 0){
            return res.status(404).json({
             mensaje: "Evento no encontrado"
            });
        }

      //esta finalizado?
      if(event[0].status === 'finalizado'){
        return res.status(400).json({
          mensaje: "El evento ya ha finalizado"
        });
      }        

        //buscamos si existen los datos
        const [rows] = await pool.query ("SELECT * FROM event_resource WHERE event_id = ? AND resource_id = ?", [eventId, resource_id]);
        //si existen devolvemos un 400
        if(rows.length > 0){
            return res.status(400).json({
                mensaje: "El recurso ya ha sido asignado al evento"
            });
        }


        //buscamos el recurso para ver cuentos hay disponibles
        const [resource] = await pool.query ("SELECT available_quantity  FROM resources WHERE id = ?",[resource_id]);
        //verificamos que el recurso exista
        if(resource.length === 0){
            return res.status(404).json({
        mensaje: "Recurso no encontrado"
        });
        }

        //verificamos que la cantidad sea mayor a 0
        if(quantity <= 0){
            return res.status(400).json({
                mensaje: "La cantidad debe ser mayor a 0"
            });
        }

        //verificamos que la cantidad disponible sea menor o igual a la solicitada
        if(quantity > resource[0].available_quantity){
            return res.status(400).json({
         mensaje: "No hay recursos suficientes disponibles"
         });
        }
        await pool.query(
            "INSERT INTO event_resource (event_id, resource_id, quantity) VALUES (?, ?, ?)",
            [eventId, resource_id, quantity]
        );

     //actualizamos available_quantity
     await pool.query (`
        UPDATE resources
        SET available_quantity = available_quantity - ?
        WHERE id = ?`,[quantity, resource_id]);
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

        //existe evento?
        const [event] = await pool.query("SELECT * FROM events WHERE id = ?",[eventId]);
        if(event.length === 0){
            return res.status(404).json({
             mensaje: "Evento no encontrado"
            });
        }
        
      //esta finalizado?
      if(event[0].status === 'finalizado'){
        return res.status(400).json({
          mensaje: "El evento ya ha finalizado"
        });
      }        
 


        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Relación no encontrada"
            });
        }
        //guardo el resultado de quantity en una variable 
        const quantity = rows[0].quantity;

        await pool.query(
            "DELETE FROM event_resource WHERE event_id = ? AND resource_id = ?",
            [eventId, resourceId]
        );




        //modificamos available quantity
        await pool.query(`
            UPDATE resources
            SET available_quantity = available_quantity + ?
            WHERE id = ?
            `,[quantity, resourceId]
        )

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

