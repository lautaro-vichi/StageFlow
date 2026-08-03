const pool = require("../db");
async function postArtistEvent(req, res) {

    try {
      const { artist_id, start_time, end_time } = req.body;
      const eventId = Number(req.params.id)

      // 1. Validamos que existan todos los campos
      if (!artist_id || !start_time || !end_time){
        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios"
        });
      }

      // === MOVIDO AQUÍ: Convertimos las fechas al formato de MySQL al inicio del flujo ===
      const start = new Date(start_time).toISOString().slice(0,19).replace("T"," ");
      const end = new Date(end_time).toISOString().slice(0,19).replace("T"," ");      

      // 2. ¿Existe el evento?
      const [event] = await pool.query("SELECT * FROM events WHERE id = ?",[eventId]);
      if(event.length === 0){
         return res.status(404).json({
          mensaje: "Evento no encontrado"
        });
      }
      
      // 3. ¿Está finalizado?
      if(event[0].status === 'finalizado'){
        return res.status(400).json({
          mensaje: "El evento ya ha finalizado"
        });
      }
      
      // 4. ¿Existe el artista?
      const [artist] = await pool.query("SELECT * FROM artists WHERE id = ?", [artist_id]);
      if(artist.length === 0){
        return res.status(404).json({
          mensaje: "Artista no encontrado"
        });
      }
      
      // 5. Verificamos que el artista no esté asignado al evento
      const [relation] = await pool.query(
        "SELECT * FROM event_artist WHERE event_id = ? AND artist_id = ?",
        [eventId, artist_id]
      );
      if( relation.length > 0 ){
        return res.status(400).json ({
         mensaje: "El artista ya ha sido asignado al evento"
        });
      }
      
      // 6. Verificamos si no se superpone el horario (Usando las variables ya formateadas)
      const [horarios] = await pool.query("SELECT * FROM event_artist WHERE artist_id = ?",[artist_id]);
      let i = 0;
      let se_superpone = false;

      while(i < horarios.length && !se_superpone){
        // Convertimos el horario de la base de datos a un formato comparable por strings
        const dbStart = new Date(horarios[i].start_time).toISOString().slice(0,19).replace("T"," ");
        const dbEnd = new Date(horarios[i].end_time).toISOString().slice(0,19).replace("T"," ");

        if( dbEnd > start && dbStart < end ){
          se_superpone = true;
        };
        i++;
      }
      
      if(se_superpone === true){
        return res.status(400).json({
          mensaje: "El artista esta ocupado en este horario"
        })
      }

      // 7. Insertamos en la base de datos usando de forma correcta las constantes FORMATEADAS
      await pool.query(
        "INSERT INTO event_artist (event_id, artist_id, start_time, end_time) VALUES (?, ?, ?, ?)", 
        [eventId, artist_id, start, end]
      );
      
      res.status(201).json({
        mensaje: "Relacion creada correctamente"
      });

    } catch(error){
      console.error(error);
        res.status(500).json({
            mensaje: "Error al crear relacion"
        })
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