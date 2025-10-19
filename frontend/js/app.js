// ===== js/app.js - ROUTER PRINCIPAL Y CONTROL DE ESTADO =====
const SGPFApp = {
  // ===== INICIALIZAR APLICACIÓN =====
  async init() {
    console.log("🚀 Inicializando SGPF App");

    // CRÍTICO: Verificar que no estemos en login.html para evitar bucle infinito
    if (window.location.pathname.includes("login.html")) {
      console.log("📍 En página de login, no inicializar app principal");
      return;
    }

    try {
      // Verificar autenticación
      const isAuthenticated = await this.checkAuthentication();

      if (!isAuthenticated) {
        console.log("🔒 No autenticado, redirigiendo a login");
        window.location.href = "login.html";
        return;
      }

      // Inicializar interfaz
      await this.initializeInterface();

      // Cargar vista inicial
      await this.loadInitialView();

      console.log("✅ App inicializada correctamente");
    } catch (error) {
      console.error("❌ Error inicializando app:", error);
      SGPF.showToast("Error inicializando aplicación", "error");
    }
  },

  // ===== VERIFICAR AUTENTICACIÓN =====
  async checkAuthentication() {
    console.log("🔍 Verificando autenticación...");

    const token = localStorage.getItem("authToken");
    const user = SGPF.getCurrentUser();

    if (!token || !user) {
      console.log("❌ Sin token o usuario");
      return false;
    }

    // Verificar token con el servidor
    const isValid = await SGPF.verifyToken();
    if (!isValid) {
      console.log("❌ Token inválido");
      return false;
    }

    console.log("✅ Autenticación válida");
    return true;
  },

  // ===== INICIALIZAR INTERFAZ =====
  async initializeInterface() {
    const user = SGPF.getCurrentUser();
    if (!user) throw new Error("No user data available");

    console.log(
      "🎨 Inicializando interfaz para:",
      user.nombres,
      user.apellidos
    );

    // Mostrar header y navegación
    this.showInterface();

    // Configurar información de usuario
    this.setupUserInfo(user);

    // Configurar navegación según rol
    this.setupNavigation(user);

    // Configurar logout
    this.setupLogout();
  },

  // ===== MOSTRAR INTERFAZ =====
  showInterface() {
    const header = document.getElementById("app-header");
    const mobileNav = document.getElementById("mobile-nav");

    if (header) header.classList.remove("hidden");
    if (mobileNav) mobileNav.classList.remove("hidden");
  },

  // ===== CONFIGURAR INFO DE USUARIO =====
  setupUserInfo(user) {
    const userNameElement = document.getElementById("user-name");
    if (userNameElement) {
      userNameElement.textContent = `${user.nombres} ${user.apellidos}`;
    }
  },

  // ===== CONFIGURAR NAVEGACIÓN =====
  setupNavigation(user) {
    const role = SGPF.getNormalizedRole();
    const mobileNav = document.getElementById("mobile-nav");

    if (!mobileNav || !role) return;

    // ===== CARGAR SCRIPT ESPECÍFICO SEGÚN EL ROL =====
    if (role === "auxiliar") {
      // Verificar si el script ya existe
      const existingScript = document.querySelector(
        'script[src="js/dashboards/auxiliar.js"]'
      );
      if (!existingScript && typeof window.AuxiliarDashboard === "undefined") {
        const script = document.createElement("script");
        script.src = "js/dashboards/auxiliar.js";
        script.onload = () => console.log("✅ Script auxiliar.js cargado");
        script.onerror = () => console.error("❌ Error cargando auxiliar.js");
        document.head.appendChild(script);
      }
    } else if (role === "asistente" || role === "asistente_tecnico") {
      const existingScript = document.querySelector(
        'script[src="js/dashboards/asistente.js"]'
      );
      if (!existingScript && typeof window.AsistenteDashboard === "undefined") {
        const script = document.createElement("script");
        script.src = "js/dashboards/asistente.js";
        script.onload = () => console.log("✅ Script asistente.js cargado");
        script.onerror = () => console.error("❌ Error cargando asistente.js");
        document.head.appendChild(script);
      }
    } // ===== CARGAR SCRIPT DEL ENCARGADO =====
    else if (role === "encargado") {
      const existingScript = document.querySelector(
        'script[src="js/dashboards/encargado.js"]'
      );

      if (!existingScript && typeof window.EncargadoDashboard === "undefined") {
        const script = document.createElement("script");
        script.src = "js/dashboards/encargado.js";
        script.onload = () => console.log("✅ Script encargado.js cargado");
        script.onerror = () => console.error("❌ Error cargando encargado.js");
        document.head.appendChild(script);
      }
    }
    // ===== CARGAR SCRIPT DEL COORDINADOR =====
    else if (role === "coordinador") {
      const existingScript = document.querySelector(
        'script[src="js/dashboards/coordinador.js"]'
      );

      if (
        !existingScript &&
        typeof window.CoordinadorDashboard === "undefined"
      ) {
        const script = document.createElement("script");
        script.src = "js/dashboards/coordinador.js";
        script.onload = () => console.log("✅ Script coordinador.js cargado");
        script.onerror = () =>
          console.error("❌ Error cargando coordinador.js");
        document.head.appendChild(script);
      }
    }

    // Configuración de tabs por rol con íconos SVG
const navigationConfig = {
    auxiliar: [
        { 
            view: "dashboard", 
            label: "Inicio", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`
        },
        { 
            view: "registro-v2", 
            label: "Registrar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`
        },
        { 
            view: "perfil", 
            label: "Perfil", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
        },
    ],
    asistente: [
        { 
            view: "dashboard", 
            label: "Dashboard", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`
        },
        { 
            view: "registro-v2", 
            label: "Registrar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`
        },
        { 
            view: "validacion", 
            label: "Validar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        },
        { 
            view: "reportes", 
            label: "Reportes", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
        },
        { 
            view: "perfil", 
            label: "Perfil", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
        },
    ],
    encargado: [
        { 
            view: "dashboard", 
            label: "Dashboard", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`
        },
        { 
            view: "registro-v2", 
            label: "Registrar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`
        },
        { 
            view: "planificacion", 
            label: "Planificación", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`
        },
        { 
            view: "usuarios", 
            label: "Usuarios", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
        },
        { 
            view: "validacion", 
            label: "Aprobar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
        },
        { 
            view: "reportes", 
            label: "Reportes", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
        },
        { 
            view: "perfil", 
            label: "Perfil", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
        },
    ],
    coordinador: [
        { 
            view: "dashboard", 
            label: "Dashboard", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`
        },
        { 
            view: "registro-v2", 
            label: "Registrar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`
        },
        { 
            view: "planificacion", 
            label: "Planificación", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`
        },
        { 
            view: "usuarios", 
            label: "Usuarios", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
        },
        { 
            view: "reportes", 
            label: "Reportes", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
        },
        { 
            view: "perfil", 
            label: "Configurar", 
            icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
        },
    ],
};

const tabs = navigationConfig[role] || [];

mobileNav.innerHTML = tabs
    .map(
        (tab) => `
        <div class="nav-item" data-view="${tab.view}">
            <span class="nav-icon">${tab.icon}</span>
            <span class="nav-label">${tab.label}</span>
        </div>
    `
    )
    .join("");

    // Agregar event listeners
    mobileNav.addEventListener("click", (e) => {
      const navItem = e.target.closest(".nav-item");
      if (navItem) {
        const view = navItem.dataset.view;
        ComponentLoader.navigateToView(view);
      }
    });

    // ===== AGREGAR AQUÍ - CARGAR SCRIPT ESPECÍFICO SEGÚN EL ROL =====
    if (role === "auxiliar") {
      const script = document.createElement("script");
      script.src = "js/dashboards/auxiliar.js";
      script.onload = () => console.log("✅ Script auxiliar.js cargado");
      script.onerror = () => console.error("❌ Error cargando auxiliar.js");
      document.head.appendChild(script);
    }
    // ===== CARGAR SCRIPT DEL ASISTENTE =====
    // ===== CARGAR SCRIPT DEL ASISTENTE =====
    if (role === "asistente") {
      const existingScript = document.querySelector(
        'script[src="js/dashboards/asistente.js"]'
      );

      if (!existingScript && typeof window.AsistenteDashboard === "undefined") {
        const script = document.createElement("script");
        script.src = "js/dashboards/asistente.js";
        script.onload = () => console.log("✅ Script asistente.js cargado");
        script.onerror = () => console.error("❌ Error cargando asistente.js");
        document.head.appendChild(script);
      }
    }
    // ===== CARGAR SCRIPT DEL ENCARGADO =====
    if (role === "encargado") {
      const existingScript = document.querySelector(
        'script[src="js/dashboards/encargado.js"]'
      );

      if (!existingScript && typeof window.EncargadoDashboard === "undefined") {
        const script = document.createElement("script");
        script.src = "js/dashboards/encargado.js";
        script.onload = () => console.log("✅ Script encargado.js cargado");
        script.onerror = () => console.error("❌ Error cargando encargado.js");
        document.head.appendChild(script);
      }
    }
  }, //

  // ===== CONFIGURAR LOGOUT =====
  setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
          SGPF.logout();
        }
      });
    }
  },

  // ===== CARGAR VISTA INICIAL =====
  async loadInitialView() {
    console.log("📱 Cargando vista inicial...");

    // Por defecto cargar dashboard
    const success = await ComponentLoader.navigateToView("dashboard");

    if (!success) {
      console.error("❌ Error cargando vista inicial");
      document.getElementById("main-content").innerHTML = `
                <div class="error">
                    <h2>Error cargando dashboard</h2>
                    <p>No se pudo cargar la vista inicial</p>
                </div>
            `;
    }
  },
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌟 DOM cargado, inicializando...");

  // Pequeño delay para evitar condiciones de carrera
  setTimeout(() => {
    SGPFApp.init();
  }, 100);
});
