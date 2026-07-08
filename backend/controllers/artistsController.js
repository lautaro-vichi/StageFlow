const pool = require("../db");


//controller para obtener artistas
async function getArtists(req, res) {

    try {
        const [rows] =  await pool.query("SELECT * FROM artists");
        res.json(rows);

    }catch (error){
     console.log(error);
     res.status(500).json({
        mensaje: "Error al obtener artistas"
     });

    }
}

//controller para obtener un artista por id

async function getArtistById(req, res){
 const id = Number(req.params.id);

 try{


    const [rows] = await pool.query("SELECT * FROM artists WHERE id = ? ", [id]);

    if (rows.length === 0 ) {
        return res.status(404).json({
         mensaje: "Artista no encontrado"
        })
    } 

    res.json(rows[0]);

 }catch(error){
    console.log(error);
    res.status(500).json({
        mensaje: "Error al obtener artista"
    });
 }
}

//controller para aniadir un artista

async function createArtist(req, res){

    try{ 
 const {name, genre} = req.body;
 //validamos que los datos existan
 if(!name || !genre){
    return res.status(400).json({
         mensaje: "Todos los campos son obligatorios"
    })
 };
 //insertamos en la base de datos
 const [result] = await pool.query("INSERT INTO artists (name, genre) VALUES (? ,?)", [name, genre]);
 res.status(201).json({
    mensaje: "Artista añadido correctamente",
    id: result.insertId
 });


}catch(error){
    console.error(error);
        res.status(500).json({
            mensaje: "Error al añadir artista"
        });
    
}
}


//controler para modificar un artista

async function updateArtist (req, res) {
    const id = Number(req.params.id);
    const {name, genre} = req.body;
    try{
     const [rows] = await pool.query("SELECT * FROM artists WHERE id = ?", [id]);
      if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Artista no encontrado"
             });
        }

        if(!name || !genre){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            })
        }

      //actualizamos la base de datos
      await pool.query("UPDATE artists SET name = ?, genre = ? WHERE id = ?", [name, genre, id]);
      res.json({
        mensaje: "Artista actualizado correctamente"
      });
    }catch(error){
        res.status(500).json({
            mensaje: "Error al actualizar artista"
        })
    }
}    

//controller para borrar un artista
async function deleteArtist(req, res){
    const id = Number(req.params.id);

    try{
      
        const [rows] = await pool.query("SELECT * FROM artists WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                mensaje: "Artista no encontrado"
            });
        }

        await pool.query("DELETE FROM artists WHERE id = ?", [id]);
        res.json({
            mensaje: "Artista eliminado correctamente"
        });
    }catch(error){
        res.status(500).json({
            mensaje: "Error al elimnar artista"
        });
    }
}

module.exports = {
    getArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
};