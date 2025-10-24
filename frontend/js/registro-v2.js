// ===== SISTEMA DE REGISTRO INDIVIDUAL V2.0 - VERSIÓN CORREGIDA =====
console.log("🔧 Cargando Sistema de Registro V2.0 (Corregido)...");

window.RegistroV2 = {
  // Estado del formulario
  state: {
    pasoActual: 1,
    usuariaActual: null,
    metodoSeleccionado: null,
  },

  // Métodos disponibles (IDs del backend)
  metodos: [
    { id: 1, nombre: "Inyección Mensual", categoria: "Inyecciones" },
    { id: 2, nombre: "Inyección Bimensual", categoria: "Inyecciones" },
    {
      id: 3,
      nombre: "Implante Hormonal Subdérmico",
      categoria: "Dispositivos",
    },
    { id: 4, nombre: "Condón Masculino", categoria: "Barrera" },
    { id: 5, nombre: "Collar del Ciclo", categoria: "Naturales" },
    {
      id: 6,
      nombre: "Método de Lactancia y Amenorrea (MELA)",
      categoria: "Naturales",
    },
    {
      id: 7,
      nombre: "Anticoncepción Quirúrgica Voluntaria Femenina",
      categoria: "Quirúrgica",
    },
    {
      id: 8,
      nombre: "Anticoncepción Quirúrgica Voluntaria Masculina",
      categoria: "Quirúrgica",
    },
    {
      id: 9,
      nombre: "Dispositivo Intrauterino (DIU)",
      categoria: "Dispositivos",
    },
    { id: 10, nombre: "Inyección Trimestral", categoria: "Inyecciones" },
    { id: 11, nombre: "Píldora Anticonceptiva", categoria: "Orales" },
  ],

  // Helper: Convertir fecha a formato YYYY-MM-DD sin problemas de zona horaria
  formatearFechaParaDB(fechaInput) {
    if (!fechaInput) {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, "0");
      const day = String(hoy.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Si viene del input, ya está en formato correcto YYYY-MM-DD
    return fechaInput;
  },

  // ===== INICIALIZACIÓN =====
  async init() {
    console.log("🚀 Inicializando Registro V2.0...");

    try {
      await this.cargarDatosUsuario();
      this.setupEventListeners();
      this.renderMetodos();
      this.setFechaHoy();
      await this.cargarTablaUsuarias();

      console.log("✅ Sistema V2.0 inicializado correctamente");
    } catch (error) {
      console.error("❌ Error inicializando:", error);
      this.showToast(
        "Error al cargar el formulario: " + error.message,
        "error"
      );
    }
  },

  // ===== CARGAR DATOS DEL USUARIO (CORREGIDO) =====
  async cargarDatosUsuario() {
    const user = SGPF.getCurrentUser();

    console.log("👤 Usuario actual:", user);

    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // ✅ Actualizar header según rol (sin guardar comunidadId)
    this.actualizarHeaderAlcance(user);

    console.log("✅ Datos de usuario cargados correctamente");
  },

  // ===== ACTUALIZAR HEADER SEGÚN ROL (NUEVO) =====
  actualizarHeaderAlcance(user) {
    const headerElement = document.getElementById("header-alcance");
    if (!headerElement) return;

    if (user.rol === "auxiliar_enfermeria") {
      if (user.comunidades && user.comunidades.length > 0) {
        const nombresComunidades = user.comunidades
          .map((c) => c.nombre)
          .join(", ");
        headerElement.textContent = nombresComunidades;
      } else {
        headerElement.textContent = "Sin comunidades asignadas";
      }
    } else if (user.rol === "asistente_tecnico") {
      if (user.territorios && user.territorios.length > 0) {
        const nombresTerritorios = user.territorios
          .map((t) => t.nombre)
          .join(", ");
        headerElement.textContent = nombresTerritorios;
      } else {
        headerElement.textContent = "Asistente Técnico";
      }
    } else if (
      user.rol === "coordinador_municipal" ||
      user.rol === "encargado_sr"
    ) {
      headerElement.textContent = "Todos los territorios";
    } else {
      headerElement.textContent = "Sistema de Registro";
    }
  },

  // Configurar event listeners
  setupEventListeners() {
    // Enter en el campo DPI
    const dpiInput = document.getElementById("dpi-buscar");
    if (dpiInput) {
      dpiInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.buscarUsuaria();
        }
      });

      // Solo permitir números
      dpiInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
      });
    }
  },

  // Renderizar lista de métodos
  renderMetodos() {
    const container = document.getElementById("metodos-lista");
    if (!container) return;

    container.innerHTML = this.metodos
      .map(
        (metodo) => `
            <label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition">
                <input 
                    type="radio" 
                    name="metodo" 
                    value="${metodo.id}"
                    class="w-4 h-4 text-blue-600"
                    onchange="RegistroV2.seleccionarMetodo(${metodo.id})"
                >
                <span class="text-sm font-medium text-gray-700">${metodo.nombre}</span>
            </label>
        `
      )
      .join("");
  },

  // Establecer fecha de hoy por defecto
  setFechaHoy() {
    const fechaInput = document.getElementById("fecha-visita");
    if (fechaInput) {
      // Usar fecha local sin conversión UTC
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, "0");
      const day = String(hoy.getDate()).padStart(2, "0");
      const fechaHoy = `${year}-${month}-${day}`;

      fechaInput.value = fechaHoy;
      fechaInput.max = fechaHoy;

      console.log("📅 Fecha de hoy establecida:", fechaHoy);
    }
  },

  // ===== TABLA DE USUARIAS (SIMPLIFICADO) =====
  async cargarTablaUsuarias() {
    console.log("📋 Cargando tabla de usuarias...");
    const tbody = document.getElementById("tabla-usuarias-body");
    const sinUsuarias = document.getElementById("sin-usuarias");

    if (!tbody) {
      console.error("❌ No se encontró tabla-usuarias-body");
      return;
    }

    // Mostrar loading
    tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                    <div class="animate-pulse">Cargando usuarias...</div>
                </td>
            </tr>
        `;

    try {
      // ✅ UNA SOLA llamada - el backend filtra automáticamente por alcance
      const response = await SGPF.apiCall("/usuarias?limit=1000");

      if (!response.success || !response.data || !response.data.usuarias) {
        throw new Error("Error en respuesta del servidor");
      }

      const usuarias = response.data.usuarias;
      console.log(`✅ ${usuarias.length} usuarias encontradas`);

      if (usuarias.length > 0) {
        tbody.innerHTML = usuarias
          .map(
            (u) => `
                    <tr class="border-t border-gray-200 hover:bg-blue-50 transition">
                        <td class="px-4 py-3 text-gray-800">${u.nombres} ${
              u.apellidos
            }</td>
                        <td class="px-4 py-3 text-gray-600 text-sm">${
                          u.comunidad || "N/A"
                        }</td>
                        <td class="px-4 py-3">
                            <span class="${this.getColorTipo(
                              u.tipo_usuaria
                            )} text-xs font-semibold">
                                ${this.formatTipoSimple(u.tipo_usuaria)}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-gray-600 text-center">${
                          u.total_visitas || 0
                        }</td>
                        <td class="px-4 py-3 text-center">
                            <button 
                                onclick='RegistroV2.seleccionarDesdeTabla(${JSON.stringify(
                                  u
                                ).replace(/'/g, "&#39;")})'
                                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-all">
                                Seleccionar
                            </button>
                        </td>
                    </tr>
                `
          )
          .join("");

        if (sinUsuarias) sinUsuarias.classList.add("hidden");
      } else {
        tbody.innerHTML = "";
        if (sinUsuarias) sinUsuarias.classList.remove("hidden");
      }
    } catch (error) {
      console.error("❌ Error cargando usuarias:", error);
      tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-red-500">
                        Error cargando usuarias. Intente nuevamente.
                    </td>
                </tr>
            `;
    }
  },

  // Filtrar tabla en tiempo real
  filtrarTabla() {
    const filtro =
      document.getElementById("filtro-tabla")?.value.toLowerCase() || "";
    const filas = document.querySelectorAll("#tabla-usuarias-body tr");

    filas.forEach((fila) => {
      const texto = fila.textContent.toLowerCase();
      fila.style.display = texto.includes(filtro) ? "" : "none";
    });
  },

  // ===== SELECCIONAR USUARIA DESDE TABLA (CORREGIDO) =====
  async seleccionarDesdeTabla(usuaria) {
    console.log("👤 Usuaria seleccionada desde tabla:", usuaria);

    this.showLoading(true);

    try {
      // Buscar datos completos con historial
      const response = await SGPF.apiCall(`/usuarias/buscar/${usuaria.dpi}`);

      if (response.success && response.exists) {
        this.state.usuariaActual = response.data.usuaria;

        // Llenar el campo DPI
        const dpiInput = document.getElementById("dpi-buscar");
        if (dpiInput) dpiInput.value = usuaria.dpi;

        // Mostrar info
        this.mostrarUsuariaEncontrada(response.data);

        // Scroll suave al resultado
        setTimeout(() => {
          document.getElementById("resultado-busqueda")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      } else {
        this.showToast("Error cargando datos de la usuaria", "error");
      }
    } catch (error) {
      console.error("❌ Error cargando usuaria:", error);
      this.showToast("Error de conexión", "error");
    } finally {
      this.showLoading(false);
    }
  },

  // ===== PASO 1: BUSCAR USUARIA =====
  async buscarUsuaria() {
    const dpiInput = document.getElementById("dpi-buscar");
    const dpi = dpiInput?.value.trim();

    // Validación
    if (!dpi) {
      this.showToast("Ingrese el DPI de la usuaria", "warning");
      dpiInput?.focus();
      return;
    }

    if (!/^\d{13}$/.test(dpi)) {
      this.showToast("El DPI debe contener exactamente 13 dígitos", "error");
      dpiInput?.focus();
      return;
    }

    this.showLoading(true);

    try {
      const response = await SGPF.apiCall(`/usuarias/buscar/${dpi}`);

      if (response.success && response.exists) {
        // Usuaria encontrada
        this.state.usuariaActual = response.data.usuaria;
        this.mostrarUsuariaEncontrada(response.data);
      } else {
        // Usuaria NO encontrada
        this.mostrarFormularioNuevaUsuaria(dpi);
      }
    } catch (error) {
      console.error("❌ Error buscando usuaria:", error);

      // Si es error 403, significa que existe pero no tiene acceso
      if (error.message && error.message.includes("403")) {
        this.showToast(
          "Usuaria encontrada pero no está en su alcance",
          "error"
        );
      } else {
        this.showToast("Error de conexión. Intente nuevamente", "error");
      }
    } finally {
      this.showLoading(false);
    }
  },

  // Mostrar usuaria encontrada
  mostrarUsuariaEncontrada(data) {
    const usuaria = data.usuaria;
    const historial = data.historial_visitas || [];

    const resultadoDiv = document.getElementById("resultado-busqueda");
    resultadoDiv.className =
      "bg-green-50 border border-green-300 rounded-lg p-4";
    resultadoDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-green-600">
    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
</div>
                <div class="flex-1">
                    <h3 class="font-semibold text-green-800 mb-2">Usuaria Encontrada</h3>
                    <div class="text-sm text-gray-700 space-y-1">
                        <p><strong>Nombre:</strong> ${usuaria.nombres} ${
      usuaria.apellidos
    }</p>
                        <p><strong>DPI:</strong> ${usuaria.dpi}</p>
                        <p><strong>Comunidad:</strong> ${
                          usuaria.comunidad_nombre || "N/A"
                        }</p>
                        <p><strong>Tipo:</strong> <span class="font-semibold ${this.getColorTipo(
                          usuaria.tipo_usuaria
                        )}">${this.formatTipo(usuaria.tipo_usuaria)}</span></p>
                        <p><strong>Total Visitas:</strong> ${
                          usuaria.total_visitas || 0
                        }</p>
                        ${
                          usuaria.fecha_ultima_visita
                            ? `<p><strong>Última Visita:</strong> ${this.formatFecha(
                                usuaria.fecha_ultima_visita
                              )}</p>`
                            : ""
                        }
                    </div>
                    <button 
                        onclick="RegistroV2.continuarConUsuaria()"
                        class="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all">
                        Continuar con esta Usuaria →
                    </button>
                </div>
            </div>
        `;
    resultadoDiv.classList.remove("hidden");

    // Mostrar historial si existe
    if (historial.length > 0) {
      this.mostrarHistorial(historial);
    }
  },

  // Mostrar formulario para nueva usuaria
  mostrarFormularioNuevaUsuaria(dpi) {
    const resultadoDiv = document.getElementById("resultado-busqueda");
    resultadoDiv.className =
      "bg-yellow-50 border border-yellow-300 rounded-lg p-4";
    resultadoDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-yellow-600">
    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
</div>
                <div class="flex-1">
                    <h3 class="font-semibold text-yellow-800 mb-2">Usuaria No Encontrada</h3>
                    <p class="text-sm text-gray-700 mb-4">
                        No existe ninguna usuaria registrada con el DPI <strong>${dpi}</strong>.
                        <br>Complete los datos para registrarla como nueva usuaria.
                    </p>
                    <button 
                        onclick="RegistroV2.irPaso2('${dpi}')"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all">
                        Registrar Nueva Usuaria →
                    </button>
                </div>
            </div>
        `;
    resultadoDiv.classList.remove("hidden");
  },

  // ===== PASO 2: CREAR USUARIA =====
  async irPaso2(dpi) {
    if (!/^\d{13}$/.test(dpi)) {
      this.showToast(
        "DPI inválido. Debe contener exactamente 13 dígitos",
        "error"
      );
      return;
    }

    this.state.pasoActual = 2;
    this.actualizarIndicadores();

    // Pre-llenar DPI
    const dpiInput = document.getElementById("usuaria-dpi");
    if (dpiInput) {
      dpiInput.value = dpi;
      dpiInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 13);
      });
    }

    // ✅ Cargar comunidades permitidas (usando nuevo endpoint)
    await this.cargarComunidadesPermitidas();

    // Mostrar paso 2, ocultar paso 1
    document.getElementById("paso-1")?.classList.add("hidden");
    document.getElementById("paso-2")?.classList.remove("hidden");

    // Focus en nombres
    document.getElementById("usuaria-nombres")?.focus();
  },

  // ===== CARGAR COMUNIDADES PERMITIDAS (CORREGIDO V2.1) =====
  async cargarComunidadesPermitidas() {
    const select = document.getElementById("usuaria-comunidad");
    if (!select) return;

    try {
      select.innerHTML = '<option value="">Cargando comunidades...</option>';

      // ✅ Obtener comunidades del usuario (ya filtradas por backend)
      const user = SGPF.getCurrentUser();

      if (!user || !user.comunidades || user.comunidades.length === 0) {
        select.innerHTML =
          '<option value="">Sin comunidades asignadas</option>';
        this.showToast(
          "No tiene comunidades asignadas para registro",
          "warning"
        );
        console.warn("⚠️ Usuario sin comunidades asignadas");
        return;
      }

      const comunidades = user.comunidades;

      // Llenar select con solo las comunidades asignadas
      select.innerHTML = comunidades
        .map(
          (c) =>
            `<option value="${c.id}">${c.nombre} (${
              c.codigo_comunidad || c.codigo || "N/A"
            })</option>`
        )
        .join("");

      // Seleccionar la primera por defecto
      if (comunidades.length > 0) {
        select.value = comunidades[0].id;
      }

      console.log(
        `✅ ${comunidades.length} comunidades cargadas (solo asignadas)`
      );
      console.log(
        "   Comunidades:",
        comunidades.map((c) => c.nombre).join(", ")
      );
    } catch (error) {
      console.error("❌ Error cargando comunidades:", error);
      select.innerHTML = '<option value="">Error cargando comunidades</option>';
      this.showToast("Error cargando comunidades", "error");
    }
  },

  // ===== CREAR USUARIA (CORREGIDO) =====
  async crearUsuaria() {
    const dpi = document.getElementById("usuaria-dpi")?.value.trim();
    const nombres = document.getElementById("usuaria-nombres")?.value.trim();
    const apellidos = document
      .getElementById("usuaria-apellidos")
      ?.value.trim();
    const comunidadId = document.getElementById("usuaria-comunidad")?.value;
    const fechaNac = document.getElementById("usuaria-fecha-nac")?.value;
    const telefono = document.getElementById("usuaria-telefono")?.value.trim();

    // Validaciones...
    if (!dpi) {
      this.showToast("Ingrese el DPI", "warning");
      document.getElementById("usuaria-dpi")?.focus();
      return;
    }

    if (!/^\d{13}$/.test(dpi)) {
      this.showToast(
        "DPI inválido. Debe contener EXACTAMENTE 13 dígitos numéricos",
        "error"
      );
      document.getElementById("usuaria-dpi")?.focus();
      return;
    }

    if (!nombres || !apellidos) {
      this.showToast("Complete nombres y apellidos", "warning");
      return;
    }

    if (!comunidadId) {
      this.showToast("Seleccione una comunidad", "warning");
      return;
    }

    this.showLoading(true);

    try {
      const response = await SGPF.apiCall("/usuarias", "POST", {
        dpi: dpi,
        nombres: nombres,
        apellidos: apellidos,
        comunidad_id: parseInt(comunidadId),
        fecha_nacimiento: fechaNac || null,
        telefono: telefono || null,
      });

      this.showLoading(false); // ✅ Ocultar loading

      if (response.success) {
        this.showToast("Usuaria creada exitosamente", "success");

        console.log("✅ Usuaria creada:", response.data);

        // ✅ NUEVO: Esperar 1 segundo y recargar el paso 1
        setTimeout(async () => {
          // Volver al paso 1
          this.state.pasoActual = 1;
          this.state.usuariaActual = null;

          // Ocultar paso 2
          document.getElementById("paso-2")?.classList.add("hidden");
          document.getElementById("paso-1")?.classList.remove("hidden");

          // Actualizar indicadores
          this.actualizarIndicadores();

          // Pre-llenar el DPI en el buscador
          const dpiInput = document.getElementById("dpi-buscar");
          if (dpiInput) {
            dpiInput.value = dpi;
          }

          // Recargar tabla para que aparezca la nueva usuaria
          await this.cargarTablaUsuarias();

          // Buscar automáticamente la usuaria recién creada
          setTimeout(() => {
            this.buscarUsuaria();
          }, 500);
        }, 1000);
      } else {
        this.showToast(response.message || "Error al crear usuaria", "error");
      }
    } catch (error) {
      this.showLoading(false);
      console.error("❌ Error creando usuaria:", error);
      this.showToast("Error de conexión. Intente nuevamente", "error");
    }
  },

  // Helper: Obtener nombre de comunidad del select
  obtenerNombreComunidadDelSelect(comunidadId) {
    const select = document.getElementById("usuaria-comunidad");
    if (!select) return "N/A";

    const option = select.querySelector(`option[value="${comunidadId}"]`);
    return option ? option.textContent.split("(")[0].trim() : "N/A";
  },

  cancelarCreacion() {
    document.getElementById("paso-2")?.classList.add("hidden");
    document.getElementById("paso-1")?.classList.remove("hidden");
    this.state.pasoActual = 1;
    this.actualizarIndicadores();

    // Limpiar campos
    document.getElementById("usuaria-nombres").value = "";
    document.getElementById("usuaria-apellidos").value = "";
    document.getElementById("usuaria-fecha-nac").value = "";
    document.getElementById("usuaria-telefono").value = "";
  },

  // ===== PASO 3: REGISTRAR VISITA =====
  continuarConUsuaria() {
    this.state.pasoActual = 3;
    this.actualizarIndicadores();

    // Ocultar pasos anteriores
    document.getElementById("paso-1")?.classList.add("hidden");
    document.getElementById("paso-2")?.classList.add("hidden");
    document.getElementById("resultado-busqueda")?.classList.add("hidden");

    // Mostrar paso 3
    document.getElementById("paso-3")?.classList.remove("hidden");

    // Llenar info de usuaria
    const usuaria = this.state.usuariaActual;
    document.getElementById(
      "visita-usuaria-nombre"
    ).textContent = `${usuaria.nombres} ${usuaria.apellidos}`;
    document.getElementById("visita-usuaria-dpi").textContent = usuaria.dpi;
    document.getElementById("visita-usuaria-comunidad").textContent =
      usuaria.comunidad_nombre || "N/A";
    document.getElementById("visita-usuaria-tipo").textContent =
      this.formatTipo(usuaria.tipo_usuaria);
    document.getElementById(
      "visita-usuaria-tipo"
    ).className = `font-semibold ${this.getColorTipo(usuaria.tipo_usuaria)}`;
    document.getElementById("visita-usuaria-total").textContent =
      usuaria.total_visitas || 0;
  },

  seleccionarMetodo(metodoId) {
    this.state.metodoSeleccionado = metodoId;
    console.log("📌 Método seleccionado:", metodoId);
  },

  // ===== GUARDAR VISITA (CORREGIDO - CON COMUNIDAD_ID) =====
  async guardarVisita() {
    const fechaInput = document.getElementById("fecha-visita")?.value;
    const fechaVisita = this.formatearFechaParaDB(fechaInput);
    const observaciones = document
      .getElementById("observaciones-visita")
      ?.value.trim();

    // Validaciones
    if (!this.state.metodoSeleccionado) {
      this.showToast("Seleccione un método anticonceptivo", "warning");
      return;
    }

    if (!fechaVisita) {
      this.showToast("Seleccione la fecha de la visita", "warning");
      return;
    }

    if (!this.state.usuariaActual || !this.state.usuariaActual.id) {
      this.showToast("Error: usuaria no seleccionada", "error");
      return;
    }

    console.log("📅 Guardando visita:", {
      usuaria_id: this.state.usuariaActual.id,
      comunidad_id: this.state.usuariaActual.comunidad_id,
      metodo_id: this.state.metodoSeleccionado,
      fecha_visita: fechaVisita,
    });

    this.showLoading(true);

    try {
      const response = await SGPF.apiCall("/visitas", "POST", {
        usuaria_id: this.state.usuariaActual.id,
        comunidad_id: this.state.usuariaActual.comunidad_id,
        metodo_id: this.state.metodoSeleccionado,
        fecha_visita: fechaVisita,
        observaciones: observaciones || null,
      });

      // ✅ CRÍTICO: Ocultar loading ANTES de mostrar toast
      this.showLoading(false);

      if (response.success) {
        this.showToast("Visita registrada exitosamente", "success");

        console.log("✅ Visita guardada:", response.data);

        // Esperar 1.5 segundos y reiniciar formulario (sin recargar)
        setTimeout(() => {
          this.volverBuscar();
        }, 1500);
      } else {
        this.showToast(response.message || "Error al guardar visita", "error");
      }
    } catch (error) {
      // ✅ También ocultar en caso de error
      this.showLoading(false);
      console.error("❌ Error guardando visita:", error);
      this.showToast("Error de conexión. Intente nuevamente", "error");
    }
  },

  volverBuscar() {
    // Reiniciar estado
    this.state.pasoActual = 1;
    this.state.usuariaActual = null;
    this.state.metodoSeleccionado = null;

    // Limpiar y mostrar paso 1
    document.getElementById("dpi-buscar").value = "";
    document.getElementById("resultado-busqueda")?.classList.add("hidden");
    document.getElementById("paso-1")?.classList.remove("hidden");
    document.getElementById("paso-2")?.classList.add("hidden");
    document.getElementById("paso-3")?.classList.add("hidden");
    document.getElementById("historial-section")?.classList.add("hidden");

    // Limpiar formulario de visita
    document
      .querySelectorAll('input[name="metodo"]')
      .forEach((radio) => (radio.checked = false));
    document.getElementById("observaciones-visita").value = "";
    this.setFechaHoy();

    this.actualizarIndicadores();

    // Recargar tabla
    this.cargarTablaUsuarias();
  },

  volverDashboard() {
    if (window.ComponentLoader && window.ComponentLoader.navigateToView) {
      window.ComponentLoader.navigateToView("dashboard");
    } else {
      window.location.reload();
    }
  },

  // ===== HELPERS =====
  actualizarIndicadores() {
    [1, 2, 3].forEach((paso) => {
      const indicator = document.getElementById(`paso-${paso}-indicator`);
      if (!indicator) return;

      const circle = indicator.querySelector("div");
      const text = indicator.querySelector("span");

      if (paso <= this.state.pasoActual) {
        circle.className =
          "w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold";
        text.className = "text-sm font-semibold text-gray-700";
      } else {
        circle.className =
          "w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold";
        text.className = "text-sm text-gray-500";
      }
    });
  },

  mostrarHistorial(visitas) {
    const section = document.getElementById("historial-section");
    const content = document.getElementById("historial-content");

    if (!section || !content || visitas.length === 0) return;

    content.innerHTML = visitas
      .map(
        (v) => `
            <div class="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                    <span class="font-medium text-gray-800">${v.metodo}</span>
                    <span class="text-xs text-gray-500 ml-2">${this.formatFecha(
                      v.fecha_visita
                    )}</span>
                </div>
                <span class="text-xs text-gray-600">${v.registrado_por}</span>
            </div>
        `
      )
      .join("");

    section.classList.remove("hidden");
  },

  formatTipo(tipo) {
    const tipos = {
      nueva: "🆕 Nueva",
      reconsulta: "🔄 Reconsulta",
      activa: "⭐ Activa",
    };
    return tipos[tipo] || tipo;
  },

  formatTipoSimple(tipo) {
    const tipos = {
      nueva: "Nueva",
      reconsulta: "Reconsulta",
      activa: "Activa",
    };
    return tipos[tipo] || tipo;
  },

  getColorTipo(tipo) {
    const colores = {
      nueva: "text-green-600",
      reconsulta: "text-blue-600",
      activa: "text-purple-600",
    };
    return colores[tipo] || "text-gray-600";
  },

  formatFecha(fecha) {
    if (!fecha) return "-";

    // Si viene en formato ISO (YYYY-MM-DD), parsearlo correctamente sin zona horaria
    if (typeof fecha === "string" && fecha.includes("-")) {
      const [year, month, day] = fecha.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Guatemala", // ✅ Forzar zona horaria de Guatemala
      });
    }

    // Si viene como timestamp
    const date = new Date(fecha);
    return date.toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Guatemala", // ✅ Forzar zona horaria de Guatemala
    });
  },

  // UI Helpers
  showLoading(show) {
    const overlay = document.getElementById("loading-overlay-v2");
    if (overlay) {
      overlay.className = show
        ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        : "hidden";
    }
  },

  showToast(message, type = "info") {
    if (typeof SGPF !== "undefined" && SGPF.showToast) {
      SGPF.showToast(message, type);
    } else {
      alert(message);
    }
  },
};

console.log("✅ Sistema de Registro V2.0 cargado correctamente");
