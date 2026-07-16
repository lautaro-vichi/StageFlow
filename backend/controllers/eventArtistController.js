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