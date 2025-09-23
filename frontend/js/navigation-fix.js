// Fix temporal para navegación a registro
document.addEventListener('DOMContentLoaded', () => {
    // Interceptar clics en navegación
    document.addEventListener('click', async (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem && navItem.dataset.view === 'registro') {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Interceptando navegación a registro');
            
            // Ocultar loading si existe
            const loading = document.querySelector('.loading-overlay');
            if (loading) loading.style.display = 'none';
            
            // Cargar template manualmente
            const response = await fetch('templates/registro/formulario.html');
            const html = await response.text();
            document.getElementById('main-content').innerHTML = html;
            
            // Cargar script manualmente
            if (!window.RegistroSystem) {
                const script = document.createElement('script');
                script.src = 'js/registro.js';
                script.onload = () => window.RegistroSystem.init();
                document.head.appendChild(script);
            } else {
                window.RegistroSystem.init();
            }
        }
    });
});