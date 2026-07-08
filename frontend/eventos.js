// ==========================================
// STAGEFLOW - LÓGICA DE GESTIÓN DE EVENTOS
// ==========================================

// Base de datos temporal en memoria (guarda los datos mientras la página esté abierta)
let eventos = [
    { id: 1, nombre: "Show de Apertura - DJ Techno Set", inicio: "20:00", fin: "21:30", equipo: "Pantallas LED + Sonido Line Array", estado: "en-curso" },
    { id: 2, nombre: "Banda de Rock Alternativo", inicio: "22:00", fin: "23:30", equipo: "Iluminación Robótica Avanzada", estado: "confirmado" }
];

// Captura de los elementos del HTML
const formEvento = document.getElementById('form-evento');
const contenedorEventos = document.getElementById('contenedor-eventos');
const mensajeVacio = document.getElementById('mensaje-vacio');
const botonesFiltros = document.querySelectorAll('.buttons.has-addons .button');

// --- 1. FUNCIÓN PARA MOSTRAR LOS EVENTOS EN PANTALLA ---
function renderizarEventos(filtro = 'todos') {
    // Limpiamos lo que haya actualmente en la lista
    contenedorEventos.innerHTML = '';
    
    // Filtramos el arreglo según el botón presionado
    const eventosFiltrados = eventos.filter(evento => {
        if (filtro === 'todos') return true;
        return evento.estado === filtro;
    });

    // Si no hay eventos para mostrar, activamos el mensaje de alerta
    if (eventosFiltrados.length === 0) {
        mensajeVacio.classList.remove('is-hidden');
        return;
    } else {
        mensajeVacio.classList.add('is-hidden');
    }

    // Construimos las tarjetas dinámicamente
    eventosFiltrados.forEach(evento => {
        let badgeColor = 'is-info';
        let badgeIcon = '✅ Confirmado';
        let accionBoton = `<button class="button is-small is-light" onclick="eliminarEvento(${evento.id})">Eliminar</button>`;

        if (evento.estado === 'en-curso') {
            badgeColor = 'is-danger';
            badgeIcon = '🎙️ En Curso';
            accionBoton = `<button class="button is-small is-light has-text-danger" onclick="cambiarEstado(${evento.id}, 'finalizado')">Finalizar</button>`;
        } else if (evento.estado === 'planificado') {
            badgeColor = 'is-warning';
            badgeIcon = '📅 Planificado';
            accionBoton = `<button class="button is-small is-primary is-light" onclick="cambiarEstado(${evento.id}, 'en-curso')">Iniciar</button>`;
        } else if (evento.estado === 'finalizado') {
            badgeColor = 'is-dark';
            badgeIcon = '🏁 Finalizado';
        }

        const tarjetaHTML = `
            <article class="box pb-3">
                <div class="columns is-vcentered is-mobile is-multiline">
                    <div class="column is-narrow">
                        <span class="tag ${badgeColor} is-light status-badge">${badgeIcon}</span>
                    </div>
                    <div class="column">
                        <h4 class="title is-5 mb-0 has-text-white">${evento.nombre}</h4>
                        <p class="is-size-7 has-text-grey-light">Horario: ${evento.inicio} - ${evento.fin} | Requerimiento: ${evento.equipo}</p>
                    </div>
                    <div class="column is-narrow">
                        ${accionBoton}
                    </div>
                </div>
            </article>
        `;
        contenedorEventos.innerHTML += tarjetaHTML;
    });
}

// --- 2. ESCUCHAR EL FORMULARIO (GUARDAR DATOS) ---
if (formEvento) {
    formEvento.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue e interrumpa el proceso

        // Capturamos lo que escribió el usuario
        const nombre = formEvento.querySelector('input[type="text"]').value;
        const inicio = formEvento.querySelectorAll('input[type="time"]')[0].value;
        const fin = formEvento.querySelectorAll('input[type="time"]')[1].value;
        const equipo = formEvento.querySelectorAll('select')[0].value;
        const estado = formEvento.querySelectorAll('select')[1].value;

        // Validación de horas
        if (inicio >= fin) {
            alert("La hora de inicio no puede ser mayor o igual a la de finalización.");
            return;
        }

        // Creamos el nuevo objeto de show
        const nuevoEvento = {
            id: Date.now(), // Genera un ID único basado en el tiempo
            nombre,
            inicio,
            fin,
            equipo,
            estado
        };

        // Lo guardamos en nuestra lista y volvemos a dibujar la pantalla
        eventos.push(nuevoEvento);
        renderizarEventos();
        
        // Limpiamos el formulario
        formEvento.reset();
    });
}

// --- 3. ACCIONES DE BOTONES INTERNOS (CAMBIAR ESTADO / ELIMINAR) ---
window.cambiarEstado = (id, nuevoEstado) => {
    const evento = eventos.find(e => e.id === id);
    if (evento) {
        evento.estado = nuevoEstado;
        renderizarEventos();
    }
};

window.eliminarEvento = (id) => {
    eventos = eventos.filter(e => e.id !== id);
    renderizarEventos();
};

// --- 4. HACER QUE LOS FILTROS FUNCIONEN ---
botonesFiltros.forEach(boton => {
    boton.addEventListener('click', () => {
        // Quitamos el color azul activo a todos los botones de filtro
        botonesFiltros.forEach(btn => btn.classList.remove('is-selected', 'is-link'));
        
        // Se lo asignamos al botón que acabamos de presionar
        boton.classList.add('is-selected', 'is-link');

        // Traducimos el texto del botón al filtro correspondiente
        const textoBoton = boton.textContent.trim().toLowerCase();
        let filtro = 'todos';
        
        if (textoBoton === 'confirmados') filtro = 'confirmado';
        if (textoBoton === 'en curso') filtro = 'en-curso';

        // Renderizamos aplicando el filtro escogido
        renderizarEventos(filtro);
    });
});

// --- INICIALIZACIÓN ---
// Muestra los shows por primera vez apenas abre la página
document.addEventListener('DOMContentLoaded', () => {
    renderizarEventos();
});