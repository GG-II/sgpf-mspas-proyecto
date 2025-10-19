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

    // Configuración de tabs por rol
    const navigationConfig = {
  auxiliar: [
    { view: "dashboard", label: "Inicio", icon: "🏠" },
    { view: "registro-v2", label: "Registrar", icon: "📝" }, // ← CAMBIO: registro → registro-v2
    { view: "perfil", label: "Perfil", icon: "👤" },
  ],
  asistente: [
    { view: "dashboard", label: "Dashboard", icon: "📊" },
    { view: "registro-v2", label: "Registrar", icon: "📝" },
    { view: "validacion", label: "Validar", icon: "✅" },
    { view: "reportes", label: "Reportes", icon: "📈" },
    { view: "perfil", label: "Perfil", icon: "👤" },
  ],
  encargado: [
    { view: "dashboard", label: "Dashboard", icon: "📊" },
    { view: "registro-v2", label: "Registrar", icon: "📝" },
    { view: "planificacion", label: "Planificación", icon: "🎯" },
    { view: "usuarios", label: "Usuarios", icon: "👥" }, 
    { view: "validacion", label: "Aprobar", icon: "✅" },
    { view: "reportes", label: "Reportes", icon: "📈" },
    { view: "perfil", label: "Perfil", icon: "👤" },
  ],
  coordinador: [
    { view: "dashboard", label: "Dashboard", icon: "📊" },
    { view: "registro-v2", label: "Registrar", icon: "📝" },
    { view: "planificacion", label: "Planificación", icon: "🎯" },
    { view: "usuarios", label: "Usuarios", icon: "👥" },
    { view: "reportes", label: "Reportes", icon: "📈" },
    { view: "perfil", label: "Configurar", icon: "⚙️" },
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
