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
                this.cargarUltimasVisitasOptimizado()
            ]);

            console.log('✅ Dashboard auxiliar V2.1 cargado exitosamente');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            SGPF.showToast('Error cargando dashboard', 'error');
        }
    },

    // ===== CARGAR DATOS DEL USUARIO (CORREGIDO) =====
    async cargarDatosUsuario() {
        const user = SGPF.getCurrentUser();
        
        // Nombre completo
        const nombreElement = document.getElementById('auxiliar-nombre');
        if (nombreElement) {
            nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
        }

        // ✅ CORREGIDO: Mostrar TODAS las comunidades en el span correcto
        const comunidadesElement = document.getElementById('auxiliar-comunidades-lista');
        if (comunidadesElement && user.comunidades && user.comunidades.length > 0) {
            const nombresComunidades = user.comunidades.map(c => c.nombre).join(', ');
            comunidadesElement.textContent = nombresComunidades;
            console.log(`✅ Comunidades mostradas: ${nombresComunidades}`);
        } else if (comunidadesElement) {
            comunidadesElement.textContent = 'Sin comunidades asignadas';
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
            const contadorBadge = document.getElementById('visitas-count');

            if (!response.success || !response.data.visitas || response.data.visitas.length === 0) {
                console.log('ℹ️ Sin visitas registradas');
                if (container) {
                    container.innerHTML = '';
                    container.classList.add('hidden');
                }
                if (sinVisitas) sinVisitas.classList.remove('hidden');
                if (contadorBadge) contadorBadge.textContent = '0 visitas';
                return;
            }

            const visitas = response.data.visitas;
            console.log(`✅ ${visitas.length} visitas obtenidas`);

            // ✅ ACTUALIZAR BADGE DE CONTADOR
            if (contadorBadge) {
                contadorBadge.textContent = `${visitas.length} visita${visitas.length !== 1 ? 's' : ''}`;
            }

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
    }
};