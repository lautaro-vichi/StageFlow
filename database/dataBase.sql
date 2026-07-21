CREATE DATABASE IF NOT EXISTS stage_flow;
USE stage_flow;

-- 1. TABLA DE ARTISTAS
CREATE TABLE IF NOT EXISTS artists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE RECURSOS
CREATE TABLE IF NOT EXISTS resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE EVENTOS
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    date DATE NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    fecha_inicio DATETIME NULL,
    fecha_fin DATETIME NULL,
    location VARCHAR(100) NOT NULL,
    equipo TEXT,
    status ENUM('planificado', 'confirmado', 'en curso', 'finalizado', 'cancelado') DEFAULT 'planificado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA PIVOTE: EVENTOS <-> ARTISTAS (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS event_artists (
    event_id INT NOT NULL,
    artist_id INT NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    PRIMARY KEY (event_id, artist_id),
    CONSTRAINT fk_ea_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_ea_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- 5. TABLA PIVOTE: EVENTOS <-> RECURSOS (Muchos a Muchos)
CREATE TABLE IF NOT EXISTS event_resources (
    event_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (event_id, resource_id),
    CONSTRAINT fk_er_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_er_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);