document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. CONFIGURACIÓN Y SELECTORES
    // -------------------------------------------------------------
    const formEvento = document.getElementById('form-evento');
    const contenedorEventos = document.getElementById('contenedor-eventos');
    
    const formArtista = document.getElementById('form-artista');
    const listaArtistas = document.getElementById('lista-artistas');

    // URLs del Backend en Docker
    const API_EVENTS = 'http://localhost:3000/events';
    const API_ARTISTS = 'http://localhost:3000/artists'; // Apunta a tu artistsController

    // -------------------------------------------------------------
    // 2. LÓGICA DE ARTISTAS (ABM)
    // -------------------------------------------------------------

    // Escuchar el envío del formulario de artistas (POST)
    if (formArtista) {
        formArtista.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('nombre-artista').value;
            const genre = document.getElementById('genero-artista').value;

            try {
                const respuesta = await fetch(API_ARTISTS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, genre })
                });

                if (respuesta.ok) {
                    alert('¡Artista añadido con éxito!');
                    formArtista.reset();
                    cargarArtistas(); // Refresca la lista lateral
                } else {
                    const data = await respuesta.json();
                    alert(data.mensaje || 'Hubo un error al guardar el artista.');
                }
            } catch (error) {
                console.error('Error al conectar con la API de artistas:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    // Cargar y mostrar la lista lateral de artistas (GET)
    async function cargarArtistas() {
        if (!listaArtistas) return;

        try {
            const respuesta = await fetch(API_ARTISTS);
            const artistas = await respuesta.json();

            listaArtistas.innerHTML = '';

            if (artistas.length === 0) {
                listaArtistas.innerHTML = `<p class="has-text-grey is-italic py-2">No hay artistas registrados.</p>`;
                return;
            }

        artistas.forEach(artista => {
            const itemHtml = `
                <div class="notification is-dark py-2 px-3 mb-2 is-flex is-justify-content-between is-align-items-center" style="background-color: #2c2c2c;">
                    <div>
                        <strong class="has-text-white">🎤 ${artista.name}</strong> <br>
                        <span class="tag is-small is-rounded is-info is-light">${artista.genre}</span>
                    </div>
                    <button onclick="eliminarArtista(${artista.id})" class="delete is-small has-background-danger"></button>
                </div>
            `;
            listaArtistas.innerHTML += itemHtml;
        });
        } catch (error) {
            console.error('Error al cargar artistas:', error);
            listaArtistas.innerHTML = `<p class="has-text-danger">Error al cargar la lista.</p>`;
        }
    }

    // Eliminar un artista (DELETE)
    window.eliminarArtista = async (id) => {
        if (!confirm('¿Estás seguro de eliminar a este artista del sistema?')) return;

        try {
            const respuesta = await fetch(`${API_ARTISTS}/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                cargarArtistas();
            } else {
                alert('No se pudo eliminar al artista.');
            }
        } catch (error) {
            console.error('Error al borrar artista:', error);
        }
    };


    // -------------------------------------------------------------
    // 3. LÓGICA DE EVENTOS (Adaptada a DATETIME)
    // -------------------------------------------------------------

    // Escuchar el envío del formulario de eventos (POST)
    if (formEvento) {
        formEvento.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('nombre').value;
            const location = document.getElementById('lugar').value;
            // Adaptación Lautaro: tomamos los valores directo del input datetime-local
            const start_time = document.getElementById('start-time').value;
            const end_time = document.getElementById('end-time').value;
            const status = "planificado";
            
            const checkboxes = document.querySelectorAll('input[name="equipo"]:checked');
            const equipoTexto = Array.from(checkboxes).map(cb => cb.value).join(', ');

            // Armamos el objeto con la estructura limpia de DATETIME
            const nuevoEvento = {
                name,
                location,
                start_time,
                end_time,
                equipo: equipoTexto,
                status
            };

            try {
                const respuesta = await fetch(API_EVENTS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoEvento)
                });

                if (respuesta.ok) {
                    alert('¡Reserva de evento agendada con éxito!');
                    formEvento.reset();
                    cargarEventos();
                } else {
                    alert('Hubo un error al guardar la reserva.');
                }
            } catch (error) {
                console.error('Error al conectar con la API de eventos:', error);
            }
        });
    }

    // Cargar y mostrar la grilla de eventos (GET)
    async function cargarEventos() {
        if (!contenedorEventos) return;

        try {
            const respuesta = await fetch(API_EVENTS);
            const eventos = await respuesta.json();

            contenedorEventos.innerHTML = '';

            if (eventos.length === 0) {
                contenedorEventos.innerHTML = `<p class="column is-full has-text-centered has-text-grey">No hay eventos reservados en este momento.</p>`;
                return;
            }

            eventos.forEach(evento => {
                // Leemos las propiedades con la nomenclatura de la base de datos
                const inicioFormateado = new Date(evento.start_time).toLocaleString('es-AR');
                const finFormateado = new Date(evento.end_time).toLocaleString('es-AR');

                const tarjetaHtml = `
                    <div class="column is-one-third is-half-tablet">
                        <div class="card">
                            <header class="card-header has-background-dark">
                                <p class="card-header-title has-text-white">
                                    ⚡ ${evento.name}
                                </p>
                                <span class="tag is-info m-2">${evento.status}</span>
                            </header>
                            <div class="card-content">
                                <div class="content">
                                    <p>📍 <strong>Lugar:</strong> ${evento.location}</p>
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

    // Eliminar un evento (DELETE)
    window.eliminarEvento = async (id) => {
        if (!confirm('¿Estás seguro de que querés cancelar esta reserva de evento?')) return;

        try {
            const respuesta = await fetch(`${API_EVENTS}/${id}`, { method: 'DELETE' });
            if (respuesta.ok) {
                cargarEventos();
            } else {
                alert('No se pudo eliminar el evento.');
            }
        } catch (error) {
            console.error('Error al intentar borrar:', error);
        }
    };

    // -------------------------------------------------------------
    // 4. INICIALIZACIÓN
    // -------------------------------------------------------------
    cargarArtistas();
    cargarEventos();
});