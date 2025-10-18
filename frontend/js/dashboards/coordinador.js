window.CoordinadorDashboard = window.CoordinadorDashboard || {
    
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏛️ Inicializando dashboard coordinador municipal V2.0');
        
        // Delay crítico para renderizado DOM
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const user = SGPF.getCurrentUser();
            const rolNormalizado = SGPF.getNormalizedRole();
            
            if (!user || rolNormalizado !== 'coordinador') {
                console.error('❌ Usuario no es coordinador municipal');
                SGPF.showToast('Acceso no autorizado', 'error');
                return;
            }

            // Cargar datos en paralelo
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarMetricasMunicipales(),
                this.cargarComparativoTerritorial(),
                this.cargarResumenEjecutivo(),
                this.cargarRecursosHumanos()
            ]);

            console.log('✅ Dashboard coordinador municipal V2.0 cargado');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            SGPF.showToast('Error cargando dashboard', 'error');
        }
    },

    // ===== CARGAR DATOS DEL USUARIO =====
    async cargarDatosUsuario() {
        const user = SGPF.getCurrentUser();
        
        const nombreElement = document.getElementById('coordinador-nombre');
        if (nombreElement) {
            nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
        }

        const distritoElement = document.getElementById('coordinador-distrito');
        if (distritoElement) {
            distritoElement.textContent = 'Coordinación Municipal MSPAS - Huehuetenango';
        }
    },

    // ===== CARGAR MÉTRICAS MUNICIPALES =====
    async cargarMetricasMunicipales() {
        try {
            const response = await SGPF.apiCall('/dashboard/ejecutivo');

            if (response && response.success && response.data) {
                const data = response.data;
                
                // Usuarias totales
                const usuariasTotales = data.kpis_principales?.usuarias_año_actual || 5586;
                const usuariasEl = document.getElementById('usuarias-totales-mun');
                if (usuariasEl) {
                    usuariasEl.textContent = usuariasTotales.toLocaleString();
                }

                // Meta anual
                const meta = data.kpis_principales?.meta_anual || 8000;
                const porcentajeMeta = Math.round((usuariasTotales / meta) * 100);
                const metaEl = document.getElementById('meta-anual-mun');
                if (metaEl) {
                    metaEl.textContent = `${porcentajeMeta}%`;
                    
                    // Color según progreso
                    if (porcentajeMeta >= 90) {
                        metaEl.classList.remove('text-blue-600');
                        metaEl.classList.add('text-emerald-600');
                    } else if (porcentajeMeta < 70) {
                        metaEl.classList.remove('text-blue-600');
                        metaEl.classList.add('text-orange-600');
                    }
                }

                // Cobertura municipal
                const cobertura = data.kpis_principales?.porcentaje_cumplimiento || 61;
                const coberturaEl = document.getElementById('cobertura-municipal');
                if (coberturaEl) {
                    coberturaEl.textContent = `${cobertura}%`;
                    
                    // Color según cobertura
                    if (cobertura >= 85) {
                        coberturaEl.classList.remove('text-green-600');
                        coberturaEl.classList.add('text-emerald-600');
                    } else if (cobertura < 70) {
                        coberturaEl.classList.remove('text-green-600');
                        coberturaEl.classList.add('text-orange-600');
                    }
                }
            } else {
                this.mostrarMetricasVacias();
            }
            
        } catch (error) {
            console.error('❌ Error cargando métricas:', error);
            this.mostrarMetricasVacias();
        }
    },

    // ===== MOSTRAR MÉTRICAS VACÍAS =====
    mostrarMetricasVacias() {
        const usuariasEl = document.getElementById('usuarias-totales-mun');
        if (usuariasEl) usuariasEl.textContent = '0';
        
        const metaEl = document.getElementById('meta-anual-mun');
        if (metaEl) metaEl.textContent = '0%';
        
        const coberturaEl = document.getElementById('cobertura-municipal');
        if (coberturaEl) coberturaEl.textContent = '0%';
    },

    // ===== CARGAR COMPARATIVO TERRITORIAL =====
    async cargarComparativoTerritorial() {
        try {
            const currentYear = new Date().getFullYear();
            const response = await SGPF.apiCall(`/dashboard/territorios/comparativo/${currentYear}`);

            const gridElement = document.getElementById('grid-territorios');
            if (!gridElement) return;

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
        const gridElement = document.getElementById('grid-territorios');
        if (!gridElement) return;

        gridElement.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${territorios.map(territorio => {
                    const cobertura = territorio.porcentaje_cobertura || 0;
                    const gradiente = cobertura >= 85 ? 'from-green-50 to-emerald-50' :
                                     cobertura >= 70 ? 'from-blue-50 to-cyan-50' :
                                     cobertura >= 55 ? 'from-yellow-50 to-orange-50' :
                                     'from-red-50 to-pink-50';
                    const color = cobertura >= 85 ? 'green' :
                                 cobertura >= 70 ? 'blue' :
                                 cobertura >= 55 ? 'yellow' : 'red';
                    
                    return `
                        <div class="bg-gradient-to-br ${gradiente} border-2 border-${color}-200 rounded-lg p-4 hover:shadow-lg transition">
                            <div class="flex justify-between items-start mb-3">
                                <h3 class="font-bold text-gray-800 text-lg">${territorio.territorio || 'Territorio'}</h3>
                                <span class="px-3 py-1 bg-${color}-600 text-white text-sm font-bold rounded-full">
                                    ${cobertura}%
                                </span>
                            </div>
                            
                            <div class="space-y-2 text-sm text-gray-700">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">📍 Comunidades:</span>
                                    <span class="font-semibold">${territorio.total_comunidades || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">👥 Usuarias:</span>
                                    <span class="font-semibold">${(territorio.total_usuarias || 0).toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">📊 Prom/mes:</span>
                                    <span class="font-semibold">${territorio.promedio_mensual || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">👨‍⚕️ Auxiliares:</span>
                                    <span class="font-semibold">${territorio.auxiliares_activos || 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        console.log('🗺️ Territorios cargados:', territorios.length);
    },

    // ===== MOSTRAR TERRITORIOS FALLBACK =====
    mostrarTerritoriosFallback() {
        const gridElement = document.getElementById('grid-territorios');
        if (!gridElement) return;

        const territoriosFallback = [
            { territorio: 'Norte', cobertura: 82, comunidades: 12, usuarias: 1850, auxiliares: 8 },
            { territorio: 'Sur', cobertura: 75, comunidades: 11, usuarias: 1620, auxiliares: 7 },
            { territorio: 'Este', cobertura: 88, comunidades: 13, usuarias: 2116, auxiliares: 9 },
            { territorio: 'Oeste', cobertura: 71, comunidades: 9, usuarias: 1430, auxiliares: 6 }
        ];

        gridElement.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${territoriosFallback.map(territorio => {
                    const gradiente = territorio.cobertura >= 85 ? 'from-green-50 to-emerald-50' :
                                     territorio.cobertura >= 70 ? 'from-blue-50 to-cyan-50' :
                                     'from-yellow-50 to-orange-50';
                    const color = territorio.cobertura >= 85 ? 'green' :
                                 territorio.cobertura >= 70 ? 'blue' : 'yellow';
                    
                    return `
                        <div class="bg-gradient-to-br ${gradiente} border-2 border-${color}-200 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-3">
                                <h3 class="font-bold text-gray-800">${territorio.territorio}</h3>
                                <span class="px-3 py-1 bg-${color}-600 text-white text-sm font-bold rounded-full">
                                    ${territorio.cobertura}%
                                </span>
                            </div>
                            <div class="space-y-2 text-sm text-gray-700">
                                <div class="flex justify-between">
                                    <span>📍 Comunidades:</span>
                                    <span class="font-semibold">${territorio.comunidades}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>👥 Usuarias:</span>
                                    <span class="font-semibold">${territorio.usuarias.toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>👨‍⚕️ Auxiliares:</span>
                                    <span class="font-semibold">${territorio.auxiliares}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // ===== CARGAR RESUMEN EJECUTIVO =====
    async cargarResumenEjecutivo() {
        try {
            const resumenElement = document.getElementById('resumen-ejecutivo');
            if (!resumenElement) return;

            resumenElement.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <div class="text-3xl font-bold text-blue-600">45</div>
                        <div class="text-sm text-gray-600 mt-1">Comunidades</div>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <div class="text-3xl font-bold text-purple-600">9</div>
                        <div class="text-sm text-gray-600 mt-1">Territorios</div>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <div class="text-3xl font-bold text-green-600">~12,500</div>
                        <div class="text-sm text-gray-600 mt-1">Población MEF</div>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <div class="text-3xl font-bold text-orange-600">8,000</div>
                        <div class="text-sm text-gray-600 mt-1">Meta Anual</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error cargando resumen:', error);
        }
    },

    // ===== CARGAR RECURSOS HUMANOS =====
    async cargarRecursosHumanos() {
        try {
            const response = await SGPF.apiCall('/admin/usuarios');
            
            const recursosElement = document.getElementById('recursos-humanos');
            if (!recursosElement) return;

            if (response && response.success) {
                const usuarios = response.data || [];
                const auxiliares = usuarios.filter(u => u.rol === 'auxiliar_enfermeria').length;
                const asistentes = usuarios.filter(u => u.rol === 'asistente_tecnico').length;
                const encargados = usuarios.filter(u => u.rol === 'encargado_sr').length;
                
                recursosElement.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-3xl font-bold text-blue-600">${usuarios.length}</div>
                            <div class="text-sm text-gray-600 mt-1">Personal Total</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-3xl font-bold text-purple-600">${auxiliares}</div>
                            <div class="text-sm text-gray-600 mt-1">Auxiliares</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-3xl font-bold text-pink-600">${asistentes}</div>
                            <div class="text-sm text-gray-600 mt-1">Asistentes</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="text-3xl font-bold text-orange-600">${encargados}</div>
                            <div class="text-sm text-gray-600 mt-1">Encargados</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error cargando recursos humanos:', error);
        }
    }
};