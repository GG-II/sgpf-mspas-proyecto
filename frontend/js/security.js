// ===== js/security.js - SISTEMA DE SEGURIDAD MULTINIVEL =====
// SGPF MSPAS - Sistema de Gestión de Planificación Familiar
// Módulo de seguridad con timeout de sesión, detección de DevTools y manejo de cierre de pestaña

const SecurityManager = {
  // ===== ESTADO DEL SISTEMA =====
  state: {
    lastActivity: Date.now(),
    sessionActive: false,
    devToolsOpen: false,
    warningShown: false,
    timeoutTimer: null,
    warningTimer: null,
    checkInterval: null,
    activityListeners: [],
    tabId: null,
    isInitialized: false,
  },

  // ===== INICIALIZACIÓN =====
  async init() {
    if (this.state.isInitialized) {
      console.log("🔒 SecurityManager ya inicializado");
      return;
    }

    console.log("🔒 Inicializando SecurityManager...");

    try {
      // Generar ID único para esta pestaña
      this.state.tabId = this.generateTabId();

      // Verificar que el usuario esté autenticado
      if (!this.isUserAuthenticated()) {
        console.log(
          "⚠️ Usuario no autenticado, SecurityManager no se iniciará"
        );
        return;
      }

      // Marcar sesión como activa
      this.state.sessionActive = true;
      this.state.lastActivity = Date.now();

      // Inicializar componentes según configuración
      if (SGPFConfig.isSecurityFeatureEnabled("session_timeout")) {
        this.initSessionTimeout();
      }

      if (SGPFConfig.isSecurityFeatureEnabled("devtools_detection")) {
        this.initDevToolsDetection();
      }

      if (SGPFConfig.isSecurityFeatureEnabled("tab_close")) {
        this.initTabCloseHandler();
      }

      // Inicializar sincronización entre pestañas
      this.initTabSync();

      // Inicializar renovación automática de token
      if (SGPFConfig.isSecurityFeatureEnabled("token_renewal")) {
        this.initTokenRenewal();
      }

      this.state.isInitialized = true;
      console.log("✅ SecurityManager inicializado correctamente");

      // Log de evento
      SGPFConfig.logSecurityEvent("security_manager_initialized", {
        tabId: this.state.tabId,
        features: {
          session_timeout:
            SGPFConfig.isSecurityFeatureEnabled("session_timeout"),
          devtools: SGPFConfig.isSecurityFeatureEnabled("devtools_detection"),
          tab_close: SGPFConfig.isSecurityFeatureEnabled("tab_close"),
        },
      });
    } catch (error) {
      console.error("❌ Error inicializando SecurityManager:", error);
    }
  },

  // ===== VERIFICAR AUTENTICACIÓN =====
  isUserAuthenticated() {
    const token = localStorage.getItem(SGPFConfig.TOKEN_KEY);
    const user = localStorage.getItem(SGPFConfig.USER_KEY);
    return !!(token && user);
  },

  // ===== GENERAR ID ÚNICO DE PESTAÑA =====
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // ===== SISTEMA DE TIMEOUT DE SESIÓN =====
  initSessionTimeout() {
    console.log("⏱️ Inicializando sistema de timeout de sesión");

    const config = SGPFConfig.SECURITY.SESSION_TIMEOUT;

    // Resetear actividad inicial
    this.resetActivity();

    // Configurar listeners de actividad
    this.setupActivityListeners();

    // Iniciar verificación periódica
    this.startTimeoutCheck();

    console.log(
      `✅ Timeout configurado: ${config.timeout_minutes} min (advertencia: ${config.warning_seconds}s antes)`
    );
  },

  // ===== CONFIGURAR LISTENERS DE ACTIVIDAD =====
  setupActivityListeners() {
    const config = SGPFConfig.SECURITY.SESSION_TIMEOUT;
    const events = config.activity_events;

    // Throttle para eventos repetitivos
    const throttledReset = this.throttle(() => {
      this.resetActivity();
    }, config.activity_throttle);

    // Agregar listeners
    events.forEach((eventType) => {
      const handler =
        eventType === "mousemove" || eventType === "scroll"
          ? throttledReset
          : () => this.resetActivity();

      window.addEventListener(eventType, handler, { passive: true });
      this.state.activityListeners.push({ eventType, handler });
    });

    console.log(`👂 ${events.length} listeners de actividad configurados`);
  },

  // ===== THROTTLE HELPER =====
  throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    };
  },

  // ===== RESETEAR ACTIVIDAD =====
  resetActivity() {
    const previousActivity = this.state.lastActivity;
    this.state.lastActivity = Date.now();

    // Si había advertencia mostrada, ocultarla
    if (this.state.warningShown) {
      this.hideTimeoutWarning();
    }

    // Sincronizar con otras pestañas
    this.syncActivityToTabs();

    // Log solo si pasó más de 1 minuto desde última actividad
    if (Date.now() - previousActivity > 60000) {
      console.log("🔄 Actividad detectada, sesión renovada");
    }
  },

  // ===== INICIAR VERIFICACIÓN DE TIMEOUT =====
  startTimeoutCheck() {
    const config = SGPFConfig.SECURITY.SESSION_TIMEOUT;
    const checkIntervalMs = config.check_interval * 1000;

    this.state.checkInterval = setInterval(() => {
      this.checkSessionTimeout();
    }, checkIntervalMs);

    console.log(`⏰ Verificación de timeout cada ${config.check_interval}s`);
  },

  // ===== VERIFICAR TIMEOUT DE SESIÓN =====
  checkSessionTimeout() {
    if (!this.state.sessionActive) return;

    const config = SGPFConfig.SECURITY.SESSION_TIMEOUT;
    const now = Date.now();
    const inactiveTime = now - this.state.lastActivity;

    const timeoutMs = config.timeout_minutes * 60 * 1000;
    const warningMs = timeoutMs - config.warning_seconds * 1000;

    // Mostrar advertencia
    if (inactiveTime >= warningMs && !this.state.warningShown) {
      this.showTimeoutWarning();
    }

    // Cerrar sesión por timeout
    if (inactiveTime >= timeoutMs) {
      this.handleSessionTimeout();
    }
  },

  // ===== MOSTRAR ADVERTENCIA DE TIMEOUT =====
  showTimeoutWarning() {
    console.warn("⚠️ Mostrando advertencia de timeout");

    this.state.warningShown = true;

    // Crear modal de advertencia
    this.createTimeoutWarningModal();

    // Iniciar contador regresivo
    this.startWarningCountdown();

    // Log de evento
    SGPFConfig.logSecurityEvent("timeout_warning_shown", {
      tabId: this.state.tabId,
    });
  },

  // ===== CREAR MODAL DE ADVERTENCIA =====
  createTimeoutWarningModal() {
    // Verificar si ya existe
    if (document.getElementById("timeout-warning-modal")) {
      document
        .getElementById("timeout-warning-modal")
        .classList.remove("hidden");
      return;
    }

    const config = SGPFConfig.SECURITY.SESSION_TIMEOUT;
    const remainingSeconds = config.warning_seconds;

    const modalHTML = `
            <div id="timeout-warning-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);">
                <div class="modal-content" style="max-width: 450px; position: relative; z-index: 100000; background: white; border-radius: 0.75rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
                    <div class="p-6">
                        <!-- Icono de advertencia -->
                        <div class="flex justify-center mb-4">
                            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Título -->
                        <h3 class="text-xl font-bold text-center text-gray-900 mb-2">
                            Sesión por Expirar
                        </h3>

                        <!-- Mensaje -->
                        <p class="text-center text-gray-600 mb-4">
                            Tu sesión se cerrará por inactividad en:
                        </p>

                        <!-- Contador -->
                        <div class="text-center mb-6">
                            <div id="timeout-countdown" class="text-5xl font-bold text-orange-600">
                                ${remainingSeconds}
                            </div>
                            <div class="text-sm text-gray-500 mt-2">segundos</div>
                        </div>

                        <!-- Botones -->
                        <div class="flex gap-3">
                            <button 
                                onclick="window.SecurityManager.extendSession(); return false;"
                                class="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                            >
                                Mantener Sesión Activa
                            </button>
                            <button 
                                onclick="window.SecurityManager.handleSessionTimeout(); return false;"
                                class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Event listeners con delay para asegurar que el DOM esté listo
    setTimeout(() => {
      const extendBtn = document.getElementById("extend-session-btn");
      const logoutBtn = document.getElementById("logout-now-btn");

      if (extendBtn) {
        console.log("✅ Botón extender sesión encontrado, agregando listener");
        extendBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("🔘 Clic en extender sesión detectado");
          console.log("🔍 this:", this);
          console.log("🔍 SecurityManager:", SecurityManager);
          SecurityManager.extendSession();
        });
      } else {
        console.error("❌ Botón extender sesión NO encontrado");
      }

      if (logoutBtn) {
        console.log("✅ Botón logout encontrado, agregando listener");
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("🔘 Clic en logout detectado");
          SecurityManager.handleSessionTimeout();
        });
      } else {
        console.error("❌ Botón logout NO encontrado");
      }
    }, 100);
  },

  // ===== INICIAR CONTADOR REGRESIVO =====
  startWarningCountdown() {
    const config = SGPFConfig.SECURITY.SESSION_TIMEOUT;
    let remainingSeconds = config.warning_seconds;

    const countdownElement = document.getElementById("timeout-countdown");
    if (!countdownElement) return;

    this.state.warningTimer = setInterval(() => {
      remainingSeconds--;
      countdownElement.textContent = remainingSeconds;

      if (remainingSeconds <= 0) {
        clearInterval(this.state.warningTimer);
      }
    }, 1000);
  },

  // ===== OCULTAR ADVERTENCIA =====
  hideTimeoutWarning() {
    this.state.warningShown = false;

    const modal = document.getElementById("timeout-warning-modal");
    if (modal) {
      modal.classList.add("hidden");
    }

    if (this.state.warningTimer) {
      clearInterval(this.state.warningTimer);
      this.state.warningTimer = null;
    }
  },

  // ===== EXTENDER SESIÓN =====
  async extendSession() {
    console.log("🔄 Usuario solicitó extender sesión");

    try {
      // Resetear actividad
      this.resetActivity();

      // Ocultar advertencia
      this.hideTimeoutWarning();

      // Renovar token en el backend
      if (window.SGPF && typeof window.SGPF.renewToken === "function") {
        await window.SGPF.renewToken();
      }

      // Mostrar confirmación
      if (window.SGPF && typeof window.SGPF.showToast === "function") {
        window.SGPF.showToast("Sesión extendida correctamente", "success");
      }

      // Log de evento
      SGPFConfig.logSecurityEvent("session_extended", {
        tabId: this.state.tabId,
      });
    } catch (error) {
      console.error("❌ Error extendiendo sesión:", error);
    }
  },

  // ===== MANEJAR TIMEOUT DE SESIÓN =====
  async handleSessionTimeout() {
    console.warn("⏱️ Sesión expirada por inactividad");

    this.state.sessionActive = false;

    // Limpiar timers
    this.cleanup();

    // Log de evento
    SGPFConfig.logSecurityEvent("session_timeout", {
      tabId: this.state.tabId,
      inactive_minutes: SGPFConfig.SECURITY.SESSION_TIMEOUT.timeout_minutes,
    });

    // Mostrar mensaje
    if (window.SGPF && typeof window.SGPF.showToast === "function") {
      window.SGPF.showToast("Sesión cerrada por inactividad", "warning");
    }

    // Pequeño delay para que se vea el mensaje
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Cerrar sesión
    if (window.SGPF && typeof window.SGPF.logout === "function") {
      window.SGPF.logout();
    } else {
      // Fallback: limpiar y redirigir
      localStorage.clear();
      window.location.href = "login.html";
    }
  },

  // ===== SINCRONIZACIÓN ENTRE PESTAÑAS =====
  initTabSync() {
    if (!SGPFConfig.SECURITY.SESSION_TIMEOUT.sync_tabs) return;

    window.addEventListener("storage", (e) => {
      if (e.key === "last_activity") {
        const newActivity = parseInt(e.newValue);
        if (newActivity > this.state.lastActivity) {
          this.state.lastActivity = newActivity;
          console.log("🔄 Actividad sincronizada desde otra pestaña");

          // Si había advertencia, ocultarla
          if (this.state.warningShown) {
            this.hideTimeoutWarning();
          }
        }
      }
    });

    console.log("🔗 Sincronización entre pestañas habilitada");
  },

  syncActivityToTabs() {
    if (SGPFConfig.SECURITY.SESSION_TIMEOUT.sync_tabs) {
      localStorage.setItem("last_activity", this.state.lastActivity.toString());
    }
  },

  // ===== DETECCIÓN DE DEVTOOLS =====
  initDevToolsDetection() {
    console.log("🔍 Inicializando detección de DevTools");

    const config = SGPFConfig.SECURITY.DEV_TOOLS_DETECTION;

    setInterval(() => {
      const isOpen = this.detectDevTools();

      if (isOpen && !this.state.devToolsOpen) {
        this.handleDevToolsOpened();
      } else if (!isOpen && this.state.devToolsOpen) {
        this.handleDevToolsClosed();
      }
    }, config.check_interval);
  },

  detectDevTools() {
    const config = SGPFConfig.SECURITY.DEV_TOOLS_DETECTION;
    const methods = config.detection_methods;

    let detected = false;

    // Método 1: Timing
    if (methods.includes("timing")) {
      const start = performance.now();
      debugger; // Se pausa si DevTools está abierto
      const elapsed = performance.now() - start;

      if (elapsed > config.timing_threshold) {
        detected = true;
      }
    }

    // Método 2: Tamaño de ventana
    if (methods.includes("window_size") && !detected) {
      const widthThreshold =
        window.outerWidth - window.innerWidth > config.window_size_threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > config.window_size_threshold;

      if (widthThreshold || heightThreshold) {
        detected = true;
      }
    }

    return detected;
  },

  handleDevToolsOpened() {
    console.warn("🔓 DevTools detectado abierto");
    this.state.devToolsOpen = true;

    const config = SGPFConfig.SECURITY.DEV_TOOLS_DETECTION;

    // Log de evento
    SGPFConfig.logSecurityEvent("devtools_opened", {
      tabId: this.state.tabId,
      mode: config.mode,
    });

    // Mostrar advertencia
    if (config.show_warning) {
      if (window.SGPF && typeof window.SGPF.showToast === "function") {
        window.SGPF.showToast(
          "Herramientas de desarrollador detectadas - Sesión monitoreada",
          "warning"
        );
      }
    }

    // Modo strict: cerrar sesión
    if (config.mode === "strict") {
      console.warn("⚠️ Modo strict: cerrando sesión");
      setTimeout(() => {
        if (window.SGPF && typeof window.SGPF.logout === "function") {
          window.SGPF.logout();
        }
      }, 3000);
    }
  },

  handleDevToolsClosed() {
    console.log("✅ DevTools cerrado");
    this.state.devToolsOpen = false;

    SGPFConfig.logSecurityEvent("devtools_closed", {
      tabId: this.state.tabId,
    });
  },

  // ===== MANEJO DE CIERRE DE PESTAÑA =====
  initTabCloseHandler() {
    console.log("🚪 Inicializando manejo de cierre de pestaña");

    const config = SGPFConfig.SECURITY.TAB_CLOSE;

    window.addEventListener("beforeunload", (e) => {
      // Verificar si hay datos sin guardar
      const hasUnsavedData = this.checkUnsavedData();

      if (hasUnsavedData && config.warn_unsaved_data) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }

      // Enviar beacon para notificar cierre
      if (config.use_beacon && this.isUserAuthenticated()) {
        this.sendCloseBeacon();
      }
    });

    console.log("✅ Handler de cierre de pestaña configurado");
  },

  checkUnsavedData() {
    // Verificar si hay formularios con datos sin guardar
    const forms = document.querySelectorAll('form[data-has-changes="true"]');
    return forms.length > 0;
  },

  sendCloseBeacon() {
    const token = localStorage.getItem(SGPFConfig.TOKEN_KEY);
    if (!token) return;

    const endpoint = SGPFConfig.getEndpoint('/auth/tab-closed');
    const data = {
        token: token,
        tabId: this.state.tabId,
        timestamp: new Date().toISOString()
    };

    // Usar Blob con tipo correcto para sendBeacon
    const blob = new Blob([JSON.stringify(data)], {
        type: 'application/json'
    });

    const sent = navigator.sendBeacon(endpoint, blob);
    
    if (sent) {
        console.log('📡 Beacon enviado: pestaña cerrada');
        console.log('📦 Datos:', data);
    }
},

  // ===== RENOVACIÓN AUTOMÁTICA DE TOKEN =====
  initTokenRenewal() {
    const config = SGPFConfig.SECURITY.TOKEN_RENEWAL;

    if (!config.auto_renew) return;

    const intervalMs = config.renew_interval_minutes * 60 * 1000;

    setInterval(async () => {
      if (this.state.sessionActive && this.isUserAuthenticated()) {
        await this.renewToken();
      }
    }, intervalMs);

    console.log(
      `🔄 Renovación automática cada ${config.renew_interval_minutes} min`
    );
  },

  async renewToken() {
    try {
      if (window.SGPF && typeof window.SGPF.renewToken === "function") {
        await window.SGPF.renewToken();

        SGPFConfig.logSecurityEvent("token_renewed", {
          tabId: this.state.tabId,
          auto: true,
        });
      }
    } catch (error) {
      console.error("❌ Error renovando token:", error);
    }
  },

  // ===== LIMPIEZA =====
  cleanup() {
    console.log("🧹 Limpiando SecurityManager");

    // Limpiar timers
    if (this.state.checkInterval) {
      clearInterval(this.state.checkInterval);
    }
    if (this.state.warningTimer) {
      clearInterval(this.state.warningTimer);
    }

    // Remover listeners
    this.state.activityListeners.forEach(({ eventType, handler }) => {
      window.removeEventListener(eventType, handler);
    });
    this.state.activityListeners = [];

    // Ocultar modal si existe
    this.hideTimeoutWarning();

    this.state.sessionActive = false;
  },

  // ===== DESTRUIR (para logout manual) =====
  destroy() {
    console.log("💥 Destruyendo SecurityManager");
    this.cleanup();
    this.state.isInitialized = false;
  },
};

// ===== EXPONER GLOBALMENTE =====
window.SecurityManager = SecurityManager;

// ===== LOG DE CARGA =====
console.log("🔒 Módulo SecurityManager cargado");
