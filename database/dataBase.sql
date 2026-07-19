CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,                  -- x si se agrega un campo descripcion
    
    -- Parte de lauti
    date DATE,                         
    start_time TIME,                   
    end_time TIME,                     
    
    -- nueva parte fecha inicio y fin
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    equipo TEXT,
    
    location VARCHAR(100) NOT NULL,
    status ENUM(
        'planificado',
        'confirmado',
        'en curso',
        'finalizado',
        'cancelado'
    ) DEFAULT 'planificado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);