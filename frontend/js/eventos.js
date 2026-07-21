// =============================================================
// 1. CONSTANTES Y HELPER DE PETICIONES
// =============================================================
const API_BASE = "http://localhost:3000";
const API = {
    EVENTS: `${API_BASE}/events`,
    ARTISTS: `${API_BASE}/artists`,
    RESOURCES: `${API_BASE}/resources`
};

let eventoActualId = null;

// Helper genérico para peticiones HTTP
async function peticionAPI(url, options = {}) {
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.mensaje || 'Error en la petición');
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

// Formateador de fechas para Argentina
const formatearFecha = str => {
    if (!str) return 'Sin fecha';
    const d = new Date(String(str).trim().replace(' ', 'T'));
    return isNaN(d.getTime()) ? str : d.toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// =============================================================
// 2. INICIALIZACIÓN
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    // A) Crear Artista
    document.getElementById('form-artista')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = JSON.stringify({
            name: document.getElementById('nombre-artista').value,
            genre: document.getElementById('genero-artista').value
        });

        const res = await peticionAPI(API.ARTISTS, { method: 'POST', body });
        if (res.ok) {
            alert('¡Artista añadido con éxito!');
            e.target.reset();
            cargarArtistas();
        } else alert(`⚠️ ${res.error}`);
    });

    // B) Crear / Editar Evento
    document.getElementById('form-evento')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('evento-id')?.value;
        const body = JSON.stringify({
            name: document.getElementById('nombre').value,
            description: document.getElementById('descripcion').value,
            location: document.getElementById('lugar').value,
            start_time: document.getElementById('start-time').value,
            end_time: document.getElementById('end-time').value,
            status: document.getElementById('estado').value
        });

        const res = await peticionAPI(id ? `${API.EVENTS}/${id}` : API.EVENTS, {
            method: id ? 'PUT' : 'POST', body
        });

        if (res.ok) {
            alert(id ? '¡Evento actualizado!' : '¡Evento agendado!');
            cancelarEdicion();
            cargarEventos();
        } else alert(`⚠️ ${res.error}`);
    });

    cargarArtistas();
    cargarEventos();
});

// =============================================================
// 3. FUNCIONES DE ARTISTAS (ABM)
// =============================================================
async function cargarArtistas() {
    const lista = document.getElementById('lista-artistas');
    const select = document.getElementById('select-artista');
    if (!lista) return;

    const res = await peticionAPI(API.ARTISTS);
    lista.innerHTML = '';
    if (select) select.innerHTML = '<option value="">-- Seleccionar Artista --</option>';

    if (!res.ok || !res.data.length) {
        lista.innerHTML = `<p class="has-text-grey is-italic py-2">No hay artistas registrados.</p>`;
        return;
    }

    res.data.forEach(a => {
        lista.innerHTML += `
            <div class="notification is-dark py-2 px-3 mb-2 is-flex is-justify-content-between is-align-items-center" style="background-color: #2c2c2c;">
                <div>
                    <strong class="has-text-white">🎤 ${a.name}</strong> <br>
                    <span class="tag is-small is-rounded is-info is-light">${a.genre || 'General'}</span>
                </div>
                <button onclick="eliminarArtista(${a.id})" class="delete is-small has-background-danger"></button>
            </div>`;
        if (select) select.innerHTML += `<option value="${a.id}">${a.name} (${a.genre || 'General'})</option>`;
    });
}

window.eliminarArtista = async (id) => {
    if (!confirm('¿Eliminar este artista?')) return;
    const res = await peticionAPI(`${API.ARTISTS}/${id}`, { method: 'DELETE' });
    if (res.ok) cargarArtistas();
};

// =============================================================
// 4. FUNCIONES DE EVENTOS (GRILLA Y EDICIÓN)
// =============================================================
async function cargarEventos() {
    const contenedor = document.getElementById('contenedor-eventos');
    if (!contenedor) return;

    const res = await peticionAPI(API.EVENTS);
    contenedor.innerHTML = '';

    if (!res.ok || !res.data.length) {
        contenedor.innerHTML = `<p class="column is-full has-text-centered has-text-grey">No hay eventos en este momento.</p>`;
        return;
    }

    res.data.forEach(e => {
        const jsonEscapado = JSON.stringify(e).replace(/'/g, "&apos;");
        contenedor.innerHTML += `
            <div class="column is-one-third is-half-tablet">
                <div class="card">
                    <header class="card-header has-background-dark">
                        <p class="card-header-title has-text-white">⚡ ${e.name}</p>
                        <span class="tag is-info m-2">${e.status || 'planificado'}</span>
                    </header>
                    <div class="card-content">
                        <div class="content">
                            <p>📍 <strong>Lugar:</strong> ${e.location}</p>
                            <p>📅 <strong>Inicio:</strong> ${formatearFecha(e.fecha_inicio || e.start_time)}</p>
                            <p>🏁 <strong>Fin:</strong> ${formatearFecha(e.fecha_fin || e.end_time)}</p>
                        </div>
                    </div>
                    <footer class="card-footer is-flex-wrap-wrap">
                        <button onclick="verDetalle(${e.id})" class="card-footer-item button is-link is-light m-1">👁️ Detalle</button>
                        <button onclick='cargarParaEditar(${jsonEscapado})' class="card-footer-item button is-warning is-light m-1">✏️ Editar</button>
                        <button onclick="eliminarEvento(${e.id})" class="card-footer-item button is-danger is-light m-1">🗑️ Eliminar</button>
                    </footer>
                </div>
            </div>`;
    });
}

window.cargarParaEditar = (e) => {
    if (typeof e === 'string') e = JSON.parse(e);
    const fmtInput = str => str ? String(str).replace(' ', 'T').substring(0, 16) : '';

    document.getElementById('evento-id').value = e.id || '';
    document.getElementById('nombre').value = e.name || '';
    document.getElementById('descripcion').value = e.description || '';
    document.getElementById('lugar').value = e.location || '';
    document.getElementById('start-time').value = fmtInput(e.fecha_inicio || e.start_time);
    document.getElementById('end-time').value = fmtInput(e.fecha_fin || e.end_time);
    document.getElementById('estado').value = e.status || 'planificado';

    document.getElementById('titulo-form-evento').textContent = '✏️ Editar Evento';
    document.getElementById('btn-guardar-evento').textContent = 'ACTUALIZAR EVENTO';
    document.getElementById('btn-cancelar-edicion').classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelarEdicion = () => {
    document.getElementById('form-evento')?.reset();
    document.getElementById('evento-id').value = '';
    document.getElementById('titulo-form-evento').textContent = '🗓️ Crear Evento';
    document.getElementById('btn-guardar-evento').textContent = 'GUARDAR EVENTO';
    document.getElementById('btn-cancelar-edicion').classList.add('is-hidden');
};

window.eliminarEvento = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    const res = await peticionAPI(`${API.EVENTS}/${id}`, { method: 'DELETE' });
    if (res.ok) cargarEventos();
};

// =============================================================
// 5. MODAL DE DETALLE Y ASIGNACIÓN
// =============================================================
window.verDetalle = async (id) => {
    eventoActualId = id;
    document.getElementById('modal-detalle')?.classList.add('is-active');

    const res = await peticionAPI(`${API.EVENTS}/${id}`);
    if (res.ok) {
        const e = Array.isArray(res.data) ? res.data[0] : res.data;
        document.getElementById('modal-titulo-evento').textContent = `⚡ ${e.name}`;
        document.getElementById('modal-lugar').textContent = e.location;
        document.getElementById('modal-horario').textContent = `${formatearFecha(e.fecha_inicio || e.start_time)} a ${formatearFecha(e.fecha_fin || e.end_time)}`;
        document.getElementById('modal-estado').textContent = e.status || 'planificado';
        document.getElementById('modal-descripcion').textContent = e.description || 'Sin descripción';
    }

    cargarArtistasDelEvento(id);
    cargarRecursosDelEvento(id);
    cargarOpcionesSelects();
};

window.cerrarModal = () => {
    document.getElementById('modal-detalle')?.classList.remove('is-active');
    eventoActualId = null;
};

// --- A) RECURSOS ---
async function cargarRecursosDelEvento(eventId) {
    const contenedor = document.getElementById('modal-lista-recursos');
    if (!contenedor) return;

    const res = await peticionAPI(`${API.EVENTS}/${eventId}/resources`);
    contenedor.innerHTML = '';

    if (!res.ok || !res.data.length) {
        contenedor.innerHTML = '<p class="has-text-grey is-italic">Sin recursos asignados.</p>';
        return;
    }

    res.data.forEach(r => {
        contenedor.innerHTML += `
            <div class="notification is-dark py-2 px-3 mb-2 is-flex is-justify-content-between is-align-items-center">
                <div><strong>🛠️ ${r.name}</strong> <span class="tag is-info is-light">x${r.quantity || 1}</span></div>
                <button onclick="eliminarRecursoDeEvento(${r.id})" class="delete is-small has-background-danger"></button>
            </div>`;
    });
}

window.agregarRecursoAEvento = async () => {
    const resource_id = document.getElementById('modal-select-recurso')?.value;
    const inputCant = document.getElementById('modal-cantidad-recurso') || document.getElementById('recurso-cantidad');
    const quantity = inputCant ? parseInt(inputCant.value, 10) : 1;

    if (!resource_id) return alert('Seleccioná un recurso.');

    const res = await peticionAPI(`${API.EVENTS}/${eventoActualId}/resources`, {
        method: 'POST', body: JSON.stringify({ resource_id, quantity })
    });

    if (res.ok) {
        alert('✅ Recurso asignado.');
        cargarRecursosDelEvento(eventoActualId);
    } else alert(`⚠️ ALERTA:\n\n${res.error}`);
};

window.eliminarRecursoDeEvento = async (resourceId) => {
    if (!confirm('¿Quitar este recurso y liberar stock?')) return;
    const res = await peticionAPI(`${API.EVENTS}/${eventoActualId}/resources/${resourceId}`, { method: 'DELETE' });
    if (res.ok) cargarRecursosDelEvento(eventoActualId);
};

// --- B) ARTISTAS ---
async function cargarArtistasDelEvento(eventId) {
    const contenedor = document.getElementById('modal-lista-artistas');
    if (!contenedor) return;

    const res = await peticionAPI(`${API.EVENTS}/${eventId}/artists`);
    contenedor.innerHTML = '';

    if (!res.ok || !res.data.length) {
        contenedor.innerHTML = '<p class="has-text-grey is-italic">Sin artistas asignados.</p>';
        return;
    }

    res.data.forEach(a => {
        contenedor.innerHTML += `
            <div class="notification is-dark py-2 px-3 mb-2 is-flex is-justify-content-between is-align-items-center">
                <div><strong>🎤 ${a.name}</strong></div>
                <button onclick="eliminarArtistaDeEvento(${a.id})" class="delete is-small has-background-danger"></button>
            </div>`;
    });
}

window.agregarArtistaAEvento = async () => {
    const artist_id = document.getElementById('modal-select-artista')?.value;
    if (!artist_id) return alert('Seleccioná un artista.');

    const res = await peticionAPI(`${API.EVENTS}/${eventoActualId}/artists`, {
        method: 'POST', body: JSON.stringify({ artist_id })
    });

    if (res.ok) {
        alert('✅ Artista asignado.');
        cargarArtistasDelEvento(eventoActualId);
    } else alert(`⚠️ RESTRICCIÓN DE AGENDA:\n\n${res.error}`);
};

window.eliminarArtistaDeEvento = async (artistId) => {
    if (!confirm('¿Quitar este artista del show?')) return;
    const res = await peticionAPI(`${API.EVENTS}/${eventoActualId}/artists/${artistId}`, { method: 'DELETE' });
    if (res.ok) cargarArtistasDelEvento(eventoActualId);
};

// --- C) SELECTS DESPLEGABLES ---
async function cargarOpcionesSelects() {
    const selectArtista = document.getElementById('modal-select-artista');
    const selectRecurso = document.getElementById('modal-select-recurso');

    if (selectArtista) {
        const res = await peticionAPI(API.ARTISTS);
        selectArtista.innerHTML = '<option value="">-- Elegir Artista --</option>';
        if (res.ok) res.data.forEach(a => selectArtista.innerHTML += `<option value="${a.id}">${a.name}</option>`);
    }

    if (selectRecurso) {
        const res = await peticionAPI(API.RESOURCES);
        selectRecurso.innerHTML = '<option value="">-- Elegir Recurso --</option>';
        if (res.ok) res.data.forEach(r => selectRecurso.innerHTML += `<option value="${r.id}">${r.name} (Stock: ${r.stock || 10})</option>`);
    }
}