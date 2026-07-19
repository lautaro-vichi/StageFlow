document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-evento');
    const contenedorEventos = document.getElementById('contenedor-eventos');

    // URL de tu Backend dockerizado (cambiar puerto si es necesario)
    const API_URL = 'http://localhost:3000/events';

    // 1. ESCUCHAR EL ENVÍO DEL FORMULARIO
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue

            // Capturamos los datos básicos
            const nombre = document.getElementById('nombre').value;
            const lugar = document.getElementById('lugar').value;
            const fecha_inicio = document.getElementById('fecha-inicio').value;
            const fecha_fin = document.getElementById('fecha-fin').value;
            const estado = "planificado";
            
            // CAPTURAR PLANILLA DE EQUIPO (Checkboxes)
            // Filtramos todos los checkboxes llamados "equipo" que estén marcados
            const checkboxes = document.querySelectorAll('input[name="equipo"]:checked');
            const equipoSeleccionado = Array.from(checkboxes).map(cb => cb.value);
            
            // Convertimos el array de equipos en un texto separado por comas para enviarlo
            const equipoTexto = equipoSeleccionado.join(', ');

            // Armamos el objeto con los datos exactos que espera el backend
            const nuevoEvento = {
            name: nombre,              // Va a la columna 'name'
            location: lugar,           // Va a la columna 'location'
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            equipo: equipoTexto,
            status: estado             // Va a la columna 'status'
};

            try {
                // Enviamos los datos al backend en Docker
                const respuesta = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nuevoEvento)
                });

                if (respuesta.ok) {
                    alert('¡Reserva de evento agendada con éxito!');
                    form.reset(); // Limpia el formulario
                    cargarEventos(); // Recarga la lista de tarjetas
                } else {
                    alert('Hubo un error al guardar la reserva en el servidor.');
                }
            } catch (error) {
                console.error('Error de conexión con el backend:', error);
                alert('No se pudo conectar con el backend. ¿Está corriendo Docker?');
            }
        });
    }

    // 2. FUNCIÓN PARA CARGAR Y MOSTRAR LAS TARJETAS (GET)
    async function cargarEventos() {
        if (!contenedorEventos) return;

        try {
            const respuesta = await fetch(API_URL);
            const eventos = await respuesta.json();

            // Limpiamos las tarjetas viejas
            contenedorEventos.innerHTML = '';

            if (eventos.length === 0) {
                contenedorEventos.innerHTML = `<p class="column is-full has-text-centered has-text-grey">No hay eventos reservados en este momento.</p>`;
                return;
            }

// Dentro del forEach, adaptá las variables para que lean el inglés:
            eventos.forEach(evento => {
                // Formateamos las fechas leyendo las columnas correspondientes
                const inicioFormateado = new Date(evento.fecha_inicio).toLocaleString('es-AR');
                const finFormateado = new Date(evento.fecha_fin).toLocaleString('es-AR');

                const tarjetaHtml = `
                    <div class="column is-one-third is-half-tablet"> <!-- Corregido 'is-thirda' por 'is-one-third' -->
                        <div class="card">
                            <header class="card-header has-background-dark">
                                <p class="card-header-title has-text-white">
                                    ⚡ ${evento.name} <!-- 💻 Cambiado a evento.name -->
                                </p>
                                <span class="tag is-info m-2">${evento.status}</span> <!-- 💻 Cambiado a evento.status -->
                            </header>
                            <div class="card-content">
                                <div class="content">
                                    <p>📍 <strong>Lugar:</strong> ${evento.location}</p> <!-- 💻 Cambiado a evento.location -->
                                    <p>📅 <strong>Inicio:</strong> ${inicioFormateado}</p>
                                    <p>🏁 <strong>Fin:</strong> ${finFormateado}</p>
                                    <p>🛠️ <strong>Equipo Técnico:</strong> <br>
                                    <span class="has-text-grey-dark">${evento.equipo || 'Ninguno seleccionado'}</span>
                                    </p>
                                </div>
                            </div>
                            <footer class="card-footer">
                                <button onclick="eliminarEvento(${evento.id})" class="card-footer-item button is-danger is-light m-2">
                                    Eliminar Reserva
                                </button>
                            </footer>
                        </div>
                    </div>
                `;
                contenedorEventos.innerHTML += tarjetaHtml;
            });

        } catch (error) {
            console.error('Error al cargar la grilla de eventos:', error);
        }
    }

    // 3. FUNCIÓN PARA ELIMINAR (DELETE)
    window.eliminarEvento = async (id) => {
        if (!confirm('¿Estás seguro de que querés cancelar esta reserva de evento?')) return;

        try {
            const respuesta = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                cargarEventos(); // Volver a renderizar la grilla actualizada
            } else {
                alert('No se pudo eliminar el evento.');
            }
        } catch (error) {
            console.error('Error al intentar borrar:', error);
        }
    };

    // Al cargar la página por primera vez, traemos lo que ya esté guardado
    cargarEventos();
});