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

    // 1. Validamos los campos obligatorios
    if (!resource_id || quantity == null) {
      return res.status(400).json({
          mensaje: "Todos los campos son obligatorios"
      });
    }

    // 2. Verificamos que exista el evento
    const [event] = await pool.query(
        "SELECT * FROM events WHERE id = ?",
        [eventId]
    );

    if (event.length === 0) {
        return res.status(404).json({
            mensaje: "Evento no encontrado"
        });
    }

    // 3. Verificamos que el evento no haya finalizado
    if (event[0].status === "finalizado") {
      return res.status(400).json({
        mensaje: "El evento ya ha finalizado"
      });
    }

    // 4. Verificamos que exista el recurso
    const [resource] = await pool.query(
      "SELECT * FROM resources WHERE id = ?",
      [resource_id]
    );

    if (resource.length === 0) {
      return res.status(404).json({
      mensaje: "Recurso no encontrado"
      });
     }

    // 5. Verificamos que la cantidad sea válida
    if (quantity <= 0) {
      return res.status(400).json({
      mensaje: "La cantidad debe ser mayor a 0"
      });
    }

    // 6. Verificamos que el recurso no esté ya asignado
    // a este mismo evento
    const [relation] = await pool.query(
      `SELECT *
      FROM event_resource
      WHERE event_id = ?
      AND resource_id = ?`,
      [eventId, resource_id]
    );

    if (relation.length > 0) {
      return res.status(400).json({
      mensaje: "El recurso ya ha sido asignado al evento"
      });
    }

    // 7. Obtenemos el horario del evento
    // El usuario NO necesita enviar start_time ni end_time
    const start = new Date(event[0].start_time);
    const end = new Date(event[0].end_time);

    // 8. Buscamos todas las asignaciones existentes
    // del mismo recurso
    const [horarios] = await pool.query(
      `SELECT er.quantity, er.start_time, er.end_time
       FROM event_resource er
       JOIN events e ON er.event_id = e.id
       WHERE er.resource_id = ?
       AND e.status != 'cancelado'`,
       [resource_id]
    );

    // 9. Sumamos solamente los recursos utilizados
    // en eventos que se superponen con el nuevo evento
    let sumaDeRecursos = 0;

    for (const horario of horarios) {

      const dbStart = new Date(horario.start_time);
      const dbEnd = new Date(horario.end_time);

      if (dbEnd > start && dbStart < end) {
        sumaDeRecursos += horario.quantity;
        }
    }

    // 10. Calculamos cuántos recursos quedan disponibles
    // para este horario
    const disponibles =
    resource[0].available_quantity - sumaDeRecursos;

    // 11. Verificamos que haya suficientes recursos
    if (quantity > disponibles) {
      return res.status(400).json({
      mensaje: `No hay recursos suficientes disponibles en ese horario. Disponibles: ${disponibles}`
      });
    }

    // 12. Creamos la relación
    // Usamos el horario del evento
    await pool.query(
      `INSERT INTO event_resource
      (event_id, resource_id, quantity, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)`,
      [
        eventId,
        resource_id,
        quantity,
        event[0].start_time,
        event[0].end_time
      ]
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

