window.EncargadoDashboard = window.EncargadoDashboard || {
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard encargado SR');
        
        // Delay para renderizado DOM completo
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            // Verificar usuario - usar rol normalizado
            const user = SGPF.getCurrentUser();
            const rolNormalizado = SGPF.getNormalizedRole();
            
            if (!user || rolNormalizado !== 'encargado') {
                console.error('❌ Usuario no es encargado SR');
                return;
            }

            // Cargar datos en paralelo
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarKPIsEjecutivos(),
                this.cargarEstadoTerritorios(),
                this.cargarRegistrosParaSupervision(),
                this.cargarPanelAdministrativo()
            ]);

            console.log('✅ Dashboard encargado SR cargado completamente');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard encargado:', error);
            SGPF.showToast('Error cargando dashboard ejecutivo', 'error');
        }
    },

    // ===== CARGAR DATOS DEL USUARIO =====
    async cargarDatosUsuario() {
        const user = SGPF.getCurrentUser();

        const nombreElement = document.getElementById('encargado-nombre');
        if (nombreElement) {
            nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
        }

        const distritoElement = document.getElementById('encargado-distrito');
        if (distritoElement) {
            distritoElement.textContent = 'Distrito de Salud Norte - Huehuetenango';
        }
    },

    // ===== CARGAR KPIs EJECUTIVOS =====
    async cargarKPIsEjecutivos() {
        try {
            console.log('📊 Cargando KPIs ejecutivos...');
            
            const response = await SGPF.apiCall('/dashboard/ejecutivo');

            if (response && response.success && response.data) {
                this.actualizarKPIsEjecutivos(response.data);
            } else {
                this.mostrarKPIsFallback();
            }
        } catch (error) {
            console.error('❌ Error cargando KPIs ejecutivos:', error);
            this.mostrarKPIsFallback();
        }
    },

    // ===== ACTUALIZAR KPIs EJECUTIVOS =====
    actualizarKPIsEjecutivos(data) {
        try {
            const territoriosElement = document.getElementById('territorios-supervisados');
            if (territoriosElement) {
                territoriosElement.textContent = data.territorios_total || '4';
            }

            const registrosMesElement = document.getElementById('registros-mes');
            if (registrosMesElement) {
                registrosMesElement.textContent = data.registros_mes || '156';
            }

            const cumplimientoElement = document.getElementById('cumplimiento-distrito');
            if (cumplimientoElement) {
                const porcentaje = data.cumplimiento_distrito || 73.5;
                cumplimientoElement.textContent = `${porcentaje}%`;
                
                if (porcentaje >= 90) {
                    cumplimientoElement.style.color = 'var(--mspas-success)';
                } else if (porcentaje >= 70) {
                    cumplimientoElement.style.color = 'var(--mspas-warning)';
                } else {
                    cumplimientoElement.style.color = 'var(--mspas-danger)';
                }
            }

            const asistentesElement = document.getElementById('asistentes-activos');
            if (asistentesElement) {
                asistentesElement.textContent = data.asistentes_activos || '8';
            }

        } catch (error) {
            console.error('❌ Error actualizando KPIs:', error);
        }
    },

    // ===== CARGAR ESTADO DE TERRITORIOS =====
    async cargarEstadoTerritorios() {
        try {
            console.log('🗺️ Cargando estado de territorios...');
            
            const currentYear = new Date().getFullYear();
            const response = await SGPF.apiCall(`/dashboard/territorios/comparativo/${currentYear}`);
            
            if (response && response.success) {
                this.mostrarEstadoTerritorios(response.data || []);
            } else {
                throw new Error('Error cargando territorios');
            }
        } catch (error) {
            console.error('❌ Error cargando territorios:', error);
            this.mostrarTerritoriosFallback();
        }
    },

    mostrarEstadoTerritorios(territorios) {
        const loadingElement = document.getElementById('territorios-loading');
        const gridElement = document.getElementById('territorios-grid');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (gridElement) gridElement.style.display = 'block';

        if (!gridElement) return;

        let html = '';
        
        if (territorios && territorios.length > 0) {
            territorios.forEach(territorio => {
                const cumplimiento = territorio.cumplimiento || 0;
                const estado = this.determinarEstadoTerritorio(cumplimiento);
                
                html += `
                    <div class="territory-card ${estado}">
                        <div class="territory-name">${territorio.nombre || 'Sin nombre'}</div>
                        <div class="territory-stats">
                            <div class="stat">${cumplimiento}% cumplimiento</div>
                            <div class="stat">${territorio.comunidades || 0} comunidades</div>
                            <div class="stat">${territorio.asistente || 'Sin asistente'}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = this.generarTerritoriosFallback();
        }
        
        gridElement.innerHTML = html;
    },

    determinarEstadoTerritorio(cumplimiento) {
        if (cumplimiento >= 90) return 'excelente';
        if (cumplimiento >= 75) return 'bueno';
        if (cumplimiento >= 60) return 'regular';
        return 'critico';
    },

    // ===== CARGAR REGISTROS PARA SUPERVISIÓN =====
    async cargarRegistrosParaSupervision() {
        try {
            console.log('📋 Cargando registros para supervisión...');
            
            // Solo buscar registros pendientes de validación (estado: registrado)
            const response = await SGPF.apiCall('/validacion/pendientes?limit=20');
            
            if (response && response.success && response.data.registros_pendientes) {
                const registrosLimitados = response.data.registros_pendientes.slice(0, 20);
                this.mostrarRegistrosSupervision(registrosLimitados);
            } else {
                this.mostrarSinRegistros();
            }
        } catch (error) {
            console.error('❌ Error cargando registros para supervisión:', error);
            this.mostrarErrorSupervision();
        }
    },

    // ===== MOSTRAR REGISTROS DE SUPERVISIÓN =====
    mostrarRegistrosSupervision(registros) {
        const loadingElement = document.getElementById('aprobacion-loading');
        const resumenElement = document.getElementById('aprobacion-resumen');
        const tablaContainer = document.getElementById('tabla-aprobacion-container');
        const sinRegistrosElement = document.getElementById('sin-aprobaciones-mensaje');
        const tablaBody = document.getElementById('tabla-aprobacion-body');

        if (loadingElement) loadingElement.style.display = 'none';

        if (!registros || registros.length === 0) {
            this.mostrarSinRegistros();
            return;
        }

        // Mostrar tabla con registros
        if (sinRegistrosElement) sinRegistrosElement.style.display = 'none';
        if (resumenElement) resumenElement.style.display = 'block';
        if (tablaContainer) tablaContainer.style.display = 'block';

        // Mostrar resumen con totales
        if (resumenElement) {
            const comunidadesUnicas = new Set(registros.map(r => r.comunidad || 'N/A')).size;
            const totalCantidad = registros.reduce((sum, r) => sum + (parseInt(r.cantidad_administrada) || 0), 0);
            
            resumenElement.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-warning);">${registros.length}</div>
                        <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Pendientes Validación</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-secondary);">${comunidadesUnicas}</div>
                        <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Comunidades</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${totalCantidad}</div>
                        <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Total Usuarias</div>
                    </div>
                </div>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <strong>🔍 Supervisión de Registros</strong><br>
                    <small>Registros pendientes de validación. Como Encargado, puede validarlos o rechazarlos directamente.</small>
                </div>
            `;
        }

        // Llenar tabla con información completa
        if (tablaBody) {
            tablaBody.innerHTML = registros.map(registro => {
                return `
                    <tr>
                        <td>
                            <strong>${registro.cargo_registrador || 'Personal'}</strong><br>
                            <small>${registro.email_registrador || 'N/A'}</small>
                        </td>
                        <td>
                            ${registro.comunidad || 'N/A'}<br>
                            <small>${registro.codigo_comunidad || ''}</small>
                        </td>
                        <td>
                            <strong>${registro.metodo || 'N/A'}</strong><br>
                            <small>${registro.categoria || ''}</small>
                        </td>
                        <td>
                            <strong>${registro.cantidad_administrada || 0}</strong><br>
                            <small>usuarias</small>
                        </td>
                        <td>${this.formatearFecha(registro.fecha_hora_registro)}</td>
                        <td><span class="badge badge-warning">Pendiente</span></td>
                        <td>
                            <button class="btn-small btn-success" onclick="EncargadoDashboard.validarRegistro(${registro.id})" title="Validar registro">
                                ✅ Validar
                            </button>
                            <button class="btn-small btn-danger" onclick="EncargadoDashboard.rechazarRegistro(${registro.id})" title="Eliminar registro">
                                🗑️ Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    },

    // ===== VALIDAR REGISTRO =====
    async validarRegistro(registroId) {
        try {
            const confirmacion = confirm('¿Validar este registro?');
            if (!confirmacion) return;

            SGPF.showLoading(true);

            const response = await SGPF.apiCall(`/validacion/registro/${registroId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    accion: 'aprobar',
                    observaciones_validacion: 'Validado por Encargado SR'
                })
            });

            if (response && response.success) {
                SGPF.showToast('Registro validado exitosamente', 'success');
                await this.cargarRegistrosParaSupervision();
                await this.cargarKPIsEjecutivos();
            } else {
                throw new Error(response?.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ Error validando registro:', error);
            SGPF.showToast('Error al validar registro', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== RECHAZAR REGISTRO (ELIMINAR COMPLETAMENTE) =====
    async rechazarRegistro(registroId) {
        const motivo = prompt('Motivo del rechazo (el registro será eliminado permanentemente):');
        if (!motivo || motivo.trim() === '') {
            SGPF.showToast('Debe proporcionar un motivo para el rechazo', 'warning');
            return;
        }

        const confirmacion = confirm('⚠️ ATENCIÓN: Este registro será eliminado permanentemente del sistema. ¿Está seguro?');
        if (!confirmacion) return;

        try {
            SGPF.showLoading(true);

            // Usar el endpoint DELETE para eliminar completamente el registro
            const response = await SGPF.apiCall(`/registros/${registroId}`, {
                method: 'DELETE'
            });

            if (response && response.success) {
                SGPF.showToast('Registro eliminado permanentemente', 'success');
                await this.cargarRegistrosParaSupervision();
                await this.cargarKPIsEjecutivos(); // Actualizar estadísticas
            } else {
                throw new Error(response?.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ Error eliminando registro:', error);
            SGPF.showToast('Error al eliminar registro', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== CARGAR PANEL ADMINISTRATIVO =====
    async cargarPanelAdministrativo() {
        try {
            const response = await SGPF.apiCall('/admin/usuarios');
            
            if (response && response.success) {
                this.mostrarPanelAdministrativo(response.data || []);
            }
        } catch (error) {
            console.error('❌ Error cargando panel administrativo:', error);
            this.mostrarErrorAdministrativo();
        }
    },

    mostrarPanelAdministrativo(usuarios) {
        const panelElement = document.getElementById('admin-panel');
        if (!panelElement) return;

        const auxiliares = usuarios.filter(u => u.rol === 'auxiliar_enfermeria').length;
        const asistentes = usuarios.filter(u => u.rol === 'asistente_tecnico').length;
        const totalUsuarios = usuarios.length;

        panelElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${totalUsuarios}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Total Usuarios</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-secondary);">${auxiliares}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Auxiliares</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-accent);">${asistentes}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Asistentes</div>
                </div>
            </div>
        `;
    },

    // ===== FUNCIONES DE UTILIDAD =====
    formatearFecha(fecha) {
        if (!fecha) return '--';
        return new Date(fecha).toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    // ===== FUNCIONES DE BOTONES =====
    mostrarPanelSupervision() {
        const elemento = document.getElementById('tabla-aprobacion-container');
        if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth' });
        }
    },

    mostrarGestionUsuarios() {
        SGPF.showToast('Función de gestión de usuarios en desarrollo', 'info');
    },

    mostrarConfiguracionMetas() {
        SGPF.showToast('Función de configuración de metas en desarrollo', 'info');
    },

    // ===== FUNCIONES DE FALLBACK Y ERROR =====
    mostrarKPIsFallback() {
        this.actualizarKPIsEjecutivos({
            territorios_total: 4,
            registros_mes: 156,
            cumplimiento_distrito: 73.5,
            asistentes_activos: 8
        });
    },

    mostrarTerritoriosFallback() {
        const gridElement = document.getElementById('territorios-grid');
        const loadingElement = document.getElementById('territorios-loading');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (gridElement) {
            gridElement.style.display = 'block';
            gridElement.innerHTML = this.generarTerritoriosFallback();
        }
    },

    generarTerritoriosFallback() {
        const territorios = [
            { nombre: 'Norte', cumplimiento: 85, comunidades: 12 },
            { nombre: 'Sur', cumplimiento: 72, comunidades: 11 },
            { nombre: 'Este', cumplimiento: 91, comunidades: 13 },
            { nombre: 'Oeste', cumplimiento: 68, comunidades: 9 }
        ];

        return territorios.map(territorio => {
            const estado = this.determinarEstadoTerritorio(territorio.cumplimiento);
            return `
                <div class="territory-card ${estado}">
                    <div class="territory-name">Territorio ${territorio.nombre}</div>
                    <div class="territory-stats">
                        <div class="stat">${territorio.cumplimiento}% cumplimiento</div>
                        <div class="stat">${territorio.comunidades} comunidades</div>
                        <div class="stat">Activo</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    mostrarSinRegistros() {
        const loadingElement = document.getElementById('aprobacion-loading');
        const resumenElement = document.getElementById('aprobacion-resumen');
        const tablaContainer = document.getElementById('tabla-aprobacion-container');
        const sinRegistrosElement = document.getElementById('sin-aprobaciones-mensaje');

        if (loadingElement) loadingElement.style.display = 'none';
        if (resumenElement) resumenElement.style.display = 'none';
        if (tablaContainer) tablaContainer.style.display = 'none';
        if (sinRegistrosElement) {
            sinRegistrosElement.style.display = 'block';
            sinRegistrosElement.innerHTML = `
                <div class="card-body" style="text-align: center; padding: 2rem;">
                    <h3>✅ No hay registros pendientes</h3>
                    <p>Todos los registros han sido procesados.</p>
                </div>
            `;
        }
    },

    mostrarErrorSupervision() {
        const loadingElement = document.getElementById('aprobacion-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="error" style="text-align: center; padding: 2rem;">
                    <h3>⚠️ Error cargando registros</h3>
                    <p>No se pudieron cargar los registros para supervisión.</p>
                </div>
            `;
        }
    },

    mostrarErrorAdministrativo() {
        const panelElement = document.getElementById('admin-panel');
        if (panelElement) {
            panelElement.innerHTML = `
                <div class="error" style="text-align: center; padding: 1rem;">
                    <p>Error cargando información administrativa</p>
                </div>
            `;
        }
    }
};