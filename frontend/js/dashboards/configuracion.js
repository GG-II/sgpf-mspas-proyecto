window.ConfiguracionSystem = window.ConfiguracionSystem || {
    metasOriginales: [],
    metasActuales: [],
    yearActual: 2025,
    comunidades: [],
    comunidadSeleccionada: null,
    proyeccionActual: null,
    metodos: [],
    planificacionActual: {},

    // ===== INICIALIZAR =====
    async init() {
        console.log("⚙️ Inicializando sistema de configuración");

        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Setup listeners de año
            this.setupYearListeners();
            
            // Cargar datos iniciales
            await Promise.all([
                this.cargarMetas(),
                this.cargarComunidades(),
                this.cargarMetodos()
            ]);

            // Setup event listeners
            this.setupEventListeners();

            console.log("✅ Sistema de configuración cargado");
        } catch (error) {
            console.error("❌ Error inicializando configuración:", error);
            SGPF.showToast("Error cargando configuración", "error");
        }
    },

    // ===== SETUP YEAR LISTENERS =====
    setupYearListeners() {
        const yearGlobal = document.getElementById('select-year-global');
        const yearPlanif = document.getElementById('select-year-planif');

        if (yearGlobal) {
            this.yearActual = parseInt(yearGlobal.value);
            yearGlobal.addEventListener('change', (e) => {
                this.yearActual = parseInt(e.target.value);
                this.cargarMetas();
            });
        }

        if (yearPlanif) {
            yearPlanif.addEventListener('change', (e) => {
                this.yearActual = parseInt(e.target.value);
                if (this.comunidadSeleccionada) {
                    this.cargarProyeccionComunidad(this.comunidadSeleccionada);
                }
            });
        }
    },

    // ===== CARGAR METAS GLOBALES =====
    async cargarMetas() {
        const loadingElement = document.getElementById('metas-loading');
        const contentElement = document.getElementById('metas-content');

        try {
            console.log(`📊 Cargando metas del año ${this.yearActual}...`);

            if (loadingElement) loadingElement.style.display = 'block';
            if (contentElement) contentElement.style.display = 'none';

            const response = await SGPF.apiCall(`/admin/metas/${this.yearActual}`);

            if (response && response.success && response.data) {
                this.metasOriginales = response.data.metas || [];
                this.metasActuales = JSON.parse(JSON.stringify(this.metasOriginales));
                
                this.renderizarMetas();

                if (loadingElement) loadingElement.style.display = 'none';
                if (contentElement) contentElement.style.display = 'block';
            } else {
                throw new Error("No se encontraron metas");
            }
        } catch (error) {
            console.error("❌ Error cargando metas:", error);
            
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="alert-box alert-warning">
                        <span style="font-size: 1.5rem;">⚠️</span>
                        <div>
                            <strong>No existen metas para el año ${this.yearActual}</strong><br>
                            <small>Las metas globales deben ser configuradas primero.</small>
                        </div>
                    </div>
                `;
            }
        }
    },

    // ===== RENDERIZAR METAS =====
    renderizarMetas() {
        const tbody = document.getElementById('metas-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.metasActuales.forEach((meta, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="metodo-cell">${meta.metodo_nombre}</td>
                <td>
                    <input 
                        type="number" 
                        class="input-meta" 
                        data-index="${index}"
                        value="${meta.porcentaje_meta || 0}" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        style="width: 80px; padding: 0.5rem; text-align: center;"
                    />
                </td>
            `;
            tbody.appendChild(row);
        });

        // Event listeners
        tbody.querySelectorAll('.input-meta').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const valor = parseFloat(e.target.value) || 0;
                this.metasActuales[index].porcentaje_meta = valor;
                this.actualizarTotal();
            });
        });

        this.actualizarTotal();
    },

    // ===== ACTUALIZAR TOTAL =====
    actualizarTotal() {
        const total = this.metasActuales.reduce((sum, meta) => {
            return sum + (parseFloat(meta.porcentaje_meta) || 0);
        }, 0);

        const totalElement = document.getElementById('total-porcentaje');
        const statusElement = document.getElementById('total-status');

        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
            
            if (total === 100) {
                totalElement.style.color = 'var(--mspas-success)';
                if (statusElement) statusElement.textContent = ' ✓';
            } else if (total > 100) {
                totalElement.style.color = 'var(--mspas-danger)';
                if (statusElement) statusElement.textContent = ` ⚠️ Excede ${(total - 100).toFixed(2)}%`;
            } else {
                totalElement.style.color = 'var(--mspas-warning)';
                if (statusElement) statusElement.textContent = ` ⚠️ Falta ${(100 - total).toFixed(2)}%`;
            }
        }

        return total;
    },

    // ===== GUARDAR METAS =====
    async guardarMetas() {
        try {
            const total = this.actualizarTotal();

            if (total !== 100) {
                const confirmar = confirm(
                    `El total es ${total.toFixed(2)}% (debe ser 100%). ¿Desea guardar de todas formas?`
                );
                if (!confirmar) return;
            }

            SGPF.showLoading(true);

            const metasParaGuardar = this.metasActuales.map(meta => ({
                metodo_id: meta.metodo_id,
                porcentaje_meta: parseFloat(meta.porcentaje_meta) || 0
            }));

            const response = await SGPF.apiCall(`/admin/metas/${this.yearActual}`, {
                method: 'PUT',
                body: JSON.stringify({ metas: metasParaGuardar })
            });

            if (response && response.success) {
                SGPF.showToast(`Metas de ${this.yearActual} actualizadas exitosamente`, 'success');
                await this.cargarMetas();
            } else {
                throw new Error(response.message || 'Error guardando metas');
            }
        } catch (error) {
            console.error("❌ Error guardando metas:", error);
            SGPF.showToast(error.message || "Error guardando metas", "error");
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== RESTABLECER METAS =====
    restablecerMetas() {
        if (confirm('¿Descartar todos los cambios?')) {
            this.metasActuales = JSON.parse(JSON.stringify(this.metasOriginales));
            this.renderizarMetas();
            SGPF.showToast('Cambios descartados', 'info');
        }
    },

    // ===== CARGAR COMUNIDADES =====
    async cargarComunidades() {
        try {
            const response = await SGPF.apiCall('/admin/comunidades');

            if (response && response.success) {
                this.comunidades = response.data || [];
                this.renderizarSelectorComunidades();
            }
        } catch (error) {
            console.error("❌ Error cargando comunidades:", error);
        }
    },

    // ===== RENDERIZAR SELECTOR DE COMUNIDADES =====
    renderizarSelectorComunidades() {
        const select = document.getElementById('select-comunidad');
        if (!select) return;

        select.innerHTML = '<option value="">-- Seleccione una comunidad --</option>';

        // Agrupar por territorio
        const porTerritorio = {};
        this.comunidades.forEach(com => {
            const territorio = com.territorio_nombre || 'Sin territorio';
            if (!porTerritorio[territorio]) porTerritorio[territorio] = [];
            porTerritorio[territorio].push(com);
        });

        // Crear optgroups
        Object.entries(porTerritorio).forEach(([territorio, comunidades]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = territorio;
            
            comunidades.forEach(com => {
                const option = document.createElement('option');
                option.value = com.id;
                option.textContent = `${com.nombre} (MEF: ${com.poblacion_mef})`;
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });

        // Event listener
        select.addEventListener('change', (e) => {
            const comunidadId = parseInt(e.target.value);
            if (comunidadId) {
                this.comunidadSeleccionada = comunidadId;
                this.cargarProyeccionComunidad(comunidadId);
            }
        });
    },

    // ===== CARGAR MÉTODOS =====
    async cargarMetodos() {
        try {
            const response = await SGPF.apiCall('/admin/metas/2025');
            if (response && response.success) {
                this.metodos = response.data.metas || [];
            }
        } catch (error) {
            console.error("❌ Error cargando métodos:", error);
        }
    },

    // ===== CARGAR PROYECCIÓN DE COMUNIDAD =====
async cargarProyeccionComunidad(comunidadId) {
    const loadingElement = document.getElementById('planificacion-loading');
    const contentElement = document.getElementById('planificacion-content');

    try {
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';

        const response = await SGPF.apiCall(`/admin/comunidades/${comunidadId}/proyeccion/${this.yearActual}`);

        if (response && response.success && response.data) {
            // SÍ existe proyección
            this.proyeccionActual = response.data;
            
            // Llenar inputs
            document.getElementById('input-mef').value = this.proyeccionActual.poblacion_mef;
            document.getElementById('input-porcentaje').value = Math.round(this.proyeccionActual.porcentaje_proyeccion * 100);
            
            // Calcular proyección
            calcularProyeccion();

            // Cargar planificación mensual
            await this.cargarPlanificacionMensual(this.proyeccionActual.id);
            
            document.getElementById('planificacion-table-container').style.display = 'block';
        } else {
            // NO existe proyección - mostrar form vacío
            throw new Error("No existe proyección");
        }

        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';

    } catch (error) {
        console.log("ℹ️ No existe proyección para esta comunidad, mostrando formulario vacío");
        
        // Llenar con datos de la comunidad
        const comunidad = this.comunidades.find(c => c.id === comunidadId);
        if (comunidad) {
            document.getElementById('input-mef').value = comunidad.poblacion_mef || '';
            document.getElementById('input-porcentaje').value = 35;
            calcularProyeccion();
        }
        
        this.proyeccionActual = null;
        this.planificacionActual = {};
        
        document.getElementById('planificacion-table-container').style.display = 'none';
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';
    }
},

    // ===== GUARDAR PROYECCIÓN =====
    async guardarProyeccion() {
        if (!this.comunidadSeleccionada) {
            SGPF.showToast("Seleccione una comunidad primero", "warning");
            return;
        }

        try {
            const mef = parseInt(document.getElementById('input-mef').value);
            const porcentaje = parseInt(document.getElementById('input-porcentaje').value);

            if (!mef || !porcentaje) {
                SGPF.showToast("Complete todos los campos", "warning");
                return;
            }

            if (porcentaje < 30 || porcentaje > 70) {
                SGPF.showToast("El porcentaje debe estar entre 30% y 70%", "warning");
                return;
            }

            SGPF.showLoading(true);

            const response = await SGPF.apiCall(`/admin/comunidades/${this.comunidadSeleccionada}/proyeccion`, {
                method: 'POST',
                body: JSON.stringify({
                    año: this.yearActual,
                    poblacion_mef: mef,
                    porcentaje_proyeccion: porcentaje / 100
                })
            });

            if (response && response.success) {
                SGPF.showToast("Proyección guardada exitosamente", "success");
                await this.cargarProyeccionComunidad(this.comunidadSeleccionada);
            } else {
                throw new Error(response.message || "Error guardando proyección");
            }
        } catch (error) {
            console.error("❌ Error guardando proyección:", error);
            SGPF.showToast(error.message || "Error guardando proyección", "error");
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== CARGAR PLANIFICACIÓN MENSUAL =====
    async cargarPlanificacionMensual(proyeccionId) {
        try {
            const response = await SGPF.apiCall(`/admin/planificacion/${proyeccionId}`);

            if (response && response.success) {
                const planificacion = response.data.planificacion || [];
                
                // Organizar por método y mes
                this.planificacionActual = {};
                planificacion.forEach(p => {
                    if (!this.planificacionActual[p.metodo_id]) {
                        this.planificacionActual[p.metodo_id] = {};
                    }
                    this.planificacionActual[p.metodo_id][p.mes] = p.meta_mensual;
                });
            }

            this.renderizarTablaPlanificacion();
        } catch (error) {
            console.error("❌ Error cargando planificación:", error);
        }
    },

    // ===== RENDERIZAR TABLA DE PLANIFICACIÓN =====
    renderizarTablaPlanificacion() {
        const tbody = document.getElementById('planificacion-tbody');
        if (!tbody || !this.proyeccionActual) return;

        tbody.innerHTML = '';

        this.metodos.forEach(metodo => {
            const metaAnual = Math.round(this.proyeccionActual.proyeccion_anual * (metodo.porcentaje_meta / 100));
            const row = document.createElement('tr');
            
            let htmlMeses = '';
            let totalPlanificado = 0;

            for (let mes = 1; mes <= 12; mes++) {
                const valor = this.planificacionActual[metodo.metodo_id]?.[mes] || 0;
                totalPlanificado += valor;
                
                htmlMeses += `
                    <td>
                        <input 
                            type="number" 
                            class="input-meta" 
                            data-metodo="${metodo.metodo_id}"
                            data-mes="${mes}"
                            value="${valor}" 
                            min="0"
                        />
                    </td>
                `;
            }

            row.innerHTML = `
                <td class="metodo-cell">${metodo.metodo_nombre}</td>
                <td style="font-weight: 700; color: var(--mspas-primary);">${metaAnual}</td>
                ${htmlMeses}
                <td style="font-weight: 700; ${totalPlanificado === metaAnual ? 'color: var(--mspas-success);' : 'color: var(--mspas-warning);'}">
                    ${totalPlanificado}
                </td>
            `;

            tbody.appendChild(row);
        });

        // Event listeners
        tbody.querySelectorAll('.input-meta').forEach(input => {
            input.addEventListener('input', (e) => {
                const metodoId = parseInt(e.target.dataset.metodo);
                const mes = parseInt(e.target.dataset.mes);
                const valor = parseInt(e.target.value) || 0;

                if (!this.planificacionActual[metodoId]) {
                    this.planificacionActual[metodoId] = {};
                }
                this.planificacionActual[metodoId][mes] = valor;

                // Recalcular total
                this.actualizarTotalMetodo(metodoId);
            });
        });
    },

    // ===== ACTUALIZAR TOTAL DE MÉTODO =====
    actualizarTotalMetodo(metodoId) {
        const row = document.querySelector(`input[data-metodo="${metodoId}"]`)?.closest('tr');
        if (!row) return;

        let total = 0;
        for (let mes = 1; mes <= 12; mes++) {
            total += this.planificacionActual[metodoId]?.[mes] || 0;
        }

        const metaAnual = parseInt(row.cells[1].textContent);
        const totalCell = row.cells[row.cells.length - 1];
        
        totalCell.textContent = total;
        totalCell.style.fontWeight = '700';
        totalCell.style.color = total === metaAnual ? 'var(--mspas-success)' : 'var(--mspas-warning)';
    },

    // ===== GUARDAR PLANIFICACIÓN =====
    async guardarPlanificacion() {
        if (!this.proyeccionActual) {
            SGPF.showToast("Debe guardar la proyección primero", "warning");
            return;
        }

        try {
            SGPF.showLoading(true);

            // Convertir a formato requerido
            const planificacion = [];
            Object.keys(this.planificacionActual).forEach(metodoId => {
                Object.keys(this.planificacionActual[metodoId]).forEach(mes => {
                    planificacion.push({
                        metodo_id: parseInt(metodoId),
                        mes: parseInt(mes),
                        meta_mensual: this.planificacionActual[metodoId][mes]
                    });
                });
            });

            const response = await SGPF.apiCall(`/admin/planificacion/${this.proyeccionActual.id}`, {
                method: 'POST',
                body: JSON.stringify({ planificacion })
            });

            if (response && response.success) {
                SGPF.showToast("Planificación guardada exitosamente", "success");
            } else {
                throw new Error(response.message || "Error guardando planificación");
            }
        } catch (error) {
            console.error("❌ Error guardando planificación:", error);
            SGPF.showToast(error.message || "Error guardando planificación", "error");
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== DISTRIBUIR AUTOMÁTICAMENTE =====
    distribuirAutomaticamente() {
        if (!this.proyeccionActual) return;

        if (!confirm('¿Distribuir automáticamente la meta anual entre los 12 meses de forma equitativa?')) {
            return;
        }

        this.metodos.forEach(metodo => {
            const metaAnual = Math.round(this.proyeccionActual.proyeccion_anual * (metodo.porcentaje_meta / 100));
            const porMes = Math.floor(metaAnual / 12);
            const residuo = metaAnual % 12;

            if (!this.planificacionActual[metodo.metodo_id]) {
                this.planificacionActual[metodo.metodo_id] = {};
            }

            for (let mes = 1; mes <= 12; mes++) {
                this.planificacionActual[metodo.metodo_id][mes] = porMes + (mes <= residuo ? 1 : 0);
            }
        });

        this.renderizarTablaPlanificacion();
        SGPF.showToast("Distribución automática completada", "success");
    },

    // ===== LIMPIAR PLANIFICACIÓN =====
    limpiarPlanificacion() {
        if (!confirm('¿Limpiar toda la planificación mensual?')) {
            return;
        }

        this.planificacionActual = {};
        this.renderizarTablaPlanificacion();
        SGPF.showToast("Planificación limpiada", "info");
    },

    // ===== SETUP EVENT LISTENERS =====
    setupEventListeners() {
        // Metas globales
        document.getElementById('btn-guardar-metas')?.addEventListener('click', () => this.guardarMetas());
        document.getElementById('btn-restablecer')?.addEventListener('click', () => this.restablecerMetas());

        // Planificación
        document.getElementById('btn-guardar-proyeccion')?.addEventListener('click', () => this.guardarProyeccion());
        document.getElementById('btn-guardar-planif')?.addEventListener('click', () => this.guardarPlanificacion());
        document.getElementById('btn-distribuir-auto')?.addEventListener('click', () => this.distribuirAutomaticamente());
        document.getElementById('btn-limpiar-planif')?.addEventListener('click', () => this.limpiarPlanificacion());
    }
};