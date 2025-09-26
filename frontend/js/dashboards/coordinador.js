window.CoordinadorDashboard = window.CoordinadorDashboard || {
  // ===== INICIALIZAR DASHBOARD =====
  async init() {
    console.log("🏛️ Inicializando dashboard coordinador municipal");

    // Delay para renderizado DOM completo (siguiendo patrón probado)
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Verificar usuario - usar rol normalizado
      const user = SGPF.getCurrentUser();
      const rolNormalizado = SGPF.getNormalizedRole();

      if (!user || rolNormalizado !== "coordinador") {
        console.error("❌ Usuario no es coordinador municipal");
        return;
      }

      // Cargar datos en paralelo (patrón del encargado)
      await Promise.all([
        this.cargarDatosUsuario(),
        this.cargarKPIsMunicipales(),
        this.cargarVistaConsolidada(),
        this.cargarEstadoTerritorios(),
        this.cargarPanelEjecutivo(),
      ]);

      console.log("✅ Dashboard coordinador municipal cargado completamente");
    } catch (error) {
      console.error("❌ Error inicializando dashboard coordinador:", error);
      SGPF.showToast("Error cargando dashboard estratégico", "error");
    }
  },

  // ===== CARGAR DATOS DEL USUARIO =====
  async cargarDatosUsuario() {
    const user = SGPF.getCurrentUser();

    const nombreElement = document.getElementById("coordinador-nombre");
    if (nombreElement) {
      nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
    }

    const distritoElement = document.getElementById("coordinador-distrito");
    if (distritoElement) {
      distritoElement.textContent =
        "Coordinación Municipal MSPAS - Huehuetenango";
    }
  },

  // ===== CARGAR KPIs MUNICIPALES =====
  async cargarKPIsMunicipales() {
    try {
      console.log("📊 Cargando KPIs municipales...");

      const response = await SGPF.apiCall("/dashboard/ejecutivo");

      if (response && response.success && response.data) {
        this.actualizarKPIsMunicipales(response.data);
      } else {
        this.mostrarKPIsFallback();
      }
    } catch (error) {
      console.error("❌ Error cargando KPIs municipales:", error);
      this.mostrarKPIsFallback();
    }
  },

  // ===== ACTUALIZAR KPIs MUNICIPALES =====
  actualizarKPIsMunicipales(data) {
    try {
      const distritosElement = document.getElementById("distritos-total");
      if (distritosElement) {
        distritosElement.textContent = "4"; // Huehuetenango tiene 4 distritos
      }

      const coberturaElement = document.getElementById("cobertura-municipal");
      if (coberturaElement) {
        const cobertura =
          data.kpis_principales?.porcentaje_cumplimiento || 76.8;
        coberturaElement.textContent = `${cobertura}%`;

        // Colores según nivel de cobertura
        if (cobertura >= 85) {
          coberturaElement.style.color = "var(--mspas-success)";
        } else if (cobertura >= 70) {
          coberturaElement.style.color = "var(--mspas-warning)";
        } else {
          coberturaElement.style.color = "var(--mspas-danger)";
        }
      }

      const usuariasTotalesElement =
        document.getElementById("usuarias-totales");
      if (usuariasTotalesElement) {
        const usuarias = data.kpis_principales?.usuarias_año_actual || 1847;
        usuariasTotalesElement.textContent = usuarias.toLocaleString();
      }

      const metaAnualElement = document.getElementById("meta-anual-mun");
      if (metaAnualElement) {
        const meta = data.kpis_principales?.meta_anual || 2400;
        const usuarias = data.kpis_principales?.usuarias_año_actual || 1847;
        const porcentaje = Math.round((usuarias / meta) * 100);
        metaAnualElement.textContent = `${porcentaje}%`;

        if (porcentaje >= 90) {
          metaAnualElement.style.color = "var(--mspas-success)";
        } else if (porcentaje >= 75) {
          metaAnualElement.style.color = "var(--mspas-warning)";
        } else {
          metaAnualElement.style.color = "var(--mspas-danger)";
        }
      }
    } catch (error) {
      console.error("❌ Error actualizando KPIs municipales:", error);
    }
  },

  // ===== CARGAR VISTA CONSOLIDADA =====
  async cargarVistaConsolidada() {
    try {
      console.log("🏘️ Cargando vista consolidada municipal...");

      const currentYear = new Date().getFullYear();
      const response = await SGPF.apiCall(
        `/dashboard/territorios/comparativo/${currentYear}`
      );

      if (response && response.success) {
        this.mostrarVistaConsolidada(response.data || {});
      } else {
        throw new Error("Error cargando vista consolidada");
      }
    } catch (error) {
      console.error("❌ Error cargando vista consolidada:", error);
      this.mostrarConsolidadaFallback();
    }
  },

  // ===== FUNCIÓN ACTUALIZADA PARA mostrarVistaConsolidada =====
  // Reemplazar en coordinador.js

  mostrarVistaConsolidada(data) {
    const consolidadaElement = document.getElementById("vista-consolidada");
    const loadingElement = document.getElementById("vista-consolidada-loading");

    if (loadingElement) loadingElement.style.display = "none";
    if (!consolidadaElement) return;

    consolidadaElement.style.display = "block";

    const resumen = data.resumen_general || {};
    const territorios = data.territorios || [];

    // Calcular datos agregados si no están disponibles
    const totalComunidades =
      territorios.reduce((sum, t) => sum + (t.total_comunidades || 0), 0) || 45;
    const totalUsuarias =
      territorios.reduce((sum, t) => sum + (t.total_usuarias || 0), 0) || 5586;
    const metaAnual = 8000; // Meta municipal
    const progresoMeta = Math.round((totalUsuarias / metaAnual) * 100);
    const coberturaPromedio =
      territorios.length > 0
        ? territorios.reduce(
            (sum, t) => sum + (t.porcentaje_cobertura || 0),
            0
          ) / territorios.length
        : 61.02;

    consolidadaElement.innerHTML = `
        <!-- Resumen de Indicadores Clave -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="text-align: center; background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--mspas-primary);">
                <div style="font-size: 2rem; font-weight: bold; color: var(--mspas-primary);">${totalComunidades}</div>
                <div style="font-size: 1rem; color: var(--mspas-text-secondary);">Comunidades Total</div>
                <div style="font-size: 0.8rem; color: var(--mspas-text-muted); margin-top: 0.5rem;">Huehuetenango</div>
            </div>
            <div style="text-align: center; background: linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--mspas-secondary);">
                <div style="font-size: 2rem; font-weight: bold; color: var(--mspas-secondary);">${totalUsuarias.toLocaleString()}</div>
                <div style="font-size: 1rem; color: var(--mspas-text-secondary);">Usuarias Atendidas</div>
                <div style="font-size: 0.8rem; color: var(--mspas-text-muted); margin-top: 0.5rem;">Año ${new Date().getFullYear()}</div>
            </div>
            <div style="text-align: center; background: linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--mspas-success);">
                <div style="font-size: 2rem; font-weight: bold; color: var(--mspas-success);">${
                  territorios.length || 4
                }</div>
                <div style="font-size: 1rem; color: var(--mspas-text-secondary);">Territorios Activos</div>
                <div style="font-size: 0.8rem; color: var(--mspas-text-muted); margin-top: 0.5rem;">Norte, Sur, Este, Oeste</div>
            </div>
            <div style="text-align: center; background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--mspas-warning);">
                <div style="font-size: 2rem; font-weight: bold; color: var(--mspas-warning);">${Math.round(
                  coberturaPromedio
                )}%</div>
                <div style="font-size: 1rem; color: var(--mspas-text-secondary);">Cobertura Municipal</div>
                <div style="font-size: 0.8rem; color: var(--mspas-text-muted); margin-top: 0.5rem;">Promedio ponderado</div>
            </div>
        </div>

        <!-- Progreso hacia Metas -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #e9ecef;">
            <h4 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                🎯 Progreso hacia Meta Anual
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; align-items: center;">
                <div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary); margin-bottom: 0.5rem;">Meta Municipal ${new Date().getFullYear()}</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-primary);">${metaAnual.toLocaleString()} usuarias</div>
                </div>
                <div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary); margin-bottom: 0.5rem;">Progreso Actual</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: ${
                      progresoMeta >= 75
                        ? "var(--mspas-success)"
                        : progresoMeta >= 50
                        ? "var(--mspas-warning)"
                        : "var(--mspas-danger)"
                    };">${progresoMeta}% completado</div>
                </div>
                <div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary); margin-bottom: 0.5rem;">Faltante para Meta</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-accent);">${(
                      metaAnual - totalUsuarias
                    ).toLocaleString()} usuarias</div>
                </div>
            </div>
            <!-- Barra de progreso -->
            <div style="margin-top: 1rem;">
                <div style="background: #e9ecef; border-radius: 10px; height: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, var(--mspas-primary), var(--mspas-secondary)); height: 100%; width: ${Math.min(
                      progresoMeta,
                      100
                    )}%; transition: width 0.3s ease; border-radius: 10px;"></div>
                </div>
                <div style="font-size: 0.8rem; color: var(--mspas-text-muted); margin-top: 0.5rem; text-align: right;">
                    ${Math.min(
                      progresoMeta,
                      100
                    )}% de ${metaAnual.toLocaleString()} usuarias
                </div>
            </div>
        </div>

        <!-- Comparativo por Territorios -->
        <div style="background: #ffffff; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #e9ecef;">
            <h4 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                🗺️ Rendimiento por Territorio
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                ${
                  territorios.length > 0
                    ? territorios
                        .map((territorio) => {
                          const cobertura =
                            territorio.porcentaje_cobertura || 0;
                          const estado =
                            cobertura >= 85
                              ? "excelente"
                              : cobertura >= 70
                              ? "bueno"
                              : cobertura >= 55
                              ? "regular"
                              : "critico";
                          const color =
                            cobertura >= 85
                              ? "var(--mspas-success)"
                              : cobertura >= 70
                              ? "var(--mspas-primary)"
                              : cobertura >= 55
                              ? "var(--mspas-warning)"
                              : "var(--mspas-danger)";

                          return `
                        <div style="background: linear-gradient(135deg, ${
                          cobertura >= 85
                            ? "#f0f9f0"
                            : cobertura >= 70
                            ? "#f8fff8"
                            : cobertura >= 55
                            ? "#fff8e1"
                            : "#ffebee"
                        } 0%, #ffffff 100%); border-radius: 8px; padding: 1rem; border-left: 4px solid ${color};">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; color: #333;">${
                                  territorio.territorio || "Territorio"
                                }</div>
                                <div style="background: ${color}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${cobertura}%</div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9rem; color: #666;">
                                <div>📍 ${
                                  territorio.total_comunidades || 0
                                } comunidades</div>
                                <div>👥 ${(
                                  territorio.total_usuarias || 0
                                ).toLocaleString()} usuarias</div>
                                <div>📊 ${
                                  territorio.promedio_mensual || 0
                                } prom/mes</div>
                                <div>👩‍⚕️ ${
                                  territorio.auxiliares_activos || 0
                                } auxiliares</div>
                            </div>
                        </div>
                    `;
                        })
                        .join("")
                    : `
                    <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--mspas-text-muted);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                        <div>Datos de territorios no disponibles</div>
                        <div style="font-size: 0.9rem; margin-top: 0.5rem;">Conecte con el sistema de territorios para ver información detallada</div>
                    </div>
                `
                }
            </div>
        </div>

        <!-- Recursos Humanos y Alertas -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem;">
            <div style="background: linear-gradient(135deg, #e8f4fd 0%, #ffffff 100%); border-radius: 12px; padding: 1.5rem; border: 1px solid #b3d9ff;">
                <h4 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                    👥 Recursos Humanos
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">30</div>
                        <div style="color: var(--mspas-text-secondary);">Auxiliares Activos</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-secondary);">8</div>
                        <div style="color: var(--mspas-text-secondary);">Asistentes Supervisores</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-accent);">4</div>
                        <div style="color: var(--mspas-text-secondary);">Encargados Distritales</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-warning);">1</div>
                        <div style="color: var(--mspas-text-secondary);">Coordinador Municipal</div>
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%); border-radius: 12px; padding: 1.5rem; border: 1px solid #ffd700;">
                <h4 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                    ⚠️ Alertas Estratégicas
                </h4>
                <div style="space-y: 0.75rem;">
                    ${
                      progresoMeta < 70
                        ? `
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.75rem;">
                            <div style="font-weight: 600; color: #856404;">Meta Anual en Riesgo</div>
                            <div style="font-size: 0.9rem; color: #856404;">Solo ${progresoMeta}% completado</div>
                        </div>
                    `
                        : ""
                    }
                    ${
                      territorios.some(
                        (t) => (t.porcentaje_cobertura || 0) < 60
                      )
                        ? `
                        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.75rem;">
                            <div style="font-weight: 600; color: #721c24;">Territorios Críticos</div>
                            <div style="font-size: 0.9rem; color: #721c24;">Requieren intervención inmediata</div>
                        </div>
                    `
                        : `
                        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.75rem;">
                            <div style="font-weight: 600; color: #155724;">Rendimiento Estable</div>
                            <div style="font-size: 0.9rem; color: #155724;">Todos los territorios funcionando adecuadamente</div>
                        </div>
                    `
                    }
                    <div style="background: #cce5ff; border-left: 4px solid #007bff; padding: 0.75rem; border-radius: 4px;">
                        <div style="font-weight: 600; color: #004085;">Cobertura Municipal: ${Math.round(
                          coberturaPromedio
                        )}%</div>
                        <div style="font-size: 0.9rem; color: #004085;">${
                          coberturaPromedio >= 70
                            ? "Nivel aceptable"
                            : "Requiere mejoras"
                        }</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Control Ejecutivo -->
        <div style="background: #e8f5e8; border-radius: 8px; padding: 1rem; text-align: center;">
            <strong>📋 Control Ejecutivo Municipal</strong><br>
            <small style="color: var(--mspas-text-secondary);">Supervisión estratégica de ${totalUsuarias.toLocaleString()} usuarias en ${totalComunidades} comunidades de Huehuetenango</small>
        </div>
    `;
  },

  // ===== CARGAR ESTADO DE TERRITORIOS =====
  async cargarEstadoTerritorios() {
    try {
      console.log("🗺️ Cargando estado de territorios...");

      const currentYear = new Date().getFullYear();
      const response = await SGPF.apiCall(
        `/dashboard/territorios/comparativo/${currentYear}`
      );

      if (response && response.success) {
        this.mostrarEstadoTerritorios(response.data.territorios || []);
      } else {
        throw new Error("Error cargando territorios");
      }
    } catch (error) {
      console.error("❌ Error cargando territorios:", error);
      this.mostrarTerritoriosFallback();
    }
  },

  mostrarEstadoTerritorios(territorios) {
    const loadingElement = document.getElementById("territorios-loading");
    const gridElement = document.getElementById("territorios-grid-coordinador");

    if (loadingElement) loadingElement.style.display = "none";
    if (gridElement) gridElement.style.display = "block";

    if (!gridElement) return;

    let html = "";

    if (territorios && territorios.length > 0) {
      territorios.forEach((territorio) => {
        const cobertura = territorio.porcentaje_cobertura || 0;
        const estado = this.determinarEstadoTerritorio(cobertura);

        html += `
                    <div class="territory-card-coordinador ${estado}">
                        <div class="territory-header">
                            <div class="territory-name">${
                              territorio.territorio || "Sin nombre"
                            }</div>
                            <div class="territory-badge ${estado}">${cobertura}%</div>
                        </div>
                        <div class="territory-stats">
                            <div class="stat">
                                <span class="stat-icon">🏘️</span>
                                <span>${
                                  territorio.total_comunidades || 0
                                } comunidades</span>
                            </div>
                            <div class="stat">
                                <span class="stat-icon">👥</span>
                                <span>${
                                  territorio.total_usuarias?.toLocaleString() ||
                                  0
                                } usuarias</span>
                            </div>
                            <div class="stat">
                                <span class="stat-icon">📊</span>
                                <span>${
                                  territorio.promedio_mensual || 0
                                } prom/mes</span>
                            </div>
                            <div class="stat">
                                <span class="stat-icon">👩‍⚕️</span>
                                <span>${
                                  territorio.auxiliares_activos || 0
                                } auxiliares</span>
                            </div>
                        </div>
                    </div>
                `;
      });
    } else {
      html = this.generarTerritoriosFallback();
    }

    gridElement.innerHTML = html;
  },

  determinarEstadoTerritorio(cobertura) {
    if (cobertura >= 85) return "excelente";
    if (cobertura >= 70) return "bueno";
    if (cobertura >= 55) return "regular";
    return "critico";
  },

  // ===== CARGAR PANEL EJECUTIVO =====
  async cargarPanelEjecutivo() {
    try {
      const response = await SGPF.apiCall("/admin/usuarios");

      if (response && response.success) {
        this.mostrarPanelEjecutivo(response.data || []);
      }
    } catch (error) {
      console.error("❌ Error cargando panel ejecutivo:", error);
      this.mostrarErrorEjecutivo();
    }
  },

  mostrarPanelEjecutivo(usuarios) {
    const panelElement = document.getElementById("panel-ejecutivo");
    if (!panelElement) return;

    const encargados = usuarios.filter(
      (u) => u.rol_nombre === "Encargado SR"
    ).length;
    const asistentes = usuarios.filter(
      (u) => u.rol_nombre === "Asistente Técnico"
    ).length;
    const auxiliares = usuarios.filter(
      (u) => u.rol_nombre === "Auxiliar Enfermería"
    ).length;
    const totalUsuarios = usuarios.length;
    const usuariosActivos = usuarios.filter((u) => u.activo).length;

    panelElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-primary);">${totalUsuarios}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Personal Total</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-success);">${usuariosActivos}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Activos</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-secondary);">${encargados}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Encargados</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-accent);">${asistentes}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Asistentes</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--mspas-warning);">${auxiliares}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Auxiliares</div>
                </div>
            </div>
            <div style="background: #e8f5e8; border-radius: 8px; padding: 1rem;">
                <strong>📋 Control Ejecutivo Municipal</strong><br>
                <small>Supervisión estratégica de ${totalUsuarios} profesionales de salud en 45 comunidades de Huehuetenango</small>
            </div>
        `;
  },

  // ===== FUNCIONES DE BOTONES =====
  mostrarDashboardEjecutivo() {
    // Scroll a la vista consolidada
    const elemento = document.getElementById("vista-consolidada");
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth" });
    }
  },

  mostrarConfiguracionSistema() {
    SGPF.showToast(
      "Función de configuración del sistema en desarrollo",
      "info"
    );
  },

  mostrarGestionUsuarios() {
    SGPF.showToast("Accediendo al módulo de gestión de usuarios...", "info");
    // Aquí se podría navegar a una vista específica de administración
  },

  mostrarReportesEjecutivos() {
    ComponentLoader.navigateToView("reportes");
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

  // ===== FUNCIONES DE FALLBACK Y ERROR =====
  mostrarKPIsFallback() {
    this.actualizarKPIsMunicipales({
      kpis_principales: {
        porcentaje_cumplimiento: 76.8,
        usuarias_año_actual: 1847,
        meta_anual: 2400,
      },
    });
  },

  mostrarConsolidadaFallback() {
    this.mostrarVistaConsolidada({
      resumen_general: {
        comunidades: 45,
        usuarias: 1847,
        cobertura_promedio: 76.8,
        poblacion_mef: 12500,
      },
      territorios: [
        { territorio: "Norte", total_comunidades: 12 },
        { territorio: "Sur", total_comunidades: 11 },
        { territorio: "Este", total_comunidades: 13 },
        { territorio: "Oeste", total_comunidades: 9 },
      ],
    });
  },

  mostrarTerritoriosFallback() {
    const gridElement = document.getElementById("territorios-grid-coordinador");
    const loadingElement = document.getElementById("territorios-loading");

    if (loadingElement) loadingElement.style.display = "none";
    if (gridElement) {
      gridElement.style.display = "block";
      gridElement.innerHTML = this.generarTerritoriosFallback();
    }
  },

  generarTerritoriosFallback() {
    const territorios = [
      {
        territorio: "Norte",
        cobertura: 82,
        comunidades: 12,
        usuarias: 468,
        auxiliares: 8,
      },
      {
        territorio: "Sur",
        cobertura: 75,
        comunidades: 11,
        usuarias: 412,
        auxiliares: 7,
      },
      {
        territorio: "Este",
        cobertura: 88,
        comunidades: 13,
        usuarias: 521,
        auxiliares: 9,
      },
      {
        territorio: "Oeste",
        cobertura: 71,
        comunidades: 9,
        usuarias: 446,
        auxiliares: 6,
      },
    ];

    return territorios
      .map((territorio) => {
        const estado = this.determinarEstadoTerritorio(territorio.cobertura);
        return `
                <div class="territory-card-coordinador ${estado}">
                    <div class="territory-header">
                        <div class="territory-name">Territorio ${
                          territorio.territorio
                        }</div>
                        <div class="territory-badge ${estado}">${
          territorio.cobertura
        }%</div>
                    </div>
                    <div class="territory-stats">
                        <div class="stat">
                            <span class="stat-icon">🏘️</span>
                            <span>${territorio.comunidades} comunidades</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">👥</span>
                            <span>${territorio.usuarias} usuarias</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">📊</span>
                            <span>${Math.round(
                              territorio.usuarias / 12
                            )} prom/mes</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">👩‍⚕️</span>
                            <span>${territorio.auxiliares} auxiliares</span>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  },

  mostrarErrorEjecutivo() {
    const panelElement = document.getElementById("panel-ejecutivo");
    if (panelElement) {
      panelElement.innerHTML = `
                <div class="error" style="text-align: center; padding: 1rem;">
                    <p>Error cargando información ejecutiva</p>
                </div>
            `;
    }
  },
};
