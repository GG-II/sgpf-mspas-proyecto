window.EncargadoDashboard = window.EncargadoDashboard || {
    
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard encargado SR V2.0');
        
        // Delay crítico para renderizado DOM
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const user = SGPF.getCurrentUser();
            const rolNormalizado = SGPF.getNormalizedRole();
            
            if (!user || rolNormalizado !== 'encargado') {
                console.error('❌ Usuario no es encargado SR');
                SGPF.showToast('Acceso no autorizado', 'error');
                return;
            }

            // Cargar datos en paralelo
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarMetricas(),
                this.cargarPendientesAprobacion(),
                this.cargarEstadoTerritorios(),
                this.cargarPanelAdmin()
            ]);

            console.log('✅ Dashboard encargado SR V2.0 cargado');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            SGPF.showToast('Error cargando dashboard', 'error');
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
            distritoElement.textContent = `Distrito de Salud ${user.territorio_nombre || 'Norte'} - Huehuetenango`;
        }
    },

    // ===== CARGAR MÉTRICAS =====
    async cargarMetricas() {
        try {
            // Obtener pendientes de validación
            const response = await SGPF.apiCall('/validacion/pendientes');

            if (response.success && response.data) {
                const pendientes = response.data.registros_pendientes || [];
                
                // Métricas calculadas
                const totalPendientes = pendientes.length;
                const territoriosActivos = new Set(pendientes.map(r => r.territorio)).size;
                
                // Calcular cumplimiento (estimación)
                const cumplimiento = totalPendientes < 10 ? 90 : 
                                    totalPendientes < 20 ? 75 : 60;

                this.actualizarMetricas({
                    pendientes: totalPendientes,
                    territorios: territoriosActivos,
                    cumplimiento: cumplimiento
                });
            } else {
                this.mostrarMetricasVacias();
            }
            
        } catch (error) {
            console.error('❌ Error cargando métricas:', error);
            this.mostrarMetricasVacias();
        }
    },

    // ===== ACTUALIZAR MÉTRICAS EN UI =====
    actualizarMetricas(metricas) {
        // Pendientes
        const pendientesEl = document.getElementById('pendientes-aprobar');
        if (pendientesEl) {
            pendientesEl.textContent = metricas.pendientes;
            
            // Color según urgencia
            if (metricas.pendientes > 15) {
                pendientesEl.classList.remove('text-orange-600');
                pendientesEl.classList.add('text-red-600');
            }
        }

        // Territorios
        const territoriosEl = document.getElementById('territorios-activos');
        if (territoriosEl) {
            territoriosEl.textContent = metricas.territorios || 4;
        }

        // Cumplimiento
        const cumplimientoEl = document.getElementById('cumplimiento-distrito');
        if (cumplimientoEl) {
            cumplimientoEl.textContent = `${metricas.cumplimiento}%`;
            
            // Color según rendimiento
            if (metricas.cumplimiento >= 85) {
                cumplimientoEl.classList.remove('text-green-600');
                cumplimientoEl.classList.add('text-emerald-600');
            } else if (metricas.cumplimiento < 70) {
                cumplimientoEl.classList.remove('text-green-600');
                cumplimientoEl.classList.add('text-orange-600');
            }
        }

        console.log('📊 Métricas actualizadas:', metricas);
    },

    // ===== MOSTRAR MÉTRICAS VACÍAS =====
    mostrarMetricasVacias() {
        const ids = ['pendientes-aprobar', 'territorios-activos'];
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
        
        const cumplimientoEl = document.getElementById('cumplimiento-distrito');
        if (cumplimientoEl) cumplimientoEl.textContent = '0%';
    },

    // ===== CARGAR PENDIENTES DE APROBACIÓN =====
    async cargarPendientesAprobacion() {
        try {
            const response = await SGPF.apiCall('/validacion/pendientes');

            const listaContainer = document.getElementById('lista-pendientes-aprobacion');
            const sinPendientes = document.getElementById('sin-pendientes-aprobar');
            const totalTexto = document.getElementById('total-pendientes-texto');

            if (!response.success || !response.data.registros_pendientes || response.data.registros_pendientes.length === 0) {
                if (listaContainer) listaContainer.classList.add('hidden');
                if (sinPendientes) sinPendientes.classList.remove('hidden');
                if (totalTexto) totalTexto.textContent = 'Sin pendientes';
                return;
            }

            const pendientes = response.data.registros_pendientes;

            if (totalTexto) {
                totalTexto.textContent = `${pendientes.length} registros`;
            }

            if (listaContainer) {
                listaContainer.innerHTML = `
                    <div class="divide-y">
                        ${pendientes.slice(0, 15).map(registro => `
                            <div class="px-6 py-4 hover:bg-gray-50 transition">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex-1">
                                        <div class="flex items-start gap-3">
                                            <div class="flex-1">
                                                <div class="font-semibold text-gray-800">
                                                    ${registro.usuaria_nombres || 'N/D'} ${registro.usuaria_apellidos || ''}
                                                </div>
                                                <div class="text-sm text-gray-600 mt-1">
                                                    📍 ${registro.comunidad || 'N/D'} • 
                                                    ${registro.metodo_nombre || registro.metodo || 'N/D'}
                                                </div>
                                                <div class="text-xs text-gray-500 mt-1">
                                                    Registrado por: ${registro.registrado_por_nombre || 'N/D'} • 
                                                    ${this.formatearFecha(registro.fecha_visita)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 flex-shrink-0">
                                        <button 
                                            onclick="EncargadoDashboard.aprobarRegistro(${registro.id})"
                                            class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
                                            title="Aprobar registro">
                                            ✅ Aprobar
                                        </button>
                                        <button 
                                            onclick="EncargadoDashboard.rechazarRegistro(${registro.id})"
                                            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                                            title="Rechazar registro">
                                            ❌ Rechazar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${pendientes.length > 15 ? `
                        <div class="px-6 py-4 bg-gray-50 border-t text-center">
                            <button 
                                onclick="ComponentLoader.navigateToView('validacion')" 
                                class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Ver todos los ${pendientes.length} registros →
                            </button>
                        </div>
                    ` : ''}
                `;
            }

            console.log(`📋 ${pendientes.length} registros pendientes cargados`);
            
        } catch (error) {
            console.error('❌ Error cargando pendientes:', error);
            const listaContainer = document.getElementById('lista-pendientes-aprobacion');
            if (listaContainer) {
                listaContainer.innerHTML = `
                    <div class="px-6 py-8 text-center text-red-600">
                        Error cargando registros pendientes
                    </div>
                `;
            }
        }
    },

    // ===== APROBAR REGISTRO =====
    async aprobarRegistro(registroId) {
        if (!confirm('¿Aprobar este registro?')) return;

        try {
            SGPF.showLoading && SGPF.showLoading(true);

            const response = await SGPF.apiCall(`/validacion/registro/${registroId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    accion: 'aprobar',
                    observaciones_validacion: 'Validado por Encargado SR'
                })
            });

            if (response && response.success) {
                SGPF.showToast('Registro aprobado exitosamente', 'success');
                await this.cargarPendientesAprobacion();
                await this.cargarMetricas();
            } else {
                throw new Error(response?.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ Error aprobando registro:', error);
            SGPF.showToast('Error al aprobar registro', 'error');
        } finally {
            SGPF.showLoading && SGPF.showLoading(false);
        }
    },

    // ===== RECHAZAR REGISTRO =====
    async rechazarRegistro(registroId) {
        const motivo = prompt('Motivo del rechazo (será eliminado permanentemente):');
        if (!motivo || motivo.trim() === '') {
            SGPF.showToast('Debe proporcionar un motivo', 'warning');
            return;
        }

        if (!confirm('⚠️ Este registro será eliminado permanentemente. ¿Continuar?')) return;

        try {
            SGPF.showLoading && SGPF.showLoading(true);

            const response = await SGPF.apiCall(`/registros/${registroId}`, {
                method: 'DELETE'
            });

            if (response && response.success) {
                SGPF.showToast('Registro eliminado', 'success');
                await this.cargarPendientesAprobacion();
                await this.cargarMetricas();
            } else {
                throw new Error(response?.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ Error eliminando registro:', error);
            SGPF.showToast('Error al eliminar registro', 'error');
        } finally {
            SGPF.showLoading && SGPF.showLoading(false);
        }
    },

    // ===== CARGAR ESTADO DE TERRITORIOS =====
    async cargarEstadoTerritorios() {
        try {
            const currentYear = new Date().getFullYear();
            const response = await SGPF.apiCall(`/dashboard/territorios/comparativo/${currentYear}`);
            
            const estadoElement = document.getElementById('estado-territorios');
            if (!estadoElement) return;

            if (response && response.success && response.data.territorios) {
                this.mostrarTerritorios(response.data.territorios);
            } else {
                this.mostrarTerritoriosFallback();
            }
        } catch (error) {
            console.error('❌ Error cargando territorios:', error);
            this.mostrarTerritoriosFallback();
        }
    },

    // ===== MOSTRAR TERRITORIOS =====
    mostrarTerritorios(territorios) {
        const estadoElement = document.getElementById('estado-territorios');
        if (!estadoElement) return;

        estadoElement.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${territorios.map(territorio => {
                    const cobertura = territorio.porcentaje_cobertura || 0;
                    const color = cobertura >= 85 ? 'green' : 
                                 cobertura >= 70 ? 'blue' : 
                                 cobertura >= 55 ? 'yellow' : 'red';
                    
                    return `
                        <div class="border-l-4 border-${color}-500 bg-${color}-50 p-4 rounded-r-lg">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-semibold text-gray-800">${territorio.territorio || 'Territorio'}</h4>
                                <span class="px-2 py-1 bg-${color}-600 text-white text-sm rounded">${cobertura}%</span>
                            </div>
                            <div class="text-sm text-gray-600 space-y-1">
                                <p>📍 ${territorio.total_comunidades || 0} comunidades</p>
                                <p>👥 ${(territorio.total_usuarias || 0).toLocaleString()} usuarias</p>
                                <p>👨‍⚕️ ${territorio.auxiliares_activos || 0} auxiliares</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // ===== MOSTRAR TERRITORIOS FALLBACK =====
    mostrarTerritoriosFallback() {
        const estadoElement = document.getElementById('estado-territorios');
        if (!estadoElement) return;

        estadoElement.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <p>📊 Información de territorios no disponible</p>
            </div>
        `;
    },

    // ===== CARGAR PANEL ADMIN =====
    async cargarPanelAdmin() {
        try {
            const response = await SGPF.apiCall('/admin/usuarios');
            
            const panelElement = document.getElementById('panel-admin');
            if (!panelElement) return;

            if (response && response.success) {
                const usuarios = response.data || [];
                const auxiliares = usuarios.filter(u => u.rol === 'auxiliar_enfermeria').length;
                const asistentes = usuarios.filter(u => u.rol === 'asistente_tecnico').length;
                
                panelElement.innerHTML = `
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-3xl font-bold text-blue-600">${usuarios.length}</div>
                            <div class="text-sm text-gray-600 mt-1">Total Personal</div>
                        </div>
                        <div>
                            <div class="text-3xl font-bold text-purple-600">${auxiliares}</div>
                            <div class="text-sm text-gray-600 mt-1">Auxiliares</div>
                        </div>
                        <div>
                            <div class="text-3xl font-bold text-pink-600">${asistentes}</div>
                            <div class="text-sm text-gray-600 mt-1">Asistentes</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error cargando panel admin:', error);
        }
    },

    // ===== FUNCIONES DE UTILIDAD =====
    formatearFecha(fecha) {
        if (!fecha) return '--';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
};