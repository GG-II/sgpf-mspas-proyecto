// ===== js/component-loader.js - SISTEMA DE CARGA DINÁMICA =====
const ComponentLoader = {
    
    // ===== CARGAR TEMPLATE =====
    async loadTemplate(templatePath) {
        try {
            console.log(`📂 Cargando template: ${templatePath}`);
            
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`Template not found: ${templatePath}`);
            }
            
            const html = await response.text();
            console.log(`✅ Template cargado: ${templatePath}`);
            return html;
            
        } catch (error) {
            console.error(`❌ Error cargando template ${templatePath}:`, error);
            return `<div class="error">Error cargando template: ${templatePath}</div>`;
        }
    },

    // ===== INSERTAR EN CONTENEDOR =====
    async insertTemplate(containerId, templatePath, data = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Contenedor no encontrado: ${containerId}`);
            return false;
        }

        SGPF.showLoading(true);
        
        try {
            let html = await this.loadTemplate(templatePath);
            
            // Reemplazar variables si se proporcionan datos
            if (Object.keys(data).length > 0) {
                html = this.replaceVariables(html, data);
            }
            
            container.innerHTML = html;
            
            // Ejecutar scripts del template si existen
            this.executeTemplateScripts(container);
            
            console.log(`✅ Template insertado en ${containerId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error insertando template:`, error);
            container.innerHTML = `<div class="error">Error cargando contenido</div>`;
            return false;
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== REEMPLAZAR VARIABLES EN TEMPLATES =====
    replaceVariables(html, data) {
        return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });
    },

    // ===== EJECUTAR SCRIPTS DE TEMPLATES =====
    executeTemplateScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            try {
                // Crear nuevo script para ejecutar
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.head.appendChild(newScript);
                document.head.removeChild(newScript);
            } catch (error) {
                console.error('❌ Error ejecutando script del template:', error);
            }
        });
    },

    // ===== NAVEGAR ENTRE VISTAS =====
    async navigateToView(viewName, data = {}) {
        console.log(`🧭 Navegando a vista: ${viewName}`);
        
        const role = SGPF.getNormalizedRole();
        if (!role) {
            console.error('❌ No se puede navegar sin rol de usuario');
            return false;
        }

        let templatePath;
        
        // Mapear vistas a templates según el rol
        switch (viewName) {
            case 'dashboard':
                templatePath = `templates/dashboard/${role}.html`;
                break;
            case 'registro':
                templatePath = 'templates/registro/formulario.html';
                break;
            case 'validacion':
                templatePath = 'templates/validacion/pendientes.html';
                break;
            case 'reportes':
                templatePath = 'templates/reportes/mensual.html';
                break;
            case 'perfil':
                templatePath = 'templates/perfil/usuario.html';
                break;
            default:
                console.error(`❌ Vista no reconocida: ${viewName}`);
                return false;
        }

        const success = await this.insertTemplate('main-content', templatePath, data);
        
        if (success) {
            SGPF.state.currentView = viewName;
            // Actualizar navegación activa
            this.updateActiveNavigation(viewName);
        }
        
        return success;
    },

    // ===== ACTUALIZAR NAVEGACIÓN ACTIVA =====
    updateActiveNavigation(activeView) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const isActive = item.dataset.view === activeView;
            item.classList.toggle('active', isActive);
        });
    }
};
