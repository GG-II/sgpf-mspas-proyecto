window.AuxiliarDashboard = window.AuxiliarDashboard || {
    
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard auxiliar V2.0');
        
        // Delay crítico para renderizado DOM
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            const user = SGPF.getCurrentUser();
            if (!user || user.rol !== 'auxiliar_enfermeria') {
                console.error('❌ Usuario no es auxiliar de enfermería');
                SGPF.showToast('Acceso no autorizado', 'error');
                return;
            }

            // Cargar datos en paralelo
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarEstadisticasMes(),
                this.cargarUltimasVisitas(),
                this.cargarInfoComunidad()
            ]);

            console.log('✅ Dashboard auxiliar V2.0 cargado');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            SGPF.showToast('Error cargando dashboard', 'error');
        }
    },

    // ===== CARGAR DATOS DEL USUARIO =====
    async cargarDatosUsuario() {
        const user = SGPF.getCurrentUser();
        
        const nombreElement = document.getElementById('auxiliar-nombre');
        if (nombreElement) {
            nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
        }

        const comunidadElement = document.getElementById('auxiliar-comunidad');
        if (comunidadElement && user.comunidades && user.comunidades.length > 0) {
            comunidadElement.textContent = `Comunidad: ${user.comunidades[0].nombre}`;
        }
    },

    // ===== CARGAR ESTADÍSTICAS DEL MES =====
    async cargarEstadisticasMes() {
        try {
            const user = SGPF.getCurrentUser();
            const hoy = new Date();
            const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
            const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

            // Obtener visitas del mes actual filtradas por comunidad del auxiliar
            const comunidadId = user.comunidades?.[0]?.id;
            
            if (!comunidadId) {
                this.mostrarEstadisticasVacias();
                return;
            }

            // Obtener todas las visitas del mes en mi comunidad
            const response = await SGPF.apiCall(
                `/visitas?fecha_desde=${primerDia}&fecha_hasta=${ultimoDia}&comunidad_id=${comunidadId}`
            );

            if (response.success && response.data.visitas) {
                this.calcularEstadisticas(response.data.visitas);
            } else {
                this.mostrarEstadisticasVacias();
            }
            
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            this.mostrarEstadisticasVacias();
        }
    },

    // ===== CALCULAR ESTADÍSTICAS POR TIPO =====
    calcularEstadisticas(visitas) {
        // Agrupar visitas por usuaria para determinar su tipo
        const usuariasTipos = {};
        
        visitas.forEach(visita => {
            if (!usuariasTipos[visita.usuaria_id]) {
                usuariasTipos[visita.usuaria_id] = visita.tipo_usuaria || 'nueva';
            }
        });

        // Contar por tipo
        const conteos = {
            nueva: 0,
            reconsulta: 0,
            activa: 0
        };

        Object.values(usuariasTipos).forEach(tipo => {
            if (conteos.hasOwnProperty(tipo)) {
                conteos[tipo]++;
            }
        });

        // Actualizar UI
        this.actualizarMetricas(conteos);
    },

    // ===== ACTUALIZAR MÉTRICAS EN UI =====
    actualizarMetricas(conteos) {
        const elementos = {
            'usuarias-nuevas': conteos.nueva,
            'usuarias-reconsulta': conteos.reconsulta,
            'usuarias-activas': conteos.activa
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = valor;
                // Animación de número
                element.classList.add('animate-pulse');
                setTimeout(() => element.classList.remove('animate-pulse'), 500);
            }
        });

        console.log('📊 Estadísticas actualizadas:', conteos);
    },

    // ===== MOSTRAR ESTADÍSTICAS VACÍAS =====
    mostrarEstadisticasVacias() {
        ['usuarias-nuevas', 'usuarias-reconsulta', 'usuarias-activas'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    },

    // ===== CARGAR ÚLTIMAS VISITAS =====
    async cargarUltimasVisitas() {
        try {
            const user = SGPF.getCurrentUser();
            
            // Obtener mis últimas 5 visitas registradas
            const response = await SGPF.apiCall('/visitas?limit=5&offset=0');

            const container = document.getElementById('ultimas-visitas');
            const sinVisitas = document.getElementById('sin-visitas');

            if (!response.success || !response.data.visitas || response.data.visitas.length === 0) {
                if (container) container.classList.add('hidden');
                if (sinVisitas) sinVisitas.classList.remove('hidden');
                return;
            }

            if (container) {
                container.innerHTML = response.data.visitas.map(visita => `
                    <div class="px-6 py-4 hover:bg-gray-50 transition">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">
                                    ${visita.usuaria_nombres} ${visita.usuaria_apellidos}
                                </div>
                                <div class="text-sm text-gray-600 mt-1">
                                    ${visita.metodo_nombre}
                                </div>
                                ${visita.observaciones ? `
                                    <div class="text-xs text-gray-500 mt-1 italic">
                                        ${visita.observaciones}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="text-right text-sm text-gray-500 flex-shrink-0">
                                <div>${this.formatearFecha(visita.fecha_visita)}</div>
                                <div class="text-xs mt-1">
                                    ${this.obtenerBadgeEstado(visita.estado)}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            console.log(`📋 ${response.data.visitas.length} visitas cargadas`);
            
        } catch (error) {
            console.error('❌ Error cargando visitas:', error);
            const container = document.getElementById('ultimas-visitas');
            if (container) {
                container.innerHTML = `
                    <div class="px-6 py-4 text-center text-red-600">
                        Error cargando visitas
                    </div>
                `;
            }
        }
    },

    // ===== CARGAR INFO COMUNIDAD =====
    async cargarInfoComunidad() {
        try {
            const user = SGPF.getCurrentUser();
            
            if (!user.comunidades || user.comunidades.length === 0) {
                this.mostrarSinComunidades();
                return;
            }

            const comunidad = user.comunidades[0];
            
            // Intentar obtener métricas de la comunidad
            try {
                const response = await SGPF.apiCall(`/dashboard/comunidades/${comunidad.id}`);
                
                if (response.success) {
                    this.mostrarInfoComunidadCompleta(comunidad, response.data);
                } else {
                    this.mostrarInfoComunidadBasica(comunidad);
                }
            } catch {
                this.mostrarInfoComunidadBasica(comunidad);
            }
            
        } catch (error) {
            console.error('❌ Error cargando info comunidad:', error);
            this.mostrarErrorComunidad();
        }
    },

    // ===== MOSTRAR INFO COMUNIDAD COMPLETA =====
    mostrarInfoComunidadCompleta(comunidad, data) {
        const infoElement = document.getElementById('info-comunidad');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">${comunidad.nombre}</h4>
                    <div class="space-y-1 text-sm text-gray-600">
                        <p><span class="font-medium">Código:</span> ${comunidad.codigo_comunidad}</p>
                        <p><span class="font-medium">Población MEF:</span> ${data?.comunidad?.poblacion_mef || comunidad.poblacion_mef || 'N/D'}</p>
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Este Año</h4>
                    <div class="space-y-1 text-sm text-gray-600">
                        <p><span class="font-medium">Total Usuarias:</span> ${data?.resumen?.total_usuarias || 0}</p>
                        <p><span class="font-medium">Cobertura:</span> ${data?.resumen?.porcentaje_poblacion_mef || 0}%</p>
                        <p><span class="font-medium">Meses Activos:</span> ${data?.resumen?.meses_con_registros || 0}/12</p>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== MOSTRAR INFO BÁSICA =====
    mostrarInfoComunidadBasica(comunidad) {
        const infoElement = document.getElementById('info-comunidad');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <div class="text-sm text-gray-600">
                <h4 class="font-semibold text-gray-800 mb-2">${comunidad.nombre}</h4>
                <p><span class="font-medium">Código:</span> ${comunidad.codigo_comunidad}</p>
                <p class="text-gray-500 italic mt-2">Información detallada no disponible</p>
            </div>
        `;
    },

    // ===== FUNCIONES DE UTILIDAD =====
    formatearFecha(fecha) {
        if (!fecha) return '--';
        const date = new Date(fecha);
        const hoy = new Date();
        
        // Si es hoy
        if (date.toDateString() === hoy.toDateString()) {
            return 'Hoy';
        }
        
        // Si es ayer
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        if (date.toDateString() === ayer.toDateString()) {
            return 'Ayer';
        }
        
        // Formato normal
        return date.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: 'short'
        });
    },

    obtenerBadgeEstado(estado) {
        const badges = {
            'registrado': '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">Pendiente</span>',
            'validado': '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Validado</span>',
            'rechazado': '<span class="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">Rechazado</span>'
        };
        return badges[estado] || '';
    },

    // ===== MENSAJES DE ERROR =====
    mostrarSinComunidades() {
        const infoElement = document.getElementById('info-comunidad');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p class="text-2xl mb-2">📍</p>
                    <p>Sin comunidades asignadas</p>
                    <p class="text-sm mt-1">Contacta a tu supervisor</p>
                </div>
            `;
        }
    },

    mostrarErrorComunidad() {
        const infoElement = document.getElementById('info-comunidad');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="text-center py-4 text-red-600">
                    <p class="text-2xl mb-2">⚠️</p>
                    <p>Error cargando información</p>
                </div>
            `;
        }
    }
};