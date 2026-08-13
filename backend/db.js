const mysql = require("mysql2/promise");

// Configuración base usando variables de entorno o valores por defecto para entorno local
const dbConfig = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL // Si la plataforma te da una URL completa
    : {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root",
        database: process.env.DB_NAME || "stage_flow",
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        
        // 🔒 Activa SSL solo si estás en producción (para nubes como Aiven, Railway, etc.)
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        
        // ⚡ Ajustes recomendados para el Pool de conexiones
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

const pool = mysql.createPool(dbConfig);

module.exports = pool;