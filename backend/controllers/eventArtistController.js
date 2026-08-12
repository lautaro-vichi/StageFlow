const pool = require("../db");
async function postArtistEvent(req, res) {

  try {

    const { artist_id } = req.body;
    const eventId = Number(req.params.id);

    // 1. Validamos que exista el artista
    if (!artist_id) {
        return res.status(400).json({
            mensaje: "El artista es obligatorio"
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

    // Obtenemos el horario directamente del evento
    const start = new Date(event[0].start_time)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    const end = new Date(event[0].end_time)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");


    // 4. Verificamos que exista el artista
    const [artist] = await pool.query(
        "SELECT * FROM artists WHERE id = ?",
        [artist_id]
    );

    if (artist.length === 0) {
        return res.status(404).json({
            mensaje: "Artista no encontrado"
        });
    }


    // 5. Verificamos que el artista no esté
    // asignado dos veces al mismo evento
    const [relation] = await pool.query(
        `SELECT *
          FROM event_artist
          WHERE event_id = ?
          AND artist_id = ?`,
        [eventId, artist_id]
    );

    if (relation.length > 0) {
        return res.status(400).json({
            mensaje: "El artista ya ha sido asignado al evento"
        });
    }


    // 6. Buscamos todos los eventos donde está
    // asignado este artista
    const [eventosArtista] = await pool.query(
        `SELECT e.start_time, e.end_time
          FROM event_artist ea
          JOIN events e ON ea.event_id = e.id
          WHERE ea.artist_id = ?
          AND e.status != 'cancelado'`,
        [artist_id]
    );


    // 7. Verificamos si existe superposición de horarios
    let i = 0;
    let se_superpone = false;

    while (i < eventosArtista.length && !se_superpone) {

        const dbStart = new Date(eventosArtista[i].start_time);
        const dbEnd = new Date(eventosArtista[i].end_time);

        const inicioNuevo = new Date(event[0].start_time);
        const finNuevo = new Date(event[0].end_time);

        if (dbEnd > inicioNuevo && dbStart < finNuevo) {
            se_superpone = true;
        }

        i++;
    }


    // 8. Si está ocupado en ese horario, rechazamos
    if (se_superpone) {
        return res.status(400).json({
            mensaje: "El artista está ocupado en este horario"
        });
    }


    // 9. Creamos la relación utilizando
    // el horario del evento
    await pool.query(
        `INSERT INTO event_artist
        (event_id, artist_id, start_time, end_time)
        VALUES (?, ?, ?, ?)`,
        [
            eventId,
            artist_id,
            start,
            end
        ]
    );


    res.status(201).json({
        mensaje: "Artista asignado correctamente al evento"
    });

  } catch (error) {

  console.error(error);

  res.status(500).json({
      mensaje: "Error al asignar artista"
  });
 }
}


async function deleteArtistEvent(req, res) {
  const eventId = Number(req.params.eventId);
  const artistId = Number(req.params.artistId);
  try{
    const [rows] = await pool.query("SELECT * FROM event_artist WHERE event_id = ? AND artist_id = ?", [eventId, artistId]);
   if (rows.length === 0) {
    return res.status(404).json({
     mensaje: "Relacion no encontrada"
     });
    }    
    //existe el evento?
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
    await pool.query("DELETE FROM event_artist WHERE event_id = ? AND artist_id = ?", [eventId, artistId]);
    res.json({
      mensaje: "Artista eliminado correctamente del evento"
      });
  }catch(error){
    console.error(error);

    res.status(500).json({
      mensaje: "Error al elimnar artista"
    });
    }
}


async function getArtistByEvent(req, res) {
  const eventId = Number(req.params.id);

  try {

  const [rows] = await pool.query(
  `  
  SELECT artists.* FROM event_artist 
  JOIN artists
  ON event_artist.artist_id = artists.id
  WHERE event_artist.event_id = ?
  `,
  [eventId]
   );

  res.json(rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      mensaje: "El evento no tiene artistas asignados"       
    })
    
  }

}
    

module.exports = {
 getArtistByEvent,
  postArtistEvent,
  deleteArtistEvent
};