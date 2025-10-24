// ===== MÓDULO DE PLANIFICACIÓN DE METAS V2.0 - MEJORADO =====
window.Planificacion = window.Planificacion || {
  // ===== ESTADO GLOBAL =====
  state: {
    anioActual: new Date().getFullYear(),
    territorioSeleccionado: null,
    comunidadActual: null,
    metaActual: null,
    porcentajes: [],
    territorios: [],
    comunidades: [],
    mesesActuales: Array(12).fill(0),
    metodosDisponibles: [
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
  },

  // ===== INICIALIZAR MÓDULO =====
  async init() {
    console.log("📊 Inicializando módulo de planificación V2.0");

    try {
      const user = SGPF.getCurrentUser();

      if (!user) {
        console.error("❌ Usuario no autenticado");
        SGPF.showToast("Debes iniciar sesión", "error");
        return;
      }

      // Verificar permisos
      if (user.rol !== "coordinador_municipal" && user.rol !== "encargado_sr") {
        console.error("❌ Usuario sin permisos de configuración");
        SGPF.showToast(
          "No tienes permisos para configurar planificación",
          "error"
        );
        return;
      }

      // Cargar años disponibles
      await this.cargarAniosDisponibles();

      // Cargar territorios
      await this.cargarTerritorios();

      // Configurar selector de año
      this.configurarSelectorAnio();

      console.log("✅ Módulo de planificación inicializado");
    } catch (error) {
      console.error("❌ Error inicializando planificación:", error);
      SGPF.showToast("Error al inicializar módulo", "error");
    }
  },

  // ===== CARGAR AÑOS DISPONIBLES (DESDE 2025) =====
async cargarAniosDisponibles() {
  try {
    const response = await SGPF.apiCall("/planificacion/anios", "GET");
    
    if (response.success) {
      const aniosExistentes = response.data || [];
      const anioActual = new Date().getFullYear();
      const selector = document.getElementById("selector-anio");
      
      if (selector) {
        // ✅ CAMBIO: Rango desde 2025 hasta año actual + 1
        const anioMinimo = 2025;  // 🎯 INICIA EN 2025, NO EN 2024
        const anioMaximo = anioActual + 1;
        
        const todosLosAnios = [];
        
        // Generar array con todos los años del rango
        for (let anio = anioMaximo; anio >= anioMinimo; anio--) {
          // Solo agregar si el año es >= 2025
          if (anio >= 2025) {
            todosLosAnios.push({
              anio: anio,
              configurado: aniosExistentes.includes(anio),
              esActual: anio === anioActual,
              esFuturo: anio > anioActual
            });
          }
        }
        
        // Renderizar selector con indicadores visuales
        selector.innerHTML = todosLosAnios
          .map((item) => {
            let label = `${item.anio}`;
            
            // Agregar indicadores
            if (item.esFuturo) {
              label += " (Próximo)";
            } else if (item.esActual) {
              label += " (Actual)";
            }
            
            // Marcar años sin configurar
            if (!item.configurado) {
              label += " ⚠️ Sin configurar";
            }
            
            return `<option value="${item.anio}" ${
              item.esActual ? "selected" : ""
            }>${label}</option>`;
          })
          .join("");
      }
    }
  } catch (error) {
    console.error("❌ Error cargando años:", error);
    
    // Fallback: Si falla, al menos mostrar el año actual
    const selector = document.getElementById("selector-anio");
    if (selector) {
      const anioActual = new Date().getFullYear();
      selector.innerHTML = `<option value="${anioActual}" selected>${anioActual} (Actual)</option>`;
    }
  }
},

// ===== MEJORAR: MOSTRAR MENSAJE APROPIADO SEGÚN EL AÑO =====
async cargarAvanceTerritorio(territorioId) {
  try {
    console.log('🔍 Cargando territorio:', territorioId, 'año:', this.state.anioActual);
    
    // Mostrar loading
    document.getElementById("loading-comunidades").classList.remove("hidden");
    document.getElementById("tabla-comunidades-container").classList.add("hidden");
    document.getElementById("sin-datos-anio").classList.add("hidden");

    const response = await SGPF.apiCall(
      `/planificacion/avance/${territorioId}/${this.state.anioActual}`,
      "GET"
    );

    console.log('📦 Respuesta:', response);

    // Ocultar loading SIEMPRE
    document.getElementById("loading-comunidades").classList.add("hidden");

    // ✅ VERIFICACIÓN SIMPLE Y DIRECTA
    if (!response.comunidades || response.comunidades.length === 0) {
      console.log('⚠️ NO HAY DATOS - Mostrando botón');
      document.getElementById("sin-datos-anio").classList.remove("hidden");
      return;
    }

    console.log('✅ HAY DATOS - Mostrando tabla');
    this.state.comunidades = response.comunidades;
    this.renderizarTablaComunidades();
    
  } catch (error) {
    console.error("❌ ERROR:", error);
    document.getElementById("loading-comunidades").classList.add("hidden");
    document.getElementById("sin-datos-anio").classList.remove("hidden");
  }
},

// ===== NUEVA FUNCIÓN: VALIDAR SI EL AÑO ESTÁ CONFIGURADO =====
async verificarConfiguracionAnio(anio) {
  try {
    const response = await SGPF.apiCall(`/planificacion/porcentajes/${anio}`, "GET");
    
    if (!response.success || !response.data || response.data.length === 0) {
      return {
        configurado: false,
        mensaje: `El año ${anio} no tiene configuración de porcentajes. Es necesario configurarlo primero.`
      };
    }
    
    // Verificar que suma de porcentajes sea 100%
    if (!response.suma_valida) {
      return {
        configurado: false,
        mensaje: `El año ${anio} tiene configuración incompleta. La suma de porcentajes debe ser 100%.`
      };
    }
    
    return {
      configurado: true,
      mensaje: `Año ${anio} configurado correctamente`
    };
  } catch (error) {
    return {
      configurado: false,
      mensaje: "Error al verificar configuración"
    };
  }
},

  // ===== CONFIGURAR SELECTOR DE AÑO =====
  configurarSelectorAnio() {
    const selector = document.getElementById("selector-anio");

    if (selector) {
      selector.addEventListener("change", async (e) => {
        this.state.anioActual = parseInt(e.target.value);
        console.log("📅 Año cambiado a:", this.state.anioActual);

        // Recargar datos del territorio actual
        if (this.state.territorioSeleccionado) {
          await this.cargarAvanceTerritorio(this.state.territorioSeleccionado);
        }
      });
    }
  },

  // ===== CARGAR TERRITORIOS =====
  async cargarTerritorios() {
    try {
      // Obtener territorios desde la BD
      const response = await SGPF.apiCall("/admin/territorios", "GET");

      if (response.success && response.data) {
        this.state.territorios = response.data;
        this.renderizarTabsTerritorios();

        // Seleccionar primer territorio por defecto
        if (this.state.territorios.length > 0) {
          await this.seleccionarTerritorio(this.state.territorios[0].id);
        }
      }
    } catch (error) {
      console.error("❌ Error cargando territorios:", error);
      SGPF.showToast("Error al cargar territorios", "error");
    }
  },

  // ===== RENDERIZAR TABS DE TERRITORIOS =====
  renderizarTabsTerritorios() {
    const tabsContainer = document.getElementById("tabs-territorios");

    if (!tabsContainer) return;

    tabsContainer.innerHTML = this.state.territorios
      .map(
        (territorio) => `
            <button 
                onclick="Planificacion.seleccionarTerritorio(${territorio.id})" 
                data-territorio-id="${territorio.id}"
                class="tab-territorio px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                       ${
                         territorio.id === this.state.territorioSeleccionado
                           ? "text-blue-600 border-blue-600"
                           : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                       }">
                ${territorio.nombre}
            </button>
        `
      )
      .join("");
  },

  // ===== SELECCIONAR TERRITORIO =====
  async seleccionarTerritorio(territorioId) {
    this.state.territorioSeleccionado = territorioId;

    // Actualizar estilos de tabs
    document.querySelectorAll(".tab-territorio").forEach((tab) => {
      const id = parseInt(tab.getAttribute("data-territorio-id"));
      if (id === territorioId) {
        tab.classList.remove("text-gray-500", "border-transparent");
        tab.classList.add("text-blue-600", "border-blue-600");
      } else {
        tab.classList.remove("text-blue-600", "border-blue-600");
        tab.classList.add("text-gray-500", "border-transparent");
      }
    });

    // Cargar datos del territorio
    await this.cargarAvanceTerritorio(territorioId);
  },

  // ===== CARGAR AVANCE DEL TERRITORIO =====
  async cargarAvanceTerritorio(territorioId) {
  try {
    document.getElementById("loading-comunidades").classList.remove("hidden");
    document.getElementById("tabla-comunidades-container").classList.add("hidden");
    document.getElementById("sin-datos-anio").classList.add("hidden");

    const response = await SGPF.apiCall(
      `/planificacion/avance/${territorioId}/${this.state.anioActual}`,
      "GET"
    );

    document.getElementById("loading-comunidades").classList.add("hidden");

    // ✅ NUEVA LÓGICA: Verificar si hay datos válidos
    const comunidades = response.comunidades || [];
    const todasConMefCero = comunidades.every(c => !c.mef || c.mef === 0);
    
    // Si no hay comunidades O todas tienen MEF = 0, mostrar botón
    if (comunidades.length === 0 || todasConMefCero) {
      console.log('⚠️ Año sin configurar - Mostrando botón');
      
      const anioActual = new Date().getFullYear();
      const sinDatos = document.getElementById("sin-datos-anio");
      
      if (this.state.anioActual > anioActual) {
        sinDatos.querySelector("h3").textContent = `Planificación ${this.state.anioActual} no disponible`;
        sinDatos.querySelector("p").textContent = `El año ${this.state.anioActual} aún no ha sido configurado. Puedes crear la planificación ahora.`;
      }
      
      sinDatos.classList.remove("hidden");
      return;
    }

    // Hay datos válidos, mostrar tabla
    console.log('✅ Hay datos válidos - Mostrando tabla');
    this.state.comunidades = comunidades;
    this.renderizarTablaComunidades();
    
  } catch (error) {
    console.error("❌ ERROR:", error);
    document.getElementById("loading-comunidades").classList.add("hidden");
    document.getElementById("sin-datos-anio").classList.remove("hidden");
  }
},

  // ===== RENDERIZAR TABLA DE COMUNIDADES =====
  renderizarTablaComunidades() {
    const tbody = document.getElementById("tabla-comunidades-body");
    const container = document.getElementById("tabla-comunidades-container");

    if (!tbody || !container) return;

    container.classList.remove("hidden");

    tbody.innerHTML = this.state.comunidades
      .map((com) => {
        const colorEstado = this.getColorEstado(com.estado);
        const esNegativa = com.meta_calculada < 0;
        const tieneManual = com.es_manual === 1;

        return `
                <tr class="hover:bg-blue-50 transition-colors ${
                  esNegativa ? "bg-red-50" : ""
                }">
                    <td class="px-6 py-4">
                        <div class="font-semibold text-gray-900">${
                          com.comunidad_nombre
                        }</div>
                        <div class="text-xs text-gray-500 mt-1">${
                          com.codigo_comunidad || ""
                        }</div>
                    </td>
                    <td class="px-6 py-4 text-center">
    <span class="font-bold text-gray-700">${com.mef || 0}</span>
</td>
<td class="px-6 py-4 text-center">
    <div class="flex flex-col items-center gap-1">
                            ${
                              com.meta_anual < 0
                                ? `<div class="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-lg border-2 border-red-500">
                                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                    <span class="font-bold text-red-600">${com.meta_anual}</span>
                                </div>
                                <span class="text-xs text-red-600 font-semibold">⚠ Requiere ajuste manual</span>`
                                : `<span class="font-bold text-blue-600">${
                                    com.meta_anual || 0
                                  }</span>`
                            }
                            ${
                              com.unidades_sin_distribuir > 0
                                ? `<span class="text-xs text-orange-600 font-semibold">⚠ ${com.unidades_sin_distribuir} sin distribuir</span>`
                                : ""
                            }
                            ${
                              tieneManual
                                ? '<span class="text-xs text-green-600 font-semibold">✓ Manual</span>'
                                : ""
                            }
                            <button 
                                onclick="Planificacion.editarProyeccion(${
                                  com.comunidad_id
                                }, ${com.mef}, ${com.meta_anual}, '${
          com.comunidad_nombre
        }')" 
                                class="text-xs text-blue-600 hover:text-blue-800 font-semibold underline">
                                Editar
                            </button>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="font-medium text-gray-700">${
                          com.ejecutado || 0
                        }</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-2xl font-bold ${
                              colorEstado.text
                            }">${com.porcentaje_alcanzado}%</span>
                            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div class="${
                                  colorEstado.bar
                                } h-full transition-all" style="width: ${Math.min(
          com.porcentaje_alcanzado,
          100
        )}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button 
                            onclick="Planificacion.verDetalleComunidad(${
                              com.comunidad_id
                            })" 
                            class="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            Ver Detalle
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  // ===== VER DETALLE DE COMUNIDAD (MODAL CON 11 MÉTODOS) =====
  async verDetalleComunidad(comunidadId) {
    try {
      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/planificacion/comunidad/${comunidadId}/${this.state.anioActual}`,
        "GET"
      );

      SGPF.showLoading(false);

      if (!response.success || !response.data) {
        SGPF.showToast("Error al cargar detalle de la comunidad", "error");
        return;
      }

      const comunidad = this.state.comunidades.find(
        (c) => c.comunidad_id === comunidadId
      );
      this.state.comunidadActual = { ...comunidad, metodos: response.data };

      // Abrir modal
      this.abrirModalComunidad();
    } catch (error) {
      SGPF.showLoading(false);
      console.error("❌ Error cargando detalle:", error);
      SGPF.showToast("Error al cargar detalle", "error");
    }
  },

  // ===== ABRIR MODAL DE COMUNIDAD =====
  abrirModalComunidad() {
    const modal = document.getElementById("modal-comunidad");
    const com = this.state.comunidadActual;

    if (!modal || !com) return;

    // Actualizar header
    document.getElementById('modal-comunidad-nombre').textContent = com.comunidad_nombre;
    document.getElementById('modal-comunidad-mef').textContent = com.mef || 0;
    document.getElementById('modal-comunidad-proyeccion').textContent = com.meta_anual || 0;

    // Calcular unidades sin distribuir (lo necesitamos antes de renderizar)
    const proyeccionTotal = com.meta_anual || 0;
    const distribuido = com.metodos.reduce((sum, m) => sum + (m.meta_anual || 0), 0);
    const sinDistribuir = proyeccionTotal - distribuido;

    // Renderizar tarjetas de métodos PRIMERO
    const metodosContainer = document.getElementById("modal-comunidad-metodos");

    metodosContainer.innerHTML = com.metodos
      .map((metodo) => {
        const colorEstado = this.getColorEstado(metodo.estado);
        const distribucionValida = metodo.distribucion_valida;
        const tieneUnidades = metodo.meta_anual > 0;

        return `
                <div class="bg-white border-2 ${
                  colorEstado.border
                } rounded-xl p-5 hover:shadow-lg transition-all ${!tieneUnidades ? 'opacity-60' : ''}">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h4 class="text-lg font-bold text-gray-900">${
                              metodo.metodo_nombre
                            }</h4>
                            <p class="text-sm text-gray-500 mt-1">${
                              metodo.categoria
                            } • ${metodo.porcentaje_global}%</p>
                            ${!tieneUnidades ? '<p class="text-xs text-orange-600 font-semibold mt-1">⚠️ Sin unidades asignadas</p>' : ''}
                        </div>
                        <span class="px-3 py-1 ${
                          colorEstado.badge
                        } text-sm font-semibold rounded-full">
                            ${metodo.porcentaje_alcanzado}%
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="text-center">
                            <p class="text-xs text-gray-500 uppercase">Meta Anual</p>
                            <p class="text-2xl font-bold ${tieneUnidades ? 'text-blue-600' : 'text-gray-400'}">${
                              metodo.meta_anual
                            }</p>
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-gray-500 uppercase">Ejecutado</p>
                            <p class="text-2xl font-bold text-gray-700">${
                              metodo.ejecutado
                            }</p>
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-gray-500 uppercase">Pendiente</p>
                            <p class="text-2xl font-bold text-orange-600">${Math.max(
                              0,
                              metodo.meta_anual - metodo.ejecutado
                            )}</p>
                        </div>
                    </div>
                    
                    ${tieneUnidades ? `
                    <div class="bg-gray-50 rounded-lg p-3 mb-3">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-700">Distribución Mensual</span>
                            ${
                              distribucionValida
                                ? '<span class="text-xs text-green-600 font-semibold">✓ Válida</span>'
                                : '<span class="text-xs text-red-600 font-semibold">⚠ Requiere ajuste</span>'
                            }
                        </div>
                        <div class="grid grid-cols-12 gap-1 text-center text-xs">
                            ${metodo.meses
                              .map(
                                (cant, idx) => `
                                <div class="flex flex-col">
                                    <span class="text-gray-500 font-semibold">${
                                      [
                                        "E",
                                        "F",
                                        "M",
                                        "A",
                                        "M",
                                        "J",
                                        "J",
                                        "A",
                                        "S",
                                        "O",
                                        "N",
                                        "D",
                                      ][idx]
                                    }</span>
                                    <span class="font-bold ${
                                      cant > 0
                                        ? "text-blue-600"
                                        : "text-gray-300"
                                    }">${cant}</span>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        <div class="mt-2 text-xs text-center ${
                          distribucionValida ? "text-green-600" : "text-red-600"
                        } font-semibold">
                            Suma: ${metodo.suma_meses} / ${metodo.meta_anual}
                        </div>
                    </div>
                    
                    <button 
                        onclick="Planificacion.editarDistribucion(${
                          metodo.meta_id
                        }, '${metodo.metodo_nombre}', ${
          metodo.meta_anual
        }, ${JSON.stringify(metodo.meses).replace(/"/g, "&quot;")})" 
                        class="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        ${
                          distribucionValida
                            ? "Editar Distribución"
                            : "Configurar Distribución"
                        }
                    </button>
                    ` : `
                    <div class="bg-gray-100 rounded-lg p-4 text-center">
                        <p class="text-sm text-gray-600 mb-2">Este método no tiene unidades asignadas</p>
                        <p class="text-xs text-gray-500">Usa "Distribuir Manualmente" para asignar unidades</p>
                    </div>
                    `}
                </div>
            `;
      })
      .join("");

    // ✅ AHORA SÍ: Insertar el banner al inicio (después de que innerHTML esté completo)
    if (sinDistribuir > 0 && proyeccionTotal > 0) {
        this.mostrarBannerDistribucionPendiente(com, sinDistribuir);
    }

    modal.classList.remove("hidden");
  },

  // ===== BANNER PARA UNIDADES SIN DISTRIBUIR =====
  mostrarBannerDistribucionPendiente(comunidad, sinDistribuir) {
    const metodosContainer = document.getElementById('modal-comunidad-metodos');
    
    const banner = `
        <div class="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-500 rounded-xl p-6 mb-6 shadow-lg">
            <div class="flex items-start gap-4 mb-4">
                <div class="bg-orange-500 rounded-full p-3 flex-shrink-0">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <h4 class="text-2xl font-bold text-orange-900 mb-3">⚠️ ${sinDistribuir} Unidades Sin Distribuir</h4>
                    <div class="bg-white rounded-lg p-4 mb-3 border-2 border-orange-200">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-gray-600 mb-1">Proyección Total</p>
                                <p class="text-2xl font-bold text-blue-600">${comunidad.meta_anual}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-600 mb-1">Faltan por Asignar</p>
                                <p class="text-2xl font-bold text-orange-600">${sinDistribuir}</p>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-orange-800 mb-2">
                        Tienes <strong>${sinDistribuir} unidades</strong> que aún no están asignadas a ningún método anticonceptivo.
                    </p>
                    <p class="text-xs text-orange-700">
                        💡 <strong>Tip:</strong> Distribuye estas unidades entre los métodos que más se usen en tu comunidad. 
                        Después podrás distribuir cada método entre los 12 meses del año.
                    </p>
                </div>
            </div>
            <button 
                onclick="Planificacion.abrirModalDistribucionManual(${comunidad.comunidad_id})"
                class="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16m-7 5h7"/>
                </svg>
                Distribuir las ${sinDistribuir} Unidades Manualmente
            </button>
        </div>
    `;
    
    metodosContainer.insertAdjacentHTML('afterbegin', banner);
  },

  // ===== CERRAR MODAL DE COMUNIDAD =====
  cerrarModalComunidad() {
    document.getElementById("modal-comunidad").classList.add("hidden");
  },

  // ===== EDITAR DISTRIBUCIÓN MENSUAL =====
  editarDistribucion(metaId, metodoNombre, metaAnual, meses) {
    // ✅ VALIDACIÓN: No permitir editar si no hay unidades
    if (metaAnual === 0) {
        SGPF.showToast('Este método no tiene unidades asignadas. Usa "Distribuir Manualmente" primero.', 'warning');
        return;
    }

    this.state.metaActual = {
      id: metaId,
      nombre: metodoNombre,
      meta_anual: metaAnual,
    };
    this.state.mesesActuales = [...meses];

    // Actualizar modal
    document.getElementById("modal-dist-titulo").textContent = metodoNombre;
    document.getElementById("modal-dist-meta-anual").textContent = metaAnual;

    // Generar inputs de meses
    const gridMeses = document.getElementById("grid-meses");
    const nombresMeses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    gridMeses.innerHTML = nombresMeses
      .map(
        (mes, idx) => `
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">${mes}</label>
                <input 
                    type="number" 
                    min="0" 
                    value="${meses[idx]}" 
                    data-mes-index="${idx}"
                    onchange="Planificacion.onMesChange(${idx}, this.value)"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-center text-lg font-bold">
            </div>
        `
      )
      .join("");

    // Calcular y mostrar validación inicial
    this.actualizarValidacionMeses();

    // Abrir modal
    document.getElementById("modal-distribucion").classList.remove("hidden");
  },

  // ===== CUANDO CAMBIA UN MES =====
  onMesChange(index, valor) {
    this.state.mesesActuales[index] = parseInt(valor) || 0;
    this.actualizarValidacionMeses();
  },

  // ===== ACTUALIZAR VALIDACIÓN DE MESES =====
  actualizarValidacionMeses() {
    const suma = this.state.mesesActuales.reduce((a, b) => a + b, 0);
    const meta = this.state.metaActual.meta_anual;
    const diferencia = suma - meta;
    const porcentaje = meta > 0 ? (suma / meta) * 100 : 0;

    // Actualizar indicadores
    document.getElementById("suma-meses-actual").textContent = suma;
    document.getElementById(
      "porcentaje-suma-meses"
    ).textContent = `${Math.round(porcentaje)}%`;

    const barra = document.getElementById("barra-progreso-meses");
    barra.style.width = `${Math.min(porcentaje, 100)}%`;

    const mensaje = document.getElementById("mensaje-validacion-meses");
    const btnGuardar = document.getElementById("btn-guardar-distribucion");

    if (diferencia === 0) {
      barra.className = "h-full bg-green-600 transition-all";
      mensaje.textContent = "✓ Distribución correcta";
      mensaje.className =
        "text-sm mt-2 text-center font-semibold text-green-600";
      btnGuardar.disabled = false;
    } else if (diferencia > 0) {
      barra.className = "h-full bg-red-600 transition-all";
      mensaje.textContent = `✗ Sobran ${diferencia} unidades`;
      mensaje.className = "text-sm mt-2 text-center font-semibold text-red-600";
      btnGuardar.disabled = true;
    } else {
      barra.className = "h-full bg-yellow-600 transition-all";
      mensaje.textContent = `⚠ Faltan ${Math.abs(diferencia)} unidades`;
      mensaje.className =
        "text-sm mt-2 text-center font-semibold text-yellow-600";
      btnGuardar.disabled = true;
    }
  },

  // ===== GUARDAR DISTRIBUCIÓN =====
  async guardarDistribucion() {
    try {
      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/planificacion/distribucion/${this.state.metaActual.id}`,
        "PUT",
        {
          meses: this.state.mesesActuales,
        }
      );

      SGPF.showLoading(false);

      if (response.success) {
        SGPF.showToast("Distribución guardada exitosamente", "success");
        this.cerrarModalDistribucion();

        // Recargar detalle de la comunidad
        await this.verDetalleComunidad(this.state.comunidadActual.comunidad_id);
      } else {
        SGPF.showToast(response.message || "Error al guardar", "error");
      }
    } catch (error) {
      SGPF.showLoading(false);
      console.error("❌ Error guardando distribución:", error);
      SGPF.showToast(error.message || "Error al guardar distribución", "error");
    }
  },

  // ===== CERRAR MODAL DE DISTRIBUCIÓN =====
  cerrarModalDistribucion() {
    document.getElementById("modal-distribucion").classList.add("hidden");
  },

  // ===== ABRIR MODAL DE PORCENTAJES GLOBALES =====
  async abrirModalPorcentajes() {
    try {
      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/planificacion/porcentajes/${this.state.anioActual}`,
        "GET"
      );

      SGPF.showLoading(false);

      if (!response.success) {
        SGPF.showToast("Error al cargar porcentajes", "error");
        return;
      }

      this.state.porcentajes = response.data;

      // Actualizar título
      document.getElementById(
        "modal-porcentajes-anio"
      ).textContent = `Año ${this.state.anioActual}`;

      // Generar formulario
      const form = document.getElementById("form-porcentajes");

      form.innerHTML = this.state.porcentajes
        .map(
          (metodo) => `
                <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex-1">
                        <label class="block text-sm font-semibold text-gray-900">${metodo.metodo_nombre}</label>
                        <span class="text-xs text-gray-500">${metodo.categoria}</span>
                    </div>
                    <div class="w-32">
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            max="100"
                            value="${metodo.porcentaje_meta}" 
                            data-metodo-id="${metodo.metodo_id}"
                            onchange="Planificacion.onPorcentajeChange(${metodo.metodo_id}, this.value)"
                            class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-right font-bold">
                    </div>
                    <span class="text-gray-500 font-bold">%</span>
                </div>
            `
        )
        .join("");

      // Calcular suma inicial
      this.actualizarValidacionPorcentajes();

      // Abrir modal
      document.getElementById("modal-porcentajes").classList.remove("hidden");
    } catch (error) {
      SGPF.showLoading(false);
      console.error("❌ Error abriendo modal:", error);
      SGPF.showToast("Error al cargar porcentajes", "error");
    }
  },

  // ===== CUANDO CAMBIA UN PORCENTAJE =====
  onPorcentajeChange(metodoId, valor) {
    const metodo = this.state.porcentajes.find((m) => m.metodo_id === metodoId);
    if (metodo) {
      metodo.porcentaje_meta = parseFloat(valor) || 0;
      this.actualizarValidacionPorcentajes();
    }
  },

  // ===== ACTUALIZAR VALIDACIÓN DE PORCENTAJES =====
  actualizarValidacionPorcentajes() {
    const suma = this.state.porcentajes.reduce(
      (acc, m) => acc + parseFloat(m.porcentaje_meta || 0),
      0
    );
    const redondeado = Math.round(suma * 100) / 100;
    const diferencia = redondeado - 100;

    // Actualizar indicadores
    document.getElementById(
      "suma-porcentajes"
    ).textContent = `${redondeado.toFixed(2)}%`;

    const barra = document.getElementById("barra-progreso-suma");
    const container = document.getElementById("indicador-suma-container");
    const mensaje = document.getElementById("mensaje-validacion-suma");
    const btnGuardar = document.getElementById("btn-guardar-porcentajes");

    barra.style.width = `${Math.min(redondeado, 100)}%`;

    if (Math.abs(diferencia) < 0.01) {
      // Suma correcta (100%)
      barra.className = "h-full bg-green-600 transition-all";
      container.className =
        "bg-green-50 rounded-xl p-4 border-2 border-green-500";
      document.getElementById("suma-porcentajes").className =
        "text-3xl font-bold text-green-600";
      mensaje.textContent = "✓ Suma correcta: 100%";
      mensaje.className =
        "text-xs text-green-600 mt-2 text-center font-semibold";
      btnGuardar.disabled = false;
    } else if (diferencia > 0) {
      // Sobra
      barra.className = "h-full bg-red-600 transition-all";
      container.className = "bg-red-50 rounded-xl p-4 border-2 border-red-500";
      document.getElementById("suma-porcentajes").className =
        "text-3xl font-bold text-red-600";
      mensaje.textContent = `✗ Sobran ${diferencia.toFixed(2)}%`;
      mensaje.className = "text-xs text-red-600 mt-2 text-center font-semibold";
      btnGuardar.disabled = true;
    } else {
      // Falta
      barra.className = "h-full bg-yellow-600 transition-all";
      container.className =
        "bg-yellow-50 rounded-xl p-4 border-2 border-yellow-500";
      document.getElementById("suma-porcentajes").className =
        "text-3xl font-bold text-yellow-600";
      mensaje.textContent = `⚠ Faltan ${Math.abs(diferencia).toFixed(2)}%`;
      mensaje.className =
        "text-xs text-yellow-600 mt-2 text-center font-semibold";
      btnGuardar.disabled = true;
    }
  },

  // ===== GUARDAR PORCENTAJES =====
  async guardarPorcentajes() {
    try {
      // Confirmación
      if (
        !confirm(
          "¿Estás seguro? Esto recalculará TODAS las metas de TODAS las comunidades."
        )
      ) {
        return;
      }

      SGPF.showLoading(true);

      const porcentajes = this.state.porcentajes.map((m) => ({
        metodo_id: m.metodo_id,
        porcentaje_meta: m.porcentaje_meta,
      }));

      const response = await SGPF.apiCall(
        `/planificacion/porcentajes/${this.state.anioActual}`,
        "PUT",
        {
          porcentajes: porcentajes,
        }
      );

      SGPF.showLoading(false);

      if (response.success) {
        SGPF.showToast("Porcentajes actualizados exitosamente", "success");

        if (response.advertencia) {
          setTimeout(() => {
            alert(response.advertencia);
          }, 1000);
        }

        this.cerrarModalPorcentajes();

        // Recargar datos
        await this.cargarAvanceTerritorio(this.state.territorioSeleccionado);
      } else {
        SGPF.showToast(response.message || "Error al guardar", "error");
      }
    } catch (error) {
      SGPF.showLoading(false);
      console.error("❌ Error guardando porcentajes:", error);
      SGPF.showToast(error.message || "Error al guardar porcentajes", "error");
    }
  },

  // ===== CERRAR MODAL DE PORCENTAJES =====
  cerrarModalPorcentajes() {
    document.getElementById("modal-porcentajes").classList.add("hidden");
  },

  // ===== INICIALIZAR AÑO (CREAR NUEVA CONFIGURACIÓN) =====
  async inicializarAnio() {
  const confirmacion = confirm(
    `🎯 Inicializar Año ${this.state.anioActual}\n\n` +
    `Esta acción creará la estructura de planificación para el año ${this.state.anioActual}.\n\n` +
    `¿Deseas copiar la configuración del año anterior?\n\n` +
    `✅ OK = Copiar porcentajes Y población MEF de ${this.state.anioActual - 1}\n` +
    `❌ Cancelar = Empezar desde cero (deberás configurar manualmente)`
  );

  if (confirmacion === null) return; // Usuario canceló

  try {
    SGPF.showLoading(true);

    // ✅ NUEVA LÓGICA: Siempre copiar MEF del año anterior si existe
    const body = confirmacion ? 
      { 
        copiar_desde: this.state.anioActual - 1,
        copiar_mef: true  // 🎯 NUEVO: Indica que debe copiar MEF también
      } : 
      {
        copiar_mef: false  // Usar MEF actual de tabla comunidades
      };

    const response = await SGPF.apiCall(
      `/planificacion/inicializar/${this.state.anioActual}`,
      "POST",
      body
    );

    SGPF.showLoading(false);

    if (response.success) {
      // Mensaje mejorado
      let mensaje = `Año ${this.state.anioActual} creado exitosamente`;
      
      if (response.mef_copiado) {
        mensaje += `\n\n✅ Población MEF copiada desde ${this.state.anioActual - 1}`;
      } else if (response.mef_warning) {
        mensaje += `\n\n⚠️ ${response.mef_warning}`;
      }
      
      SGPF.showToast(mensaje, "success");

      // Recargar años disponibles
      await this.cargarAniosDisponibles();

      // Recargar datos
      await this.cargarAvanceTerritorio(this.state.territorioSeleccionado);
    } else {
      SGPF.showToast(response.message || "Error al inicializar año", "error");
    }
  } catch (error) {
    SGPF.showLoading(false);
    console.error("❌ Error inicializando año:", error);
    SGPF.showToast(error.message || "Error al inicializar año", "error");
  }
},

  // ===== UTILIDADES =====
  getColorEstado(estado) {
    const colores = {
      success: {
        text: "text-green-600",
        bar: "bg-green-600",
        border: "border-green-200",
        badge: "bg-green-100 text-green-800",
      },
      warning: {
        text: "text-yellow-600",
        bar: "bg-yellow-600",
        border: "border-yellow-200",
        badge: "bg-yellow-100 text-yellow-800",
      },
      danger: {
        text: "text-red-600",
        bar: "bg-red-600",
        border: "border-red-200",
        badge: "bg-red-100 text-red-800",
      },
    };

    return colores[estado] || colores.danger;
  },
  
  // ===== EDITAR PROYECCIÓN MANUAL =====
  async editarProyeccion(comunidadId, mef, metaActual, comunidadNombre) {
    const nuevaMeta = prompt(
      `📊 Editar Proyección Manual\n\n` +
        `Comunidad: ${comunidadNombre}\n` +
        `MEF: ${mef}\n` +
        `Proyección actual: ${metaActual}\n\n` +
        `Ingresa la nueva proyección manual:`,
      metaActual
    );

    if (nuevaMeta === null) return; // Cancelado

    const metaNum = parseInt(nuevaMeta);

    if (isNaN(metaNum) || metaNum < 0) {
      SGPF.showToast("Debe ser un número positivo", "error");
      return;
    }

    try {
      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/planificacion/proyeccion-manual/${comunidadId}/${this.state.anioActual}`,
        "PUT",
        { proyeccion_manual: metaNum }
      );

      SGPF.showLoading(false);

      if (response.success) {
        SGPF.showToast("Proyección manual guardada", "success");

        // Recargar datos
        await this.cargarAvanceTerritorio(this.state.territorioSeleccionado);
      } else {
        SGPF.showToast(response.message || "Error al guardar", "error");
      }
    } catch (error) {
      SGPF.showLoading(false);
      console.error("❌ Error guardando proyección:", error);
      SGPF.showToast('Error al guardar proyección', 'error');
    }
  },

  // ===== MODAL DE DISTRIBUCIÓN MANUAL =====
  async abrirModalDistribucionManual(comunidadId) {
    const comunidad = this.state.comunidadActual;
    
    if (!comunidad) {
        SGPF.showToast('Error: comunidad no encontrada', 'error');
        return;
    }
    
    const proyeccionTotal = comunidad.meta_anual || 0;
    const metodos = comunidad.metodos || [];
    
    // Calcular ya distribuido
    const yaDistribuido = metodos.reduce((sum, m) => sum + (m.meta_anual || 0), 0);
    const disponible = proyeccionTotal - yaDistribuido;
    
    const modalHTML = `
        <div id="modal-distribucion-manual" class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                <!-- Header -->
                <div class="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold flex items-center gap-3">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16m-7 5h7"/>
                                </svg>
                                Distribuir Proyección Manualmente
                            </h3>
                            <p class="text-orange-100 mt-2">${comunidad.comunidad_nombre}</p>
                        </div>
                        <button 
                            onclick="Planificacion.cerrarModalDistribucionManual()"
                            class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Información Principal -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b-2 border-indigo-200">
                    <div class="grid grid-cols-3 gap-6">
                        <div class="text-center">
                            <p class="text-sm text-gray-600 mb-1">Proyección Total</p>
                            <p class="text-3xl font-bold text-blue-600">${proyeccionTotal}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm text-gray-600 mb-1">Ya Distribuido</p>
                            <p class="text-3xl font-bold text-green-600" id="total-distribuido">${yaDistribuido}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm text-gray-600 mb-1">Faltan por Asignar</p>
                            <p class="text-3xl font-bold text-orange-600" id="total-faltante">${disponible}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Contenido -->
                <div class="p-8 overflow-y-auto" style="max-height: calc(90vh - 340px);">
                    <div class="space-y-3">
                        ${metodos.map(m => `
                            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-orange-300">
                                <div class="flex-1">
                                    <p class="font-bold text-gray-900">${m.metodo_nombre}</p>
                                    <p class="text-xs text-gray-500">${m.categoria}</p>
                                </div>
                                <div class="flex items-center gap-3">
                                    <button 
                                        onclick="Planificacion.ajustarDistribucion(${m.metodo_id}, -1)"
                                        class="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all font-bold">
                                        −
                                    </button>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        value="${m.meta_anual || 0}"
                                        data-metodo-id="${m.metodo_id}"
                                        class="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-bold text-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                                        onchange="Planificacion.recalcularDistribucion()">
                                    <button 
                                        onclick="Planificacion.ajustarDistribucion(${m.metodo_id}, 1)"
                                        class="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all font-bold">
                                        +
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="border-t bg-gray-50 px-8 py-4 flex gap-3 justify-end">
                    <button 
                        onclick="Planificacion.cerrarModalDistribucionManual()" 
                        class="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onclick="Planificacion.guardarDistribucionManual(${comunidadId}, ${proyeccionTotal})" 
                        id="btn-guardar-distribucion-manual"
                        disabled
                        class="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                        Guardar Distribución
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Inicializar validación
    this.recalcularDistribucion();
  },

  cerrarModalDistribucionManual() {
    const modal = document.getElementById('modal-distribucion-manual');
    if (modal) {
        modal.remove();
    }
  },

  ajustarDistribucion(metodoId, cambio) {
    const input = document.querySelector(`#modal-distribucion-manual input[data-metodo-id="${metodoId}"]`);
    if (input) {
        const valorActual = parseInt(input.value) || 0;
        const nuevoValor = Math.max(0, valorActual + cambio);
        input.value = nuevoValor;
        this.recalcularDistribucion();
    }
  },

  recalcularDistribucion() {
    const inputs = document.querySelectorAll('#modal-distribucion-manual input[data-metodo-id]');
    let sumaDistribuida = 0;
    
    inputs.forEach(input => {
        sumaDistribuida += parseInt(input.value) || 0;
    });
    
    // Obtener proyección total del DOM
    const proyeccionTotal = parseInt(document.querySelector('#modal-distribucion-manual .text-blue-600').textContent);
    const faltante = proyeccionTotal - sumaDistribuida;
    
    // Actualizar indicadores
    const distribuidoEl = document.getElementById('total-distribuido');
    const faltanteEl = document.getElementById('total-faltante');
    const btnGuardar = document.getElementById('btn-guardar-distribucion-manual');
    
    if (distribuidoEl) {
        distribuidoEl.textContent = sumaDistribuida;
        distribuidoEl.className = sumaDistribuida === proyeccionTotal 
            ? 'text-3xl font-bold text-green-600' 
            : 'text-3xl font-bold text-yellow-600';
    }
    
    if (faltanteEl) {
        faltanteEl.textContent = faltante;
        faltanteEl.className = faltante === 0 
            ? 'text-3xl font-bold text-green-600' 
            : 'text-3xl font-bold text-orange-600';
    }
    
    if (btnGuardar) {
        btnGuardar.disabled = faltante !== 0;
    }
  },

  async guardarDistribucionManual(comunidadId, proyeccionTotal) {
    const inputs = document.querySelectorAll('#modal-distribucion-manual input[data-metodo-id]');
    const distribucion = [];
    
    inputs.forEach(input => {
        const metodoId = parseInt(input.dataset.metodoId);
        const unidades = parseInt(input.value) || 0;
        
        distribucion.push({ metodo_id: metodoId, unidades: unidades });
    });
    
    // Validar suma
    const suma = distribucion.reduce((acc, d) => acc + d.unidades, 0);
    
    if (suma !== proyeccionTotal) {
        SGPF.showToast(`La suma (${suma}) debe ser ${proyeccionTotal}`, 'error');
        return;
    }
    
    try {
        SGPF.showLoading(true);
        
        const response = await SGPF.apiCall(
            `/planificacion/distribuir-proyeccion-manual/${comunidadId}/${this.state.anioActual}`,
            'POST',
            { distribucion }
        );
        
        SGPF.showLoading(false);
        
        if (response.success) {
            SGPF.showToast('✅ Distribución guardada correctamente', 'success');
            this.cerrarModalDistribucionManual();
            
            // Recargar datos
            await this.cargarAvanceTerritorio(this.state.territorioSeleccionado);
            
            // Reabrir modal actualizado
            setTimeout(async () => {
                await this.verDetalleComunidad(comunidadId);
            }, 500);
        } else {
            SGPF.showToast(response.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        SGPF.showLoading(false);
        console.error('❌ Error:', error);
        SGPF.showToast('Error de conexión', 'error');
    }
  },

};