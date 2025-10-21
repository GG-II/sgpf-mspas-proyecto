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
},

// ========================================
    // 🔒 CONFIGURACIÓN DE SEGURIDAD
    // ========================================

    /**
     * Sistema de seguridad multinivel
     * Configuración automática según ambiente
     */
    SECURITY: {
        /**
         * Timeout de sesión por inactividad
         */
        SESSION_TIMEOUT: {
            // Configuración según ambiente
            get enabled() {
                return true; // Siempre habilitado
            },
            
            // Tiempo de inactividad antes de cerrar sesión (minutos)
            get timeout_minutes() {
                return SGPFConfig.isDevelopment() ? 60 : 15;
            },
            
            // Segundos antes del timeout para mostrar advertencia
            get warning_seconds() {
                return SGPFConfig.isDevelopment() ? 120 : 60;
            },
            
            // Intervalo de verificación de actividad (segundos)
            check_interval: 30,
            
            // Sincronizar timeout entre pestañas
            sync_tabs: true,
            
            // Guardar borradores antes de cerrar
            save_drafts: true,
            
            // Eventos que cuentan como "actividad"
            activity_events: ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'],
            
            // Throttle para eventos repetitivos (ms)
            activity_throttle: 2000
        },

        /**
         * Detección de DevTools (Herramientas de Desarrollador)
         */
        DEV_TOOLS_DETECTION: {
            // Habilitado solo en producción
            get enabled() {
                return SGPFConfig.isProduction();
            },
            
            // Modo de acción: 'soft' (advertir) o 'strict' (cerrar sesión)
            mode: 'soft',
            
            // Registrar eventos en servidor
            log_to_server: true,
            
            // Mostrar advertencia visual al usuario
            show_warning: true,
            
            // Intervalo de verificación (ms)
            check_interval: 1000,
            
            // Métodos de detección a usar
            detection_methods: ['timing', 'window_size', 'console_props'],
            
            // Threshold para detección por timing (ms)
            timing_threshold: 100,
            
            // Threshold para detección por tamaño de ventana
            window_size_threshold: 160
        },

        /**
         * Manejo de cierre de pestaña
         */
        TAB_CLOSE: {
            enabled: true,
            
            // Periodo de gracia para reconectar sin relogin (minutos)
            get grace_period_minutes() {
                return SGPFConfig.isDevelopment() ? 30 : 5;
            },
            
            // Usar navigator.sendBeacon para logout confiable
            use_beacon: true,
            
            // Mostrar confirmación si hay datos sin guardar
            warn_unsaved_data: true,
            
            // Invalidar token inmediatamente al cerrar
            invalidate_immediately: false
        },

        /**
         * Rate Limiting (Frontend)
         */
        RATE_LIMIT: {
            enabled: true,
            
            // Máximo de requests por minuto
            max_requests_per_minute: 60,
            
            // Máximo de requests por hora
            max_requests_per_hour: 1000,
            
            // Mostrar advertencias al usuario
            show_warnings: true,
            
            // Bloquear temporalmente si se excede
            temporary_block: true,
            
            // Duración del bloqueo temporal (segundos)
            block_duration_seconds: 60
        },

        /**
         * Logging de eventos de seguridad
         */
        SECURITY_LOGGING: {
            enabled: true,
            
            // Tipos de eventos a registrar
            log_events: {
                login: true,
                logout: true,
                timeout: true,
                devtools_detected: true,
                tab_closed: true,
                token_renewed: true,
                failed_auth: true,
                rate_limit_exceeded: true
            },
            
            // Enviar logs al servidor
            send_to_server: true,
            
            // Mantener logs en localStorage (solo desarrollo)
            get local_storage() {
                return SGPFConfig.isDevelopment();
            },
            
            // Máximo de logs en localStorage
            max_local_logs: 100
        },

        /**
         * Renovación automática de token
         */
        TOKEN_RENEWAL: {
            enabled: true,
            
            // Renovar token cada X minutos de actividad
            renew_interval_minutes: 10,
            
            // Renovar automáticamente en background
            auto_renew: true,
            
            // Mostrar notificación al renovar
            show_notification: false
        },

        /**
         * Protección de datos sensibles
         */
        DATA_PROTECTION: {
            // Limpiar console.log en producción
            get clear_console() {
                return SGPFConfig.isProduction();
            },
            
            // Deshabilitar click derecho (NO RECOMENDADO - molesto)
            disable_right_click: false,
            
            // Deshabilitar selección de texto (NO RECOMENDADO)
            disable_text_selection: false,
            
            // Ofuscar datos sensibles en DOM
            obfuscate_sensitive_data: true,
            
            // Limpiar sessionStorage al cerrar sesión
            clear_session_storage: true,
            
            // Limpiar localStorage al cerrar sesión (excepto preferencias)
            clear_local_storage: true
        }
    },

    /**
     * Obtener configuración completa de seguridad según ambiente
     * @returns {object} Configuración de seguridad activa
     */
    getSecurityConfig() {
        const config = this.SECURITY;
        
        // Resolver getters dinámicos
        return {
            session: {
                enabled: config.SESSION_TIMEOUT.enabled,
                timeout_minutes: config.SESSION_TIMEOUT.timeout_minutes,
                warning_seconds: config.SESSION_TIMEOUT.warning_seconds,
                check_interval: config.SESSION_TIMEOUT.check_interval,
                sync_tabs: config.SESSION_TIMEOUT.sync_tabs
            },
            devtools: {
                enabled: config.DEV_TOOLS_DETECTION.enabled,
                mode: config.DEV_TOOLS_DETECTION.mode,
                log_to_server: config.DEV_TOOLS_DETECTION.log_to_server
            },
            tab_close: {
                enabled: config.TAB_CLOSE.enabled,
                grace_period_minutes: config.TAB_CLOSE.grace_period_minutes,
                use_beacon: config.TAB_CLOSE.use_beacon
            },
            logging: {
                enabled: config.SECURITY_LOGGING.enabled,
                local_storage: config.SECURITY_LOGGING.local_storage
            }
        };
    },

    /**
     * Verificar si una característica de seguridad está habilitada
     * @param {string} feature - Nombre de la característica
     * @returns {boolean}
     */
    isSecurityFeatureEnabled(feature) {
        const features = {
            'session_timeout': this.SECURITY.SESSION_TIMEOUT.enabled,
            'devtools_detection': this.SECURITY.DEV_TOOLS_DETECTION.enabled,
            'tab_close': this.SECURITY.TAB_CLOSE.enabled,
            'rate_limit': this.SECURITY.RATE_LIMIT.enabled,
            'security_logging': this.SECURITY.SECURITY_LOGGING.enabled,
            'token_renewal': this.SECURITY.TOKEN_RENEWAL.enabled
        };
        
        return features[feature] || false;
    },

    /**
     * Log de evento de seguridad
     * @param {string} eventType - Tipo de evento
     * @param {object} data - Datos adicionales
     */
    logSecurityEvent(eventType, data = {}) {
        if (!this.SECURITY.SECURITY_LOGGING.enabled) return;
        
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            user: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')).email : 'anonymous',
            environment: this.getEnvironment(),
            data: data
        };
        
        // Log en consola (solo desarrollo)
        if (this.isDevelopment()) {
            console.log(`🔒 Security Event [${eventType}]:`, event);
        }
        
        // Guardar en localStorage (solo desarrollo)
        if (this.SECURITY.SECURITY_LOGGING.local_storage) {
            const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
            logs.push(event);
            
            // Mantener solo los últimos N logs
            if (logs.length > this.SECURITY.SECURITY_LOGGING.max_local_logs) {
                logs.shift();
            }
            
            localStorage.setItem('security_logs', JSON.stringify(logs));
        }
        
        // Enviar al servidor (producción)
        if (this.SECURITY.SECURITY_LOGGING.send_to_server && this.isProduction()) {
            // Esto se implementará en el módulo security.js
            if (window.SecurityManager && window.SecurityManager.sendLogToServer) {
                window.SecurityManager.sendLogToServer(event);
            }
        }
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