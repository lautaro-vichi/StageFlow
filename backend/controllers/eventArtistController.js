const pool = require("../db");

async function postArtistEvent(req, res) {

    try {
      const { event_id, artist_id, start_time, end_time } = req.body;
      //validamos que exitan todos los cambios
      if (!artist_id || !start_time || !end_time){
        return res.status(500).json({
            mensaje: "Todos los campos son obligatorios"
        });
      }
      //insetamos en la base de datos
      const [restult] = await pool.query("INSERT INTO event_artist (event_id, artist_id, start_time, end_time) VALUES (?, ?, ?, ?)", [event_id, artist_id, start_time, end_time]);
      res.status(201).json({
        mensaje: "Relacion creada correctamente"
      });

    } catch(error){
        res.status(500).json({
            mensaje: "Error al crear relacion"
        })
    }
}

async function deleteArtistEvent(req, res) {
  const id = Number(req.params.id);
  const artistId = Number(req.params.artistId);
  try{
    const [rows] = await pool.query("SELECT * FROM event_artist WHERE event_id = ? AND artist_id = ?", [id, artistId]);
   if (rows.length === 0) {
    return res.status(404).json({
     mensaje: "Relacion no encontrada"
     });
    }    
    await pool.query("DELETE FROM event_artist WHERE event_id = ? AND artist_id = ?", [id, artistId]);
    res.json({
      mensaje: "Artista eliminado correctamente del evento"
      });
  }catch(error){
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