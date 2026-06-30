DROP DATABASE IF EXISTS stage_flow;
CREATE DATABASE stage_flow;
USE stage_flow;

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
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

    genre VARCHAR(50)

);

CREATE TABLE resources (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    type VARCHAR(50),

    available BOOLEAN DEFAULT TRUE

);

CREATE TABLE event_artist (

    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    artist_id INT NOT NULL,

    start_time TIME,

    end_time TIME,

    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE

);

CREATE TABLE event_resource (

    id INT AUTO_INCREMENT PRIMARY KEY,

    event_id INT NOT NULL,

    resource_id INT NOT NULL,

    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE

);

INSERT INTO events (name, description, date, start_time, end_time, location, status) VALUES
('Concierto de Rock', 'Un concierto de rock con bandas locales.', '2024-07-15', '20:00:00', '23:00:00', 'Auditorio Municipal', 'planificado'),
('Festival de Jazz', 'Un festival de jazz con artistas internacionales.', '2024-08-10', '18:00:00', '22:00:00', 'Parque Central', 'confirmado'),
('Exposición de Arte', 'Una exposición de arte contemporáneo.', '2024-09-05', '10:00:00', '18:00:00', 'Galería de Arte Moderno', 'en curso'),
('Feria Gastronómica', 'Una feria gastronómica con chefs reconocidos.', '2024-10-20', '12:00:00', '20:00:00', 'Plaza Mayor', 'finalizado'),
('Conferencia Tecnológica', 'Una conferencia sobre las últimas tendencias en tecnología.', '2024-11-15', '09:00:00', '17:00:00', 'Centro de Convenciones', 'cancelado');

INSERT INTO artists (name, genre) VALUES 
('powfu', 'lo-fi');
