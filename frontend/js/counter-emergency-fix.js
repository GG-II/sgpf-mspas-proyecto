(function() {
    'use strict';
    
    let initialized = false;
    
    function initCounters() {
        if (initialized) return;
        
        console.log('🔧 Configurando incrementadores optimizados...');
        
        // Usar delegación de eventos - más eficiente
        document.addEventListener('click', function(e) {
            // Verificar si el elemento clickeado es un botón contador
            if (!e.target.classList.contains('counter-btn')) return;
            
            e.preventDefault();
            e.stopImmediatePropagation();
            
            const targetId = e.target.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (!input) return;
            
            const isPlus = e.target.classList.contains('plus');
            let currentValue = parseInt(input.value) || 0;
            
            if (isPlus) {
                currentValue = Math.min(currentValue + 1, 999);
            } else {
                currentValue = Math.max(currentValue - 1, 0);
            }
            
            input.value = currentValue;
            updateTotal();
            
            // Feedback visual
            e.target.style.transform = 'scale(0.9)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 100);
            
        }, true); // Usar capture phase
        
        initialized = true;
        console.log('✅ Incrementadores configurados correctamente');
    }
    
    function updateTotal() {
        const inputs = document.querySelectorAll('.counter-input input');
        let total = 0;
        
        inputs.forEach(input => {
            total += parseInt(input.value) || 0;
        });
        
        const totalElement = document.getElementById('total-usuarias');
        if (totalElement) {
            totalElement.textContent = total;
            
            // Animación suave
            totalElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                totalElement.style.transform = '';
            }, 200);
        }
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounters);
    } else {
        initCounters();
    }
    
})();

// Función global para testing manual
window.testCounter = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const before = parseInt(input.value) || 0;
        input.value = before + 1;
        
        // Actualizar total
        const inputs = document.querySelectorAll('.counter-input input');
        let total = 0;
        inputs.forEach(inp => total += parseInt(inp.value) || 0);
        
        const totalElement = document.getElementById('total-usuarias');
        if (totalElement) totalElement.textContent = total;
        
        console.log(`Test manual: ${before} -> ${input.value}, Total: ${total}`);
    }
};