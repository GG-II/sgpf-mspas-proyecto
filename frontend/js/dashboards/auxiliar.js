window.AuxiliarDashboard = window.AuxiliarDashboard || {
    
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard auxiliar');
        
        try {
            // Verificar que el usuario sea auxiliar
            const user = SGPF.getCurrentUser();
            if (!user || user.rol !== 'auxiliar_enfermeria') {
                console.error('❌ Usuario no es auxiliar de enfermería');
                return;
            }

            // Cargar datos en paralelo
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarEstadisticasPersonales(),
                this.cargarRegistrosDelMes(),
                this.cargarInfoComunidad()
            ]);

            console.log('✅ Dashboard auxiliar cargado');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard auxiliar:', error);
            SGPF.showToast('Error cargando dashboard', 'error');
        }
    },

    // ===== CARGAR DATOS DEL USUARIO =====
    async cargarDatosUsuario() {
        const user = SGPF.getCurrentUser();
        
        // Actualizar nombre del usuario
        const nombreElement = document.getElementById('auxiliar-nombre');
        if (nombreElement) {
            nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
        }

        // Mostrar comunidad principal (primera asignada)
        const comunidadElement = document.getElementById('auxiliar-comunidad');
        if (comunidadElement && user.comunidades && user.comunidades.length > 0) {
            comunidadElement.textContent = `Comunidad: ${user.comunidades[0].nombre}`;
        } else if (comunidadElement) {
            comunidadElement.textContent = 'Sin comunidades asignadas';
        }
    },

    // ===== CARGAR ESTADÍSTICAS PERSONALES =====
    async cargarEstadisticasPersonales() {
        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            
            // Obtener estadísticas personales
            const response = await SGPF.apiCall(`/perfil/estadisticas?year=${currentYear}`);
            
            if (response.success) {
                this.actualizarTarjetasEstado(response.data, currentMonth);
            }
            
        } catch (error) {
            console.error('❌ Error cargando estadísticas personales:', error);
            this.mostrarErrorEstadisticas();
        }
    },

    // ===== ACTUALIZAR TARJETAS DE ESTADO =====
    actualizarTarjetasEstado(data, currentMonth) {
        // 1. Estado del registro del mes
        const registroMesElement = document.getElementById('registro-mes-estado');
        const tieneRegistroEsteMes = data.actividad_mensual?.some(mes => mes.mes === currentMonth);
        
        if (registroMesElement) {
            if (tieneRegistroEsteMes) {
                registroMesElement.textContent = '✅';
                registroMesElement.style.color = 'var(--mspas-success)';
            } else {
                registroMesElement.textContent = '⏳';
                registroMesElement.style.color = 'var(--mspas-warning)';
            }
        }

        // 2. Progreso hacia meta anual (estimado)
        const metaElement = document.getElementById('meta-anual-porcentaje');
        if (metaElement) {
            // Estimación simple: si tiene registros vs meses activos
            const mesesActivos = data.resumen.meses_activos || 0;
            const porcentajeProgreso = Math.min((mesesActivos / 12) * 100, 100);
            metaElement.textContent = `${Math.round(porcentajeProgreso)}%`;
            
            // Color según progreso
            if (porcentajeProgreso >= 75) {
                metaElement.style.color = 'var(--mspas-success)';
            } else if (porcentajeProgreso >= 50) {
                metaElement.style.color = 'var(--mspas-warning)';
            } else {
                metaElement.style.color = 'var(--mspas-danger)';
            }
        }

        // 3. Última sincronización (simulada por última actividad)
        const sincronElement = document.getElementById('ultima-sincronizacion');
        if (sincronElement) {
            if (data.resumen.ultimo_registro) {
                const fecha = new Date(data.resumen.ultimo_registro);
                sincronElement.textContent = this.formatearFechaRelativa(fecha);
            } else {
                sincronElement.textContent = 'Nunca';
            }
        }

        // 4. Usuarias registradas este mes
        const usuariasElement = document.getElementById('metodos-registrados');
        if (usuariasElement) {
            const registroEsteMes = data.actividad_mensual?.find(mes => mes.mes === currentMonth);
            usuariasElement.textContent = registroEsteMes?.usuarias || 0;
        }
    },

    // ===== CARGAR REGISTROS DEL MES ACTUAL =====
    async cargarRegistrosDelMes() {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            
            // Obtener registros del usuario actual
            const response = await SGPF.apiCall('/registros?limit=50');
            
            if (response.success) {
                // Filtrar registros del mes actual
                const registrosEsteMes = response.data.registros.filter(registro => {
                    return registro.año === currentYear && registro.mes === currentMonth;
                });
                
                this.mostrarRegistrosDelMes(registrosEsteMes);
            }
            
        } catch (error) {
            console.error('❌ Error cargando registros del mes:', error);
            this.mostrarErrorRegistros();
        }
    },

    // ===== MOSTRAR REGISTROS DEL MES =====
    mostrarRegistrosDelMes(registros) {
        const resumenElement = document.getElementById('resumen-mes-actual');
        const tablaContainer = document.getElementById('tabla-registros-container');
        const sinRegistrosElement = document.getElementById('sin-registros-mensaje');
        const tablaBody = document.getElementById('tabla-registros-body');

        if (!resumenElement) return;

        // Limpiar loading
        resumenElement.innerHTML = '';

        if (registros.length === 0) {
            // Mostrar mensaje de sin registros
            if (tablaContainer) tablaContainer.style.display = 'none';
            if (sinRegistrosElement) sinRegistrosElement.style.display = 'block';
            return;
        }

        // Mostrar tabla con registros
        if (sinRegistrosElement) sinRegistrosElement.style.display = 'none';
        if (tablaContainer) tablaContainer.style.display = 'block';

        // Llenar tabla
        if (tablaBody) {
            tablaBody.innerHTML = registros.map(registro => `
                <tr>
                    <td>${registro.metodo}</td>
                    <td><strong>${registro.cantidad_administrada}</strong></td>
                    <td><span class="status status-${registro.estado}">${this.formatearEstado(registro.estado)}</span></td>
                    <td>${this.formatearFecha(registro.fecha_registro)}</td>
                </tr>
            `).join('');
        }

        // Mostrar resumen
        const totalUsuarias = registros.reduce((sum, r) => sum + (r.cantidad_administrada || 0), 0);
        resumenElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${registros.length}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Registros</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${totalUsuarias}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Usuarias</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--mspas-primary);">${new Set(registros.map(r => r.metodo)).size}</div>
                    <div style="font-size: 0.9rem; color: var(--mspas-text-secondary);">Métodos</div>
                </div>
            </div>
        `;
    },

    // ===== CARGAR INFORMACIÓN DE LA COMUNIDAD =====
    async cargarInfoComunidad() {
        try {
            const user = SGPF.getCurrentUser();
            
            if (!user.comunidades || user.comunidades.length === 0) {
                this.mostrarSinComunidades();
                return;
            }

            const comunidad = user.comunidades[0]; // Primera comunidad asignada
            
            // Obtener métricas específicas de la comunidad
            const response = await SGPF.apiCall(`/dashboard/comunidades/${comunidad.id}`);
            
            if (response.success) {
                this.mostrarInfoComunidad(comunidad, response.data);
            } else {
                this.mostrarInfoComunidadBasica(comunidad);
            }
            
        } catch (error) {
            console.error('❌ Error cargando info de comunidad:', error);
            this.mostrarErrorComunidad();
        }
    },

    // ===== MOSTRAR INFORMACIÓN DE LA COMUNIDAD =====
    mostrarInfoComunidad(comunidad, data) {
        const infoElement = document.getElementById('info-comunidad');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <h4>${comunidad.nombre}</h4>
                    <p><strong>Código:</strong> ${comunidad.codigo_comunidad}</p>
                    <p><strong>Población MEF:</strong> ${data?.comunidad?.poblacion_mef || comunidad.poblacion_mef || 'No disponible'}</p>
                </div>
                <div>
                    <h4>Este Año</h4>
                    <p><strong>Total Usuarias:</strong> ${data?.resumen?.total_usuarias || 0}</p>
                    <p><strong>Cobertura:</strong> ${data?.resumen?.porcentaje_poblacion_mef || 0}%</p>
                    <p><strong>Meses Activos:</strong> ${data?.resumen?.meses_con_registros || 0}/12</p>
                </div>
            </div>
        `;
    },

    // ===== MOSTRAR INFO BÁSICA DE COMUNIDAD =====
    mostrarInfoComunidadBasica(comunidad) {
        const infoElement = document.getElementById('info-comunidad');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <div>
                <h4>${comunidad.nombre}</h4>
                <p><strong>Código:</strong> ${comunidad.codigo_comunidad}</p>
                <p><em>Información detallada no disponible</em></p>
            </div>
        `;
    },

    // ===== MOSTRAR HISTORIAL PERSONAL =====
    async mostrarHistorial() {
        try {
            SGPF.showLoading(true);
            
            const response = await SGPF.apiCall('/registros?limit=20');
            
            if (response.success) {
                // Crear modal o navegar a vista de historial
                this.crearModalHistorial(response.data.registros);
            }
            
        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            SGPF.showToast('Error cargando historial', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== CREAR MODAL DE HISTORIAL =====
    crearModalHistorial(registros) {
        // Crear overlay modal
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.cursor = 'pointer';
        
        const modal = document.createElement('div');
        modal.className = 'card';
        modal.style.cssText = `
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            margin: 2rem;
            cursor: default;
        `;
        
        modal.innerHTML = `
            <div class="card-header">
                <h3>Mi Historial de Registros</h3>
                <button id="cerrar-modal" style="float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div class="card-body">
                ${registros.length === 0 ? 
                    '<p>No tienes registros todavía.</p>' :
                    `<div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Método</th>
                                    <th>Cantidad</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${registros.map(r => `
                                    <tr>
                                        <td>${this.formatearFecha(r.fecha_registro)}</td>
                                        <td>${r.metodo}</td>
                                        <td><strong>${r.cantidad_administrada}</strong></td>
                                        <td><span class="status status-${r.estado}">${this.formatearEstado(r.estado)}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`
                }
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
        
        modal.querySelector('#cerrar-modal').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // Prevenir que clicks en el modal cierren el overlay
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    },

    // ===== SINCRONIZAR DATOS =====
    async sincronizarDatos() {
        try {
            SGPF.showLoading(true);
            SGPF.showToast('Sincronizando datos...', 'info');
            
            // Simular sincronización y recargar datos
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Recargar dashboard
            await this.init();
            
            SGPF.showToast('Datos sincronizados correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error sincronizando:', error);
            SGPF.showToast('Error en sincronización', 'error');
        } finally {
            SGPF.showLoading(false);
        }
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

    formatearFechaRelativa(fecha) {
        const ahora = new Date();
        const diff = ahora - fecha;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (dias === 0) return 'Hoy';
        if (dias === 1) return 'Ayer';
        if (dias < 7) return `Hace ${dias} días`;
        if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
        return this.formatearFecha(fecha);
    },

    formatearEstado(estado) {
        const estados = {
            'registrado': 'Pendiente',
            'validado': 'Validado',
            'aprobado': 'Aprobado'
        };
        return estados[estado] || estado;
    },

    // ===== FUNCIONES DE ERROR =====
    mostrarErrorEstadisticas() {
        const elements = [
            'registro-mes-estado',
            'meta-anual-porcentaje',
            'ultima-sincronizacion',
            'metodos-registrados'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '--';
                element.style.color = 'var(--mspas-text-secondary)';
            }
        });
    },

    mostrarErrorRegistros() {
        const resumenElement = document.getElementById('resumen-mes-actual');
        if (resumenElement) {
            resumenElement.innerHTML = '<div class="error">Error cargando registros del mes</div>';
        }
    },

    mostrarErrorComunidad() {
        const infoElement = document.getElementById('info-comunidad');
        if (infoElement) {
            infoElement.innerHTML = '<div class="error">Error cargando información de la comunidad</div>';
        }
    },

    mostrarSinComunidades() {
        const infoElement = document.getElementById('info-comunidad');
        if (infoElement) {
            infoElement.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h4>Sin Comunidades Asignadas</h4>
                    <p>Contacta a tu supervisor para que te asigne comunidades.</p>
                </div>
            `;
        }
    }
};

