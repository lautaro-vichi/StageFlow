# ⚡ StageFlow - Sistema de Gestión de Escenarios y Eventos

![StageFlow Banner](https://via.placeholder.com/1200x400/1a1a1a/ffffff?text=StageFlow+-+Control+de+Escenario+en+Tiempo+Real)

**StageFlow** es un sistema web integral diseñado para la logística, coordinación y administración técnica de espectáculos en vivo y festivales. Permite agendar eventos, gestionar un catálogo de artistas, administrar el stock de recursos técnicos/equipamiento y asignar dinámicamente dichos recursos y bandas a cada escenario.

---
.
## 👥 Integrantes del Grupo
* **Integrante 1:** [Nombre y Apellido] - *Legajo / GitHub*
* **Integrante 2:** [Nombre y Apellido] - *Legajo / GitHub*
* **Integrante 3:** [Nombre y Apellido] - *Legajo / GitHub*
* **Integrante 4:** [Nombre y Apellido] - *Legajo / GitHub*

---

## 🌐 Despliegue en Producción (Punto Extra)
El proyecto se encuentra desplegado y disponible públicamente en internet:

* 📱 **Frontend (Vercel):** [https://tu-proyecto.vercel.app](https://tu-proyecto.vercel.app)
* ⚡ **Backend API (Render):** [https://tu-api.onrender.com](https://tu-api.onrender.com)

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript ES6 (Vanilla / CSR - Client Side Rendering), Framework Bulma CSS.
* **Backend:** Node.js, Express.js (API RESTful).
* **Base de Datos:** MySQL (con relaciones mediante claves foráneas / Foreign Keys).
* **Contenedores:** Docker, Docker Compose, Nginx.

---

## 🗄️ Modelo de Datos y Entidades

El sistema cuenta con tres (3) entidades principales que cumplen con el requisito de al menos 5 campos por tabla (excluyendo el `ID`):

1. **Eventos (`events`)**:
   * `id` (PK)
   * `name` (VARCHAR)
   * `description` (TEXT)
   * `location` (VARCHAR)
   * `start_time` (DATETIME)
   * `end_time` (DATETIME)
   * `status` (ENUM: *planificado, confirmado, en curso, finalizado, cancelado*)

2. **Artistas (`artists`)**:
   * `id` (PK)
   * `name` (VARCHAR)
   * `genre` (VARCHAR)
   * `phone` (VARCHAR)
   * `email` (VARCHAR)
   * `fee` (DECIMAL)

3. **Recursos Técnicos (`resources`)**:
   * `id` (PK)
   * `name` (VARCHAR)
   * `category` (VARCHAR)
   * `serial_number` (VARCHAR)
   * `total_quantity` (INT)
   * `available_quantity` (INT)

* **Tablas Intermedias / Relaciones:** `event_artists` y `event_resources` (Relaciones Muchos a Muchos entre Eventos, Artistas y Recursos con Claves Foráneas).

---

## 🚀 Cómo Ejecutar el Proyecto con Docker Compose

Requisito previo: Tener instalado [Docker Desktop](https://www.docker.com/).

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/TU_USUARIO/TU_REPOSITO.git](https://github.com/TU_USUARIO/TU_REPOSITO.git)
   cd TU_REPOSITO

   Levantar los servicios:
Ejecuta el siguiente comando en la raíz del proyecto para iniciar la Base de Datos, el Backend y el Frontend simultáneamente:

Bash
docker-compose up --build
Acceder a la aplicación:

Frontend Web: http://localhost:8080 (o http://localhost:80)

Backend API REST: http://localhost:3000

Base de Datos MySQL: localhost:3306

Detener los contenedores:

Bash
docker-compose down
⚙️ Ejecución en Entorno de Desarrollo Local (Sin Docker)
Base de Datos:
Importa el archivo database/schema.sql en tu servidor MySQL local (XAMPP / MySQL Workbench).

Backend:

Bash
cd backend
npm install
# Crear un archivo .env con las credenciales de tu MySQL local
npm start
Frontend:
Abre el archivo frontend/eventos.html en tu navegador o utilizando la extensión Live Server en VS Code.

📸 Capturas de Pantalla del Funcionamiento
1. Panel Principal de Gestión e Interfaz General



2. Formulario de Registro de Artistas y Eventos
(Agrega aquí una imagen de la carga de un artista/evento)

3. Modal de Gestión de Asignaciones (Artistas y Recursos Técnicos)
(Agrega aquí una imagen del modal interactivo abierto)


---

### 💡 Consejos para completar tu README:
1. Cambia las URLs ficticias de GitHub, Vercel y Render por tus enlaces reales.
2. Recuerda poner los nombres y legajos de todos tus compañeros de grupo.
3. Para las imágenes, puedes subir las capturas de tu pantalla directamente al repositorio en una carpeta llamada `docs/` o `images/` y reemplazar las URLs de `placeholder.com` por el path local (ej: `./images/panel.png`).