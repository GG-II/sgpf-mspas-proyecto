window.AuxiliarDashboard = window.AuxiliarDashboard || {
    
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard auxiliar V2.1 OPTIMIZADO');
        
        // Delay crítico para renderizado DOM
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            const user = SGPF.getCurrentUser();
            if (!user || user.rol !== 'auxiliar_enfermeria') {
                console.error('❌ Usuario no es auxiliar de enfermería');
                SGPF.showToast('Acceso no autorizado', 'error');
                return;
            }

            // Cargar datos en paralelo usando endpoints optimizados
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarEstadisticasMesOptimizado(),
                this.cargarUltimasVisitasOptimizado(),
                this.cargarInfoComunidadOptimizado()
            ]);

            console.log('✅ Dashboard auxiliar V2.1 cargado exitosamente');
            
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

    // ===== CARGAR ESTADÍSTICAS DEL MES (OPTIMIZADO) =====
    async cargarEstadisticasMesOptimizado() {
        try {
            console.log('📊 Cargando estadísticas del mes (endpoint optimizado)...');
            
            // ✅ Llamada al nuevo endpoint optimizado
            const response = await SGPF.apiCall('/dashboard-auxiliar/stats/mes-actual');

            if (response.success && response.data) {
                const data = response.data;
                
                console.log(`✅ Estadísticas del mes obtenidas: ${data.periodo.descripcion}`);
                console.log('   - Total usuarias:', data.total_usuarias_unicas);
                console.log('   - Nuevas:', data.usuarias_nuevas);
                console.log('   - Reconsulta:', data.usuarias_reconsulta);
                console.log('   - Activas:', data.usuarias_activas);
                
                // Actualizar las 4 tarjetas directamente
                this.actualizarMetricas({
                    total: data.total_usuarias_unicas,
                    nueva: data.usuarias_nuevas,
                    reconsulta: data.usuarias_reconsulta,
                    activa: data.usuarias_activas
                });
            } else {
                console.warn('⚠️ Sin datos de estadísticas, mostrando valores en cero');
                this.mostrarEstadisticasVacias();
            }
            
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            SGPF.showToast('Error cargando estadísticas del mes', 'error');
            this.mostrarEstadisticasVacias();
        }
    },

    // ===== ACTUALIZAR MÉTRICAS EN UI =====
    actualizarMetricas(conteos) {
        const elementos = {
            'total-usuarias': conteos.total,
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

        console.log('📊 Métricas actualizadas en UI:', conteos);
    },

    // ===== MOSTRAR ESTADÍSTICAS VACÍAS =====
    mostrarEstadisticasVacias() {
        ['total-usuarias', 'usuarias-nuevas', 'usuarias-reconsulta', 'usuarias-activas'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    },

    // ===== CARGAR ÚLTIMAS VISITAS (OPTIMIZADO) =====
    async cargarUltimasVisitasOptimizado() {
        try {
            console.log('📋 Cargando últimas 5 visitas (endpoint optimizado)...');
            
            // ✅ Llamada al nuevo endpoint optimizado
            const response = await SGPF.apiCall('/dashboard-auxiliar/ultimas-visitas?limit=5');

            const container = document.getElementById('ultimas-visitas');
            const sinVisitas = document.getElementById('sin-visitas');

            if (!response.success || !response.data.visitas || response.data.visitas.length === 0) {
                console.log('ℹ️ Sin visitas registradas');
                if (container) container.classList.add('hidden');
                if (sinVisitas) sinVisitas.classList.remove('hidden');
                return;
            }

            const visitas = response.data.visitas;
            console.log(`✅ ${visitas.length} visitas obtenidas`);

            if (container) {
                container.classList.remove('hidden');
                if (sinVisitas) sinVisitas.classList.add('hidden');
                
                container.innerHTML = visitas.map(visita => `
                    <div class="px-6 py-4 hover:bg-gray-50 transition">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">
                                    ${visita.usuaria_nombres} ${visita.usuaria_apellidos}
                                </div>
                                <div class="text-sm text-gray-600 mt-1">
                                    ${visita.metodo_nombre}
                                    <span class="text-xs text-gray-400 ml-2">
                                        (${this.getTipoUsuariaBadge(visita.tipo_usuaria)})
                                    </span>
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

    // ===== CARGAR TODAS LAS COMUNIDADES ASIGNADAS =====
async cargarInfoComunidadOptimizado() {
    try {
        console.log('🏘️ Cargando comunidades asignadas (endpoint optimizado)...');
        
        // ✅ Llamada al nuevo endpoint
        const response = await SGPF.apiCall('/dashboard-auxiliar/mis-comunidades');
        
        const infoElement = document.getElementById('info-comunidad');
        if (!infoElement) return;

        if (!response.success || !response.data || response.data.total === 0) {
            console.log('ℹ️ Sin comunidades asignadas');
            this.mostrarSinComunidades();
            return;
        }

        const comunidades = response.data.comunidades;
        console.log(`✅ ${comunidades.length} comunidades obtenidas`);

        // Mostrar TODAS las comunidades
        infoElement.innerHTML = `
            <div class="space-y-3">
                ${comunidades.map(com => `
                    <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition">
                        <h4 class="font-semibold text-gray-800 mb-2">${com.nombre}</h4>
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <div><span class="font-medium">Código:</span> ${com.codigo_comunidad}</div>
                            <div><span class="font-medium">Territorio:</span> ${com.territorio_nombre}</div>
                            <div><span class="font-medium">Población MEF:</span> ${com.poblacion_mef}</div>
                            <div><span class="font-medium">Distancia:</span> ${com.distancia_km || 'N/D'} km</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-3 text-xs text-gray-500 text-center">
                Total: ${comunidades.length} comunidad${comunidades.length !== 1 ? 'es' : ''} asignada${comunidades.length !== 1 ? 's' : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Error cargando comunidades:', error);
        this.mostrarErrorComunidad();
    }
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

    getTipoUsuariaBadge(tipo) {
        const badges = {
            'nueva': '<span class="text-green-600 font-medium">Nueva</span>',
            'reconsulta': '<span class="text-blue-600 font-medium">Reconsulta</span>',
            'activa': '<span class="text-purple-600 font-medium">Activa</span>'
        };
        return badges[tipo] || tipo;
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