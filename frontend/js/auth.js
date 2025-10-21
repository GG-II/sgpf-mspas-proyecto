// ===== js/auth.js - SISTEMA DE AUTENTICACIÓN EXPANDIDO =====

const AuthManager = {
    
    // ===== INICIALIZAR SISTEMA DE LOGIN =====
    initLogin() {
        console.log('🔐 Inicializando sistema de login');
        
        // Verificar si ya está logueado para evitar bucle infinito
        if (this.isAlreadyAuthenticated()) {
            console.log('👤 Usuario ya autenticado, redirigiendo al dashboard');
            window.location.href = 'index.html';
            return;
        }

        // Configurar eventos del formulario
        this.setupLoginForm();
        
        // Configurar usuarios de prueba clickeables
        this.setupTestUsers();
        
        // Configurar validación en tiempo real
        this.setupFormValidation();
        
        console.log('✅ Sistema de login inicializado');
    },

    // ===== VERIFICAR AUTENTICACIÓN EXISTENTE =====
    isAlreadyAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (!token || !user) {
            console.log('🔍 No hay token o usuario guardado');
            return false;
        }
        
        try {
            // Verificar que el usuario sea válido JSON
            const userData = JSON.parse(user);
            if (!userData.id || !userData.rol) {
                console.log('❌ Datos de usuario inválidos');
                this.clearAuthData();
                return false;
            }
            
            console.log('✅ Datos de autenticación válidos encontrados');
            return true;
            
        } catch (error) {
            console.error('❌ Error parseando datos de usuario:', error);
            this.clearAuthData();
            return false;
        }
    },

    // ===== CONFIGURAR FORMULARIO DE LOGIN =====
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        
        if (!loginForm) {
            console.error('❌ Formulario de login no encontrado');
            return;
        }

        loginForm.addEventListener('submit', this.handleLogin.bind(this));
        console.log('📝 Formulario de login configurado');
    },

    // ===== CONFIGURAR USUARIOS DE PRUEBA =====
    setupTestUsers() {
        const testUsers = document.querySelectorAll('.test-user');
        
        testUsers.forEach(userElement => {
            userElement.addEventListener('click', () => {
                const email = userElement.dataset.email;
                const password = userElement.dataset.password;
                
                if (email && password) {
                    this.fillLoginForm(email, password);
                    console.log(`👤 Usuario de prueba seleccionado: ${email}`);
                }
            });
        });
        
        console.log(`👥 ${testUsers.length} usuarios de prueba configurados`);
    },

    // ===== LLENAR FORMULARIO CON DATOS =====
    fillLoginForm(email, password) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput && passwordInput) {
            emailInput.value = email;
            passwordInput.value = password;
            
            // Enfocar el botón de submit para UX
            const submitBtn = document.getElementById('login-btn');
            if (submitBtn) {
                submitBtn.focus();
            }
        }
    },

    // ===== CONFIGURAR VALIDACIÓN EN TIEMPO REAL =====
    setupFormValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        // Validación de email
        if (emailInput) {
            emailInput.addEventListener('input', this.validateEmailInput.bind(this));
            emailInput.addEventListener('blur', this.validateEmailInput.bind(this));
        }
        
        // Validación de contraseña
        if (passwordInput) {
            passwordInput.addEventListener('input', this.validatePasswordInput.bind(this));
        }
        
        console.log('✅ Validación en tiempo real configurada');
    },

    // ===== VALIDAR EMAIL =====
    validateEmailInput(event) {
        const emailInput = event.target;
        const email = emailInput.value.trim();
        
        // Limpiar estilos previos
        emailInput.classList.remove('error', 'success');
        
        if (email && !this.isValidEmail(email)) {
            emailInput.classList.add('error');
        } else if (email) {
            emailInput.classList.add('success');
        }
    },

    // ===== VALIDAR CONTRASEÑA =====
    validatePasswordInput(event) {
        const passwordInput = event.target;
        const password = passwordInput.value;
        
        // Limpiar estilos previos
        passwordInput.classList.remove('error', 'success');
        
        if (password && password.length < 3) {
            passwordInput.classList.add('error');
        } else if (password) {
            passwordInput.classList.add('success');
        }
    },

    // ===== VALIDAR FORMATO DE EMAIL =====
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // ===== MANEJAR PROCESO DE LOGIN =====
    async handleLogin(event) {
        event.preventDefault();
        
        console.log('🔐 Iniciando proceso de login');
        
        // Obtener datos del formulario
        const formData = this.getFormData();
        if (!formData) return;
        
        // Configurar UI para loading
        this.setLoadingState(true);
        
        try {
            // Realizar login
            const response = await this.performLogin(formData.email, formData.password);
            
            if (response.success) {
                await this.handleLoginSuccess(response);
            } else {
                this.handleLoginError(response.message || 'Error de autenticación');
            }
            
        } catch (error) {
            console.error('❌ Error en proceso de login:', error);
            this.handleLoginError(error.message || 'Error de conexión');
        } finally {
            this.setLoadingState(false);
        }
    },

    // ===== OBTENER DATOS DEL FORMULARIO =====
    getFormData() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (!emailInput || !passwordInput) {
            console.error('❌ Campos del formulario no encontrados');
            return null;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validaciones básicas
        if (!email) {
            this.showError('El email es requerido');
            emailInput.focus();
            return null;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('El formato del email no es válido');
            emailInput.focus();
            return null;
        }
        
        if (!password) {
            this.showError('La contraseña es requerida');
            passwordInput.focus();
            return null;
        }
        
        if (password.length < 3) {
            this.showError('La contraseña debe tener al menos 3 caracteres');
            passwordInput.focus();
            return null;
        }
        
        return { email, password };
    },

    // ===== REALIZAR LLAMADA DE LOGIN AL BACKEND =====
    async performLogin(email, password) {
        console.log(`🌐 Enviando solicitud de login: ${email}`);
        
        const loginUrl = SGPFConfig.getEndpoint('/auth/login');
console.log('🌐 URL de login:', loginUrl);
const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        console.log('📡 Respuesta del servidor:', {
            status: response.status,
            success: data.success,
            hasUser: !!data.user,
            hasToken: !!data.token
        });
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }
        
        return data;
    },

    // ===== MANEJAR LOGIN EXITOSO =====
    async handleLoginSuccess(response) {
    console.log('✅ Login exitoso:', response.user);
    
    // Validar estructura de respuesta
    if (!response.user || !response.token) {
        throw new Error('Respuesta del servidor incompleta');
    }
    
    // Guardar datos de autenticación
    this.saveAuthData(response.user, response.token);
    
    // Mostrar mensaje de éxito brevemente
    this.showSuccess(`Bienvenido, ${response.user.nombres}`);
    
    // Log de evento de seguridad
    if (window.SGPFConfig) {
        window.SGPFConfig.logSecurityEvent('login_success', {
            user_email: response.user.email,
            user_role: response.user.rol
        });
    }
    
    // Pequeño delay para UX antes de redirigir
    setTimeout(() => {
        console.log('🏠 Redirigiendo al dashboard');
        window.location.href = 'index.html';
    }, 1000);
},

    // ===== GUARDAR DATOS DE AUTENTICACIÓN =====
    saveAuthData(user, token) {
        try {
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            console.log('💾 Datos de autenticación guardados:', {
                userId: user.id,
                userRole: user.rol,
                userName: `${user.nombres} ${user.apellidos}`
            });
            
        } catch (error) {
            console.error('❌ Error guardando datos de autenticación:', error);
            throw new Error('Error guardando datos de sesión');
        }
    },

    // ===== MANEJAR ERROR DE LOGIN =====
    handleLoginError(message) {
        console.error('❌ Error de login:', message);
        this.showError(message);
        
        // Enfocar el campo de contraseña para reintento
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.select();
            passwordInput.focus();
        }
    },

    // ===== CONFIGURAR ESTADO DE LOADING =====
    setLoadingState(isLoading) {
        const loginBtn = document.getElementById('login-btn');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (loginBtn) {
            loginBtn.disabled = isLoading;
            loginBtn.textContent = isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión';
        }
        
        if (emailInput) emailInput.disabled = isLoading;
        if (passwordInput) passwordInput.disabled = isLoading;
        
        // Cambiar cursor del body
        document.body.style.cursor = isLoading ? 'wait' : 'default';
    },

    // ===== MOSTRAR MENSAJE DE ERROR =====
    showError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
        
        console.error('🚨 Error mostrado al usuario:', message);
    },

    // ===== MOSTRAR MENSAJE DE ÉXITO =====
    showSuccess(message) {
        // Crear elemento de éxito temporal
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        // Insertar después del formulario
        const loginForm = document.getElementById('login-form');
        if (loginForm && loginForm.parentNode) {
            loginForm.parentNode.insertBefore(successDiv, loginForm.nextSibling);
            
            // Auto-remover después de 3 segundos
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }
        
        console.log('✅ Mensaje de éxito mostrado:', message);
    },

    // ===== LIMPIAR DATOS DE AUTENTICACIÓN =====
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.log('🧹 Datos de autenticación limpiados');
    },

    // ===== MÉTODO DE UTILIDAD PARA DEBUGGING =====
    debugAuthState() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        console.log('🔍 Estado de autenticación:', {
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            hasUser: !!user,
            userData: user ? JSON.parse(user) : null
        });
    }
};

// ===== CONFIGURACIÓN GLOBAL PARA DEBUGGING =====
// En desarrollo, exponer AuthManager globalmente para debugging
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.AuthManager = AuthManager;
    console.log('🔧 AuthManager expuesto globalmente para debugging');
}