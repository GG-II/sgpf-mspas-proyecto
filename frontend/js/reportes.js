// ===== SISTEMA DE REPORTES V2.0 =====
window.ReportesSystem = {
    
    // ===== ESTADO GLOBAL =====
    state: {
        anioActual: new Date().getFullYear(),
        pestanaActiva: 'proyeccion-general',
        metodoSeleccionado: null,
        territorioSeleccionado: null,
        consultaActiva: 'general',
        datosActuales: null,
        metodos: [],
        territorios: [],
        usuarias: []
    },

    // ===== INICIALIZAR SISTEMA =====
    async init() {
        console.log('📊 Inicializando Sistema de Reportes V2.0');
        
        try {
            const user = SGPF.getCurrentUser();
            
            if (!user) {
                console.error('❌ Usuario no autenticado');
                SGPF.showToast('Debes iniciar sesión', 'error');
                return;
            }

            // Verificar permisos
            if (user.rol !== 'coordinador_municipal' && user.rol !== 'encargado_sr') {
                console.error('❌ Usuario sin permisos de reportes');
                SGPF.showToast('No tienes permisos para ver reportes ejecutivos', 'error');
                return;
            }

            // Delay para asegurar que DOM está listo
            await new Promise(resolve => setTimeout(resolve, 500));

            // Cargar datos iniciales
            await this.cargarAniosDisponibles();
            await this.cargarMetodos();
            await this.cargarTerritorios();

            // Configurar selector de año
            this.configurarSelectorAnio();

            // Cargar primera pestaña
            await this.cambiarPestana('proyeccion-general');

            console.log('✅ Sistema de Reportes inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando reportes:', error);
            SGPF.showToast('Error al inicializar sistema de reportes', 'error');
        }
    },

    // ===== CARGAR AÑOS DISPONIBLES =====
    async cargarAniosDisponibles() {
        try {
            const response = await SGPF.apiCall('/planificacion/anios', 'GET');
            
            if (response.success && response.data) {
                const selector = document.getElementById('selector-anio-reportes');
                
                if (selector) {
                    const anios = response.data;
                    
                    selector.innerHTML = anios.map(anio => 
                        `<option value="${anio}" ${anio === this.state.anioActual ? 'selected' : ''}>${anio}</option>`
                    ).join('');
                    
                    // Si no hay años, agregar el actual
                    if (anios.length === 0) {
                        selector.innerHTML = `<option value="${this.state.anioActual}" selected>${this.state.anioActual}</option>`;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error cargando años:', error);
        }
    },

    // ===== CONFIGURAR SELECTOR DE AÑO =====
    configurarSelectorAnio() {
        const selector = document.getElementById('selector-anio-reportes');
        
        if (selector) {
            selector.addEventListener('change', async (e) => {
                this.state.anioActual = parseInt(e.target.value);
                console.log('📅 Año cambiado a:', this.state.anioActual);
                
                // Recargar pestaña actual
                await this.recargarPestanaActual();
            });
        }
    },

    // ===== CARGAR MÉTODOS =====
    async cargarMetodos() {
        try {
            const response = await SGPF.apiCall('/reportes/metodos', 'GET');
            
            if (response.success && response.data) {
                this.state.metodos = response.data;
                
                const selector = document.getElementById('selector-metodo');
                if (selector) {
                    selector.innerHTML = '<option value="">-- Seleccione un método --</option>' +
                        response.data.map(m => 
                            `<option value="${m.id}">${m.nombre}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('❌ Error cargando métodos:', error);
        }
    },

    // ===== CARGAR TERRITORIOS =====
    async cargarTerritorios() {
        try {
            const response = await SGPF.apiCall('/reportes/territorios', 'GET');
            
            if (response.success && response.data) {
                this.state.territorios = response.data;
                
                const selector = document.getElementById('selector-territorio');
                if (selector) {
                    selector.innerHTML = '<option value="">-- Seleccione un territorio --</option>' +
                        response.data.map(t => 
                            `<option value="${t.id}">${t.nombre}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('❌ Error cargando territorios:', error);
        }
    },

    // ===== CAMBIAR PESTAÑA =====
    async cambiarPestana(pestana) {
        console.log(`📑 Cambiando a pestaña: ${pestana}`);
        
        this.state.pestanaActiva = pestana;
        
        // Actualizar estilos de tabs
        document.querySelectorAll('.tab-reporte').forEach(tab => {
            const tabName = tab.getAttribute('data-tab');
            if (tabName === pestana) {
                tab.classList.add('active');
                tab.classList.remove('border-transparent', 'text-gray-500');
                tab.classList.add('border-purple-600', 'text-purple-600');
            } else {
                tab.classList.remove('active', 'border-purple-600', 'text-purple-600');
                tab.classList.add('border-transparent', 'text-gray-500');
            }
        });
        
        // Ocultar todas las pestañas
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Mostrar pestaña activa
        const contenidoActivo = document.getElementById(`contenido-${pestana}`);
        if (contenidoActivo) {
            contenidoActivo.classList.remove('hidden');
        }
        
        // Cargar datos según pestaña
        await this.cargarDatosPestana(pestana);
    },

    // ===== CARGAR DATOS DE PESTAÑA =====
    async cargarDatosPestana(pestana) {
        switch(pestana) {
            case 'proyeccion-general':
                await this.cargarProyeccionGeneral();
                break;
            case 'proyeccion-metodo':
                // Se carga cuando se selecciona método
                break;
            case 'proyeccion-territorio':
                // Se carga cuando se selecciona territorio
                break;
            case 'fichas-usuarias':
                await this.cargarListadoUsuarias();
                break;
            case 'consultas-rapidas':
                await this.cargarConsultasRapidas();
                break;
        }
    },

    // ===== RECARGAR PESTAÑA ACTUAL =====
    async recargarPestanaActual() {
        await this.cargarDatosPestana(this.state.pestanaActiva);
    },

    // ===== MOSTRAR LOADING =====
    mostrarLoading(mostrar) {
        const loading = document.getElementById('loading-reportes');
        if (loading) {
            if (mostrar) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    },

    // ========================================
    // PESTAÑA 1: PROYECCIÓN GENERAL
    // ========================================
    async cargarProyeccionGeneral() {
        try {
            this.mostrarLoading(true);
            
            const response = await SGPF.apiCall(
                `/reportes/proyeccion-general/${this.state.anioActual}`, 
                'GET'
            );
            
            this.mostrarLoading(false);
            
            if (!response.success) {
                SGPF.showToast('Error cargando proyección general', 'error');
                return;
            }
            
            this.state.datosActuales = response.data;
            this.renderizarProyeccionGeneral(response.data);
            
        } catch (error) {
            this.mostrarLoading(false);
            console.error('❌ Error:', error);
            SGPF.showToast('Error cargando datos', 'error');
        }
    },

    renderizarProyeccionGeneral(datos) {
        const container = document.getElementById('tabla-proyeccion-general');
        
        if (!container || !datos || datos.length === 0) {
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay datos disponibles</p>';
            }
            return;
        }
        
        // Obtener todos los métodos únicos
        const metodosUnicos = new Set();
        datos.forEach(t => {
            Object.keys(t.metodos).forEach(metodo => metodosUnicos.add(metodo));
        });
        const metodosArray = Array.from(metodosUnicos);
        
        let html = `
            <table class="w-full border-collapse">
                <thead class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <tr>
                        <th class="px-4 py-3 text-left font-semibold border border-purple-700">Territorio</th>
                        <th class="px-4 py-3 text-center font-semibold border border-purple-700">MEF</th>
                        <th class="px-4 py-3 text-center font-semibold border border-purple-700">Proyección Anual</th>
                        ${metodosArray.map(metodo => 
                            `<th class="px-4 py-3 text-center font-semibold border border-purple-700 text-sm">${metodo}</th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        datos.forEach((territorio, idx) => {
            const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            html += `
                <tr class="${bgColor} hover:bg-purple-50 transition-colors">
                    <td class="px-4 py-3 border border-gray-300 font-semibold text-gray-800">${territorio.territorio}</td>
                    <td class="px-4 py-3 border border-gray-300 text-center font-bold text-blue-600">${territorio.mef_total || 0}</td>
                    <td class="px-4 py-3 border border-gray-300 text-center font-bold text-purple-600">${territorio.proyeccion_anual_total || 0}</td>
                    ${metodosArray.map(metodo => 
                        `<td class="px-4 py-3 border border-gray-300 text-center">${territorio.metodos[metodo] || 0}</td>`
                    ).join('')}
                </tr>
            `;
        });
        
        // Totales
        const totalMEF = datos.reduce((sum, t) => sum + (t.mef_total || 0), 0);
        const totalProyeccion = datos.reduce((sum, t) => sum + (t.proyeccion_anual_total || 0), 0);
        
        html += `
                <tr class="bg-gradient-to-r from-purple-100 to-indigo-100 font-bold">
                    <td class="px-4 py-3 border border-gray-300 text-gray-800">TOTAL</td>
                    <td class="px-4 py-3 border border-gray-300 text-center text-blue-700">${totalMEF}</td>
                    <td class="px-4 py-3 border border-gray-300 text-center text-purple-700">${totalProyeccion}</td>
                    ${metodosArray.map(metodo => {
                        const total = datos.reduce((sum, t) => sum + (t.metodos[metodo] || 0), 0);
                        return `<td class="px-4 py-3 border border-gray-300 text-center">${total}</td>`;
                    }).join('')}
                </tr>
            </tbody>
        </table>
        `;
        
        container.innerHTML = html;
    },

    // ========================================
    // PESTAÑA 2: PROYECCIÓN POR MÉTODO
    // ========================================
    async cargarProyeccionMetodo() {
        const metodoId = document.getElementById('selector-metodo').value;
        
        if (!metodoId) {
            SGPF.showToast('Selecciona un método', 'warning');
            return;
        }
        
        try {
            this.mostrarLoading(true);
            this.state.metodoSeleccionado = metodoId;
            
            const response = await SGPF.apiCall(
                `/reportes/proyeccion-metodo/${this.state.anioActual}/${metodoId}`, 
                'GET'
            );
            
            this.mostrarLoading(false);
            
            if (!response.success) {
                SGPF.showToast('Error cargando proyección por método', 'error');
                return;
            }
            
            this.state.datosActuales = response;
            this.renderizarProyeccionMetodo(response);
            
        } catch (error) {
            this.mostrarLoading(false);
            console.error('❌ Error:', error);
            SGPF.showToast('Error cargando datos', 'error');
        }
    },

    renderizarProyeccionMetodo(response) {
        const container = document.getElementById('tabla-proyeccion-metodo');
        
        if (!container || !response.data || response.data.length === 0) {
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay datos disponibles</p>';
            }
            return;
        }
        
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        let html = `
            <div class="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <h3 class="text-xl font-bold text-purple-800">
                    ${response.metodo.nombre} (${response.metodo.categoria})
                </h3>
                <p class="text-gray-600 mt-1">Año ${response.año}</p>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                    <thead class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        <tr>
                            <th rowspan="2" class="px-3 py-2 text-left font-semibold border border-purple-700 sticky left-0 bg-purple-600">Territorio</th>
                            <th rowspan="2" class="px-3 py-2 text-center font-semibold border border-purple-700">MEF</th>
                            <th colspan="13" class="px-3 py-2 text-center font-semibold border border-purple-700">PROYECTADO</th>
                            <th colspan="13" class="px-3 py-2 text-center font-semibold border border-purple-700 bg-green-600">EJECUTADO</th>
                            <th rowspan="2" class="px-3 py-2 text-center font-semibold border border-purple-700 bg-orange-600">% Alcanzado</th>
                        </tr>
                        <tr>
                            ${meses.map(m => `<th class="px-2 py-2 text-center border border-purple-700">${m}</th>`).join('')}
                            <th class="px-2 py-2 text-center border border-purple-700 font-bold">Total</th>
                            ${meses.map(m => `<th class="px-2 py-2 text-center border border-purple-700 bg-green-600">${m}</th>`).join('')}
                            <th class="px-2 py-2 text-center border border-purple-700 bg-green-700 font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        response.data.forEach((territorio, idx) => {
            const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            const porcentajeColor = territorio.porcentaje_alcanzado >= 70 ? 'text-green-700' : 
                                    territorio.porcentaje_alcanzado >= 50 ? 'text-yellow-700' : 'text-red-700';
            
            html += `
                <tr class="${bgColor} hover:bg-purple-50 transition-colors">
                    <td class="px-3 py-2 border border-gray-300 font-semibold sticky left-0 ${bgColor}">${territorio.territorio}</td>
                    <td class="px-3 py-2 border border-gray-300 text-center">${territorio.mef_total || 0}</td>
                    ${territorio.proyectado_mensual.map(val => 
                        `<td class="px-2 py-2 border border-gray-300 text-center">${val}</td>`
                    ).join('')}
                    <td class="px-2 py-2 border border-gray-300 text-center font-bold bg-purple-100">${territorio.total_proyectado}</td>
                    ${territorio.ejecutado_mensual.map(val => 
                        `<td class="px-2 py-2 border border-gray-300 text-center bg-green-50">${val}</td>`
                    ).join('')}
                    <td class="px-2 py-2 border border-gray-300 text-center font-bold bg-green-100">${territorio.total_ejecutado}</td>
                    <td class="px-2 py-2 border border-gray-300 text-center font-bold ${porcentajeColor}">${territorio.porcentaje_alcanzado}%</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    },

    // ========================================
    // PESTAÑA 3: PROYECCIÓN POR TERRITORIO
    // ========================================
    async cargarProyeccionTerritorio() {
        const territorioId = document.getElementById('selector-territorio').value;
        
        if (!territorioId) {
            SGPF.showToast('Selecciona un territorio', 'warning');
            return;
        }
        
        try {
            this.mostrarLoading(true);
            this.state.territorioSeleccionado = territorioId;
            
            const response = await SGPF.apiCall(
                `/reportes/proyeccion-territorio/${this.state.anioActual}/${territorioId}`, 
                'GET'
            );
            
            this.mostrarLoading(false);
            
            if (!response.success) {
                SGPF.showToast('Error cargando proyección por territorio', 'error');
                return;
            }
            
            this.state.datosActuales = response;
            this.renderizarProyeccionTerritorio(response);
            
        } catch (error) {
            this.mostrarLoading(false);
            console.error('❌ Error:', error);
            SGPF.showToast('Error cargando datos', 'error');
        }
    },

    renderizarProyeccionTerritorio(response) {
        const container = document.getElementById('tabla-proyeccion-territorio');
        
        if (!container || !response.data || response.data.length === 0) {
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay datos disponibles</p>';
            }
            return;
        }
        
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        let html = `
            <div class="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <h3 class="text-xl font-bold text-purple-800">
                    ${response.territorio.nombre}
                </h3>
                <p class="text-gray-600 mt-1">Año ${response.año}</p>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                    <thead class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        <tr>
                            <th rowspan="2" class="px-3 py-2 text-left font-semibold border border-purple-700 sticky left-0 bg-purple-600">Método</th>
                            <th rowspan="2" class="px-3 py-2 text-center font-semibold border border-purple-700">Categoría</th>
                            <th colspan="13" class="px-3 py-2 text-center font-semibold border border-purple-700">PROYECTADO</th>
                            <th colspan="13" class="px-3 py-2 text-center font-semibold border border-purple-700 bg-green-600">EJECUTADO</th>
                            <th rowspan="2" class="px-3 py-2 text-center font-semibold border border-purple-700 bg-orange-600">% Alcanzado</th>
                        </tr>
                        <tr>
                            ${meses.map(m => `<th class="px-2 py-2 text-center border border-purple-700">${m}</th>`).join('')}
                            <th class="px-2 py-2 text-center border border-purple-700 font-bold">Total</th>
                            ${meses.map(m => `<th class="px-2 py-2 text-center border border-purple-700 bg-green-600">${m}</th>`).join('')}
                            <th class="px-2 py-2 text-center border border-purple-700 bg-green-700 font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        response.data.forEach((metodo, idx) => {
            const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            const porcentajeColor = metodo.porcentaje_alcanzado >= 70 ? 'text-green-700' : 
                                    metodo.porcentaje_alcanzado >= 50 ? 'text-yellow-700' : 'text-red-700';
            
            html += `
                <tr class="${bgColor} hover:bg-purple-50 transition-colors">
                    <td class="px-3 py-2 border border-gray-300 font-semibold sticky left-0 ${bgColor}">${metodo.metodo_nombre}</td>
                    <td class="px-3 py-2 border border-gray-300 text-center text-xs">${metodo.categoria}</td>
                    ${metodo.proyectado_mensual.map(val => 
                        `<td class="px-2 py-2 border border-gray-300 text-center">${val}</td>`
                    ).join('')}
                    <td class="px-2 py-2 border border-gray-300 text-center font-bold bg-purple-100">${metodo.total_proyectado}</td>
                    ${metodo.ejecutado_mensual.map(val => 
                        `<td class="px-2 py-2 border border-gray-300 text-center bg-green-50">${val}</td>`
                    ).join('')}
                    <td class="px-2 py-2 border border-gray-300 text-center font-bold bg-green-100">${metodo.total_ejecutado}</td>
                    <td class="px-2 py-2 border border-gray-300 text-center font-bold ${porcentajeColor}">${metodo.porcentaje_alcanzado}%</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    },

    // ========================================
    // PESTAÑA 4: FICHAS DE USUARIAS
    // ========================================
    async cargarListadoUsuarias() {
        try {
            this.mostrarLoading(true);
            
            const response = await SGPF.apiCall('/reportes/usuarias/listado', 'GET');
            
            this.mostrarLoading(false);
            
            if (!response.success) {
                SGPF.showToast('Error cargando usuarias', 'error');
                return;
            }
            
            this.state.usuarias = response.data;
            this.renderizarListadoUsuarias(response.data);
            
        } catch (error) {
            this.mostrarLoading(false);
            console.error('❌ Error:', error);
            SGPF.showToast('Error cargando datos', 'error');
        }
    },

    renderizarListadoUsuarias(usuarias) {
        const container = document.getElementById('tabla-listado-usuarias');
        
        if (!container || !usuarias || usuarias.length === 0) {
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay usuarias registradas</p>';
            }
            return;
        }
        
        let html = `
            <table class="w-full border-collapse">
                <thead class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <tr>
                        <th class="px-4 py-3 text-left font-semibold border border-purple-700">DPI</th>
                        <th class="px-4 py-3 text-left font-semibold border border-purple-700">Nombres</th>
                        <th class="px-4 py-3 text-left font-semibold border border-purple-700">Apellidos</th>
                        <th class="px-4 py-3 text-center font-semibold border border-purple-700">Comunidad</th>
                        <th class="px-4 py-3 text-center font-semibold border border-purple-700">Tipo</th>
                        <th class="px-4 py-3 text-center font-semibold border border-purple-700">Visitas</th>
                        <th class="px-4 py-3 text-center font-semibold border border-purple-700">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tbody-usuarias">
        `;
        
        usuarias.forEach((usuaria, idx) => {
            const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            const tipoColor = usuaria.tipo_usuaria === 'nueva' ? 'bg-blue-100 text-blue-800' :
                             usuaria.tipo_usuaria === 'reconsulta' ? 'bg-green-100 text-green-800' :
                             'bg-purple-100 text-purple-800';
            
            html += `
                <tr class="${bgColor} hover:bg-purple-50 transition-colors busqueda-row" 
                    data-busqueda="${usuaria.nombres.toLowerCase()} ${usuaria.apellidos.toLowerCase()} ${usuaria.dpi} ${usuaria.comunidad.toLowerCase()}">
                    <td class="px-4 py-3 border border-gray-300 font-mono">${usuaria.dpi}</td>
                    <td class="px-4 py-3 border border-gray-300">${usuaria.nombres}</td>
                    <td class="px-4 py-3 border border-gray-300">${usuaria.apellidos}</td>
                    <td class="px-4 py-3 border border-gray-300 text-center text-sm">${usuaria.comunidad}</td>
                    <td class="px-4 py-3 border border-gray-300 text-center">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${tipoColor}">
                            ${usuaria.tipo_usuaria}
                        </span>
                    </td>
                    <td class="px-4 py-3 border border-gray-300 text-center font-bold">${usuaria.total_visitas || 0}</td>
                    <td class="px-4 py-3 border border-gray-300 text-center">
                        <button onclick="ReportesSystem.verFichaUsuaria(${usuaria.id})" 
                                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                            Ver Ficha
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    },

    filtrarUsuarias() {
        const busqueda = document.getElementById('buscador-usuarias').value.toLowerCase();
        const filas = document.querySelectorAll('.busqueda-row');
        
        filas.forEach(fila => {
            const textoBusqueda = fila.getAttribute('data-busqueda');
            if (textoBusqueda.includes(busqueda)) {
                fila.classList.remove('hidden');
            } else {
                fila.classList.add('hidden');
            }
        });
    },

    async verFichaUsuaria(usuariaId) {
        try {
            this.mostrarLoading(true);
            
            const response = await SGPF.apiCall(`/reportes/usuaria/${usuariaId}`, 'GET');
            
            this.mostrarLoading(false);
            
            if (!response.success) {
                SGPF.showToast('Error cargando ficha', 'error');
                return;
            }
            
            this.renderizarFichaUsuaria(response.data);
            
        } catch (error) {
            this.mostrarLoading(false);
            console.error('❌ Error:', error);
            SGPF.showToast('Error cargando ficha', 'error');
        }
    },

    renderizarFichaUsuaria(data) {
        const container = document.getElementById('ficha-usuaria-detalle');
        const usuaria = data.usuaria;
        
        if (!container) return;
        
        // Ocultar listado, mostrar ficha
        document.getElementById('tabla-listado-usuarias').classList.add('hidden');
        document.getElementById('buscador-usuarias').parentElement.classList.add('hidden');
        container.classList.remove('hidden');
        
        const edad = usuaria.fecha_nacimiento ? 
            Math.floor((new Date() - new Date(usuaria.fecha_nacimiento)) / 31557600000) : 'N/A';
        
        let html = `
            <div class="space-y-6">
                
                <!-- Botón volver -->
                <button onclick="ReportesSystem.volverListadoUsuarias()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    Volver al Listado
                </button>
                
                <!-- Botón exportar PDF -->
                <button onclick="ReportesSystem.exportarFichaPDF()" 
                        class="float-right px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    Descargar PDF
                </button>
                
                <div class="clear-both"></div>
                
                <!-- Card de datos personales -->
                <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
                    <div class="flex items-center gap-6">
                        <div class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h2 class="text-3xl font-bold">${usuaria.nombres} ${usuaria.apellidos}</h2>
                            <p class="text-purple-100 mt-2">DPI: ${usuaria.dpi}</p>
                            <div class="flex gap-4 mt-3">
                                <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                                    ${usuaria.tipo_usuaria}
                                </span>
                                <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                                    ${edad} años
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Grid de información -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- Datos personales -->
                    <div class="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Datos Personales
                        </h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Comunidad:</span>
                                <span class="font-semibold">${usuaria.comunidad}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Territorio:</span>
                                <span class="font-semibold">${usuaria.territorio}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Teléfono:</span>
                                <span class="font-semibold">${usuaria.telefono || 'No registrado'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Estado:</span>
                                <span class="font-semibold ${usuaria.activa ? 'text-green-600' : 'text-red-600'}">
                                    ${usuaria.activa ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resumen de visitas -->
                    <div class="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            Resumen
                        </h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Visitas:</span>
                                <span class="font-bold text-purple-600">${data.resumen.total_visitas}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Métodos Usados:</span>
                                <span class="font-bold text-blue-600">${data.resumen.metodos_diferentes}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Primera Visita:</span>
                                <span class="font-semibold">${new Date(data.resumen.primera_visita).toLocaleDateString('es-GT')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Última Visita:</span>
                                <span class="font-semibold">${data.resumen.ultima_visita ? new Date(data.resumen.ultima_visita).toLocaleDateString('es-GT') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                </div>
                
                <!-- Métodos utilizados -->
                ${data.metodos_utilizados.length > 0 ? `
                <div class="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Métodos Utilizados</h3>
                    <div class="space-y-2">
                        ${data.metodos_utilizados.map(m => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span class="font-semibold text-gray-800">${m.metodo}</span>
                                    <span class="text-xs text-gray-500 ml-2">(${m.categoria})</span>
                                </div>
                                <div class="text-right">
                                    <span class="font-bold text-purple-600">${m.veces_usado}</span>
                                    <span class="text-sm text-gray-600"> veces</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Historial de visitas -->
                <div class="bg-white rounded-xl border-2 border-gray-200 p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Historial de Visitas</h3>
                    ${data.historial_visitas.length > 0 ? `
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Fecha</th>
                                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Método</th>
                                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Registrado Por</th>
                                        <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${data.historial_visitas.map(v => {
                                        const estadoColor = v.estado === 'validado' ? 'bg-green-100 text-green-800' :
                                                          v.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                                          'bg-yellow-100 text-yellow-800';
                                        return `
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-4 py-3 text-sm">${new Date(v.fecha_visita).toLocaleDateString('es-GT')}</td>
                                                <td class="px-4 py-3 text-sm font-semibold">${v.metodo}</td>
                                                <td class="px-4 py-3 text-sm">${v.registrado_por_nombre} ${v.registrado_por_apellido}</td>
                                                <td class="px-4 py-3 text-center">
                                                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${estadoColor}">
                                                        ${v.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p class="text-gray-500 text-center py-4">No hay visitas registradas</p>'}
                </div>
                
            </div>
        `;
        
        container.innerHTML = html;
    },

    volverListadoUsuarias() {
        document.getElementById('tabla-listado-usuarias').classList.remove('hidden');
        document.getElementById('buscador-usuarias').parentElement.classList.remove('hidden');
        document.getElementById('ficha-usuaria-detalle').classList.add('hidden');
    },

    // ========================================
    // PESTAÑA 5: CONSULTAS RÁPIDAS
    // ========================================
    async cargarConsultasRapidas() {
        try {
            this.mostrarLoading(true);
            
            const response = await SGPF.apiCall(
                `/reportes/consultas-rapidas/${this.state.anioActual}`, 
                'GET'
            );
            
            this.mostrarLoading(false);
            
            if (!response.success) {
                SGPF.showToast('Error cargando consultas rápidas', 'error');
                return;
            }
            
            this.state.datosActuales = response.data;
            this.cambiarConsulta('general');
            
        } catch (error) {
            this.mostrarLoading(false);
            console.error('❌ Error:', error);
            SGPF.showToast('Error cargando datos', 'error');
        }
    },

    cambiarConsulta(tipo) {
        this.state.consultaActiva = tipo;
        
        // Actualizar botones
        document.querySelectorAll('.consulta-btn').forEach(btn => {
            const consultaTipo = btn.getAttribute('data-consulta');
            if (consultaTipo === tipo) {
                btn.classList.remove('bg-gray-200', 'text-gray-700');
                btn.classList.add('bg-purple-600', 'text-white', 'active');
            } else {
                btn.classList.remove('bg-purple-600', 'text-white', 'active');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
        
        // Renderizar según tipo
        this.renderizarConsulta(tipo);
    },

    renderizarConsulta(tipo) {
        const container = document.getElementById('contenedor-graficos');
        
        if (!container || !this.state.datosActuales) return;
        
        const data = this.state.datosActuales;
        
        switch(tipo) {
            case 'general':
                this.renderizarCumplimientoGeneral(container, data.cumplimiento_general);
                break;
            case 'territorios':
                this.renderizarCumplimientoTerritorios(container, data.por_territorio);
                break;
            case 'metodos':
                this.renderizarCumplimientoMetodos(container, data.por_metodo);
                break;
        }
    },

    renderizarCumplimientoGeneral(container, datos) {
        const porcentaje = datos.porcentaje;
        const color = porcentaje >= 70 ? '#10b981' : porcentaje >= 50 ? '#f59e0b' : '#ef4444';
        
        container.innerHTML = `
            <div class="text-center space-y-6">
                <h3 class="text-2xl font-bold text-gray-800">Cumplimiento General ${this.state.anioActual}</h3>
                
                <div class="flex justify-center items-center">
                    <div class="relative w-64 h-64">
                        <svg class="w-full h-full transform -rotate-90">
                            <circle cx="128" cy="128" r="100" stroke="#e5e7eb" stroke-width="20" fill="none"/>
                            <circle cx="128" cy="128" r="100" 
                                    stroke="${color}" 
                                    stroke-width="20" 
                                    fill="none"
                                    stroke-dasharray="${(porcentaje / 100) * 628} 628"
                                    stroke-linecap="round"/>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-5xl font-bold" style="color: ${color}">${porcentaje}%</span>
                            <span class="text-gray-600 mt-2">Alcanzado</span>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div class="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <p class="text-gray-600 mb-2">Proyección Anual</p>
                        <p class="text-3xl font-bold text-blue-600">${datos.proyeccion}</p>
                    </div>
                    <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                        <p class="text-gray-600 mb-2">Ejecutado</p>
                        <p class="text-3xl font-bold text-green-600">${datos.ejecutado}</p>
                    </div>
                </div>
            </div>
        `;
    },

    renderizarCumplimientoTerritorios(container, datos) {
        if (!datos || datos.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">No hay datos disponibles</p>';
            return;
        }
        
        const maxValor = Math.max(...datos.map(t => t.proyeccion));
        
        container.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-2xl font-bold text-gray-800 text-center">Cumplimiento por Territorio ${this.state.anioActual}</h3>
                
                <div class="space-y-4">
                    ${datos.map(territorio => {
                        const porcentaje = territorio.porcentaje;
                        const color = porcentaje >= 70 ? 'bg-green-500' : porcentaje >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                        const widthProyeccion = (territorio.proyeccion / maxValor) * 100;
                        const widthEjecutado = territorio.proyeccion > 0 ? (territorio.ejecutado / territorio.proyeccion) * widthProyeccion : 0;
                        
                        return `
                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div class="flex items-center justify-between mb-2">
                                    <h4 class="font-bold text-gray-800">${territorio.territorio}</h4>
                                    <span class="text-2xl font-bold ${porcentaje >= 70 ? 'text-green-600' : porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                                        ${porcentaje}%
                                    </span>
                                </div>
                                <div class="flex gap-4 text-sm mb-3">
                                    <span class="text-gray-600">Proyección: <strong>${territorio.proyeccion}</strong></span>
                                    <span class="text-gray-600">Ejecutado: <strong>${territorio.ejecutado}</strong></span>
                                </div>
                                <div class="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                                    <div class="absolute inset-0 bg-blue-300" style="width: ${widthProyeccion}%"></div>
                                    <div class="absolute inset-0 ${color}" style="width: ${widthEjecutado}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderizarCumplimientoMetodos(container, datos) {
        if (!datos || datos.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">No hay datos disponibles</p>';
            return;
        }
        
        const maxValor = Math.max(...datos.map(m => m.proyeccion));
        
        container.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-2xl font-bold text-gray-800 text-center">Cumplimiento por Método ${this.state.anioActual}</h3>
                
                <div class="space-y-4">
                    ${datos.map(metodo => {
                        const porcentaje = metodo.porcentaje;
                        const color = porcentaje >= 70 ? 'bg-green-500' : porcentaje >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                        const widthProyeccion = (metodo.proyeccion / maxValor) * 100;
                        const widthEjecutado = metodo.proyeccion > 0 ? (metodo.ejecutado / metodo.proyeccion) * widthProyeccion : 0;
                        
                        return `
                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div class="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 class="font-bold text-gray-800">${metodo.metodo}</h4>
                                        <p class="text-xs text-gray-500">${metodo.categoria}</p>
                                    </div>
                                    <span class="text-2xl font-bold ${porcentaje >= 70 ? 'text-green-600' : porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                                        ${porcentaje}%
                                    </span>
                                </div>
                                <div class="flex gap-4 text-sm mb-3">
                                    <span class="text-gray-600">Proyección: <strong>${metodo.proyeccion}</strong></span>
                                    <span class="text-gray-600">Ejecutado: <strong>${metodo.ejecutado}</strong></span>
                                </div>
                                <div class="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                                    <div class="absolute inset-0 bg-blue-300" style="width: ${widthProyeccion}%"></div>
                                    <div class="absolute inset-0 ${color}" style="width: ${widthEjecutado}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    // ========================================
    // FUNCIONES DE EXPORTACIÓN
    // ========================================
    exportarExcel(tipo) {
        console.log(`📥 Exportando a Excel: ${tipo}`);
        
        try {
            let datos, nombreArchivo;
            
            switch(tipo) {
                case 'proyeccion-general':
                    datos = this.prepararDatosProyeccionGeneral();
                    nombreArchivo = `Proyeccion_General_${this.state.anioActual}.xlsx`;
                    break;
                case 'proyeccion-metodo':
                    if (!this.state.metodoSeleccionado) {
                        SGPF.showToast('Selecciona un método primero', 'warning');
                        return;
                    }
                    datos = this.prepararDatosProyeccionMetodo();
                    const metodo = this.state.metodos.find(m => m.id == this.state.metodoSeleccionado);
                    nombreArchivo = `Proyeccion_${metodo.nombre.replace(/\s/g, '_')}_${this.state.anioActual}.xlsx`;
                    break;
                case 'proyeccion-territorio':
                    if (!this.state.territorioSeleccionado) {
                        SGPF.showToast('Selecciona un territorio primero', 'warning');
                        return;
                    }
                    datos = this.prepararDatosProyeccionTerritorio();
                    const territorio = this.state.territorios.find(t => t.id == this.state.territorioSeleccionado);
                    nombreArchivo = `Proyeccion_${territorio.nombre.replace(/\s/g, '_')}_${this.state.anioActual}.xlsx`;
                    break;
                default:
                    SGPF.showToast('Tipo de exportación no soportado', 'error');
                    return;
            }
            
            // Crear libro de Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(datos);
            XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            
            // Descargar
            XLSX.writeFile(wb, nombreArchivo);
            
            SGPF.showToast('Archivo Excel descargado', 'success');
            
        } catch (error) {
            console.error('❌ Error exportando Excel:', error);
            SGPF.showToast('Error al exportar Excel', 'error');
        }
    },

    prepararDatosProyeccionGeneral() {
        // Preparar array 2D para Excel
        const datos = this.state.datosActuales;
        if (!datos || datos.length === 0) return [['Sin datos']];
        
        // Obtener métodos únicos
        const metodosUnicos = new Set();
        datos.forEach(t => {
            Object.keys(t.metodos).forEach(metodo => metodosUnicos.add(metodo));
        });
        const metodosArray = Array.from(metodosUnicos);
        
        // Header
        const header = ['Territorio', 'MEF', 'Proyección Anual', ...metodosArray];
        const filas = [header];
        
        // Datos
        datos.forEach(territorio => {
            const fila = [
                territorio.territorio,
                territorio.mef_total || 0,
                territorio.proyeccion_anual_total || 0,
                ...metodosArray.map(metodo => territorio.metodos[metodo] || 0)
            ];
            filas.push(fila);
        });
        
        return filas;
    },

    prepararDatosProyeccionMetodo() {
        const response = this.state.datosActuales;
        if (!response || !response.data) return [['Sin datos']];
        
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Header
        const header = [
            'Territorio', 'MEF',
            ...meses.map(m => `${m} (P)`), 'Total (P)',
            ...meses.map(m => `${m} (E)`), 'Total (E)',
            '% Alcanzado'
        ];
        const filas = [
            [`Método: ${response.metodo.nombre}`, `Año: ${response.año}`],
            [],
            header
        ];
        
        // Datos
        response.data.forEach(territorio => {
            const fila = [
                territorio.territorio,
                territorio.mef_total || 0,
                ...territorio.proyectado_mensual,
                territorio.total_proyectado,
                ...territorio.ejecutado_mensual,
                territorio.total_ejecutado,
                `${territorio.porcentaje_alcanzado}%`
            ];
            filas.push(fila);
        });
        
        return filas;
    },

    prepararDatosProyeccionTerritorio() {
        const response = this.state.datosActuales;
        if (!response || !response.data) return [['Sin datos']];
        
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Header
        const header = [
            'Método', 'Categoría',
            ...meses.map(m => `${m} (P)`), 'Total (P)',
            ...meses.map(m => `${m} (E)`), 'Total (E)',
            '% Alcanzado'
        ];
        const filas = [
            [`Territorio: ${response.territorio.nombre}`, `Año: ${response.año}`],
            [],
            header
        ];
        
        // Datos
        response.data.forEach(metodo => {
            const fila = [
                metodo.metodo_nombre,
                metodo.categoria,
                ...metodo.proyectado_mensual,
                metodo.total_proyectado,
                ...metodo.ejecutado_mensual,
                metodo.total_ejecutado,
                `${metodo.porcentaje_alcanzado}%`
            ];
            filas.push(fila);
        });
        
        return filas;
    },

    async exportarPDF(tipo) {
        console.log(`📄 Exportando a PDF: ${tipo}`);
        
        try {
            // Verificar que jsPDF esté cargado
            if (!window.jsPDF) {
                SGPF.showToast('Error: jsPDF no está cargado', 'error');
                console.error('jsPDF no disponible');
                return;
            }
            
            // Instanciar correctamente según la versión
            const doc = new window.jsPDF.jsPDF();
            
            // Header del PDF
            doc.setFontSize(18);
            doc.setTextColor(124, 58, 237); // Purple
            doc.text('MSPAS - Sistema de Reportes', 105, 15, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Año: ${this.state.anioActual}`, 105, 25, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT')}`, 105, 32, { align: 'center' });
            
            let yPos = 40;
            
            switch(tipo) {
                case 'proyeccion-general':
                    await this.generarPDFProyeccionGeneral(doc, yPos);
                    doc.save(`Proyeccion_General_${this.state.anioActual}.pdf`);
                    break;
                    
                case 'proyeccion-metodo':
                    if (!this.state.metodoSeleccionado) {
                        SGPF.showToast('Selecciona un método primero', 'warning');
                        return;
                    }
                    await this.generarPDFProyeccionMetodo(doc, yPos);
                    const metodo = this.state.metodos.find(m => m.id == this.state.metodoSeleccionado);
                    doc.save(`Proyeccion_${metodo.nombre.replace(/\s/g, '_')}_${this.state.anioActual}.pdf`);
                    break;
                    
                case 'proyeccion-territorio':
                    if (!this.state.territorioSeleccionado) {
                        SGPF.showToast('Selecciona un territorio primero', 'warning');
                        return;
                    }
                    await this.generarPDFProyeccionTerritorio(doc, yPos);
                    const territorio = this.state.territorios.find(t => t.id == this.state.territorioSeleccionado);
                    doc.save(`Proyeccion_${territorio.nombre.replace(/\s/g, '_')}_${this.state.anioActual}.pdf`);
                    break;
                    
                case 'consultas-rapidas':
                    await this.generarPDFConsultasRapidas(doc, yPos);
                    doc.save(`Consultas_Rapidas_${this.state.anioActual}.pdf`);
                    break;
                    
                default:
                    SGPF.showToast('Tipo de exportación no soportado', 'error');
                    return;
            }
            
            SGPF.showToast('PDF descargado exitosamente', 'success');
            
        } catch (error) {
            console.error('❌ Error exportando PDF:', error);
            SGPF.showToast('Error al exportar PDF', 'error');
        }
    },

    async generarPDFProyeccionGeneral(doc, yPos) {
        const datos = this.state.datosActuales;
        if (!datos || datos.length === 0) return;
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('PROYECCIÓN GENERAL DE USUARIAS EN MÉTODOS', 105, yPos, { align: 'center' });
        
        // Obtener métodos únicos
        const metodosUnicos = new Set();
        datos.forEach(t => {
            Object.keys(t.metodos).forEach(metodo => metodosUnicos.add(metodo));
        });
        const metodosArray = Array.from(metodosUnicos);
        
        // Preparar datos para la tabla
        const headers = [['Territorio', 'MEF', 'Proyección', ...metodosArray]];
        const rows = datos.map(t => [
            t.territorio,
            t.mef_total || 0,
            t.proyeccion_anual_total || 0,
            ...metodosArray.map(metodo => t.metodos[metodo] || 0)
        ]);
        
        doc.autoTable({
            head: headers,
            body: rows,
            startY: yPos + 10,
            theme: 'grid',
            headStyles: {
                fillColor: [124, 58, 237],
                fontSize: 8,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { halign: 'center' },
                2: { halign: 'center' }
            }
        });
    },

    async generarPDFProyeccionMetodo(doc, yPos) {
        const response = this.state.datosActuales;
        if (!response || !response.data) return;
        
        doc.setFontSize(14);
        doc.text(`PROYECCIÓN: ${response.metodo.nombre}`, 105, yPos, { align: 'center' });
        
        const meses = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        
        // Tabla con orientación landscape si es necesario
        const headers = [[
            'Territorio', 
            ...meses.map(m => `${m}(P)`), 
            'Tot(P)',
            ...meses.map(m => `${m}(E)`), 
            'Tot(E)', 
            '%'
        ]];
        
        const rows = response.data.map(t => [
            t.territorio,
            ...t.proyectado_mensual,
            t.total_proyectado,
            ...t.ejecutado_mensual,
            t.total_ejecutado,
            `${t.porcentaje_alcanzado}%`
        ]);
        
        doc.autoTable({
            head: headers,
            body: rows,
            startY: yPos + 10,
            theme: 'grid',
            headStyles: {
                fillColor: [124, 58, 237],
                fontSize: 6,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 6,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'left' }
            }
        });
    },

    async generarPDFProyeccionTerritorio(doc, yPos) {
        const response = this.state.datosActuales;
        if (!response || !response.data) return;
        
        doc.setFontSize(14);
        doc.text(`PROYECCIÓN: ${response.territorio.nombre}`, 105, yPos, { align: 'center' });
        
        const meses = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        
        const headers = [[
            'Método', 
            ...meses.map(m => `${m}(P)`), 
            'Tot(P)',
            ...meses.map(m => `${m}(E)`), 
            'Tot(E)', 
            '%'
        ]];
        
        const rows = response.data.map(m => [
            m.metodo_nombre,
            ...m.proyectado_mensual,
            m.total_proyectado,
            ...m.ejecutado_mensual,
            m.total_ejecutado,
            `${m.porcentaje_alcanzado}%`
        ]);
        
        doc.autoTable({
            head: headers,
            body: rows,
            startY: yPos + 10,
            theme: 'grid',
            headStyles: {
                fillColor: [124, 58, 237],
                fontSize: 6,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 6,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 25, halign: 'left' }
            }
        });
    },

    async generarPDFConsultasRapidas(doc, yPos) {
        const data = this.state.datosActuales;
        if (!data) return;
        
        doc.setFontSize(14);
        doc.text('CONSULTAS RÁPIDAS - CUMPLIMIENTO', 105, yPos, { align: 'center' });
        
        yPos += 15;
        
        // Cumplimiento General
        doc.setFontSize(12);
        doc.setTextColor(124, 58, 237);
        doc.text('Cumplimiento General:', 20, yPos);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Proyección: ${data.cumplimiento_general.proyeccion}`, 25, yPos + 7);
        doc.text(`Ejecutado: ${data.cumplimiento_general.ejecutado}`, 25, yPos + 14);
        doc.text(`Porcentaje: ${data.cumplimiento_general.porcentaje}%`, 25, yPos + 21);
        
        yPos += 35;
        
        // Tabla por Territorio
        doc.setFontSize(12);
        doc.setTextColor(124, 58, 237);
        doc.text('Por Territorio:', 20, yPos);
        
        const headersTerritorios = [['Territorio', 'Proyección', 'Ejecutado', '% Alcanzado']];
        const rowsTerritorios = data.por_territorio.map(t => [
            t.territorio,
            t.proyeccion || 0,
            t.ejecutado || 0,
            `${t.porcentaje}%`
        ]);
        
        doc.autoTable({
            head: headersTerritorios,
            body: rowsTerritorios,
            startY: yPos + 5,
            theme: 'grid',
            headStyles: {
                fillColor: [124, 58, 237],
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // Tabla por Método
        doc.setFontSize(12);
        doc.setTextColor(124, 58, 237);
        doc.text('Por Método:', 20, yPos);
        
        const headersMetodos = [['Método', 'Proyección', 'Ejecutado', '% Alcanzado']];
        const rowsMetodos = data.por_metodo.map(m => [
            m.metodo,
            m.proyeccion || 0,
            m.ejecutado || 0,
            `${m.porcentaje}%`
        ]);
        
        doc.autoTable({
            head: headersMetodos,
            body: rowsMetodos,
            startY: yPos + 5,
            theme: 'grid',
            headStyles: {
                fillColor: [124, 58, 237],
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            }
        });
    },

    async exportarFichaPDF() {
        console.log('📄 Exportando ficha de usuaria a PDF');
        
        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            const fichaContainer = document.getElementById('ficha-usuaria-detalle');
            if (!fichaContainer) {
                SGPF.showToast('No hay ficha cargada', 'error');
                return;
            }
            
            // Capturar el contenido de la ficha
            const canvas = await html2canvas(fichaContainer, {
                scale: 2,
                logging: false,
                useCORS: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;
            
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= 280;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 10;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= 280;
            }
            
            doc.save(`Ficha_Usuaria_${Date.now()}.pdf`);
            SGPF.showToast('Ficha descargada en PDF', 'success');
            
        } catch (error) {
            console.error('❌ Error exportando ficha:', error);
            SGPF.showToast('Error al exportar ficha', 'error');
        }
    },

    async exportarImagen() {
        console.log('🖼️ Exportando consultas rápidas como imagen');
        
        try {
            const container = document.getElementById('contenedor-graficos');
            
            if (!container) {
                SGPF.showToast('No hay gráfico para exportar', 'error');
                return;
            }
            
            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });
            
            // Convertir a blob y descargar
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Consultas_Rapidas_${this.state.anioActual}_${this.state.consultaActiva}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                SGPF.showToast('Imagen descargada exitosamente', 'success');
            });
            
        } catch (error) {
            console.error('❌ Error exportando imagen:', error);
            SGPF.showToast('Error al exportar imagen', 'error');
        }
    }
};

// ===== AUTO-INICIALIZAR SI SE CARGA DIRECTAMENTE =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 DOM cargado, esperando inicialización manual');
    });
} else {
    console.log('✅ ReportesSystem cargado y listo');
}