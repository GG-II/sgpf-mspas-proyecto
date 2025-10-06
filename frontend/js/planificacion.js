// ===== js/planificacion.js - VERSIÓN CORREGIDA =====
window.PlanificacionSystem = window.PlanificacionSystem || {
    // Estado del sistema
    vistaActual: 'configuracion',
    datosOriginales: null,
    datosEditados: null,
    porcentajesEditados: null,
    metasEditadas: null,
    distribucionEditada: null,
    filtrosActuales: {
        año: 2025,
        comunidadId: null,
        metodoId: null,
        tipoFiltro: 'metodo' // 'metodo' o 'comunidad'
    },
    modoEdicion: false,

    // INICIALIZACIÓN
    async init() {
        console.log('Inicializando Sistema de Planificación y Metas');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            const user = SGPF.getCurrentUser();
            const rolNormalizado = SGPF.getNormalizedRole();
            
            console.log('Usuario:', user.nombres, user.apellidos);
            console.log('Rol:', rolNormalizado);
            
            this.modoEdicion = (rolNormalizado === 'coordinador');
            
            this.configurarFiltrosDefault();
            this.configurarEventListeners();
            await this.cargarResumen();
            
            console.log('Sistema de Planificación inicializado');
        } catch (error) {
            console.error('Error inicializando planificación:', error);
            SGPF.showToast('Error inicializando sistema de planificación', 'error');
        }
    },

    configurarFiltrosDefault() {
        const fechaActual = new Date();
        const añoActual = fechaActual.getFullYear();

        const selectAño = document.getElementById('filtro-año-plan');
        if (selectAño) {
            selectAño.value = añoActual.toString();
            this.filtrosActuales.año = añoActual;
        }
    },

    configurarEventListeners() {
        // Tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.cambiarVista(e.target.dataset.tab);
            });
        });

        // Filtro año
        const selectAño = document.getElementById('filtro-año-plan');
        if (selectAño) {
            selectAño.addEventListener('change', (e) => {
                this.filtrosActuales.año = parseInt(e.target.value);
                this.cargarVistaActual();
            });
        }

        // Ocultar botones si no es coordinador
        if (!this.modoEdicion) {
            const botonesCoordinador = ['btn-guardar-configuracion', 'btn-guardar-porcentajes', 'btn-calcular-metas', 'btn-guardar-metas-individuales', 'btn-guardar-distribucion'];
            botonesCoordinador.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.style.display = 'none';
            });
        }
    },

    cambiarVista(vista) {
        this.vistaActual = vista;
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === vista);
        });

        this.cargarVistaActual();
    },

    async cargarVistaActual() {
        if (this.vistaActual === 'configuracion') {
            await this.cargarVistaConfiguracion();
        } else if (this.vistaActual === 'consolidado') {
            await this.cargarVistaConsolidado();
        } else if (this.vistaActual === 'comparativo') {
            await this.cargarVistaComparativo();
        }
    },

    async cargarResumen() {
        try {
            const response = await SGPF.apiCall(`/planificacion/configuracion/${this.filtrosActuales.año}`);
            
            if (response.success && response.data) {
                this.actualizarElemento('total-comunidades-plan', response.data.comunidades.length);
                
                const totalProyeccion = response.data.comunidades.reduce((sum, c) => sum + (c.proyeccion_anual || 0), 0);
                this.actualizarElemento('total-proyeccion-anual', totalProyeccion);
            }
        } catch (error) {
            console.error('Error cargando resumen:', error);
        }
    },

    // ========== VISTA 1: CONFIGURACIÓN MEF ==========
    async cargarVistaConfiguracion() {
        console.log('Cargando configuración MEF');

        try {
            this.mostrarLoading();

            const response = await SGPF.apiCall(`/planificacion/configuracion/${this.filtrosActuales.año}`);

            if (response.success) {
                this.datosOriginales = JSON.parse(JSON.stringify(response.data.comunidades));
                this.datosEditados = JSON.parse(JSON.stringify(response.data.comunidades));
                this.renderizarTablaConfiguracion();
            }

        } catch (error) {
            console.error('Error cargando configuración:', error);
            this.mostrarError('Error cargando configuración.');
        }
    },

    // ========== VISTA 1: CONFIGURACIÓN MEF CORREGIDO ==========
    renderizarTablaConfiguracion() {
        const contenedor = document.getElementById('contenido-planificacion');
        
        if (!contenedor) return;

        let html = `
            <table class="tabla-planificacion">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Comunidad</th>
                        <th>Población MEF</th>
                        <th>Proyección Anual</th>
                        ${this.modoEdicion ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        this.datosEditados.forEach((dato, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${dato.comunidad}</strong></td>
                    <td>
                        ${this.modoEdicion ? `
                            <input type="number" 
                                   id="mef-${index}"
                                   class="input-editable" 
                                   value="${dato.poblacion_mef || 0}"
                                   min="0"
                                   onchange="PlanificacionSystem.actualizarSoloMEF(${index}, this.value)"
                                   style="width: 100px; padding: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
                        ` : dato.poblacion_mef || 0}
                    </td>
                    <td>
                        ${this.modoEdicion ? `
                            <input type="number" 
                                   id="proyeccion-${index}"
                                   class="input-editable" 
                                   value="${dato.proyeccion_anual || 0}"
                                   min="0"
                                   onchange="PlanificacionSystem.actualizarSoloProyeccion(${index}, this.value)"
                                   style="width: 100px; padding: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
                        ` : dato.proyeccion_anual || 0}
                    </td>
                    ${this.modoEdicion ? `
                        <td>
                            <button class="btn-small btn-secondary" 
                                    onclick="PlanificacionSystem.calcularProyeccionAutomatica(${index})"
                                    title="Calcular con fórmula: (MEF × 35%) - 70">
                                🧮 Calcular
                            </button>
                        </td>
                    ` : ''}
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        if (this.modoEdicion) {
            html += `
                <div style="margin-top: 1rem; text-align: right;">
                    <button id="btn-guardar-configuracion" class="btn btn-primary">
                        💾 GUARDAR CAMBIOS
                    </button>
                </div>
            `;
        }

        contenedor.innerHTML = html;

        if (this.modoEdicion) {
            document.getElementById('btn-guardar-configuracion')?.addEventListener('click', () => {
                this.guardarConfiguracion();
            });
        }
    },

    // Solo actualizar MEF sin tocar proyección
    actualizarSoloMEF(index, valor) {
        const mef = parseInt(valor) || 0;
        this.datosEditados[index].poblacion_mef = mef;
    },

    // Solo actualizar proyección sin tocar MEF
    actualizarSoloProyeccion(index, valor) {
        const proyeccion = parseInt(valor) || 0;
        this.datosEditados[index].proyeccion_anual = proyeccion;
    },

    // Calcular proyección con la fórmula (botón opcional)
    calcularProyeccionAutomatica(index) {
        const mef = this.datosEditados[index].poblacion_mef || 0;
        const proyeccion = Math.round((mef * 0.35) - 70);
        const proyeccionFinal = Math.max(0, proyeccion);
        
        this.datosEditados[index].proyeccion_anual = proyeccionFinal;
        
        // Actualizar el input visualmente
        const inputProyeccion = document.getElementById(`proyeccion-${index}`);
        if (inputProyeccion) {
            inputProyeccion.value = proyeccionFinal;
        }
        
        SGPF.showToast(`Proyección calculada: ${proyeccionFinal}`, 'info');
    },

    actualizarPoblacionMEF(index, valor) {
        const mef = parseInt(valor) || 0;
        this.datosEditados[index].poblacion_mef = mef;
        
        // Calcular proyección automáticamente: (MEF × 35%) - 70
        const proyeccion = Math.round((mef * 0.35) - 70);
        this.datosEditados[index].proyeccion_anual = Math.max(0, proyeccion);
        
        // Actualizar input de proyección
        const inputProyeccion = event.target.closest('tr').querySelector('input[onchange*="actualizarProyeccionAnual"]');
        if (inputProyeccion) {
            inputProyeccion.value = this.datosEditados[index].proyeccion_anual;
        }
    },

    actualizarProyeccionAnual(index, valor) {
        this.datosEditados[index].proyeccion_anual = parseInt(valor) || 0;
    },

    async guardarConfiguracion() {
        try {
            SGPF.showLoading(true);

            console.log('Guardando configuración:', this.datosEditados);

            const response = await SGPF.apiCall(`/planificacion/configuracion/guardar/${this.filtrosActuales.año}`, {
                method: 'POST',
                body: JSON.stringify({ comunidades: this.datosEditados })
            });

            if (response.success) {
                SGPF.showToast('Configuración guardada exitosamente', 'success');
                
                // Limpiar cache
                this.datosOriginales = null;
                this.datosEditados = null;
                
                // Recargar vista después de un delay
                setTimeout(async () => {
                    await this.cargarVistaConfiguracion();
                    await this.cargarResumen();
                }, 500);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            SGPF.showToast('Error guardando configuración', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ========== VISTA 2: CONSOLIDADO ==========
    async cargarVistaConsolidado() {
        console.log('Cargando consolidado');

        try {
            this.mostrarLoading();

            // Cargar porcentajes globales
            const respPorcentajes = await SGPF.apiCall(`/planificacion/porcentajes-metodos/${this.filtrosActuales.año}`);
            
            // Cargar datos consolidados
            const respConsolidado = await SGPF.apiCall(`/planificacion/reporte-consolidado/${this.filtrosActuales.año}`);

            if (respPorcentajes.success && respConsolidado.success) {
                this.porcentajesEditados = respPorcentajes.data.porcentajes.map(p => ({
                    metodo_id: p.metodo_id,
                    porcentaje_meta: parseFloat(p.porcentaje_meta)
                }));
                
                this.metasEditadas = respConsolidado.data.consolidado;
                this.renderizarTablaConsolidado();
            }

        } catch (error) {
            console.error('Error cargando consolidado:', error);
            this.mostrarError('Error cargando consolidado.');
        }
    },

    renderizarTablaConsolidado() {
        const contenedor = document.getElementById('contenido-planificacion');
        
        if (!contenedor) return;

        // Agrupar por comunidad
        const comunidadesMap = {};
        
        this.metasEditadas.forEach(row => {
            if (!comunidadesMap[row.comunidad_id]) {
                comunidadesMap[row.comunidad_id] = {
                    comunidad_id: row.comunidad_id,
                    comunidad: row.comunidad,
                    poblacion_mef: row.poblacion_mef,
                    proyeccion_anual: row.proyeccion_anual,
                    metodos: {}
                };
            }
            
            if (row.metodo_id) {
                comunidadesMap[row.comunidad_id].metodos[row.metodo_id] = {
                    metodo: row.metodo,
                    orden: row.orden_visualizacion,
                    porcentaje: row.porcentaje_meta || 0,
                    proyeccion: row.proyeccion_anual_metodo || 0
                };
            }
        });

        const comunidades = Object.values(comunidadesMap);

        // Calcular suma de porcentajes
        const sumaPorcentajes = this.porcentajesEditados.reduce((sum, p) => sum + p.porcentaje_meta, 0);

        let html = `
    ${this.modoEdicion ? `
        <div style="background: ${sumaPorcentajes === 100 ? '#d4edda' : '#fff3cd'}; padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
            <strong>Configuración de Porcentajes Globales</strong><br>
            Suma actual: <strong>${sumaPorcentajes.toFixed(2)}%</strong> ${sumaPorcentajes === 100 ? '✓' : '(debe ser 100%)'}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
    ` : ''}
`;

        if (this.modoEdicion) {
            // Obtener nombres de métodos
            const metodosNombres = ['Iny. Mensual', 'Iny. Bimensual', 'Iny. Trimestral', 'Píldora', 'DIU', 'Implante', 'Condón', 'Collar', 'MELA', 'AQV F', 'AQV M'];
            
            this.porcentajesEditados.forEach((p, idx) => {
                html += `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <label style="flex: 1; font-size: 0.85rem;">${metodosNombres[idx]}:</label>
                        <input type="number" 
                               step="0.1" 
                               min="0" 
                               max="100"
                               value="${p.porcentaje_meta}"
                               onchange="PlanificacionSystem.actualizarPorcentaje(${idx}, this.value)"
                               style="width: 70px; padding: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
                        <span style="font-size: 0.85rem;">%</span>
                    </div>
                `;
            });

            html += `
                    </div>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button id="btn-guardar-porcentajes" class="btn btn-primary" ${sumaPorcentajes !== 100 ? 'disabled' : ''}>
                            GUARDAR PORCENTAJES
                        </button>
                        <button id="btn-calcular-metas" class="btn btn-secondary">
                            HACER CÁLCULO
                        </button>
                    </div>
                </div>
            `;
        }

        html += `
            <div style="overflow-x: auto;">
                <table class="tabla-planificacion" style="min-width: 1400px;">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Comunidad</th>
                            <th>MEF</th>
                            <th>Proy. Anual</th>
                            <th>Iny. Mens.<br><small>10%</small></th>
                            <th>Iny. Bim.<br><small>10%</small></th>
                            <th>Iny. Trim.<br><small>45%</small></th>
                            <th>Píldora<br><small>12%</small></th>
                            <th>DIU<br><small>2%</small></th>
                            <th>Implante<br><small>8%</small></th>
                            <th>Condón<br><small>6%</small></th>
                            <th>Collar<br><small>1%</small></th>
                            <th>MELA<br><small>5.5%</small></th>
                            <th>AQV F<br><small>0.25%</small></th>
                            <th>AQV M<br><small>0.25%</small></th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        comunidades.forEach((comunidad, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${comunidad.comunidad}</strong></td>
                    <td>${comunidad.poblacion_mef || 0}</td>
                    <td><strong>${comunidad.proyeccion_anual || 0}</strong></td>
            `;

            // Los 11 métodos en orden
            for (let metodoId = 1; metodoId <= 11; metodoId++) {
                const metodo = comunidad.metodos[metodoId] || { proyeccion: 0, porcentaje: 0 };
                
                if (this.modoEdicion) {
                    html += `
                        <td>
                            <input type="number" 
                                   class="input-editable-small" 
                                   value="${metodo.proyeccion}"
                                   min="0"
                                   onchange="PlanificacionSystem.actualizarMetaIndividual(${comunidad.comunidad_id}, ${metodoId}, this.value)"
                                   style="width: 60px; padding: 0.2rem; border: 1px solid #ddd; border-radius: 3px; font-size: 0.85rem;">
                            <br><small>${metodo.porcentaje}%</small>
                        </td>
                    `;
                } else {
                    html += `
                        <td>${metodo.proyeccion}<br><small>${metodo.porcentaje}%</small></td>
                    `;
                }
            }

            html += `</tr>`;
        });

        // Fila totales
        const totalMEF = comunidades.reduce((sum, c) => sum + (c.poblacion_mef || 0), 0);
        const totalProyeccion = comunidades.reduce((sum, c) => sum + (c.proyeccion_anual || 0), 0);

        html += `
                <tr style="background: #f0f0f0; font-weight: bold;">
                    <td colspan="2">TOTAL</td>
                    <td>${totalMEF}</td>
                    <td>${totalProyeccion}</td>
                    <td colspan="11"></td>
                </tr>
                </tbody>
            </table>
            </div>
        `;

        if (this.modoEdicion) {
            html += `
                <div style="margin-top: 1rem; text-align: right;">
                    <button id="btn-guardar-metas-individuales" class="btn btn-primary">
                        GUARDAR CAMBIOS
                    </button>
                </div>
            `;
        }

        html += `
            <div style="margin-top: 1rem;">
                <button id="btn-exportar-consolidado-excel" class="btn btn-secondary">
                    Exportar Excel
                </button>
            </div>
        `;

        contenedor.innerHTML = html;

        // Event listeners
        if (this.modoEdicion) {
            document.getElementById('btn-guardar-porcentajes')?.addEventListener('click', () => {
                this.guardarPorcentajes();
            });

            document.getElementById('btn-calcular-metas')?.addEventListener('click', () => {
                this.calcularMetas();
            });

            document.getElementById('btn-guardar-metas-individuales')?.addEventListener('click', () => {
                this.guardarMetasIndividuales();
            });
        }

        document.getElementById('btn-exportar-consolidado-excel')?.addEventListener('click', () => {
            this.exportarConsolidadoExcel();
        });
    },

    actualizarPorcentaje(index, valor) {
        this.porcentajesEditados[index].porcentaje_meta = parseFloat(valor) || 0;
        
        // Recalcular suma y actualizar vista
        const suma = this.porcentajesEditados.reduce((s, p) => s + p.porcentaje_meta, 0);
        const btn = document.getElementById('btn-guardar-porcentajes');
        if (btn) {
            btn.disabled = Math.abs(suma - 100) > 0.01;
        }
        
        // Actualizar texto de suma
        const sumaPorcentajes = suma.toFixed(2);
        this.renderizarTablaConsolidado();
    },

    actualizarMetaIndividual(comunidadId, metodoId, valor) {
        const registro = this.metasEditadas.find(m => m.comunidad_id === comunidadId && m.metodo_id === metodoId);
        if (registro) {
            registro.proyeccion_anual_metodo = parseInt(valor) || 0;
        }
    },

    async guardarPorcentajes() {
        try {
            SGPF.showLoading(true);

            const response = await SGPF.apiCall(`/planificacion/porcentajes-metodos/guardar/${this.filtrosActuales.año}`, {
                method: 'POST',
                body: JSON.stringify({ porcentajes: this.porcentajesEditados })
            });

            if (response.success) {
                SGPF.showToast('Porcentajes guardados', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando porcentajes:', error);
            SGPF.showToast(error.message || 'Error guardando porcentajes', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    async calcularMetas() {
        try {
            SGPF.showLoading(true);

            const response = await SGPF.apiCall(`/planificacion/calcular-metas/${this.filtrosActuales.año}`, {
                method: 'POST'
            });

            if (response.success) {
                SGPF.showToast(response.message, 'success');
                await this.cargarVistaConsolidado();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error calculando metas:', error);
            SGPF.showToast('Error calculando metas', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    async guardarMetasIndividuales() {
        try {
            SGPF.showLoading(true);

            const metas = this.metasEditadas.map(m => ({
                comunidad_id: m.comunidad_id,
                metodo_id: m.metodo_id,
                año: this.filtrosActuales.año,
                proyeccion_anual_metodo: m.proyeccion_anual_metodo
            }));

            const response = await SGPF.apiCall('/planificacion/metas-individuales/guardar', {
                method: 'POST',
                body: JSON.stringify({ metas })
            });

            if (response.success) {
                SGPF.showToast('Metas guardadas', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando metas:', error);
            SGPF.showToast('Error guardando metas', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

// ========== VISTA 3: PLANIFICADO VS EJECUTADO ==========
    async cargarVistaComparativo() {
        console.log('Cargando vista comparativo');

        const contenedor = document.getElementById('contenido-planificacion');
        
        contenedor.innerHTML = `
            <div class="card-body">
                <h3>Comparativo Planificado vs Ejecutado</h3>
                <p>Seleccione una opción para ver el comparativo:</p>
                
                <div class="filtros-reportes">
                    <div class="filtro-grupo">
                        <label>Tipo de Reporte:</label>
                        <select id="tipo-comparativo" onchange="PlanificacionSystem.cambiarTipoComparativo()">
                            <option value="metodo">Todas las comunidades de un método</option>
                            <option value="comunidad">Una comunidad con todos los métodos</option>
                        </select>
                    </div>
                    
                    <div class="filtro-grupo" id="filtro-metodo-comp" style="display: block;">
                        <label>Método:</label>
                        <select id="select-metodo-comp">
                            <option value="">Seleccione...</option>
                        </select>
                    </div>
                    
                    <div class="filtro-grupo" id="filtro-comunidad-comp" style="display: none;">
                        <label>Comunidad:</label>
                        <select id="select-comunidad-comp">
                            <option value="">Seleccione...</option>
                        </select>
                    </div>
                    
                    <div class="filtro-grupo">
                        <label>&nbsp;</label>
                        <button id="btn-cargar-comparativo" class="btn btn-primary">
                            Ver Comparativo
                        </button>
                    </div>
                </div>
                
                <div id="resultado-comparativo"></div>
            </div>
        `;

        await this.cargarSelectComunidades();
        await this.cargarSelectMetodos();

        document.getElementById('btn-cargar-comparativo')?.addEventListener('click', () => {
            this.cargarComparativoDetalle();
        });
    },

    cambiarTipoComparativo() {
        const tipo = document.getElementById('tipo-comparativo')?.value;
        const filtroMetodo = document.getElementById('filtro-metodo-comp');
        const filtroComunidad = document.getElementById('filtro-comunidad-comp');
        
        if (tipo === 'metodo') {
            filtroMetodo.style.display = 'flex';
            filtroComunidad.style.display = 'none';
            this.filtrosActuales.tipoFiltro = 'metodo';
        } else {
            filtroMetodo.style.display = 'none';
            filtroComunidad.style.display = 'flex';
            this.filtrosActuales.tipoFiltro = 'comunidad';
        }
    },

    async cargarSelectComunidades() {
        try {
            const response = await SGPF.apiCall(`/planificacion/configuracion/${this.filtrosActuales.año}`);
            
            if (response.success) {
                const select = document.getElementById('select-comunidad-comp');
                if (select) {
                    select.innerHTML = '<option value="">Seleccione...</option>';
                    response.data.comunidades.forEach(com => {
                        const option = document.createElement('option');
                        option.value = com.comunidad_id;
                        option.textContent = com.comunidad;
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error cargando comunidades:', error);
        }
    },

    async cargarSelectMetodos() {
        try {
            // Métodos hardcoded por ahora
            const metodos = [
                { id: 1, nombre: 'Inyección Mensual' },
                { id: 2, nombre: 'Inyección Bimensual' },
                { id: 3, nombre: 'Inyección Trimestral' },
                { id: 4, nombre: 'Píldora' },
                { id: 5, nombre: 'DIU' },
                { id: 6, nombre: 'Implante Subdérmico' },
                { id: 7, nombre: 'Condón' },
                { id: 8, nombre: 'Collar de Perlas' },
                { id: 9, nombre: 'MELA' },
                { id: 10, nombre: 'AQV Femenina' },
                { id: 11, nombre: 'AQV Masculina' }
            ];

            const select = document.getElementById('select-metodo-comp');
            if (select) {
                select.innerHTML = '<option value="">Seleccione...</option>';
                metodos.forEach(metodo => {
                    const option = document.createElement('option');
                    option.value = metodo.id;
                    option.textContent = metodo.nombre;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando métodos:', error);
        }
    },

    async cargarComparativoDetalle() {
        const tipo = this.filtrosActuales.tipoFiltro;
        const metodoId = document.getElementById('select-metodo-comp')?.value;
        const comunidadId = document.getElementById('select-comunidad-comp')?.value;

        if (tipo === 'metodo' && !metodoId) {
            SGPF.showToast('Seleccione un método', 'warning');
            return;
        }

        if (tipo === 'comunidad' && !comunidadId) {
            SGPF.showToast('Seleccione una comunidad', 'warning');
            return;
        }

        try {
            SGPF.showLoading(true);

            // NUEVO: Asegurar que existan las metas primero
            if (tipo === 'metodo') {
                // Obtener todas las comunidades
                const respComunidades = await SGPF.apiCall(`/planificacion/configuracion/${this.filtrosActuales.año}`);
                
                if (respComunidades.success) {
                    // Asegurar meta para cada comunidad con este método
                    for (const com of respComunidades.data.comunidades) {
                        await SGPF.apiCall('/planificacion/asegurar-meta', {
                            method: 'POST',
                            body: JSON.stringify({
                                comunidad_id: com.comunidad_id,
                                metodo_id: parseInt(metodoId),
                                año: this.filtrosActuales.año
                            })
                        });
                    }
                }
            } else {
                // Asegurar meta para esta comunidad con todos los métodos
                for (let metId = 1; metId <= 11; metId++) {
                    await SGPF.apiCall('/planificacion/asegurar-meta', {
                        method: 'POST',
                        body: JSON.stringify({
                            comunidad_id: parseInt(comunidadId),
                            metodo_id: metId,
                            año: this.filtrosActuales.año
                        })
                    });
                }
            }

            // Ahora sí cargar los datos
            let endpoint;
            if (tipo === 'metodo') {
                endpoint = `/planificacion/planificacion-mensual/metodo/${metodoId}/${this.filtrosActuales.año}`;
                this.filtrosActuales.metodoId = parseInt(metodoId);
            } else {
                endpoint = `/planificacion/planificacion-mensual/comunidad/${comunidadId}/${this.filtrosActuales.año}`;
                this.filtrosActuales.comunidadId = parseInt(comunidadId);
            }

            const response = await SGPF.apiCall(endpoint);

            if (response.success) {
                this.distribucionEditada = response.data.planificacion;
                this.renderizarComparativo(response.data.planificacion, tipo);
            }
        } catch (error) {
            console.error('Error cargando comparativo:', error);
            SGPF.showToast('Error cargando comparativo', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    renderizarComparativo(datos, tipo) {
        const contenedor = document.getElementById('resultado-comparativo');
        
        if (!contenedor || !datos || datos.length === 0) {
            if (contenedor) {
                contenedor.innerHTML = '<div class="sin-datos">No hay datos disponibles</div>';
            }
            return;
        }

        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Agrupar por comunidad o método
        const grupos = {};
        datos.forEach(row => {
            const key = tipo === 'metodo' ? row.comunidad_id : row.metodo_id;
            const label = tipo === 'metodo' ? row.comunidad : row.metodo;
            
            if (!grupos[key]) {
                grupos[key] = {
                    id: key,
                    label: label,
                    meta_metodo_comunidad_id: row.meta_metodo_comunidad_id, // IMPORTANTE
                    meta_anual: row.meta_anual || 0,
                    meses: {}
                };
            }
            
            if (row.mes) {
                grupos[key].meses[row.mes] = {
                    planificado: row.planificado || 0,
                    ejecutado: row.ejecutado || 0
                };
            }
        });

        // Inicializar objeto de distribución
        if (!this.distribucionPorGrupo) {
            this.distribucionPorGrupo = {};
        }

        let html = '<div style="margin-top: 2rem;">';

        Object.values(grupos).forEach((grupo) => {
            // Guardar datos del grupo con el ID correcto
            this.distribucionPorGrupo[grupo.id] = {
                meta_metodo_comunidad_id: grupo.meta_metodo_comunidad_id,
                meta_anual: grupo.meta_anual,
                distribuciones: []
            };

            // Calcular totales
            let totalPlanificado = 0;
            let totalEjecutado = 0;
            
            for (let mes = 1; mes <= 12; mes++) {
                const valor = grupo.meses[mes]?.planificado || 0;
                totalPlanificado += valor;
                totalEjecutado += grupo.meses[mes]?.ejecutado || 0;
                
                this.distribucionPorGrupo[grupo.id].distribuciones.push({
                    mes: mes,
                    meta_mensual: valor
                });
            }

            const porcentajeAlcanzado = totalPlanificado > 0 
                ? ((totalEjecutado / totalPlanificado) * 100).toFixed(1)
                : 0;

            const faltaDistribuir = grupo.meta_anual - totalPlanificado;
            const sumaCorrecta = faltaDistribuir === 0;

            html += `
                <div style="margin-bottom: 2rem; border: 2px solid ${sumaCorrecta ? '#28a745' : '#dc3545'}; border-radius: 8px; padding: 1rem;">
                    <h4>${grupo.label}</h4>
                    <p style="margin-bottom: 0.5rem;">
                        Meta Anual: <strong>${grupo.meta_anual}</strong> | 
                        Planificado: <strong id="total-planificado-${grupo.id}">${totalPlanificado}</strong> 
                        ${!sumaCorrecta ? `<span style="color: ${faltaDistribuir > 0 ? 'red' : 'orange'}; font-weight: bold;">(${faltaDistribuir > 0 ? 'Faltan' : 'Exceso de'} ${Math.abs(faltaDistribuir)})</span>` : '<span style="color: green; font-weight: bold;">✓</span>'} | 
                        Ejecutado: <strong>${totalEjecutado}</strong> | 
                        Alcance: <strong style="color: ${porcentajeAlcanzado >= 100 ? 'green' : 'orange'};">${porcentajeAlcanzado}%</strong>
                    </p>
                    
                    <table class="tabla-planificacion">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Planificado</th>
                                <th>Ejecutado</th>
                                <th>Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            for (let mes = 1; mes <= 12; mes++) {
                const datosMes = grupo.meses[mes] || { planificado: 0, ejecutado: 0 };
                const diferenciaMes = datosMes.ejecutado - datosMes.planificado;
                const clase = diferenciaMes >= 0 ? 'exito' : 'danger';

                html += `
                    <tr>
                        <td><strong>${meses[mes - 1]}</strong></td>
                        <td>
                            ${this.modoEdicion ? `
                                <input type="number" 
                                       class="input-editable-small" 
                                       value="${datosMes.planificado}"
                                       min="0"
                                       onchange="PlanificacionSystem.actualizarDistribucionMensualNuevo(${grupo.id}, ${mes}, this.value)"
                                       style="width: 80px; padding: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
                            ` : datosMes.planificado}
                        </td>
                        <td>${datosMes.ejecutado}</td>
                        <td class="${clase}">${diferenciaMes >= 0 ? '+' : ''}${diferenciaMes}</td>
                    </tr>
                `;
            }

            html += `
                        </tbody>
                        <tfoot>
                            <tr style="background: #f0f0f0; font-weight: bold;">
                                <td>TOTAL</td>
                                <td id="footer-total-${grupo.id}">${totalPlanificado}</td>
                                <td>${totalEjecutado}</td>
                                <td class="${totalEjecutado >= totalPlanificado ? 'exito' : 'danger'}">${totalEjecutado >= totalPlanificado ? '+' : ''}${totalEjecutado - totalPlanificado}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    ${this.modoEdicion ? `
                        <div style="margin-top: 1rem; text-align: right;">
                            <button 
                                id="btn-guardar-grupo-${grupo.id}" 
                                class="btn btn-primary"
                                ${!sumaCorrecta ? 'disabled' : ''}
                                onclick="PlanificacionSystem.guardarDistribucionGrupo(${grupo.id})">
                                GUARDAR ${grupo.label.toUpperCase()}
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';

        html += `
            <div style="margin-top: 1rem;">
                <button id="btn-exportar-comparativo-excel" class="btn btn-secondary">
                    📊 Exportar Excel
                </button>
            </div>
        `;

        contenedor.innerHTML = html;

        document.getElementById('btn-exportar-comparativo-excel')?.addEventListener('click', () => {
            this.exportarComparativoExcel();
        });
    },

    actualizarDistribucionMensualNuevo(grupoId, mes, valor) {
        const valorNum = parseInt(valor) || 0;
        
        // Actualizar en el objeto
        const grupo = this.distribucionPorGrupo[grupoId];
        const distMes = grupo.distribuciones.find(d => d.mes === mes);
        if (distMes) {
            distMes.meta_mensual = valorNum;
        }

        // Recalcular suma
        const suma = grupo.distribuciones.reduce((acc, d) => acc + d.meta_mensual, 0);
        
        // Actualizar display
        const totalElement = document.getElementById(`total-planificado-${grupoId}`);
        const footerElement = document.getElementById(`footer-total-${grupoId}`);
        const btnGuardar = document.getElementById(`btn-guardar-grupo-${grupoId}`);
        
        if (totalElement) totalElement.textContent = suma;
        if (footerElement) footerElement.textContent = suma;
        
        // Habilitar/deshabilitar botón
        const sumaCorrecta = suma === grupo.meta_anual;
        if (btnGuardar) {
            btnGuardar.disabled = !sumaCorrecta;
        }

        // Actualizar texto de diferencia
        const faltaDistribuir = grupo.meta_anual - suma;
        const statusText = suma === grupo.meta_anual 
            ? '<span style="color: green; font-weight: bold;">✓</span>'
            : `<span style="color: ${faltaDistribuir > 0 ? 'red' : 'orange'}; font-weight: bold;">(${faltaDistribuir > 0 ? 'Faltan' : 'Exceso de'} ${Math.abs(faltaDistribuir)})</span>`;
        
        // Buscar el párrafo y actualizarlo
        const container = totalElement?.closest('div');
        if (container) {
            const p = container.querySelector('p');
            if (p) {
                p.innerHTML = `
                    Meta Anual: <strong>${grupo.meta_anual}</strong> | 
                    Planificado: <strong id="total-planificado-${grupoId}">${suma}</strong> 
                    ${statusText} | 
                    Ejecutado: <strong>${p.innerHTML.match(/Ejecutado: <strong>(\d+)<\/strong>/)?.[1] || 0}</strong> | 
                    Alcance: ${p.innerHTML.match(/Alcance: <strong[^>]*>[\d.]+%<\/strong>/)?.[0] || ''}
                `;
            }
        }
    },

    // Guardar distribución de un grupo específico
    async guardarDistribucionGrupo(grupoId) {
        const grupo = this.distribucionPorGrupo[grupoId];
        
        if (!grupo || !grupo.meta_metodo_comunidad_id) {
            SGPF.showToast('Error: Datos del grupo no válidos', 'error');
            console.error('Grupo inválido:', grupo);
            return;
        }

        // Validar suma
        const suma = grupo.distribuciones.reduce((acc, d) => acc + d.meta_mensual, 0);
        if (suma !== grupo.meta_anual) {
            SGPF.showToast(`La suma (${suma}) debe ser exactamente ${grupo.meta_anual}`, 'error');
            return;
        }

        try {
            SGPF.showLoading(true);

            console.log('Enviando al backend:', {
                meta_metodo_comunidad_id: grupo.meta_metodo_comunidad_id,
                meta_anual: grupo.meta_anual,
                distribuciones: grupo.distribuciones
            });

            const response = await SGPF.apiCall('/planificacion/planificacion-mensual/guardar', {
                method: 'POST',
                body: JSON.stringify({
                    meta_metodo_comunidad_id: grupo.meta_metodo_comunidad_id,
                    meta_anual: grupo.meta_anual,
                    distribuciones: grupo.distribuciones
                })
            });

            if (response.success) {
                SGPF.showToast('Distribución guardada exitosamente', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando distribución:', error);
            SGPF.showToast(error.message || 'Error guardando distribución', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    actualizarDistribucionMensual(identificador, mes, valor) {
        // Actualizar en el array de distribucion editada
        const valorNum = parseInt(valor) || 0;
        
        this.distribucionEditada.forEach(dist => {
            const label = this.filtrosActuales.tipoFiltro === 'metodo' ? dist.comunidad : dist.metodo;
            if (label === identificador && dist.mes === mes) {
                dist.planificado = valorNum;
            }
        });
    },

    async guardarDistribucionMensual() {
        try {
            // Validar que cada grupo sume exactamente su meta anual
            const grupos = {};
            this.distribucionEditada.forEach(dist => {
                const key = this.filtrosActuales.tipoFiltro === 'metodo' 
                    ? dist.comunidad_id 
                    : dist.metodo_id;
                
                if (!grupos[key]) {
                    grupos[key] = {
                        meta_anual: dist.meta_anual,
                        total_distribuido: 0
                    };
                }
                
                grupos[key].total_distribuido += dist.planificado || 0;
            });

            // Validar
            for (const grupo of Object.values(grupos)) {
                if (grupo.total_distribuido !== grupo.meta_anual) {
                    SGPF.showToast(`La distribución debe sumar exactamente la meta anual (${grupo.meta_anual}). Actual: ${grupo.total_distribuido}`, 'error');
                    return;
                }
            }

            SGPF.showLoading(true);

            // Preparar datos para enviar
            const distribuciones = this.distribucionEditada.map(dist => ({
                meta_metodo_comunidad_id: dist.meta_metodo_comunidad_id, // Necesitamos este ID del backend
                mes: dist.mes,
                meta_mensual: dist.planificado
            }));

            const response = await SGPF.apiCall('/planificacion/planificacion-mensual/guardar', {
                method: 'POST',
                body: JSON.stringify({ distribuciones })
            });

            if (response.success) {
                SGPF.showToast('Distribución mensual guardada', 'success');
                await this.cargarComparativoDetalle();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando distribución:', error);
            SGPF.showToast('Error guardando distribución mensual', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ========== EXPORTACIÓN ==========
    exportarConsolidadoExcel() {
        if (typeof XLSX === 'undefined') {
            SGPF.showToast('Librería Excel no disponible', 'warning');
            return;
        }

        try {
            const tabla = document.querySelector('#contenido-planificacion table');
            if (!tabla) {
                SGPF.showToast('No hay datos para exportar', 'warning');
                return;
            }

            // Extraer datos de la tabla manualmente para mejor formato
            const rows = tabla.querySelectorAll('tbody tr');
            const data = [];
            
            // Headers
            data.push(['No.', 'Comunidad', 'MEF', 'Proy. Anual', 'Iny. Mensual', 'Iny. Bimensual', 'Iny. Trimestral', 'Píldora', 'DIU', 'Implante', 'Condón', 'Collar', 'MELA', 'AQV F', 'AQV M']);

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = [];
                
                cells.forEach((cell, idx) => {
                    if (idx < 4) {
                        // Primeras 4 columnas son texto/números simples
                        rowData.push(cell.textContent.trim());
                    } else {
                        // Columnas de métodos: extraer solo el número (antes del <br>)
                        const input = cell.querySelector('input');
                        if (input) {
                            rowData.push(parseInt(input.value) || 0);
                        } else {
                            const text = cell.textContent.trim().split('\n')[0];
                            rowData.push(parseInt(text) || 0);
                        }
                    }
                });
                
                data.push(rowData);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            
            // Anchos de columna
            ws['!cols'] = [
                { width: 5 },
                { width: 25 },
                { width: 10 },
                { width: 12 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 },
                { width: 10 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Consolidado');
            XLSX.writeFile(wb, `planificacion_consolidado_${this.filtrosActuales.año}.xlsx`);
            
            SGPF.showToast('Excel exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error exportando Excel:', error);
            SGPF.showToast('Error exportando Excel', 'error');
        }
    },

    exportarComparativoExcel() {
        if (typeof XLSX === 'undefined') {
            SGPF.showToast('Librería Excel no disponible', 'warning');
            return;
        }

        try {
            const tablas = document.querySelectorAll('#resultado-comparativo table');
            if (tablas.length === 0) {
                SGPF.showToast('No hay datos para exportar', 'warning');
                return;
            }

            const wb = XLSX.utils.book_new();

            tablas.forEach((tabla, index) => {
                const titulo = tabla.closest('div').querySelector('h4')?.textContent || `Hoja ${index + 1}`;
                const ws = XLSX.utils.table_to_sheet(tabla);
                
                ws['!cols'] = [
                    { width: 10 },
                    { width: 15 },
                    { width: 15 },
                    { width: 15 }
                ];

                const sheetName = titulo.substring(0, 31); // Excel limit
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });

            XLSX.writeFile(wb, `planificacion_comparativo_${this.filtrosActuales.año}.xlsx`);
            
            SGPF.showToast('Excel exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error exportando Excel:', error);
            SGPF.showToast('Error exportando Excel', 'error');
        }
    },

    // ========== UTILIDADES ==========
    actualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    },

    mostrarLoading() {
        const contenedor = document.getElementById('contenido-planificacion');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="loading-reportes">
                    <div>Cargando datos...</div>
                </div>
            `;
        }
    },

    mostrarError(mensaje) {
        const contenedor = document.getElementById('contenido-planificacion');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="sin-datos">
                    <div>${mensaje}</div>
                </div>
            `;
        }
    },

    // Función para llenar las cajas vacías
    async inicializarSistema() {
        if (!confirm('Esto llenará las tablas vacías. ¿Continuar?')) return;

        try {
            SGPF.showLoading(true);
            const response = await SGPF.apiCall(`/planificacion/inicializar/2025`, {
                method: 'POST'
            });

            if (response.success) {
                alert('Sistema inicializado. Recarga la página.');
                location.reload();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            SGPF.showLoading(false);
        }
    }
};