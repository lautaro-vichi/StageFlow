DROP DATABASE IF EXISTS stage_flow;
CREATE DATABASE stage_flow;
USE stage_flow;

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    location VARCHAR(100) NOT NULL,
    status ENUM(
        'planificado',
        'confirmado',
        'en curso',
        'finalizado',
        'cancelado'
    )DEFAULT 'planificado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artists (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    genre VARCHAR(50),
    
    description VARCHAR(225),

    age INT,

    nationality TEXT
);

CREATE TABLE resources (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    description VARCHAR(100),

    type VARCHAR(50),

    total_quantity INT NOT NULL,

    available_quantity INT NOT NULL

);

CREATE TABLE event_resource (
    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    resource_id INT NOT NULL,

    quantity INT NOT NULL,

    start_time DATETIME NOT NULL,

    end_time DATETIME NOT NULL,

    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

CREATE TABLE event_artist (

    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    artist_id INT NOT NULL,

    start_time DATETIME NOT NULL,
    
    end_time DATETIME NOT NULL,

    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE

);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    picture VARCHAR(255),
    role ENUM('admin', 'organizador', 'tecnico') DEFAULT 'organizador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



INSERT INTO resources (name, type, total_quantity, available_quantity) VALUES
('Parlantes JBL EON', 'Audio', 20, 20),
('Micrófonos Shure SM58', 'Audio', 15, 15),
('Consola Yamaha TF1', 'Audio', 2, 2),
('Monitores de escenario', 'Audio', 12, 12),
('Luces LED RGB', 'Iluminación', 40, 40),
('Reflectores PAR LED', 'Iluminación', 24, 24),
('Cabezas móviles', 'Iluminación', 12, 12),
('Máquinas de humo', 'Efectos', 6, 6),
('Pantallas LED', 'Pantallas', 4, 4),
('Proyectores Epson', 'Video', 5, 5),
('Cámaras de video Sony', 'Video', 6, 6),
('Generadores eléctricos', 'Energía', 3, 3),
('Vallas de seguridad', 'Seguridad', 120, 120),
('Handys', 'Comunicación', 30, 30),
('Sillas plegables', 'Mobiliario', 600, 600),
('Mesas rectangulares', 'Mobiliario', 100, 100),
('Carpas', 'Infraestructura', 10, 10),
('Tarimas modulares', 'Escenario', 25, 25),
('Trípodes', 'Soportes', 20, 20),
('Atriles', 'Accesorios', 15, 15);

