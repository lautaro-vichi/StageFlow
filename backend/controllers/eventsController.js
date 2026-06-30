const pool = require("../db");


// controlador para obtener todos los eventos
async function getEvents(req, res) {

    try {

        const [rows] = await pool.query("SELECT * FROM events");

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener eventos"
        });

    }

}

async function getEventById(req, res) {
    const id = req.params.id;

    try {

        const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [id]);

        if (rows.length === 0 ) {
            return res.status(404).json({
                mensaje: "Evento no encontrado"
            })

            
        } 
     res.json(rows[0]);    

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al obtener evento"
        })
    }

} 
 module.exports = {
    getEvents,
    getEventById
};