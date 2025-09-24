// ===== SISTEMA DE REGISTRO DE DATOS SGPF =====
// Evitar múltiples declaraciones
console.log('📝 ARCHIVO REGISTRO.JS CARGADO');
window.RegistroSystem = window.RegistroSystem || {
  // Estado actual del formulario
  currentData: {
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear(),
    comunidadId: null,
    metodos: {},
  },

  // Inicializar el sistema de registro
  async init() {
    console.log("🚀 FUNCIÓN INIT LLAMADA - INICIANDO DEBUG");
    alert("REGISTRO INIT EJECUTADO"); // Esto forzará un popup

    try {
      await this.cargarComunidadesUsuario();
      this.setupEventListeners();
      this.initializeForm();
      this.updateTotal();
      console.log("✅ Sistema de registro inicializado");
    } catch (error) {
      console.error("❌ Error al inicializar registro:", error);
      this.showError("Error al cargar el formulario");
    }
  },

  // Configurar todos los event listeners
  setupEventListeners() {
    // Selector de comunidad
    document
      .getElementById("comunidad-registro-select")
      ?.addEventListener("change", (e) => {
        this.currentData.comunidadId = e.target.value;
        this.actualizarInfoComunidad();
      });

    // Incrementadores y decrementadores
    document.querySelectorAll(".counter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleCounter(e));
    });

    // Inputs numéricos directos
    document.querySelectorAll(".counter-input input").forEach((input) => {
      input.addEventListener("input", () => this.updateTotal());
      input.addEventListener("change", () => this.validateInput(input));
    });

    // Selectores de período
    document.getElementById("mes-registro")?.addEventListener("change", (e) => {
      this.currentData.mes = parseInt(e.target.value);
    });

    document.getElementById("año-registro")?.addEventListener("change", (e) => {
      this.currentData.año = parseInt(e.target.value);
    });

    // Botones de acción
    document.getElementById("btn-cancelar")?.addEventListener("click", () => {
      this.cancelarRegistro();
    });

    document.getElementById("btn-guardar")?.addEventListener("click", () => {
      this.guardarRegistro();
    });

    console.log("📋 Event listeners configurados");
  },

  // Cargar comunidades del usuario
  async cargarComunidadesUsuario() {
    try {
      const user = SGPF.getCurrentUser();

      // Para roles superiores que no tienen comunidades específicas asignadas
      if (!user.comunidades || user.comunidades.length === 0) {
        console.log(
          "⚠️ Usuario sin comunidades específicas, cargando todas las disponibles"
        );
        await this.cargarTodasLasComunidades();
        return;
      }

      const comunidadSelect = document.getElementById(
        "comunidad-registro-select"
      );
      const infoElement = document.getElementById("comunidad-registro");

      if (comunidadSelect) {
        comunidadSelect.innerHTML = "";

        // Si tiene múltiples comunidades, agregar opciones
        if (user.comunidades.length > 1) {
          user.comunidades.forEach((comunidad) => {
            const option = document.createElement("option");
            option.value = comunidad.id;
            option.textContent = `${comunidad.nombre} (${comunidad.codigo_comunidad})`;
            comunidadSelect.appendChild(option);
          });

          // Seleccionar la primera por defecto
          this.currentData.comunidadId = user.comunidades[0].id;
          comunidadSelect.value = user.comunidades[0].id;
        } else {
          // Solo una comunidad - ocultar selector
          const comunidad = user.comunidades[0];
          this.currentData.comunidadId = comunidad.id;

          const option = document.createElement("option");
          option.value = comunidad.id;
          option.textContent = `${comunidad.nombre} (${comunidad.codigo_comunidad})`;
          option.selected = true;
          comunidadSelect.appendChild(option);

          // Ocultar el grupo selector si solo hay una comunidad
          const selectorGroup = document.getElementById(
            "comunidad-selector-group"
          );
          if (selectorGroup) {
            selectorGroup.style.display = "none";
          }
        }

        this.actualizarInfoComunidad();
      }
    } catch (error) {
      console.error("❌ Error cargando comunidades:", error);
      this.showError("Error cargando comunidades asignadas");
    }
  },

  // Cargar todas las comunidades disponibles (para roles superiores)
  async cargarTodasLasComunidades() {
    try {
      console.log("🌍 Cargando todas las comunidades disponibles...");

      // Llamar al endpoint de administración para obtener todas las comunidades
      const response = await SGPF.apiCall("/admin/comunidades");

      if (!response.success || !response.data || response.data.length === 0) {
        throw new Error("No se pudieron cargar las comunidades");
      }

      const comunidades = response.data;
      const comunidadSelect = document.getElementById(
        "comunidad-registro-select"
      );
      const infoElement = document.getElementById("comunidad-registro");

      if (comunidadSelect) {
        comunidadSelect.innerHTML = "";

        // Agregar opción por defecto
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Selecciona una comunidad...";
        comunidadSelect.appendChild(defaultOption);

        // Agregar todas las comunidades
        comunidades.forEach((comunidad) => {
          const option = document.createElement("option");
          option.value = comunidad.id;
          option.textContent = `${comunidad.nombre} (${comunidad.codigo_comunidad})`;
          comunidadSelect.appendChild(option);
        });

        // No seleccionar ninguna por defecto para forzar selección consciente
        this.currentData.comunidadId = null;
      }

      if (infoElement) {
        infoElement.textContent =
          "Selecciona la comunidad para registrar datos";
      }

      console.log(`✅ ${comunidades.length} comunidades cargadas`);
    } catch (error) {
      console.error("❌ Error cargando todas las comunidades:", error);

      // Fallback: usar datos mock si no hay conexión con admin
      this.cargarComunidadesFallback();
    }
  },

  // Fallback con comunidades mock (por si falla la API de admin)
  cargarComunidadesFallback() {
    console.log("⚠️ Usando comunidades de fallback");

    const comunidadesMock = [
      { id: 1, nombre: "Comunidad Norte", codigo_comunidad: "CN001" },
      { id: 2, nombre: "Comunidad Sur", codigo_comunidad: "CS001" },
      { id: 3, nombre: "Comunidad Este", codigo_comunidad: "CE001" },
      { id: 4, nombre: "Comunidad Oeste", codigo_comunidad: "CO001" },
    ];

    const comunidadSelect = document.getElementById(
      "comunidad-registro-select"
    );
    const infoElement = document.getElementById("comunidad-registro");

    if (comunidadSelect) {
      comunidadSelect.innerHTML = "";

      // Opción por defecto
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Selecciona una comunidad...";
      comunidadSelect.appendChild(defaultOption);

      // Agregar comunidades mock
      comunidadesMock.forEach((comunidad) => {
        const option = document.createElement("option");
        option.value = comunidad.id;
        option.textContent = `${comunidad.nombre} (${comunidad.codigo_comunidad})`;
        comunidadSelect.appendChild(option);
      });
    }

    if (infoElement) {
      infoElement.textContent =
        "Selecciona la comunidad para registrar datos (datos de prueba)";
    }

    this.showToast(
      "Usando comunidades de prueba. Verifica la conexión.",
      "warning"
    );
  },

  // Actualizar información de comunidad en el header
  actualizarInfoComunidad() {
    const infoElement = document.getElementById("comunidad-registro");
    const user = SGPF.getCurrentUser();

    if (!infoElement || !this.currentData.comunidadId) return;

    const comunidadActual = user.comunidades?.find(
      (c) => c.id == this.currentData.comunidadId
    );

    if (comunidadActual) {
      infoElement.textContent = `Registrando en: ${comunidadActual.nombre}`;
    } else {
      infoElement.textContent = "Selecciona una comunidad para registrar";
    }
  },

  // Inicializar valores del formulario
  initializeForm() {
    const now = new Date();
    const mesSelect = document.getElementById("mes-registro");
    const añoSelect = document.getElementById("año-registro");

    if (mesSelect) {
      mesSelect.value = now.getMonth() + 1;
      this.currentData.mes = now.getMonth() + 1;
    }

    if (añoSelect) {
      añoSelect.value = now.getFullYear();
      this.currentData.año = now.getFullYear();
    }
  },

  // Manejar incrementadores (+/-)
  handleCounter(event) {
    const button = event.target;
    const targetId = button.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (!input) return;

    let currentValue = parseInt(input.value) || 0;
    const isIncrement = button.classList.contains("plus");

    if (isIncrement) {
      currentValue = Math.min(currentValue + 1, 999);
    } else {
      currentValue = Math.max(currentValue - 1, 0);
    }

    input.value = currentValue;
    this.updateTotal();

    // Feedback visual
    button.style.transform = "scale(0.95)";
    setTimeout(() => {
      button.style.transform = "";
    }, 100);
  },

  // Validar input individual
  validateInput(input) {
    let value = parseInt(input.value) || 0;

    // Asegurar que esté en rango válido
    if (value < 0) value = 0;
    if (value > 999) value = 999;

    input.value = value;
    this.updateTotal();
  },

  // Actualizar el total de usuarias
  updateTotal() {
    const inputs = document.querySelectorAll(".counter-input input");
    let total = 0;

    inputs.forEach((input) => {
      total += parseInt(input.value) || 0;
    });

    const totalElement = document.getElementById("total-usuarias");
    if (totalElement) {
      totalElement.textContent = total;

      // Animación de actualización
      totalElement.style.transform = "scale(1.1)";
      setTimeout(() => {
        totalElement.style.transform = "";
      }, 200);
    }

    return total;
  },

  // Recopilar datos del formulario
  gatherFormData() {
    const data = {
      mes: this.currentData.mes,
      año: this.currentData.año,
      registros: {},
    };

    // Mapeo de IDs a nombres de métodos para el backend
const metodosMap = {
    'inyeccion-mensual': 'inyeccion-mensual',
    'inyeccion-bimensual': 'inyeccion-bimensual', 
    'inyeccion-trimestral': 'inyeccion-trimestral',
    'pildoras': 'pildoras',
    'pildora-emergencia': 'pildora-emergencia',
    'diu': 'diu',
    'implante': 'implante',  // Cambiar de 'implante_subdermico' a 'implante'
    'condon-masculino': 'condon-masculino',
    'condon-femenino': 'condon-femenino',
    'mela': 'mela'
};

    // Recopilar valores de cada método
    Object.keys(metodosMap).forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        const valor = parseInt(input.value) || 0;
        if (valor > 0) {
          data.registros[metodosMap[inputId]] = valor;
        }
      }
    });

    return data;
  },

  // Guardar registro en el backend
async guardarRegistro() {
    console.log('💾 Iniciando guardado de registro');
    
    try {
        // Mostrar loading
        this.showLoading(true);

        // Recopilar datos
        const formData = this.gatherFormData();
        const total = this.updateTotal();

        // Validación básica
        if (total === 0) {
            this.showError('Debe registrar al menos una usuaria');
            this.showLoading(false);
            return;
        }

        if (!this.currentData.comunidadId) {
            this.showError('Debe seleccionar una comunidad');
            this.showLoading(false);
            return;
        }

        console.log('📊 Datos a enviar:', formData);

        // NUEVO: Obtener IDs de métodos
        const metodosIds = await this.obtenerMetodosIds();
        
        // NUEVO: Enviar cada método por separado
        let registrosExitosos = 0;
        let registrosTotal = Object.keys(formData.registros).length;
        
        for (const [metodoClave, cantidad] of Object.entries(formData.registros)) {
            if (cantidad > 0) {
                const metodoId = metodosIds[metodoClave];
                if (metodoId) {
                    await this.enviarRegistroIndividual({
                        comunidad_id: this.currentData.comunidadId,
                        metodo_id: metodoId,
                        año: formData.año,
                        mes: formData.mes,
                        cantidad: cantidad
                    });
                    registrosExitosos++;
                }
            }
        }

        if (registrosExitosos > 0) {
            this.showSuccess(`${registrosExitosos} registros guardados exitosamente`);
            
            // Regresar al dashboard después de 2 segundos
            setTimeout(() => {
                this.regresarDashboard();
            }, 2000);
        } else {
            this.showError('No se pudieron guardar los registros');
        }

    } catch (error) {
        console.error('❌ Error al guardar:', error);
        this.showError('Error de conexión. Verifique su conexión a internet');
    } finally {
        this.showLoading(false);
    }
},

// Obtener IDs de métodos del backend
async obtenerMetodosIds() {
    return {
        'inyeccion-mensual': 1,        // INY_MEN
        'inyeccion-bimensual': 2,      // INY_BIM  
        'inyeccion-trimestral': 3,     // INY_TRI
        'pildoras': 4,                 // PILDORA
        'pildora-emergencia': 4,       // No tienes píldora de emergencia, usar píldora normal
        'diu': 5,                      // DIU
        'implante': 6,                 // IMPLANTE
        'condon-masculino': 7,         // CONDON_M
        'condon-femenino': 7,          // No tienes condón femenino, usar masculino
        'mela': 9                      // MELA
    };
},

// Enviar un registro individual
async enviarRegistroIndividual(data) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('No hay sesión activa');
    }

    const response = await fetch('http://localhost:5000/api/registros', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en método: ${errorText}`);
    }

    return await response.json();
},


  // Cancelar registro
  cancelarRegistro() {
    if (this.updateTotal() > 0) {
      if (
        confirm("¿Está seguro de cancelar? Se perderán los datos ingresados.")
      ) {
        this.regresarDashboard();
      }
    } else {
      this.regresarDashboard();
    }
  },

  // Regresar al dashboard
  regresarDashboard() {
    console.log("🏠 Regresando al dashboard");

    // Usar el sistema de navegación existente
    if (window.ComponentLoader && window.ComponentLoader.navigateToView) {
      window.ComponentLoader.navigateToView("dashboard");
    } else {
      // Fallback
      window.location.reload();
    }
  },

  // Mostrar/ocultar loading
  showLoading(show) {
    const overlay = document.getElementById("loading-overlay");
    const guardarBtn = document.getElementById("btn-guardar");

    if (overlay) {
      overlay.style.display = show ? "flex" : "none";
    }

    if (guardarBtn) {
      guardarBtn.disabled = show;
      guardarBtn.textContent = show ? "Guardando..." : "Guardar Registro";
    }
  },

  // Mostrar mensaje de éxito
  showSuccess(message) {
    this.showToast(message, "success");
  },

  // Mostrar mensaje de error
  showError(message) {
    this.showToast(message, "error");
  },

  // Mostrar mensaje de advertencia
  showWarning(message) {
    this.showToast(message, "warning");
  },

  // Sistema de notificaciones toast
  showToast(message, type = "info") {
    // Remover toasts previos
    const existingToast = document.querySelector(".toast");
    if (existingToast) {
      existingToast.remove();
    }

    // Crear nuevo toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Estilos básicos del toast
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "16px 24px",
      borderRadius: "8px",
      color: "white",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "1001",
      animation: "slideIn 0.3s ease",
      maxWidth: "300px",
    });

    // Color según tipo
    if (type === "success") {
      toast.style.background = "linear-gradient(135deg, #10B981, #059669)";
    } else if (type === "error") {
      toast.style.background = "linear-gradient(135deg, #EF4444, #DC2626)";
    } else if (type === "warning") {
      toast.style.background = "linear-gradient(135deg, #F59E0B, #D97706)";
    } else {
      toast.style.background = "linear-gradient(135deg, #3B82F6, #2563EB)";
    }

    document.body.appendChild(toast);

    // Remover automáticamente después de 4 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  },
};


console.log('📝 Sistema de registro cargado y listo');
console.log('📝 OBJETO RegistroSystem CREADO:', window.RegistroSystem);