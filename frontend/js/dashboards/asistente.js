window.AsistenteDashboard = window.AsistenteDashboard || {
  // ===== INICIALIZAR DASHBOARD =====
// ===== INICIALIZAR DASHBOARD =====
async init() {
    console.log('🏥 Inicializando dashboard asistente técnico');
    
    // AGREGAR ESTE DELAY PARA ESPERAR EL DOM
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
        // Verificar que el usuario sea asistente técnico
        const user = SGPF.getCurrentUser();
        if (!user || user.rol !== 'asistente_tecnico') {
            console.error('❌ Usuario no es asistente técnico');
            return;
        }

        // Cargar datos en paralelo
        await Promise.all([
            this.cargarDatosUsuario(),
            this.cargarEstadisticasTerritoriales(),
            this.cargarRegistrosPendientes(),
            this.cargarInfoTerritorio()
        ]);

        console.log('✅ Dashboard asistente técnico cargado');
        
    } catch (error) {
        console.error('❌ Error inicializando dashboard asistente:', error);
        SGPF.showToast('Error cargando dashboard', 'error');
    }
},

  // ===== CARGAR DATOS DEL USUARIO =====
  async cargarDatosUsuario() {
    const user = SGPF.getCurrentUser();

    // Actualizar nombre del usuario
    const nombreElement = document.getElementById("asistente-nombre");
    if (nombreElement) {
      nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
    }

    // Mostrar territorio asignado
    const territorioElement = document.getElementById("asistente-territorio");
    if (territorioElement) {
      // El backend debería proporcionar el territorio, por ahora simulamos
      territorioElement.textContent = "Territorio: Norte";
    }
  },

  // ===== CARGAR ESTADÍSTICAS TERRITORIALES =====
  async cargarEstadisticasTerritoriales() {
    try {
      const currentYear = new Date().getFullYear();

      // Obtener estadísticas de validación pendientes
      const response = await SGPF.apiCall("/validacion/pendientes");

      if (response.success) {
        // Pasar los registros pendientes correctamente
        const datosParaTarjetas = {
          registros: response.data.registros_pendientes || [],
        };
        this.actualizarTarjetasTerritoriales(datosParaTarjetas);
      }
    } catch (error) {
      console.error("❌ Error cargando estadísticas territoriales:", error);
      this.mostrarErrorEstadisticas();
    }
  },

  // ===== ACTUALIZAR TARJETAS TERRITORIALES =====
  actualizarTarjetasTerritoriales(data) {
    // 1. Comunidades activas (calculado de registros únicos)
    const comunidadesElement = document.getElementById("comunidades-activas");
    if (comunidadesElement && data.registros) {
      const comunidadesUnicas = new Set(
        data.registros.map((r) => r.comunidad_id)
      );
      comunidadesElement.textContent = comunidadesUnicas.size;
    }

    // 2. Registros pendientes de validación
    const pendientesElement = document.getElementById("registros-pendientes");
    if (pendientesElement && data.registros) {
      pendientesElement.textContent = data.registros.length;

      // Color según urgencia
      if (data.registros.length > 20) {
        pendientesElement.style.color = "var(--mspas-danger)";
      } else if (data.registros.length > 10) {
        pendientesElement.style.color = "var(--mspas-warning)";
      } else {
        pendientesElement.style.color = "var(--mspas-success)";
      }
    }

    // 3. Cumplimiento territorial (estimado)
    const cumplimientoElement = document.getElementById(
      "cumplimiento-territorial"
    );
    if (cumplimientoElement) {
      // Simulación: menos pendientes = mayor cumplimiento
      const totalRegistros = data.total_territorio || 100;
      const pendientes = data.registros ? data.registros.length : 0;
      const porcentaje = Math.max(
        0,
        Math.round(((totalRegistros - pendientes) / totalRegistros) * 100)
      );

      cumplimientoElement.textContent = `${porcentaje}%`;

      // Color según cumplimiento
      if (porcentaje >= 90) {
        cumplimientoElement.style.color = "var(--mspas-success)";
      } else if (porcentaje >= 70) {
        cumplimientoElement.style.color = "var(--mspas-warning)";
      } else {
        cumplimientoElement.style.color = "var(--mspas-danger)";
      }
    }

    // 4. Auxiliares activos (calculado de registros únicos)
    const auxiliaresElement = document.getElementById("auxiliares-activos");
    if (auxiliaresElement && data.registros) {
      const auxiliaresUnicos = new Set(data.registros.map((r) => r.usuario_id));
      auxiliaresElement.textContent = auxiliaresUnicos.size;
    }
  },

  // ===== CARGAR REGISTROS PENDIENTES =====
  async cargarRegistrosPendientes() {
    try {
      const response = await SGPF.apiCall("/validacion/pendientes?limit=10");

      if (response.success) {
        this.mostrarRegistrosPendientes(
          response.data.registros_pendientes || []
        );
      }
    } catch (error) {
      console.error("❌ Error cargando registros pendientes:", error);
      this.mostrarErrorValidacion();
    }
  },

  // ===== MOSTRAR REGISTROS PENDIENTES =====
  mostrarRegistrosPendientes(registros) {
    const resumenElement = document.getElementById("resumen-validacion");
    const tablaContainer = document.getElementById(
      "tabla-pendientes-container"
    );
    const sinPendientesElement = document.getElementById(
      "sin-pendientes-mensaje"
    );
    const tablaBody = document.getElementById("tabla-pendientes-body");

    if (!resumenElement) return;

    // Limpiar loading
    resumenElement.innerHTML = "";

    if (!registros || registros.length === 0) {
      // Mostrar mensaje sin pendientes
      if (tablaContainer) tablaContainer.style.display = "none";
      if (sinPendientesElement) sinPendientesElement.style.display = "block";
      return;
    }

    // Mostrar tabla con registros
    if (sinPendientesElement) sinPendientesElement.style.display = "none";
    if (tablaContainer) tablaContainer.style.display = "block";

    // Llenar tabla CON LOS CAMPOS REALES
    if (tablaBody) {
      tablaBody.innerHTML = registros
        .map(
          (registro) => `
            <tr>
                <td><strong>${registro.registrado_por || "N/A"}</strong></td>
                <td>${registro.comunidad || "N/A"}</td>
                <td>${registro.metodo || "N/A"}</td>
                <td><strong>${registro.cantidad_administrada || 0}</strong></td>
                <td>${this.formatearFecha(registro.fecha_registro)}</td>
                <td>
                    <button class="btn-small btn-success" onclick="AsistenteDashboard.validarRegistro(${
                      registro.id
                    }, 'validado')">✅</button>
                    <button class="btn-small btn-warning" onclick="AsistenteDashboard.validarRegistro(${
                      registro.id
                    }, 'revisar')">📝</button>
                    <button class="btn-small btn-danger" onclick="AsistenteDashboard.validarRegistro(${
                      registro.id
                    }, 'rechazado')">❌</button>
                </td>
            </tr>
        `
        )
        .join("");
    }

    // Mostrar resumen CON DATOS REALES
    const comunidadesUnicas = new Set(registros.map((r) => r.comunidad)).size;
    const auxiliaresUnicos = new Set(registros.map((r) => r.registrado_por))
      .size;

    resumenElement.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${registros.length}</div>
                <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Pendientes</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${auxiliaresUnicos}</div>
                <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Auxiliares</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${comunidadesUnicas}</div>
                <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Comunidades</div>
            </div>
        </div>
    `;
  },

  // ===== VALIDAR REGISTRO =====
  async validarRegistro(registroId, accion) {
    try {
      SGPF.showLoading(true);

      const observaciones =
        accion === "rechazado"
          ? prompt("Razón del rechazo:")
          : accion === "revisar"
          ? prompt("Observaciones para revisión:")
          : "";

      if (accion !== "validado" && !observaciones) {
        SGPF.showToast("Debes proporcionar observaciones", "warning");
        return;
      }

      const response = await SGPF.apiCall(
        `/validacion/registro/${registroId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            estado: accion,
            observaciones: observaciones,
          }),
        }
      );

      if (response.success) {
        SGPF.showToast(`Registro ${accion} exitosamente`, "success");
        // Recargar registros pendientes
        await this.cargarRegistrosPendientes();
        // Actualizar estadísticas
        await this.cargarEstadisticasTerritoriales();
      } else {
        SGPF.showToast("Error al validar registro", "error");
      }
    } catch (error) {
      console.error("❌ Error validando registro:", error);
      SGPF.showToast("Error al validar registro", "error");
    } finally {
      SGPF.showLoading(false);
    }
  },

  // ===== CARGAR INFORMACIÓN DEL TERRITORIO =====
  async cargarInfoTerritorio() {
    try {
      // Por ahora mostrar información básica del usuario
      const user = SGPF.getCurrentUser();
      this.mostrarInfoTerritorioBasica(user);
    } catch (error) {
      console.error("❌ Error cargando info de territorio:", error);
      this.mostrarErrorTerritorio();
    }
  },

  // ===== MOSTRAR INFORMACIÓN BÁSICA DEL TERRITORIO =====
  mostrarInfoTerritorioBasica(user) {
    const infoElement = document.getElementById("info-territorio");
    if (!infoElement) return;

    // Simular información territorial
    infoElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <h4>Territorio Norte</h4>
                    <p><strong>Asistente:</strong> ${user.nombres} ${user.apellidos}</p>
                    <p><strong>Comunidades:</strong> 8-12 comunidades</p>
                </div>
                <div>
                    <h4>Estado Actual</h4>
                    <p><strong>Auxiliares Supervisados:</strong> 8-10 auxiliares</p>
                    <p><strong>Última Validación:</strong> Hoy</p>
                    <p><strong>Registros del Mes:</strong> En proceso</p>
                </div>
            </div>
        `;
  },

  // ===== MOSTRAR AUXILIARES SUPERVISADOS =====
  async mostrarAuxiliares() {
    try {
      SGPF.showToast("Función en desarrollo", "info");
      // TODO: Implementar vista de auxiliares supervisados
    } catch (error) {
      console.error("❌ Error mostrando auxiliares:", error);
      SGPF.showToast("Error cargando auxiliares", "error");
    }
  },

  // ===== FUNCIONES DE UTILIDAD =====
  formatearFecha(fecha) {
    if (!fecha) return "--";
    return new Date(fecha).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  },

  // ===== FUNCIONES DE ERROR =====
  mostrarErrorEstadisticas() {
    const elements = [
      "comunidades-activas",
      "registros-pendientes",
      "cumplimiento-territorial",
      "auxiliares-activos",
    ];

    elements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = "--";
        element.style.color = "var(--mspas-text-secondary)";
      }
    });
  },

  mostrarErrorValidacion() {
    const resumenElement = document.getElementById("resumen-validacion");
    if (resumenElement) {
      resumenElement.innerHTML =
        '<div class="error">Error cargando registros pendientes</div>';
    }
  },

  mostrarErrorTerritorio() {
    const infoElement = document.getElementById("info-territorio");
    if (infoElement) {
      infoElement.innerHTML =
        '<div class="error">Error cargando información del territorio</div>';
    }
  },
};
