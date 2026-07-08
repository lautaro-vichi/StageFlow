document.addEventListener('DOMContentLoaded', () => {
    // 1. CAPTURAMOS LOS ELEMENTOS DEL HTML
    const modal = document.getElementById('modal-experiencia');
    const botonesPerfil = document.querySelectorAll('.btn-perfil');
    
    // Elementos internos del Modal para rellenar con datos
    const modalRol = document.getElementById('modal-rol');
    const modalListaTech = document.getElementById('modal-lista-tech');

    // Elementos encargados de cerrar el cartel
    const cerrarBg = document.getElementById('modal-bg-close');
    const cerrarBtn = document.getElementById('modal-btn-close');
    const cerrarFoot = document.getElementById('modal-foot-close');

    // 2. PROGRAMAMOS LA FUNCIÓN PARA ABRIR EL MODAL (EVENTO CLICK)
    botonesPerfil.forEach(boton => {
        boton.addEventListener('click', () => {
            // Extraemos los datos del botón cliqueado mediante 'dataset'
            const especialidad = boton.dataset.rol;
            const tecnologias = boton.dataset.tech;

            // Inyectamos la información dentro de las etiquetas del Modal
            modalRol.textContent = especialidad;
            modalListaTech.textContent = tecnologias;

            // Agregamos la clase de Bulma que hace visible al Modal
            modal.classList.add('is-active');
        });
    });

    // 3. PROGRAMAMOS LA FUNCIÓN PARA CERRAR EL MODAL
    function cerrarModal() {
        modal.classList.remove('is-active');
    }

    // El modal se cerrará si hacen clic en la cruz, en el fondo gris o en el botón inferior
    cerrarBg.addEventListener('click', cerrarModal);
    cerrarBtn.addEventListener('click', cerrarModal);
    cerrarFoot.addEventListener('click', cerrarModal);

   fetch("http://localhost:3000/events")
    .then(response => response.json())
    .then(eventos => {

        console.log(eventos);

    });
    

});