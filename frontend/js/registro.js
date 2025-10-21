// ===== SISTEMA DE REGISTRO DE DATOS SGPF =====
// Evitar múltiples declaraciones
console.log("📝 ARCHIVO REGISTRO.JS CARGADO");
window.RegistroSystem = window.RegistroSystem || {
  // Estado actual del formulario
  currentData: {
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear(),
    comunidadId: null,
    metodos: {},
  },

  // Flag para evitar múltiples inicializaciones
  initialized: false,

  // Inicializar el sistema de registro
  async init() {
    console.log("🚀 FUNCIÓN INIT LLAMADA - INICIANDO DEBUG");

    // PREVENIR MÚLTIPLES INICIALIZACIONES
    if (this.initialized) {
      console.log("⚠️ Sistema ya inicializado, saltando...");
      return;
    }

    try {
      await this.cargarComunidadesUsuario();
      this.setupEventListeners();
      this.initializeForm();
      this.updateTotal();

      this.initialized = true;
      console.log("✅ Sistema de registro inicializado");
    } catch (error) {
      console.error("❌ Error al inicializar registro:", error);
      this.showError("Error al cargar el formulario");
    }
  },

  // Configurar todos los event listeners
  setupEventListeners() {
    console.log("📋 Configurando event listeners...");

    // REMOVER EVENT LISTENERS EXISTENTES PRIMERO
    this.removeEventListeners();

    // Selector de comunidad
    const comunidadSelect = document.getElementById(
      "comunidad-registro-select"
    );
    if (comunidadSelect) {
      comunidadSelect.addEventListener("change", (e) => {
        this.currentData.comunidadId = e.target.value;
        this.actualizarInfoComunidad();
      });
    }

    // Incrementadores y decrementadores - CON PREVENCIÓN DE DUPLICADOS
    document.querySelectorAll(".counter-btn").forEach((btn) => {
      // Remover cualquier listener previo
      btn.removeEventListener("click", this.handleCounterBound);

      // Crear función bound para poder removerla después
      if (!this.handleCounterBound) {
        this.handleCounterBound = (e) => this.handleCounter(e);
      }

      btn.addEventListener("click", this.handleCounterBound);
    });

    // Inputs numéricos directos
    document.querySelectorAll(".counter-input input").forEach((input) => {
      input.addEventListener("input", () => this.updateTotal());
      input.addEventListener("change", () => this.validateInput(input));
    });

    // Selectores de período
    const mesSelect = document.getElementById("mes-registro");
    if (mesSelect) {
      mesSelect.addEventListener("change", (e) => {
        this.currentData.mes = parseInt(e.target.value);
      });
    }

    const añoSelect = document.getElementById("año-registro");
    if (añoSelect) {
      añoSelect.addEventListener("change", (e) => {
        this.currentData.año = parseInt(e.target.value);
      });
    }

    // Botones de acción
    const btnCancelar = document.getElementById("btn-cancelar");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        this.cancelarRegistro();
      });
    }

    const btnGuardar = document.getElementById("btn-guardar");
    if (btnGuardar) {
      btnGuardar.addEventListener("click", () => {
        this.guardarRegistro();
      });
    }

    console.log("📋 Event listeners configurados correctamente");
  },

  // NUEVA FUNCIÓN: Remover event listeners para evitar duplicados
  removeEventListeners() {
    if (this.handleCounterBound) {
      document.querySelectorAll(".counter-btn").forEach((btn) => {
        btn.removeEventListener("click", this.handleCounterBound);
      });
    }
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

      console.log(`✅ ${comunidades.length} comunidades cargadas`);
    } catch (error) {
      console.error("❌ Error cargando todas las comunidades:", error);
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

  // Manejar incrementadores (+/-) - FUNCIÓN CORREGIDA
  handleCounter(event) {
    console.log("🔢 HandleCounter ejecutado"); // Debug

    // PREVENIR PROPAGACIÓN MULTIPLE
    event.preventDefault();
    event.stopPropagation();

    const button = event.target;
    const targetId = button.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (!input) {
      console.log("❌ Input no encontrado:", targetId);
      return;
    }

    let currentValue = parseInt(input.value) || 0;
    const isIncrement = button.classList.contains("plus");

    console.log(
      `🔢 Valor actual: ${currentValue}, Incrementar: ${isIncrement}`
    );

    // INCREMENTAR/DECREMENTAR DE 1 EN 1
    if (isIncrement) {
      currentValue = Math.min(currentValue + 1, 999);
    } else {
      currentValue = Math.max(currentValue - 1, 0);
    }

    console.log(`🔢 Nuevo valor: ${currentValue}`);

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
      "inyeccion-mensual": "inyeccion-mensual",
      "inyeccion-bimensual": "inyeccion-bimensual",
      "inyeccion-trimestral": "inyeccion-trimestral",
      pildoras: "pildoras",
      "pildora-emergencia": "pildora-emergencia",
      diu: "diu",
      implante: "implante",
      "condon-masculino": "condon-masculino",
      "condon-femenino": "condon-femenino",
      mela: "mela",
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
    console.log("💾 Iniciando guardado de registro");

    try {
      // Mostrar loading
      this.showLoading(true);

      // Recopilar datos
      const formData = this.gatherFormData();
      const total = this.updateTotal();

      // Validación básica
      if (total === 0) {
        this.showError("Debe registrar al menos una usuaria");
        this.showLoading(false);
        return;
      }

      if (!this.currentData.comunidadId) {
        this.showError("Debe seleccionar una comunidad");
        this.showLoading(false);
        return;
      }

      console.log("📊 Datos a enviar:", formData);

      // Obtener IDs de métodos
      const metodosIds = await this.obtenerMetodosIds();

      // Enviar cada método por separado
      let registrosExitosos = 0;
      let registrosTotal = Object.keys(formData.registros).length;

      for (const [metodoClave, cantidad] of Object.entries(
        formData.registros
      )) {
        if (cantidad > 0) {
          const metodoId = metodosIds[metodoClave];
          if (metodoId) {
            await this.enviarRegistroIndividual({
              comunidad_id: this.currentData.comunidadId,
              metodo_id: metodoId,
              año: formData.año,
              mes: formData.mes,
              cantidad: cantidad,
            });
            registrosExitosos++;
          }
        }
      }

      if (registrosExitosos > 0) {
        this.showSuccess(
          `${registrosExitosos} registros guardados exitosamente`
        );

        // Regresar al dashboard después de 2 segundos
        setTimeout(() => {
          this.regresarDashboard();
        }, 2000);
      } else {
        this.showError("No se pudieron guardar los registros");
      }
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      this.showError("Error de conexión. Verifique su conexión a internet");
    } finally {
      this.showLoading(false);
    }
  },

  // Obtener IDs de métodos del backend
  async obtenerMetodosIds() {
    return {
      "inyeccion-mensual": 1,
      "inyeccion-bimensual": 2,
      "inyeccion-trimestral": 3,
      pildoras: 4,
      "pildora-emergencia": 4,
      diu: 5,
      implante: 6,
      "condon-masculino": 7,
      "condon-femenino": 7,
      mela: 9,
    };
  },

  // Enviar un registro individual
  async enviarRegistroIndividual(data) {
    const token = localStorage.getItem("authToken");

    if (!token) {
      throw new Error("No hay sesión activa");
    }

    const response = await fetch("http://localhost:5000/api/registros", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
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

    // Limpiar flag de inicialización para futuras cargas
    this.initialized = false;

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

console.log("📝 Sistema de registro cargado y listo");
console.log("📝 OBJETO RegistroSystem CREADO:", window.RegistroSystem);

// SCRIPT DE DEBUG TEMPORAL - Agregar al final de registro.js

// Debug function para detectar múltiples event listeners
function debugCounterButtons() {
  console.log("=== DEBUG COUNTER BUTTONS ===");

  const buttons = document.querySelectorAll(".counter-btn");
  console.log(`Total botones encontrados: ${buttons.length}`);

  buttons.forEach((btn, index) => {
    const targetId = btn.getAttribute("data-target");
    const isPlus = btn.classList.contains("plus");
    console.log(
      `Botón ${index}: target=${targetId}, tipo=${isPlus ? "plus" : "minus"}`
    );

    // Verificar cuántos listeners tiene
    const listeners = getEventListeners
      ? getEventListeners(btn)
      : "No disponible";
    console.log(`Listeners en botón ${index}:`, listeners);
  });

  // Verificar inputs
  const inputs = document.querySelectorAll(".counter-input input");
  console.log(`Total inputs encontrados: ${inputs.length}`);

  inputs.forEach((input, index) => {
    console.log(`Input ${index}: id=${input.id}, valor=${input.value}`);
  });
}

// Función de test manual
function testSingleIncrement(inputId) {
  console.log(`=== TEST MANUAL para ${inputId} ===`);

  const input = document.getElementById(inputId);
  if (!input) {
    console.log("Input no encontrado");
    return;
  }

  const valorAntes = parseInt(input.value) || 0;
  console.log(`Valor antes: ${valorAntes}`);

  // Incrementar manualmente
  input.value = valorAntes + 1;

  const valorDespues = parseInt(input.value) || 0;
  console.log(`Valor después: ${valorDespues}`);
  console.log(`Diferencia: ${valorDespues - valorAntes}`);

  // Llamar updateTotal para ver si hay problema ahí
  if (window.RegistroSystem && window.RegistroSystem.updateTotal) {
    window.RegistroSystem.updateTotal();
  }
}

// Interceptar clics en botones para debug
function interceptCounterClicks() {
  console.log("=== INTERCEPTANDO CLICS ===");

  document.querySelectorAll(".counter-btn").forEach((btn) => {
    btn.addEventListener(
      "click",
      function (e) {
        console.log("CLIC INTERCEPTADO:", {
          target: e.target.getAttribute("data-target"),
          tipo: e.target.classList.contains("plus") ? "plus" : "minus",
          timestamp: Date.now(),
        });
      },
      true
    ); // true = capture phase, se ejecuta antes que otros listeners
  });
}

// Ejecutar debug cuando se cargue la página
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    console.log("EJECUTANDO DEBUG...");
    debugCounterButtons();
    interceptCounterClicks();
  }, 1000);
});

// Función global para ejecutar desde consola
window.debugCounters = debugCounterButtons;
window.testIncrement = testSingleIncrement;

// REEMPLAZO TEMPORAL DE LA FUNCIÓN handleCounter
// Agregar esto al final de registro.js para sobrescribir la función problemática

window.RegistroSystem.handleCounter = function (event) {
  console.log("🔢 NUEVO HandleCounter ejecutado");

  // Prevenir comportamiento por defecto y propagación
  event.preventDefault();
  event.stopImmediatePropagation();

  const button = event.target;
  const targetId = button.getAttribute("data-target");
  const input = document.getElementById(targetId);

  if (!input) {
    console.log("❌ Input no encontrado:", targetId);
    return false;
  }

  // Obtener valor actual
  let currentValue = parseInt(input.value) || 0;
  const isIncrement = button.classList.contains("plus");

  console.log(
    `🔢 Antes - Input: ${targetId}, Valor: ${currentValue}, Acción: ${
      isIncrement ? "sumar" : "restar"
    }`
  );

  // Cambiar valor EXACTAMENTE en 1
  if (isIncrement) {
    currentValue += 1;
    if (currentValue > 999) currentValue = 999;
  } else {
    currentValue -= 1;
    if (currentValue < 0) currentValue = 0;
  }

  console.log(`🔢 Después - Nuevo valor: ${currentValue}`);

  // Asignar directamente
  input.value = currentValue;

  // Disparar evento de input para que se actualice el total
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // Feedback visual
  button.style.transform = "scale(0.9)";
  button.style.opacity = "0.7";
  setTimeout(() => {
    button.style.transform = "";
    button.style.opacity = "";
  }, 150);

  return false; // Prevenir más propagación
};

// TAMBIÉN reemplazar la configuración de event listeners
window.RegistroSystem.setupCounterListeners = function () {
  console.log("🔧 Configurando nuevos listeners...");

  // Remover TODOS los listeners existentes
  document.querySelectorAll(".counter-btn").forEach((btn) => {
    // Clonar el botón para remover todos los event listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Agregar nuevos listeners con delegación de eventos
  document.addEventListener(
    "click",
    function (e) {
      // Verificar si el elemento clickeado es un botón contador
      if (e.target.classList.contains("counter-btn")) {
        console.log("🎯 Delegación de evento detectada");
        window.RegistroSystem.handleCounter(e);
      }
    },
    true
  );

  console.log("✅ Nuevos listeners configurados");
};

// Ejecutar la nueva configuración
setTimeout(() => {
  if (window.RegistroSystem) {
    window.RegistroSystem.setupCounterListeners();
  }
}, 500);
