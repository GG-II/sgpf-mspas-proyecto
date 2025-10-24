// ===== js/validacion.js - SISTEMA DE VALIDACIÓN CON SWIPE MÓVIL =====
window.ValidacionSystem = window.ValidacionSystem || {
  // Variables internas
  registrosPendientes: [],
  registrosFiltrados: [],
  accionPendiente: null,
  registroSeleccionado: null,

  // ===== INICIALIZAR SISTEMA =====
  async init() {
    console.log("🔍 Inicializando sistema de validación...");

    // Delay para renderizado DOM completo
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // Verificar que el usuario tenga permisos de validación
      const user = SGPF.getCurrentUser();
      const rolNormalizado = SGPF.getNormalizedRole();

      if (
        !user ||
        (rolNormalizado !== "asistente" && rolNormalizado !== "encargado")
      ) {
        console.error("❌ Usuario sin permisos de validación");
        SGPF.showToast("No tienes permisos para validar registros", "error");
        ComponentLoader.navigateToView("dashboard");
        return;
      }

      // Configurar información del usuario
      this.configurarInfoUsuario(user, rolNormalizado);

      // Cargar registros primero, luego los filtros
      await this.cargarRegistrosPendientes();
      await this.cargarFiltros();

      console.log("✅ Sistema de validación inicializado");
    } catch (error) {
      console.error("❌ Error inicializando validación:", error);
      SGPF.showToast("Error cargando sistema de validación", "error");
    }
  },

  // ===== CONFIGURAR INFORMACIÓN DE USUARIO =====
  configurarInfoUsuario(user, rol) {
    const territorioElement = document.getElementById("validacion-territorio");
    if (territorioElement) {
      const descripcion =
        rol === "encargado"
          ? "Supervisa y valida registros de todo el distrito"
          : "Valida registros de tu territorio asignado";
      territorioElement.textContent = descripcion;
    }
  },

  // ===== CARGAR REGISTROS PENDIENTES =====
  async cargarRegistrosPendientes() {
    try {
      console.log("📋 Cargando visitas pendientes...");

      const loadingElement = document.getElementById("validacion-loading");
      const containerElement = document.getElementById("registros-container");
      const sinRegistrosElement = document.getElementById(
        "sin-registros-mensaje"
      );

      // MOSTRAR LOADING
      if (loadingElement) loadingElement.classList.remove("hidden");
      if (containerElement) containerElement.classList.add("hidden");
      if (sinRegistrosElement) sinRegistrosElement.classList.add("hidden");

      // ✅ Usar endpoint de visitas con filtro de estado
      const response = await SGPF.apiCall(
        "/visitas?estado=registrado&limit=100"
      );

      if (response && response.success && response.data.visitas) {
        // Mapear estructura de visitas a estructura esperada
        this.registrosPendientes = response.data.visitas.map((v) => ({
          id: v.id,
          metodo: v.metodo,
          metodo_corto: v.nombre_corto,
          comunidad: v.comunidad,
          codigo_comunidad: v.codigo_comunidad,
          territorio: v.territorio,
          registrado_por: v.registrado_por,
          cargo_registrador: "Auxiliar de Enfermería",
          cantidad_administrada: 1,
          fecha_hora_registro: v.fecha_hora_registro,
          usuaria_nombre: v.usuaria_nombre,
          tipo_usuaria: v.tipo_usuaria,
          estado: v.estado,
        }));

        this.registrosFiltrados = [...this.registrosPendientes];

        console.log(
          `✅ ${this.registrosPendientes.length} visitas pendientes cargadas`
        );

        // OCULTAR LOADING ANTES DE MOSTRAR
        if (loadingElement) loadingElement.classList.add("hidden");

        this.actualizarResumen();
        this.mostrarRegistros();
      } else {
        // OCULTAR LOADING ANTES DE MOSTRAR MENSAJE
        if (loadingElement) loadingElement.classList.add("hidden");
        this.mostrarSinRegistros();
      }
    } catch (error) {
      console.error("❌ Error cargando visitas:", error);

      // OCULTAR LOADING EN CASO DE ERROR
      const loadingElement = document.getElementById("validacion-loading");
      if (loadingElement) loadingElement.classList.add("hidden");

      this.mostrarError("Error cargando visitas pendientes");
    }
  },

  // ===== ACTUALIZAR RESUMEN =====
  actualizarResumen() {
    const registros = this.registrosFiltrados;

    // Total pendientes
    const totalElement = document.getElementById("total-pendientes");
    if (totalElement) totalElement.textContent = registros.length;

    // Comunidades únicas
    const comunidadesUnicas = new Set(
      registros.map((r) => r.comunidad || "N/A")
    ).size;
    const comunidadesElement = document.getElementById("total-comunidades");
    if (comunidadesElement) comunidadesElement.textContent = comunidadesUnicas;

    // Total usuarias
    const totalUsuarias = registros.reduce(
      (sum, r) => sum + (parseInt(r.cantidad_administrada) || 0),
      0
    );
    const usuariasElement = document.getElementById("total-usuarias");
    if (usuariasElement) usuariasElement.textContent = totalUsuarias;
  },

  // ===== MOSTRAR REGISTROS CON SWIPE =====
  mostrarRegistros() {
    const containerElement = document.getElementById("registros-container");
    const sinRegistrosElement = document.getElementById("sin-registros-mensaje");
    const loadingElement = document.getElementById("validacion-loading");

    if (!containerElement) {
      console.error("❌ Container de registros no encontrado");
      return;
    }

    console.log(`📦 Mostrando ${this.registrosFiltrados.length} registros`);

    // ASEGURAR QUE LOADING ESTÉ OCULTO
    if (loadingElement) loadingElement.classList.add("hidden");

    if (this.registrosFiltrados.length === 0) {
      containerElement.classList.add("hidden");
      if (sinRegistrosElement) {
        sinRegistrosElement.classList.remove("hidden");
      }
      return;
    }

    // Limpiar container
    containerElement.innerHTML = "";
    containerElement.classList.remove("hidden");
    if (sinRegistrosElement) sinRegistrosElement.classList.add("hidden");

    // Crear cards y habilitar swipe
    this.registrosFiltrados.forEach((registro) => {
      const card = this.crearCardRegistro(registro);
      containerElement.appendChild(card);
      
      // ✅ HABILITAR SWIPE EN LA CARD
      this.habilitarSwipe(card, registro.id);
    });

    console.log("✅ Registros renderizados con swipe habilitado");
  },

  // ===== CREAR CARD DE REGISTRO =====
  crearCardRegistro(registro) {
    const card = document.createElement("div");
    card.className = "registro-card";
    card.setAttribute("data-registro-id", registro.id);

    const badgeColor =
      registro.tipo_usuaria === "nueva"
        ? "badge-nueva"
        : registro.tipo_usuaria === "reconsulta"
        ? "badge-reconsulta"
        : "badge-activa";

    card.innerHTML = `
      <!-- Indicadores de Swipe -->
      <div class="swipe-indicator left">✗</div>
      <div class="swipe-indicator right">✓</div>

      <!-- Header del Card -->
      <div style="background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%); padding: 1.5rem; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #2C3E50; margin-bottom: 0.5rem;">
              ${registro.metodo || "Método Desconocido"}
            </h3>
            <p style="font-size: 0.875rem; color: #6B7280;">
              ${registro.usuaria_nombre || "Usuaria sin nombre"}
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span style="padding: 0.25rem 0.75rem; background: #FEF3C7; color: #92400E; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">
              Pendiente
            </span>
            <span class="${badgeColor}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; text-transform: capitalize;">
              ${registro.tipo_usuaria || "N/A"}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Detalles del Registro -->
      <div style="padding: 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <!-- Auxiliar -->
          <div>
            <p style="font-size: 0.75rem; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Auxiliar</p>
            <p style="font-size: 0.9375rem; font-weight: 600; color: #2C3E50;">${registro.registrado_por || "N/A"}</p>
            <p style="font-size: 0.875rem; color: #6B7280;">${registro.cargo_registrador || ""}</p>
          </div>
          
          <!-- Comunidad -->
          <div>
            <p style="font-size: 0.75rem; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Comunidad</p>
            <p style="font-size: 0.9375rem; font-weight: 600; color: #2C3E50;">${registro.comunidad || "N/A"}</p>
            <p style="font-size: 0.875rem; color: #6B7280;">${registro.codigo_comunidad || ""}</p>
          </div>
          
          <!-- Fecha -->
          <div>
            <p style="font-size: 0.75rem; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Fecha</p>
            <p style="font-size: 0.9375rem; font-weight: 600; color: #2C3E50;">${this.formatearFecha(registro.fecha_hora_registro)}</p>
          </div>
          
          <!-- Cantidad -->
          <div>
            <p style="font-size: 0.75rem; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">Cantidad</p>
            <p style="font-size: 0.9375rem; font-weight: 600; color: #2C3E50;">${registro.cantidad_administrada || 1}</p>
          </div>
        </div>
        
        <!-- Botones (Desktop) -->
        <div class="desktop-buttons" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button onclick="ValidacionSystem.rechazarRegistro(${registro.id})" 
                  style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Rechazar
          </button>
          <button onclick="ValidacionSystem.validarRegistro(${registro.id})" 
                  style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00A651 0%, #00853D 100%); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Validar
          </button>
        </div>
      </div>
    `;

    return card;
  },

  // ===== 📱 HABILITAR SWIPE EN MÓVIL =====
  habilitarSwipe(card, registroId) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    // Solo en dispositivos móviles
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      console.log("💻 Desktop detectado - Swipe deshabilitado");
      return;
    }

    console.log(`📱 Swipe habilitado para registro ${registroId}`);
    
    // Touch Start
    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      card.style.transition = 'none';
    });
    
    // Touch Move
    card.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      
      // Aplicar transform
      card.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
      
      // Cambiar apariencia según dirección
      if (diff < -50) {
        card.classList.add('swiping-left');
        card.classList.remove('swiping-right');
      } else if (diff > 50) {
        card.classList.add('swiping-right');
        card.classList.remove('swiping-left');
      } else {
        card.classList.remove('swiping-left', 'swiping-right');
      }
    });
    
    // Touch End
    card.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      const diff = currentX - startX;
      
      card.style.transition = 'all 0.3s ease-out';
      
      // Umbral de swipe: 120px
      if (diff < -120) {
        // SWIPE LEFT - RECHAZAR
        console.log(`👈 Swipe LEFT detectado - Rechazando ${registroId}`);
        this.animarRechazo(card, registroId);
      } else if (diff > 120) {
        // SWIPE RIGHT - VALIDAR
        console.log(`👉 Swipe RIGHT detectado - Validando ${registroId}`);
        this.animarValidacion(card, registroId);
      } else {
        // Volver a posición original
        card.style.transform = '';
        card.classList.remove('swiping-left', 'swiping-right');
      }
      
      startX = 0;
      currentX = 0;
    });
  },

  // ===== 📱 ANIMACIÓN VALIDAR (SWIPE RIGHT) =====
  async animarValidacion(card, registroId) {
    // Animar salida a la derecha
    card.style.transform = 'translateX(150%) rotate(20deg)';
    card.style.opacity = '0';
    
    // Esperar animación
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Ejecutar validación SIN modal
    await this.ejecutarValidacion(registroId);
  },

  // ===== 📱 ANIMACIÓN RECHAZAR (SWIPE LEFT) =====
  async animarRechazo(card, registroId) {
    // Animar salida a la izquierda
    card.style.transform = 'translateX(-150%) rotate(-20deg)';
    card.style.opacity = '0';
    
    // Esperar animación
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Ejecutar rechazo SIN modal
    await this.ejecutarRechazo(registroId);
  },

  // ===== VALIDAR REGISTRO (CON MODAL EN DESKTOP) =====
  validarRegistro(registroId) {
    // En desktop: Mostrar modal
    // En móvil: El swipe ya maneja la animación
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Móvil: Ejecutar directo (viene del botón)
      this.ejecutarValidacion(registroId);
    } else {
      // Desktop: Mostrar modal
      this.mostrarModal(
        "Validar Registro",
        "¿Confirmar validación de este registro?",
        () => this.ejecutarValidacion(registroId)
      );
    }
  },

  // ===== RECHAZAR REGISTRO (CON MODAL EN DESKTOP) =====
  rechazarRegistro(registroId) {
    // En desktop: Mostrar modal
    // En móvil: El swipe ya maneja la animación
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Móvil: Ejecutar directo (viene del botón)
      this.ejecutarRechazo(registroId);
    } else {
      // Desktop: Mostrar modal
      this.mostrarModal(
        "Eliminar Registro",
        "⚠️ ATENCIÓN: Este registro será eliminado permanentemente. ¿Está seguro?",
        () => this.ejecutarRechazo(registroId)
      );
    }
  },

  // ===== EJECUTAR VALIDACIÓN =====
  async ejecutarValidacion(registroId) {
    try {
      // Cerrar modal si existe
      const modal = document.getElementById("modal-confirmacion");
      if (modal) modal.classList.add("hidden");

      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/validacion/registro/${registroId}`,
        "PUT",
        {
          accion: "aprobar",
          observaciones_validacion: "Validado en módulo de validación",
        }
      );

      if (response && response.success) {
        SGPF.showToast("✅ Registro validado exitosamente", "success");
        await this.cargarRegistrosPendientes();
      } else {
        throw new Error(response?.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error validando registro:", error);
      SGPF.showToast("Error al validar registro", "error");
    } finally {
      SGPF.showLoading(false);
    }
  },

  // ===== EJECUTAR RECHAZO =====
  async ejecutarRechazo(registroId) {
    try {
      // Cerrar modal si existe
      const modal = document.getElementById("modal-confirmacion");
      if (modal) modal.classList.add("hidden");

      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/validacion/registro/${registroId}`,
        "DELETE"
      );

      if (response && response.success) {
        SGPF.showToast("🗑️ Registro eliminado permanentemente", "success");
        await this.cargarRegistrosPendientes();
      } else {
        throw new Error(response?.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error eliminando registro:", error);
      SGPF.showToast("Error al eliminar registro", "error");
    } finally {
      SGPF.showLoading(false);
    }
  },

  // ===== CARGAR FILTROS =====
  async cargarFiltros() {
    try {
      console.log(
        "🔍 Cargando filtros con registros:",
        this.registrosPendientes.length
      );

      if (!this.registrosPendientes || this.registrosPendientes.length === 0) {
        console.log("⚠️ No hay registros para generar filtros");
        return;
      }

      // Extraer comunidades únicas de los registros
      const comunidades = [
        ...new Set(
          this.registrosPendientes.map((r) => r.comunidad).filter((c) => c)
        ),
      ];
      const auxiliares = [
        ...new Set(
          this.registrosPendientes.map((r) => r.registrado_por).filter((a) => a)
        ),
      ];

      console.log(
        "📍 Comunidades encontradas:",
        comunidades.length,
        comunidades
      );
      console.log("👥 Auxiliares encontrados:", auxiliares.length, auxiliares);

      // Llenar selector de comunidades
      const comunidadSelect = document.getElementById("filtro-comunidad");
      if (comunidadSelect && comunidades.length > 0) {
        comunidadSelect.innerHTML =
          '<option value="">Todas las comunidades</option>' +
          comunidades
            .sort()
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("");
        console.log("✅ Selector de comunidades actualizado");
      }

      // Llenar selector de auxiliares
      const auxiliarSelect = document.getElementById("filtro-auxiliar");
      if (auxiliarSelect && auxiliares.length > 0) {
        auxiliarSelect.innerHTML =
          '<option value="">Todos los auxiliares</option>' +
          auxiliares
            .sort()
            .map((a) => `<option value="${a}">${a}</option>`)
            .join("");
        console.log("✅ Selector de auxiliares actualizado");
      }
    } catch (error) {
      console.error("❌ Error cargando filtros:", error);
    }
  },

  // ===== APLICAR FILTROS =====
  aplicarFiltros() {
    const comunidadFiltro =
      document.getElementById("filtro-comunidad")?.value || "";
    const auxiliarFiltro =
      document.getElementById("filtro-auxiliar")?.value || "";
    const busquedaFiltro =
      document.getElementById("buscar-registro")?.value.toLowerCase() || "";

    this.registrosFiltrados = this.registrosPendientes.filter((registro) => {
      const cumpleComunidad =
        !comunidadFiltro || registro.comunidad === comunidadFiltro;
      const cumpleAuxiliar =
        !auxiliarFiltro || registro.registrado_por === auxiliarFiltro;
      const cumpleBusqueda =
        !busquedaFiltro ||
        (registro.metodo &&
          registro.metodo.toLowerCase().includes(busquedaFiltro)) ||
        (registro.comunidad &&
          registro.comunidad.toLowerCase().includes(busquedaFiltro)) ||
        (registro.registrado_por &&
          registro.registrado_por.toLowerCase().includes(busquedaFiltro));

      return cumpleComunidad && cumpleAuxiliar && cumpleBusqueda;
    });

    this.actualizarResumen();
    this.mostrarRegistros();
  },

  // ===== LIMPIAR FILTROS =====
  limpiarFiltros() {
    document.getElementById("filtro-comunidad").value = "";
    document.getElementById("filtro-auxiliar").value = "";
    document.getElementById("buscar-registro").value = "";
    this.aplicarFiltros();
  },

  // ===== VALIDAR TODOS =====
  validarTodos() {
    if (this.registrosFiltrados.length === 0) {
      SGPF.showToast("No hay registros para validar", "warning");
      return;
    }

    this.mostrarModal(
      "Validar Todos",
      `¿Confirmar validación de ${this.registrosFiltrados.length} registros?`,
      () => this.ejecutarValidacionMasiva()
    );
  },

  // ===== EJECUTAR VALIDACIÓN MASIVA =====
  async ejecutarValidacionMasiva() {
    try {
      const modal = document.getElementById("modal-confirmacion");
      if (modal) modal.classList.add("hidden");

      SGPF.showLoading(true);

      let exitosos = 0;
      let errores = 0;

      for (const registro of this.registrosFiltrados) {
        try {
          const response = await SGPF.apiCall(
            `/validacion/registro/${registro.id}`,
            "PUT",
            {
              accion: "aprobar",
              observaciones_validacion: "Validación masiva",
            }
          );

          if (response && response.success) {
            exitosos++;
          } else {
            errores++;
          }
        } catch (error) {
          errores++;
          console.error(`Error validando registro ${registro.id}:`, error);
        }
      }

      SGPF.showToast(
        `Validación completa: ${exitosos} exitosos, ${errores} errores`,
        "success"
      );
      await this.cargarRegistrosPendientes();
    } catch (error) {
      console.error("❌ Error en validación masiva:", error);
      SGPF.showToast("Error en validación masiva", "error");
    } finally {
      SGPF.showLoading(false);
    }
  },

  // ===== MOSTRAR MODAL =====
  mostrarModal(titulo, mensaje, accionConfirmar) {
    const modal = document.getElementById("modal-confirmacion");
    const tituloElement = document.getElementById("modal-titulo");
    const mensajeElement = document.getElementById("modal-mensaje");

    if (modal && tituloElement && mensajeElement) {
      tituloElement.textContent = titulo;
      mensajeElement.textContent = mensaje;
      modal.classList.remove("hidden");

      this.accionPendiente = accionConfirmar;
    }
  },

  // ===== EJECUTAR ACCIÓN CONFIRMADA =====
  ejecutarAccionConfirmada() {
    if (this.accionPendiente) {
      this.accionPendiente();
      this.accionPendiente = null;
    }
  },

  // ===== MOSTRAR SIN REGISTROS =====
  mostrarSinRegistros() {
    const containerElement = document.getElementById("registros-container");
    const sinRegistrosElement = document.getElementById(
      "sin-registros-mensaje"
    );

    if (containerElement) containerElement.classList.add("hidden");
    if (sinRegistrosElement) sinRegistrosElement.classList.remove("hidden");

    this.actualizarResumen();
  },

  // ===== MOSTRAR ERROR =====
  mostrarError(mensaje) {
    const containerElement = document.getElementById("registros-container");
    if (containerElement) {
      containerElement.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <svg style="width: 3rem; height: 3rem; color: #EF4444; margin: 0 auto 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #2C3E50; margin-bottom: 0.5rem;">⚠️ ${mensaje}</h3>
          <button onclick="ValidacionSystem.cargarRegistrosPendientes()" 
                  style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #0066CC; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">
            Intentar de nuevo
          </button>
        </div>
      `;
      containerElement.classList.remove("hidden");
    }
  },

  // ===== FUNCIÓN DE UTILIDAD =====
  formatearFecha(fecha) {
    if (!fecha) return "--";
    return new Date(fecha).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  },
};