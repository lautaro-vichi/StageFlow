const pool = require("../db"); //importamos la conexion a la base de datos

async  function getResources(req, res){
    try { 
    const [rows] = await pool.query("SELECT * FROM resources");

    res.json(rows);



    } catch(error){
        res.status(500).json({
            mensaje: "Error al obtener recursos"
        })
    }
}


async function getResourceById(req, res){
    const  id  = Number(req.params.id);
    try {
        const [rows] = await pool.query("SELECT * FROM resources WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Recurso no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el recurso"
        });
    }
}

module.exports = {
    getResources,
    getResourceById
};