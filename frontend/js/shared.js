// ===== js/shared.js - FUNCIONES COMUNES Y API CALLS =====
const SGPF = {
    // Configuración base
    API_BASE: 'http://localhost:5000/api',
    
    // Estado global de la aplicación
    state: {
        currentUser: null,
        isAuthenticated: false,
        currentView: 'dashboard',
        loading: false
    },

    // ===== API CALLS =====
    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            console.log(`🌐 API Call: ${config.method || 'GET'} ${endpoint}`);
            const response = await fetch(`${this.API_BASE}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`❌ API Error en ${endpoint}:`, error);
            this.showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    },

    // ===== GESTIÓN DE USUARIO =====
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (!userData) return null;
            
            const user = JSON.parse(userData);
            console.log('👤 Usuario actual recuperado:', user);
            return user;
        } catch (error) {
            console.error('❌ Error parseando usuario:', error);
            localStorage.removeItem('currentUser');
            return null;
        }
    },

    setCurrentUser(user) {
        console.log('💾 Guardando usuario:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.state.currentUser = user;
        this.state.isAuthenticated = true;
    },

    // ===== GESTIÓN DE ROL =====
    getUserRole() {
        const user = this.getCurrentUser();
        if (!user) return null;
        
        // CRÍTICO: Evitar el error de estructura anidada
        const role = user.rol || user.user?.rol || null;
        console.log('🎭 Rol detectado:', role);
        return role;
    },

    // Mapeo robusto de roles (tolerante a variaciones)
    roleMapping: {
        'auxiliar_enfermeria': 'auxiliar',
        'auxiliar': 'auxiliar',
        'asistente_tecnico': 'asistente', 
        'asistente': 'asistente',
        'encargado_sr': 'encargado',
        'encargado': 'encargado',
        'coordinador_municipal': 'coordinador',
        'coordinador': 'coordinador',
        'admin': 'coordinador'
    },

    getNormalizedRole() {
        const rawRole = this.getUserRole();
        if (!rawRole) return null;
        
        const normalized = this.roleMapping[rawRole.toLowerCase()] || null;
        console.log(`🔄 Rol normalizado: ${rawRole} → ${normalized}`);
        return normalized;
    },

    // ===== LOGOUT =====
    async logout() {
        try {
            await this.apiCall('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.warn('⚠️ Error en logout API:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            this.state.currentUser = null;
            this.state.isAuthenticated = false;
            
            console.log('👋 Logout completado');
            window.location.href = 'login.html';
        }
    },

    // ===== UTILIDADES UI =====
    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
        this.state.loading = show;
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    },

    // ===== VALIDACIÓN DE AUTENTICACIÓN =====
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = this.getCurrentUser();
        return !!(token && user);
    },

    // ===== VERIFICAR TOKEN =====
    async verifyToken() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        try {
            const response = await this.apiCall('/auth/verify');
            return response.success;
        } catch (error) {
            console.warn('⚠️ Token inválido:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            return false;
        }
    }
};