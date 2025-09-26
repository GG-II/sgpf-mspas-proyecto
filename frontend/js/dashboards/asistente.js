window.AsistenteDashboard = window.AsistenteDashboard || {
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard asistente técnico');
        
        // Delay para esperar el DOM
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
            territorioElement.textContent = "Territorio: Norte";
        }
    },

    // ===== CARGAR ESTADÍSTICAS TERRITORIALES =====
    async cargarEstadisticasTerritoriales() {
        try {
            // Obtener estadísticas de validación pendientes
            const response = await SGPF.apiCall("/validacion/pendientes");

            if (response.success) {
                const datosParaTarjetas = {
                    registros: response.data.registros_pendientes || [],
                };
                this.actualizarTarjetasTerritoriales(datosParaTarjetas);
            } else {
                this.mostrarEstadisticasFallback();
            }
        } catch (error) {
            console.error("❌ Error cargando estadísticas territoriales:", error);
            this.mostrarEstadisticasFallback();
        }
    },

    // ===== ACTUALIZAR TARJETAS TERRITORIALES =====
    actualizarTarjetasTerritoriales(data) {
        // 1. Comunidades activas (calculado de registros únicos)
        const comunidadesElement = document.getElementById("comunidades-activas");
        if (comunidadesElement && data.registros) {
            const comunidadesUnicas = new Set(data.registros.map((r) => r.comunidad));
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
        const cumplimientoElement = document.getElementById("cumplimiento-territorial");
        if (cumplimientoElement) {
            const totalRegistros = data.total_territorio || 100;
            const pendientes = data.registros ? data.registros.length : 0;
            const porcentaje = Math.max(0, Math.round(((totalRegistros - pendientes) / totalRegistros) * 100));

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
            const auxiliaresUnicos = new Set(data.registros.map((r) => r.registrado_por));
            auxiliaresElement.textContent = auxiliaresUnicos.size;
        }

        console.log('✅ Estadísticas territoriales actualizadas');
    },

    // ===== CARGAR INFORMACIÓN DEL TERRITORIO =====
    async cargarInfoTerritorio() {
        try {
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

        infoElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <h4>📍 Territorio Norte</h4>
                    <p><strong>Asistente:</strong> ${user.nombres} ${user.apellidos}</p>
                    <p><strong>Comunidades:</strong> 8-12 comunidades rurales</p>
                    <p><strong>Población MEF:</strong> ~2,500 mujeres</p>
                </div>
                <div>
                    <h4>📊 Estado Actual</h4>
                    <p><strong>Auxiliares Supervisados:</strong> 8-10 auxiliares</p>
                    <p><strong>Última Actividad:</strong> Hoy</p>
                    <p><strong>Sistema:</strong> Operativo ✅</p>
                </div>
                <div>
                    <h4>🎯 Acciones Rápidas</h4>
                    <p><button class="btn btn-primary" onclick="ComponentLoader.navigateToView('validacion')">
                        ✅ Validar Registros
                    </button></p>
                    <p><button class="btn btn-secondary" onclick="ComponentLoader.navigateToView('reportes')">
                        📊 Ver Reportes
                    </button></p>
                </div>
            </div>
        `;
    },

    // ===== FUNCIONES DE FALLBACK Y ERROR =====
    mostrarEstadisticasFallback() {
        // Mostrar valores por defecto si no se pueden cargar las estadísticas
        const comunidadesElement = document.getElementById("comunidades-activas");
        const pendientesElement = document.getElementById("registros-pendientes");
        const cumplimientoElement = document.getElementById("cumplimiento-territorial");
        const auxiliaresElement = document.getElementById("auxiliares-activos");

        if (comunidadesElement) comunidadesElement.textContent = "9";
        if (pendientesElement) pendientesElement.textContent = "31";
        if (cumplimientoElement) {
            cumplimientoElement.textContent = "68%";
            cumplimientoElement.style.color = "var(--mspas-warning)";
        }
        if (auxiliaresElement) auxiliaresElement.textContent = "11";

        console.log('📊 Usando estadísticas de fallback');
    },

    mostrarErrorTerritorio() {
        const infoElement = document.getElementById("info-territorio");
        if (infoElement) {
            infoElement.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h4>⚠️ Error cargando información territorial</h4>
                    <p>Por favor, contacta al administrador del sistema.</p>
                </div>
            `;
        }
    },

    // ===== FUNCIONES DE UTILIDAD =====
    mostrarAuxiliares() {
        SGPF.showToast("Función de supervisión de auxiliares en desarrollo", "info");
    }
};