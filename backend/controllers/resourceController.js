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

async function createResource(req, res) {
    const { name, description, type, total_quantity, available_quantity } = req.body;
    try{
        if(!name || !description || !type || !total_quantity || !available_quantity){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            })
        };

        await pool.query ("INSERT INTO resources (name, description, type, total_quantity, available_quantity) VALUES (?, ?, ?, ?,?)", [name, description, type, total_quantity, available_quantity]);

        res.status(201).json({
            mensaje: "Recurso aniadido correctamente"
        });
    }catch(error){
        console.error(error);
        res.status(500).json({
            mensaje: "Error al añadir recurso"
        });
    }
};

async function updateResource(req, res){
    const resourceId = Number(req.params.id);
    const { name, description, type, total_quantity, available_quantity } = req.body;
    try{
        if(!name || !description || !type || !total_quantity || !available_quantity){
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            })
        };
        
        //existe recurso?
        const [resource] = await pool.query ("SELECT * FROM resources WHERE id = ?", [resourceId]);
        if(resource.length === 0){
           return res.status(404).json({
            mensaje: "El recurso no existe"
           });
        };

        await pool.query ("UPDATE resources SET name = ?, description = ?, type = ?, total_quantity = ?, available_quantity = ? WHERE id = ?",[name, description, type, total_quantity, available_quantity, resourceId])
        res.status(200).json({
            mensaje: "Recurso actualizado correctamente"
        });


    }catch(error){
        console.error(error);
        res.status(500).json({
            mensaje: "Error al modificar recurso"
        });  
    }
}

async function deleteResource(req, res){
    const resourceId = Number(req.params.id);

    try{  
        //existe recurso?
        const [resource] = await pool.query ("SELECT * FROM resources WHERE id = ?", [resourceId]);
        if(resource.length === 0){
           return res.status(404).json({
            mensaje: "El recurso no existe"
           });
        };

        await pool.query ("DELETE FROM resources WHERE id = ?", [resourceId]);
        res.status(200).json({
            mensaje: "Recurso eliminado correctamente"
        });
    }catch(error){
        res.status(500).json({
            mensaje: "Error al eliminar recurso"
        });
    }
};

module.exports = {
    getResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource
};