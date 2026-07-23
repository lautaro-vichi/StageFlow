# 🎭 StageFlow

StageFlow es una aplicación web para la gestión de eventos, artistas y recursos técnicos. Permite administrar eventos evitando conflictos de horarios entre artistas y recursos.

---

# 🛠️ Tecnologías utilizadas

- Backend: Node.js + Express.js
- Frontend: HTML, CSS y JavaScript
- Base de datos: MySQL
- Contenedores: Docker y Docker Compose
- Despliegue: Render

---

# 📁 Estructura del proyecto

text
Stage-Flow/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── config/
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── pages/
│   ├── index.html
│   └── Dockerfile
│
├── database/
│   └── dataBase.sql
│
├── docker-compose.yml
└── README.md


---

# 🚀 Cómo ejecutar el proyecto

## Requisitos

- Docker Desktop
- Git

## 1. Clonar el repositorio

bash
git clone https://github.com/lautaro-vichi/StageFlow.git
cd Stage-Flow


## 2. Levantar los contenedores

bash
docker compose up --build


Una vez iniciados:

- Frontend: http://localhost:8080
- Backend: http://localhost:3000

---

# 🌐 API desplegada

Backend en Render:

https://genuine-profiterole-fcab2e.netlify.app/eventos

---