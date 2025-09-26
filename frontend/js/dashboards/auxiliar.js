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

            // Cargar datos en paralelo (eliminadas cargarRegistrosDelMes)
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarEstadisticasPersonales(),
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

    // ELIMINADA: cargarRegistrosDelMes()
    // ELIMINADA: mostrarRegistrosDelMes()
    // ELIMINADA: mostrarHistorial()
    // ELIMINADA: crearModalHistorial()
    // ELIMINADA: sincronizarDatos()

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

    // ELIMINADA: mostrarErrorRegistros()

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