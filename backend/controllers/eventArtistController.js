const pool = require("../db");

async function postArtistEvent(req, res) {

    try {
      const { artist_id, start_time, end_time } = req.body;
      const eventId = Number(req.params.id)


      //validamos que exitan todos los cambios
      if (!artist_id || !start_time || !end_time){
        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios"
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
      //existe el artista?
      const [artist] = await pool.query("SELECT * FROM artists WHERE id = ?", [artist_id]);
      if(artist.length === 0){
        return res.status(404).json({
          mensaje: "Artista no encontrado"
        });
      }
      //verificamos que el artista no este asignado al evento
      const [relation] = await pool.query(
        "SELECT * FROM event_artist WHERE event_id = ? AND artist_id = ?",
        [eventId, artist_id]
      );
      //si se repite un artista (error)
      if( relation.length > 0 ){
        return res.status(400).json ({
         mensaje: "El artista ya ha sido asignado al evento"
        });
      }
      
      //verificamos si no se superpone el horario
      const [horarios] = await pool.query("SELECT * FROM event_artist WHERE artist_id = ?",[artist_id]);
      let i = 0;
      let se_superpone = false;

      while(i < horarios.length && !se_superpone){
        if( horarios[i].end_time > start_time && horarios[i].start_time < end_time ){
          se_superpone = true;
        };
        i++;
      }
      if(se_superpone === true){
        return res.status(400).json({
          mensaje: "El artista esta ocupado en este horario"
        })
      }

      //insetamos en la base de datos
      await pool.query("INSERT INTO event_artist (event_id, artist_id, start_time, end_time) VALUES (?, ?, ?, ?)", [eventId, artist_id, start_time, end_time]);
      
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