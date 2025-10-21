// ===== CONFIGURACIÓN CENTRALIZADA DEL SISTEMA =====
// Sistema de Gestión de Planificación Familiar - SGPF MSPAS
// Versión 2.0.1 - Con soporte para red local

const SGPFConfig = {
    // ========================================
    // 🎯 CONFIGURACIÓN PRINCIPAL
    // ========================================
    
    PRODUCTION_SUBDOMAIN: 'gerbert.hopitalbarillas.cloud',
    PRODUCTION_API_PATH: '/api',
    DEV_BACKEND_PORT: 5000,
    DEV_FRONTEND_PORT: 3000,

    // ========================================
    // 🔍 DETECCIÓN AUTOMÁTICA DE ENTORNO
    // ========================================
    
    getEnvironment() {
        const hostname = window.location.hostname;
        
        // Desarrollo: localhost, 127.0.0.1 o IPs de red local
        if (
            hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')
        ) {
            return 'development';
        }
        
        return 'production';
    },

    isDevelopment() {
        return this.getEnvironment() === 'development';
    },

    isProduction() {
        return this.getEnvironment() === 'production';
    },

    isNetworkAccess() {
        const hostname = window.location.hostname;
        return (
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')
        );
    },

    // ========================================
    // 🌐 URLS AUTOMÁTICAS
    // ========================================

    getFrontendUrl() {
        if (this.isDevelopment()) {
            const hostname = window.location.hostname;
            return `http://${hostname}:${this.DEV_FRONTEND_PORT}`;
        }
        return `https://${this.PRODUCTION_SUBDOMAIN}`;
    },

    getApiUrl() {
        if (this.isDevelopment()) {
            const hostname = window.location.hostname;
            
            // Si es localhost/127.0.0.1, usar IP del servidor
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                // ⚠️ CAMBIAR ESTA IP A LA DE TU SERVIDOR
                return `http://192.168.1.11:${this.DEV_BACKEND_PORT}/api`;
            }
            
            // Si es IP de red, usarla directamente
            return `http://${hostname}:${this.DEV_BACKEND_PORT}/api`;
        }
        return `https://${this.PRODUCTION_SUBDOMAIN}${this.PRODUCTION_API_PATH}`;
    },

    getEndpoint(endpoint) {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.getApiUrl()}${normalizedEndpoint}`;
    },

    // ========================================
    // 📊 INFORMACIÓN DEL SISTEMA
    // ========================================

    getSystemInfo() {
        return {
            environment: this.getEnvironment(),
            frontend_url: this.getFrontendUrl(),
            api_url: this.getApiUrl(),
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            is_development: this.isDevelopment(),
            is_production: this.isProduction(),
            is_network_access: this.isNetworkAccess(),
            version: '2.0.1'
        };
    },

    logConfig() {
        const info = this.getSystemInfo();
        console.log('🔧 SGPF Configuration:');
        console.log(`   Environment: ${info.environment}`);
        console.log(`   Hostname: ${info.hostname}`);
        console.log(`   Frontend: ${info.frontend_url}`);
        console.log(`   API: ${info.api_url}`);
        
        if (this.isNetworkAccess()) {
            console.log('   📱 Acceso desde red local detectado');
        } else if (this.isDevelopment()) {
            console.log('   💻 Acceso desde localhost');
        } else {
            console.log('   ✅ Modo producción');
        }
    },

    // ========================================
    // ⚙️ CONFIGURACIONES ADICIONALES
    // ========================================

    SESSION_TIMEOUT: 15 * 60 * 1000,
    WARNING_TIMEOUT: 14 * 60 * 1000,
    TOAST_DURATION: 3000,
    MAX_LOGIN_ATTEMPTS: 3,

    // ========================================
    // 🎨 UTILIDADES DE FORMATEO
    // ========================================

    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    formatDateForAPI(date) {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getStatusColor(percentage) {
        if (percentage >= 70) return 'success';
        if (percentage >= 50) return 'warning';
        return 'danger';
    },

    formatNumber(number) {
        return new Intl.NumberFormat('es-GT').format(number);
    },

    formatPercentage(value, total) {
        if (!total || total === 0) return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(1)}%`;
    },

    // ========================================
    // 🔐 CONFIGURACIÓN DE SEGURIDAD
    // ========================================

    TOKEN_KEY: 'authToken',
    USER_KEY: 'currentUser',

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

    init() {
        if (this.isDevelopment()) {
            this.logConfig();
        }

        if (this.isProduction() && this.PRODUCTION_SUBDOMAIN === 'gerbert.hopitalbarillas.cloud') {
            console.warn('⚠️ ADVERTENCIA: Usando subdominio por defecto.');
        }

        window.addEventListener('online', () => {
            console.log('✅ Conexión restaurada');
        });

        window.addEventListener('offline', () => {
            console.warn('⚠️ Sin conexión a internet');
        });

        return this;
    },

    // ========================================
    // 🔒 LOGGING DE SEGURIDAD
    // ========================================
    
    logSecurityEvent(eventType, data = {}) {
        if (!this.isDevelopment()) return; // Solo en desarrollo por ahora
        
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        console.log(`🔒 Security Event [${eventType}]:`, event);
    },

    // ========================================
    // 📄 CACHE BUSTING
    // ========================================
    
    VERSION: '2.1.0',
    CACHE_BUST: new Date().getTime(),

    getCacheBuster() {
        return this.isDevelopment() ? this.CACHE_BUST : this.VERSION;
    },

    getVersionedScript(scriptPath) {
        const separator = scriptPath.includes('?') ? '&' : '?';
        return `${scriptPath}${separator}v=${this.getCacheBuster()}`;
    }
};
// ========================================
// 🔧 AUTO-INICIALIZACIÓN
// ========================================

if (typeof window !== 'undefined') {
    window.SGPFConfig = SGPFConfig;
    SGPFConfig.init();
    
    if (SGPFConfig.isDevelopment()) {
        console.log('%c🏥 SGPF-MSPAS v2.0 ', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');
        console.log('Sistema de Gestión de Planificación Familiar');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SGPFConfig;
}

