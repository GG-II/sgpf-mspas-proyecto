// ===== js/component-loader.js - SISTEMA DE CARGA DINÁMICA =====
const ComponentLoader = {
  // ===== CARGAR TEMPLATE =====
  async loadTemplate(templatePath) {
    try {
      console.log(`📂 Cargando template: ${templatePath}`);

      const templateUrl = `${templatePath}?t=${Date.now()}`;
      const response = await fetch(templateUrl);
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

  // ===== INSERTAR EN CONTENEDOR (VERSIÓN FORZADA) =====
  async insertTemplateOnly(templatePath, data = {}) {
    const container = document.getElementById("main-content");
    if (!container) {
      console.error(`❌ Contenedor no encontrado: main-content`);
      return false;
    }

    try {
      console.log(`📂 Cargando template: ${templatePath}`);
      let html = await this.loadTemplate(templatePath);

      console.log(`📏 Longitud del HTML cargado: ${html.length} caracteres`);
      console.log(
        `📝 Primeros 200 caracteres del HTML:`,
        html.substring(0, 200)
      );

      // LIMPIAR COMPLETAMENTE EL CONTAINER PRIMERO
      container.innerHTML = "";

      // FORZAR UN REPAINT
      container.offsetHeight;

      // INSERTAR EL HTML
      container.innerHTML = html;

      // FORZAR OTRO REPAINT
      container.offsetHeight;

      console.log(`📦 HTML insertado en container`);
      console.log(
        `🔍 Elementos después de inserción:`,
        container.children.length
      );

      // ESPERAR UN MOMENTO ANTES DE VERIFICAR
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verificar si los elementos específicos del perfil existen
      const perfilCodigo = document.getElementById("perfil-codigo");
      console.log(
        `🎯 perfil-codigo encontrado DESPUÉS de espera:`,
        !!perfilCodigo
      );

      if (perfilCodigo) {
        console.log(`✅ Elemento encontrado, estructura DOM correcta`);
      } else {
        console.error(
          `❌ Elemento aún no encontrado, verificando HTML completo:`
        );
        console.log(
          "HTML completo insertado:",
          container.innerHTML.substring(0, 500)
        );
      }

      this.executeTemplateScripts(container);
      console.log(`✅ Template insertado en main-content`);
      return true;
    } catch (error) {
      console.error(`❌ Error insertando template:`, error);
      container.innerHTML = `<div class="error">Error cargando contenido</div>`;
      return false;
    }
  },

  // ===== INSERTAR EN CONTENEDOR (CON LOADING - MANTENER POR COMPATIBILIDAD) =====
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
    const scripts = container.querySelectorAll("script");
    scripts.forEach((script) => {
      try {
        // Crear nuevo script para ejecutar
        const newScript = document.createElement("script");
        newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
        document.head.removeChild(newScript);
      } catch (error) {
        console.error("❌ Error ejecutando script del template:", error);
      }
    });
  },

  // ===== NAVEGAR ENTRE VISTAS (VERSIÓN CORREGIDA) =====
  async navigateToView(viewName, data = {}) {
    console.log(`🧭 Navegando a vista: ${viewName}`);

    const role = SGPF.getNormalizedRole();
    if (!role) {
      console.error("❌ No se puede navegar sin rol de usuario");
      return false;
    }

    let templatePath;

    // Mapear vistas a templates según el rol
    switch (viewName) {
      case "dashboard":
        templatePath = `templates/dashboard/${role}.html`;
        break;
      case "registro":
        templatePath = "templates/registro/formulario.html";
        break;
      case "validacion":
        templatePath = "templates/validacion/pendientes.html";
        break;
      case "reportes":
        templatePath = "templates/reportes/mensual.html";
        break;
      case "perfil":
        templatePath = "templates/perfil/usuario.html";
        console.log(`🎯 Template path para perfil: ${templatePath}`);
        break;
      default:
        console.error(`❌ Vista no reconocida: ${viewName}`);
        return false;
    }

    // MOSTRAR LOADING AL INICIO
    SGPF.showLoading(true);

    try {
      // Cargar template sin loading individual
      const success = await this.insertTemplateOnly(templatePath, data);

      if (success) {
        SGPF.state.currentView = viewName;

        // Inicializar sistemas específicos según la vista
        await this.initializeViewSystem(viewName);

        // Actualizar navegación activa
        this.updateActiveNavigation(viewName);
      }

      return success;
    } catch (error) {
      console.error("❌ Error en navegación:", error);
      return false;
    } finally {
      // OCULTAR LOADING SOLO CUANDO TODO TERMINE
      SGPF.showLoading(false);
    }
  },

  // ===== INICIALIZAR SISTEMAS DE VISTA =====
  async initializeViewSystem(viewName) {
    try {
      switch (viewName) {
        case "dashboard":
          const role = SGPF.getNormalizedRole();
          if (role === "auxiliar" && window.AuxiliarDashboard) {
            await window.AuxiliarDashboard.init();
          } else if (role === "asistente") {
            // Cargar script del asistente si no existe
            if (!window.AsistenteDashboard) {
              const script = document.createElement("script");
              script.src = "js/dashboards/asistente.js";
              await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
              });
            }
            if (window.AsistenteDashboard) {
              await window.AsistenteDashboard.init();
            }
          } else if (role === "encargado") {
            // Cargar script del encargado si no existe
            if (!window.EncargadoDashboard) {
              const script = document.createElement("script");
              script.src = "js/dashboards/encargado.js";
              await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
              });
            }
            if (window.EncargadoDashboard) {
              await window.EncargadoDashboard.init();
            }
          } else if (role === "coordinador") {
            // Cargar script del coordinador si no existe
            if (!window.CoordinadorDashboard) {
              const script = document.createElement("script");
              script.src = "js/dashboards/coordinador.js";
              await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
              });
            }
            if (window.CoordinadorDashboard) {
              await window.CoordinadorDashboard.init();
            }
          }

          break;

        case "registro":
          // Cargar script si no existe
          await this.loadRegistroScript();
          if (window.RegistroSystem) {
            await window.RegistroSystem.init();
          }
          break;

        case "validacion":
          // Cargar script de validación si no existe
          if (!window.ValidacionSystem) {
            const script = document.createElement("script");
            script.src = "js/validacion.js";
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }

          // Esperar renderizado del DOM y después inicializar
          await new Promise((resolve) => setTimeout(resolve, 200));

          if (window.ValidacionSystem) {
            await window.ValidacionSystem.init();
          }
          break;

        case "perfil":
          console.log("🔥 INICIANDO CASO PERFIL");

          if (!window.PerfilUsuario) {
            console.log("🔥 Cargando script perfil.js");
            const script = document.createElement("script");
            script.src = "js/perfil.js";
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
              script.onload = () => {
                console.log("🔥 Script perfil.js cargado exitosamente");
                resolve();
              };
              script.onerror = (error) => {
                console.log("🔥 Error cargando script perfil.js:", error);
                reject(error);
              };
              setTimeout(() => {
                console.log("🔥 Timeout cargando script perfil.js");
                reject(new Error("Timeout"));
              }, 5000);
            });
          } else {
            console.log("🔥 Script PerfilUsuario ya existe");
          }

          console.log("🔥 Esperando 500ms para DOM...");
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log(
            "🔥 Verificando window.PerfilUsuario:",
            !!window.PerfilUsuario
          );

          if (window.PerfilUsuario) {
            console.log("🔥 EJECUTANDO PerfilUsuario.init()");
            try {
              await window.PerfilUsuario.init();
              console.log("🔥 PerfilUsuario.init() COMPLETADO EXITOSAMENTE");
            } catch (error) {
              console.error("🔥 ERROR EN PerfilUsuario.init():", error);
              throw error;
            }
          } else {
            console.error("🔥 PerfilUsuario NO DISPONIBLE DESPUÉS DE CARGA");
            throw new Error("PerfilUsuario no se cargó correctamente");
          }
          console.log("🔥 CASO PERFIL TERMINADO");
          break;

        case "reportes":
          // Cargar script de reportes si no existe
          if (!window.ReportesSystem) {
            const script = document.createElement("script");
            script.src = "js/reportes.js";
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }

          // Esperar renderizado del DOM
          await new Promise((resolve) => setTimeout(resolve, 300));

          if (window.ReportesSystem) {
            await window.ReportesSystem.init();
          }
          break;
      }
    } catch (error) {
      console.error("❌ Error inicializando sistema de vista:", error);
      throw error;
    }
  },

  // ===== CARGAR SCRIPT DE REGISTRO =====
  async loadRegistroScript() {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      if (window.RegistroSystem) {
        console.log("✅ RegistroSystem ya disponible");
        resolve();
        return;
      }

      // Verificar si el script ya existe
      const existingScript = document.querySelector(
        'script[src="js/registro.js"]'
      );
      if (existingScript) {
        console.log("⏳ Script ya existe, esperando inicialización...");
        // Esperar un poco para que se ejecute
        setTimeout(() => {
          if (window.RegistroSystem) {
            console.log("✅ RegistroSystem disponible después de espera");
            resolve();
          } else {
            console.error("❌ Script cargado pero sistema no disponible");
            reject(new Error("Script cargado pero sistema no disponible"));
          }
        }, 150);
        return;
      }

      console.log("📥 Cargando script registro.js...");

      // Cargar script dinámicamente
      const script = document.createElement("script");
      script.src = "js/registro.js";
      script.onload = () => {
        console.log("✅ Script registro.js descargado");
        // Dar tiempo para que se ejecute completamente
        setTimeout(() => {
          if (window.RegistroSystem) {
            console.log("✅ RegistroSystem disponible después de carga");
            resolve();
          } else {
            console.error("❌ Script cargado pero sistema no disponible");
            reject(new Error("Script cargado pero sistema no disponible"));
          }
        }, 100);
      };
      script.onerror = () => {
        console.error("❌ Error descargando registro.js");
        reject(new Error("Error cargando registro.js"));
      };
      document.head.appendChild(script);
    });
  },

  // ===== ACTUALIZAR NAVEGACIÓN ACTIVA =====
  updateActiveNavigation(activeView) {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const isActive = item.dataset.view === activeView;
      item.classList.toggle("active", isActive);
    });
  },
};
