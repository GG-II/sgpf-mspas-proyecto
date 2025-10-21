// ===== CONFIGURACIÓN CENTRALIZADA DEL SISTEMA =====
// Sistema de Gestión de Planificación Familiar - SGPF MSPAS
// Versión 2.0 - Preparado para desarrollo y producción

/**
 * 🔧 INSTRUCCIONES DE USO:
 * 
 * PARA DESARROLLO LOCAL:
 * - No cambies nada, funciona automáticamente con localhost
 * 
 * PARA PRODUCCIÓN (Hostinger):
 * 1. Cambia PRODUCTION_SUBDOMAIN con tu subdominio
 * 2. Si tu API está en diferente ubicación, ajusta PRODUCTION_API_PATH
 * 3. Guarda y sube a Hostinger
 * 4. ¡Listo! Todo se configura automáticamente
 * 
 * El sistema detecta automáticamente si estás en desarrollo o producción
 * y configura todas las URLs correctamente.
 */

const SGPFConfig = {
    // ========================================
    // 🎯 CONFIGURACIÓN PRINCIPAL
    // ========================================
    
    /**
     * ⚠️ CAMBIAR ESTO PARA PRODUCCIÓN
     * Tu subdominio en Hostinger (sin https://)
     */
    PRODUCTION_SUBDOMAIN: 'gerbert.hopitalbarillas.cloud',
    
    /**
     * Ruta de la API en producción
     * Por defecto: /api (mismo dominio)
     * Si tu backend está en otro puerto/ruta, cámbialo aquí
     */
    PRODUCTION_API_PATH: '/api',
    
    /**
     * Puerto del backend en desarrollo local
     */
    DEV_BACKEND_PORT: 5000,
    
    /**
     * Puerto del frontend en desarrollo local
     */
    DEV_FRONTEND_PORT: 3000,

    // ========================================
    // 🔍 DETECCIÓN AUTOMÁTICA DE ENTORNO
    // ========================================
    
    /**
     * Detecta si estamos en desarrollo o producción
     * @returns {string} 'development' o 'production'
     */
    getEnvironment() {
        const hostname = window.location.hostname;
        
        // Desarrollo: localhost o 127.0.0.1
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        // Producción: cualquier otro dominio
        return 'production';
    },

    /**
     * Verifica si estamos en desarrollo
     * @returns {boolean}
     */
    isDevelopment() {
        return this.getEnvironment() === 'development';
    },

    /**
     * Verifica si estamos en producción
     * @returns {boolean}
     */
    isProduction() {
        return this.getEnvironment() === 'production';
    },

    // ========================================
    // 🌐 URLS AUTOMÁTICAS
    // ========================================

    /**
     * Obtiene la URL base del frontend
     * @returns {string} URL completa del frontend
     */
    getFrontendUrl() {
        if (this.isDevelopment()) {
            return `http://localhost:${this.DEV_FRONTEND_PORT}`;
        }
        return `https://${this.PRODUCTION_SUBDOMAIN}`;
    },

    /**
     * Obtiene la URL base de la API
     * @returns {string} URL completa de la API
     */
    getApiUrl() {
        if (this.isDevelopment()) {
            return `http://localhost:${this.DEV_BACKEND_PORT}/api`;
        }
        return `https://${this.PRODUCTION_SUBDOMAIN}${this.PRODUCTION_API_PATH}`;
    },

    /**
     * Obtiene la URL completa para un endpoint específico
     * @param {string} endpoint - Ruta del endpoint (ej: '/auth/login')
     * @returns {string} URL completa del endpoint
     */
    getEndpoint(endpoint) {
        // Asegurar que el endpoint empiece con /
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.getApiUrl()}${normalizedEndpoint}`;
    },

    // ========================================
    // 📊 INFORMACIÓN DEL SISTEMA
    // ========================================

    /**
     * Información del sistema para debugging
     * @returns {object} Objeto con información de configuración
     */
    getSystemInfo() {
        return {
            environment: this.getEnvironment(),
            frontend_url: this.getFrontendUrl(),
            api_url: this.getApiUrl(),
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            is_development: this.isDevelopment(),
            is_production: this.isProduction(),
            version: '2.0.0'
        };
    },

    /**
     * Muestra información de configuración en consola
     * Útil para debugging
     */
    logConfig() {
        const info = this.getSystemInfo();
        console.log('🔧 SGPF Configuration:');
        console.log(`   Environment: ${info.environment}`);
        console.log(`   Frontend: ${info.frontend_url}`);
        console.log(`   API: ${info.api_url}`);
        
        if (this.isDevelopment()) {
            console.log('   ⚠️ Modo desarrollo activo');
        } else {
            console.log('   ✅ Modo producción');
        }
    },

    // ========================================
    // ⚙️ CONFIGURACIONES ADICIONALES
    // ========================================

    /**
     * Configuración de timeout de sesión (en milisegundos)
     */
    SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutos
    
    /**
     * Tiempo de advertencia antes de timeout (en milisegundos)
     */
    SESSION_WARNING_TIME: 14 * 60 * 1000, // 14 minutos (1 min antes)

    /**
     * Intervalo de renovación automática de token (en milisegundos)
     */
    TOKEN_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos

    /**
     * Número máximo de reintentos para llamadas API fallidas
     */
    MAX_API_RETRIES: 3,

    /**
     * Tiempo de espera para llamadas API (en milisegundos)
     */
    API_TIMEOUT: 30000, // 30 segundos

    /**
     * Configuración de paginación por defecto
     */
    DEFAULT_PAGE_SIZE: 20,
    
    /**
     * Tamaños de página disponibles
     */
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],

    // ========================================
    // 🎨 CONFIGURACIÓN DE UI
    // ========================================

    /**
     * Duración de notificaciones toast (en milisegundos)
     */
    TOAST_DURATION: 3000,

    /**
     * Colores de estado para % alcanzado
     */
    STATUS_COLORS: {
        danger: '#ef4444',    // < 50%
        warning: '#f59e0b',   // 50-80%
        success: '#10b981',   // 80-110%
        excellent: '#3b82f6'  // > 110%
    },

    /**
     * Obtiene el color según el porcentaje alcanzado
     * @param {number} porcentaje - Porcentaje alcanzado
     * @returns {string} Código de color hex
     */
    getStatusColor(porcentaje) {
        if (porcentaje < 50) return this.STATUS_COLORS.danger;
        if (porcentaje < 80) return this.STATUS_COLORS.warning;
        if (porcentaje <= 110) return this.STATUS_COLORS.success;
        return this.STATUS_COLORS.excellent;
    },

    /**
     * Obtiene el label de estado según porcentaje
     * @param {number} porcentaje - Porcentaje alcanzado
     * @returns {string} Label descriptivo
     */
    getStatusLabel(porcentaje) {
        if (porcentaje < 50) return 'Bajo';
        if (porcentaje < 80) return 'Regular';
        if (porcentaje <= 110) return 'Óptimo';
        return 'Excelente';
    },

    // ========================================
    // 📅 CONFIGURACIÓN DE FECHAS
    // ========================================

    /**
     * Año actual del sistema
     */
    CURRENT_YEAR: new Date().getFullYear(),

    /**
     * Mes actual (1-12)
     */
    CURRENT_MONTH: new Date().getMonth() + 1,

    /**
     * Obtiene fecha actual en formato ISO (YYYY-MM-DD)
     * @returns {string} Fecha en formato ISO
     */
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Formatea una fecha para display
     * @param {string} dateString - Fecha en formato ISO
     * @returns {string} Fecha formateada (DD/MM/YYYY)
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Obtiene nombre del mes
     * @param {number} mes - Número de mes (1-12)
     * @returns {string} Nombre del mes
     */
    getMonthName(mes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[mes - 1] || '';
    },

    // ========================================
    // 🔐 CONFIGURACIÓN DE SEGURIDAD
    // ========================================

    /**
     * Nombre de la clave para el token en localStorage
     */
    TOKEN_KEY: 'authToken',

    /**
     * Nombre de la clave para datos del usuario en localStorage
     */
    USER_KEY: 'currentUser',

    /**
     * Headers por defecto para llamadas API
     * @returns {object} Headers object
     */
    getDefaultHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem(this.TOKEN_KEY);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    },

    // ========================================
    // 🚀 INICIALIZACIÓN
    // ========================================

    /**
     * Inicializa la configuración y muestra info en consola
     * Llamar esto al cargar la aplicación
     */
    init() {
        // Mostrar configuración en consola (solo en desarrollo)
        if (this.isDevelopment()) {
            this.logConfig();
        }

        // Verificar que las variables críticas estén configuradas
        if (this.isProduction() && this.PRODUCTION_SUBDOMAIN === 'gerbert.hopitalbarillas.cloud') {
            console.warn('⚠️ ADVERTENCIA: Usando subdominio por defecto. Actualiza PRODUCTION_SUBDOMAIN en config.js');
        }

        // Agregar event listener para errores de red
        window.addEventListener('online', () => {
            console.log('✅ Conexión restaurada');
        });

        window.addEventListener('offline', () => {
            console.warn('⚠️ Sin conexión a internet');
        });

        return this;
    },
    // ========================================
// 🔄 CACHE BUSTING SYSTEM
// ========================================

/**
 * Versión del sistema para cache busting
 */
VERSION: '2.1.0',

/**
 * Timestamp para desarrollo (invalida caché en cada recarga)
 */
CACHE_BUST: new Date().getTime(),

/**
 * Obtiene el parámetro de versión según el ambiente
 * @returns {string} Versión o timestamp
 */
getCacheBuster() {
    return this.isDevelopment() ? this.CACHE_BUST : this.VERSION;
},

/**
 * Agrega cache busting a una URL de script
 * @param {string} scriptPath - Ruta del script
 * @returns {string} URL con parámetro de versión
 */
getVersionedScript(scriptPath) {
    const separator = scriptPath.includes('?') ? '&' : '?';
    return `${scriptPath}${separator}v=${this.getCacheBuster()}`;
}
};

// ========================================
// 🔧 AUTO-INICIALIZACIÓN
// ========================================

// Inicializar automáticamente cuando se carga el script
if (typeof window !== 'undefined') {
    // Hacer disponible globalmente
    window.SGPFConfig = SGPFConfig;
    
    // Inicializar
    SGPFConfig.init();
    
    // Mensaje de bienvenida (solo en desarrollo)
    if (SGPFConfig.isDevelopment()) {
        console.log('%c🏥 SGPF-MSPAS v2.0 ', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');
        console.log('Sistema de Gestión de Planificación Familiar');
        console.log('Ministerio de Salud - Huehuetenango, Guatemala');
    }
}

// Exportar para uso en módulos (si aplica)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SGPFConfig;
}