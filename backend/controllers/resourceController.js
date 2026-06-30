const pool = require("../db"); //importamos la conexion a la base de datos

async  function getResources(req, res){
    try { 
    const [rows] = await pool.query("SELECT * FROM resources");

    res.json(rows);



    } catch(error){
        res.status(500).json({
            mensaje: "Error al obtener eventos"
        })
    }
}

module.exports = {
 getResources
};