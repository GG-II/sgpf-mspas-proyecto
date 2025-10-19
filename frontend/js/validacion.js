// ===== js/validacion.js - SISTEMA DE VALIDACIÓN DE REGISTROS =====
window.ValidacionSystem = window.ValidacionSystem || {
    // Variables internas
    registrosPendientes: [],
    registrosFiltrados: [],
    accionPendiente: null,
    registroSeleccionado: null,

    // ===== INICIALIZAR SISTEMA =====
    async init() {
        console.log('🔍 Inicializando sistema de validación...');
        
        // Delay para renderizado DOM completo
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            // Verificar que el usuario tenga permisos de validación
            const user = SGPF.getCurrentUser();
            const rolNormalizado = SGPF.getNormalizedRole();
            
            if (!user || (rolNormalizado !== 'asistente' && rolNormalizado !== 'encargado')) {
                console.error('❌ Usuario sin permisos de validación');
                SGPF.showToast('No tienes permisos para validar registros', 'error');
                ComponentLoader.navigateToView('dashboard');
                return;
            }

            // Configurar información del usuario
            this.configurarInfoUsuario(user, rolNormalizado);

            // Cargar registros primero, luego los filtros
            await this.cargarRegistrosPendientes();
            await this.cargarFiltros();

            console.log('✅ Sistema de validación inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando validación:', error);
            SGPF.showToast('Error cargando sistema de validación', 'error');
        }
    },

    // ===== CONFIGURAR INFORMACIÓN DE USUARIO =====
    configurarInfoUsuario(user, rol) {
        const territorioElement = document.getElementById('validacion-territorio');
        if (territorioElement) {
            const descripcion = rol === 'encargado' 
                ? 'Supervisa y valida registros de todo el distrito'
                : 'Valida registros de tu territorio asignado';
            territorioElement.textContent = descripcion;
        }
    },

    // ===== CARGAR REGISTROS PENDIENTES =====
async cargarRegistrosPendientes() {
    try {
        console.log('📋 Cargando visitas pendientes...');
        
        const loadingElement = document.getElementById('validacion-loading');
        const containerElement = document.getElementById('registros-container');
        const sinRegistrosElement = document.getElementById('sin-registros-mensaje');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (containerElement) containerElement.style.display = 'none';
        if (sinRegistrosElement) sinRegistrosElement.style.display = 'none';

        // ✅ SOLUCIÓN TEMPORAL: Usar endpoint de visitas con filtro de estado
        const response = await SGPF.apiCall('/visitas?estado=registrado&limit=100');

        if (response && response.success && response.data.visitas) {
            // Mapear estructura de visitas a estructura esperada
            this.registrosPendientes = response.data.visitas.map(v => ({
                id: v.id,
                metodo: v.metodo,
                metodo_corto: v.nombre_corto,
                comunidad: v.comunidad,
                codigo_comunidad: v.codigo_comunidad,
                territorio: v.territorio,
                registrado_por: v.registrado_por,
                cargo_registrador: 'Auxiliar de Enfermería',
                cantidad_administrada: 1, // V2.0: 1 visita = 1 usuaria
                fecha_hora_registro: v.fecha_hora_registro,
                usuaria_nombre: v.usuaria_nombre,
                tipo_usuaria: v.tipo_usuaria,
                estado: v.estado
            }));
            
            this.registrosFiltrados = [...this.registrosPendientes];
            
            console.log(`✅ ${this.registrosPendientes.length} visitas pendientes cargadas`);
            
            this.actualizarResumen();
            this.mostrarRegistros();
        } else {
            this.mostrarSinRegistros();
        }
    } catch (error) {
        console.error('❌ Error cargando visitas:', error);
        this.mostrarError('Error cargando visitas pendientes');
    } finally {
        const loadingElement = document.getElementById('validacion-loading');
        if (loadingElement) loadingElement.style.display = 'none';
    }
},

    // ===== ACTUALIZAR RESUMEN =====
    actualizarResumen() {
        const registros = this.registrosFiltrados;
        
        // Total pendientes
        const totalElement = document.getElementById('total-pendientes');
        if (totalElement) totalElement.textContent = registros.length;

        // Comunidades únicas
        const comunidadesUnicas = new Set(registros.map(r => r.comunidad || 'N/A')).size;
        const comunidadesElement = document.getElementById('total-comunidades');
        if (comunidadesElement) comunidadesElement.textContent = comunidadesUnicas;

        // Total usuarias
        const totalUsuarias = registros.reduce((sum, r) => sum + (parseInt(r.cantidad_administrada) || 0), 0);
        const usuariasElement = document.getElementById('total-usuarias');
        if (usuariasElement) usuariasElement.textContent = totalUsuarias;

        // Validados hoy (simulado por ahora)
        const validadosHoyElement = document.getElementById('validados-hoy');
        if (validadosHoyElement) validadosHoyElement.textContent = '0';
    },

    // ===== MOSTRAR REGISTROS =====
    mostrarRegistros() {
        const containerElement = document.getElementById('registros-container');
        const sinRegistrosElement = document.getElementById('sin-registros-mensaje');
        
        if (!containerElement) return;

        if (this.registrosFiltrados.length === 0) {
            containerElement.style.display = 'none';
            if (sinRegistrosElement) sinRegistrosElement.style.display = 'block';
            return;
        }

        containerElement.style.display = 'block';
        if (sinRegistrosElement) sinRegistrosElement.style.display = 'none';

        // Crear HTML para cada registro con estilo similar al formulario
        const registrosHtml = this.registrosFiltrados.map(registro => `
            <div class="method-category" data-registro-id="${registro.id}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 class="category-title">📋 ${registro.metodo || 'Método Desconocido'}</h3>
                    <span class="badge badge-warning">Pendiente</span>
                </div>
                
                <div class="method-grid">
                    <div class="method-item">
                        <label>Auxiliar</label>
                        <div class="counter-input">
                            <strong>${registro.registrado_por || 'N/A'}</strong><br>
                            <small>${registro.cargo_registrador || ''}</small>
                        </div>
                    </div>
                    
                    <div class="method-item">
                        <label>Comunidad</label>
                        <div class="counter-input">
                            <strong>${registro.comunidad || 'N/A'}</strong><br>
                            <small>${registro.codigo_comunidad || ''}</small>
                        </div>
                    </div>
                    
                    <div class="method-item">
                        <label>Cantidad</label>
                        <div class="counter-input">
                            <span class="total-value">${registro.cantidad_administrada || 0}</span><br>
                            <small>usuarias</small>
                        </div>
                    </div>
                    
                    <div class="method-item">
                        <label>Fecha Registro</label>
                        <div class="counter-input">
                            <strong>${this.formatearFecha(registro.fecha_hora_registro)}</strong>
                        </div>
                    </div>
                </div>
                
                <!-- Botones de acción -->
                <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-success" onclick="ValidacionSystem.validarRegistro(${registro.id})" style="flex: 1; min-width: 150px;">
                        ✅ Validar
                    </button>
                    <button class="btn btn-danger" onclick="ValidacionSystem.rechazarRegistro(${registro.id})" style="flex: 1; min-width: 150px;">
                        ❌ Rechazar
                    </button>
                </div>
            </div>
        `).join('');

        containerElement.innerHTML = registrosHtml;

        // Mostrar botón de validar todos si hay registros
        const btnValidarTodos = document.getElementById('btn-validar-todos');
        if (btnValidarTodos) {
            btnValidarTodos.style.display = this.registrosFiltrados.length > 1 ? 'inline-block' : 'none';
        }

        // Recargar filtros si es la primera vez
        if (this.registrosFiltrados.length > 0 && this.registrosFiltrados === this.registrosPendientes) {
            setTimeout(() => this.cargarFiltros(), 100);
        }
    },

    // ===== VALIDAR REGISTRO =====
    async validarRegistro(registroId) {
        this.mostrarModal(
            'Validar Registro',
            '¿Confirmar que este registro es correcto y debe ser validado?',
            () => this.ejecutarValidacion(registroId)
        );
    },

    

    // ===== RECHAZAR REGISTRO =====
    async rechazarRegistro(registroId) {
        this.mostrarModal(
            'Eliminar Registro',
            '⚠️ ATENCIÓN: Este registro será eliminado permanentemente del sistema. ¿Está seguro?',
            () => this.ejecutarRechazo(registroId)
        );
    },

    // ===== EJECUTAR VALIDACIÓN =====
async ejecutarValidacion(registroId) {
    try {
        SGPF.showLoading(true);

        const response = await SGPF.apiCall(`/validacion/registro/${registroId}`, 'PUT', {
            accion: 'aprobar',
            observaciones_validacion: 'Validado en módulo de validación'
        });

        if (response && response.success) {
            SGPF.showToast('Registro validado exitosamente', 'success');
            await this.cargarRegistrosPendientes();
        } else {
            throw new Error(response?.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('❌ Error validando registro:', error);
        SGPF.showToast('Error al validar registro', 'error');
    } finally {
        SGPF.showLoading(false);
    }
},

// ===== EJECUTAR RECHAZO =====
async ejecutarRechazo(registroId) {
    try {
        SGPF.showLoading(true);

        const response = await SGPF.apiCall(`/validacion/registro/${registroId}`, 'DELETE');

        if (response && response.success) {
            SGPF.showToast('Registro eliminado permanentemente', 'success');
            await this.cargarRegistrosPendientes();
        } else {
            throw new Error(response?.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('❌ Error eliminando registro:', error);
        SGPF.showToast('Error al eliminar registro', 'error');
    } finally {
        SGPF.showLoading(false);
    }
},

    // ===== CARGAR FILTROS =====
    async cargarFiltros() {
        try {
            console.log('🔍 Cargando filtros con registros:', this.registrosPendientes.length);
            
            if (!this.registrosPendientes || this.registrosPendientes.length === 0) {
                console.log('⚠️ No hay registros para generar filtros');
                return;
            }

            // Extraer comunidades únicas de los registros
            const comunidades = [...new Set(this.registrosPendientes.map(r => r.comunidad).filter(c => c))];
            const auxiliares = [...new Set(this.registrosPendientes.map(r => r.registrado_por).filter(a => a))];

            console.log('📍 Comunidades encontradas:', comunidades.length, comunidades);
            console.log('👥 Auxiliares encontrados:', auxiliares.length, auxiliares);

            // Llenar selector de comunidades
            const comunidadSelect = document.getElementById('filtro-comunidad');
            if (comunidadSelect && comunidades.length > 0) {
                comunidadSelect.innerHTML = '<option value="">Todas las comunidades</option>' +
                    comunidades.sort().map(c => `<option value="${c}">${c}</option>`).join('');
                console.log('✅ Selector de comunidades actualizado');
            }

            // Llenar selector de auxiliares
            const auxiliarSelect = document.getElementById('filtro-auxiliar');
            if (auxiliarSelect && auxiliares.length > 0) {
                auxiliarSelect.innerHTML = '<option value="">Todos los auxiliares</option>' +
                    auxiliares.sort().map(a => `<option value="${a}">${a}</option>`).join('');
                console.log('✅ Selector de auxiliares actualizado');
            }
        } catch (error) {
            console.error('❌ Error cargando filtros:', error);
        }
    },

    // ===== APLICAR FILTROS =====
    aplicarFiltros() {
        const comunidadFiltro = document.getElementById('filtro-comunidad')?.value || '';
        const auxiliarFiltro = document.getElementById('filtro-auxiliar')?.value || '';
        const busquedaFiltro = document.getElementById('buscar-registro')?.value.toLowerCase() || '';

        this.registrosFiltrados = this.registrosPendientes.filter(registro => {
            const cumpleComunidad = !comunidadFiltro || registro.comunidad === comunidadFiltro;
            const cumpleAuxiliar = !auxiliarFiltro || registro.registrado_por === auxiliarFiltro;
            const cumpleBusqueda = !busquedaFiltro || 
                (registro.metodo && registro.metodo.toLowerCase().includes(busquedaFiltro)) ||
                (registro.comunidad && registro.comunidad.toLowerCase().includes(busquedaFiltro)) ||
                (registro.registrado_por && registro.registrado_por.toLowerCase().includes(busquedaFiltro));

            return cumpleComunidad && cumpleAuxiliar && cumpleBusqueda;
        });

        this.actualizarResumen();
        this.mostrarRegistros();
    },

    // ===== LIMPIAR FILTROS =====
    limpiarFiltros() {
        document.getElementById('filtro-comunidad').value = '';
        document.getElementById('filtro-auxiliar').value = '';
        document.getElementById('buscar-registro').value = '';
        this.aplicarFiltros();
    },

    // ===== VALIDAR TODOS =====
    validarTodos() {
        if (this.registrosFiltrados.length === 0) {
            SGPF.showToast('No hay registros para validar', 'warning');
            return;
        }

        this.mostrarModal(
            'Validar Todos',
            `¿Confirmar validación de ${this.registrosFiltrados.length} registros?`,
            () => this.ejecutarValidacionMasiva()
        );
    },

    // ===== EJECUTAR VALIDACIÓN MASIVA =====
    async ejecutarValidacionMasiva() {
        try {
            SGPF.showLoading(true);

            let exitosos = 0;
            let errores = 0;

            for (const registro of this.registrosFiltrados) {
                try {
                    const response = await SGPF.apiCall(`/validacion/registro/${registro.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            accion: 'aprobar',
                            observaciones_validacion: 'Validación masiva'
                        })
                    });

                    if (response && response.success) {
                        exitosos++;
                    } else {
                        errores++;
                    }
                } catch (error) {
                    errores++;
                    console.error(`Error validando registro ${registro.id}:`, error);
                }
            }

            SGPF.showToast(`Validación completa: ${exitosos} exitosos, ${errores} errores`, 'success');
            await this.cargarRegistrosPendientes();
        } catch (error) {
            console.error('❌ Error en validación masiva:', error);
            SGPF.showToast('Error en validación masiva', 'error');
        } finally {
            SGPF.showLoading(false);
        }
    },

    // ===== MOSTRAR MODAL =====
    mostrarModal(titulo, mensaje, accionConfirmar) {
        const modal = document.getElementById('modal-confirmacion');
        const tituloElement = document.getElementById('modal-titulo');
        const mensajeElement = document.getElementById('modal-mensaje');
        
        if (modal && tituloElement && mensajeElement) {
            tituloElement.textContent = titulo;
            mensajeElement.textContent = mensaje;
            modal.style.display = 'block';
            
            this.accionPendiente = accionConfirmar;
        }
    },

    // ===== EJECUTAR ACCIÓN CONFIRMADA =====
    ejecutarAccionConfirmada() {
        const modal = document.getElementById('modal-confirmacion');
        if (modal) modal.style.display = 'none';
        
        if (this.accionPendiente) {
            this.accionPendiente();
            this.accionPendiente = null;
        }
    },

    // ===== MOSTRAR SIN REGISTROS =====
    mostrarSinRegistros() {
        const containerElement = document.getElementById('registros-container');
        const sinRegistrosElement = document.getElementById('sin-registros-mensaje');
        
        if (containerElement) containerElement.style.display = 'none';
        if (sinRegistrosElement) sinRegistrosElement.style.display = 'block';
        
        this.actualizarResumen();
    },

    // ===== MOSTRAR ERROR =====
    mostrarError(mensaje) {
        const containerElement = document.getElementById('registros-container');
        if (containerElement) {
            containerElement.innerHTML = `
                <div class="error" style="text-align: center; padding: 2rem;">
                    <h3>⚠️ ${mensaje}</h3>
                    <button class="btn btn-primary" onclick="ValidacionSystem.cargarRegistrosPendientes()">
                        Intentar de nuevo
                    </button>
                </div>
            `;
            containerElement.style.display = 'block';
        }
    },

    // ===== FUNCIÓN DE UTILIDAD =====
    formatearFecha(fecha) {
        if (!fecha) return '--';
        return new Date(fecha).toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
};