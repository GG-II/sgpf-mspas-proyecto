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
        
        // MOSTRAR LOADING
        if (loadingElement) loadingElement.classList.remove('hidden');
        if (containerElement) containerElement.classList.add('hidden');
        if (sinRegistrosElement) sinRegistrosElement.classList.add('hidden');

        // ✅ Usar endpoint de visitas con filtro de estado
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
                cantidad_administrada: 1,
                fecha_hora_registro: v.fecha_hora_registro,
                usuaria_nombre: v.usuaria_nombre,
                tipo_usuaria: v.tipo_usuaria,
                estado: v.estado
            }));
            
            this.registrosFiltrados = [...this.registrosPendientes];
            
            console.log(`✅ ${this.registrosPendientes.length} visitas pendientes cargadas`);
            
            // OCULTAR LOADING ANTES DE MOSTRAR
            if (loadingElement) loadingElement.classList.add('hidden');
            
            this.actualizarResumen();
            this.mostrarRegistros();
        } else {
            // OCULTAR LOADING ANTES DE MOSTRAR MENSAJE
            if (loadingElement) loadingElement.classList.add('hidden');
            this.mostrarSinRegistros();
        }
    } catch (error) {
        console.error('❌ Error cargando visitas:', error);
        
        // OCULTAR LOADING EN CASO DE ERROR
        const loadingElement = document.getElementById('validacion-loading');
        if (loadingElement) loadingElement.classList.add('hidden');
        
        this.mostrarError('Error cargando visitas pendientes');
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
},

    // ===== MOSTRAR REGISTROS =====
mostrarRegistros() {
    const containerElement = document.getElementById('registros-container');
    const sinRegistrosElement = document.getElementById('sin-registros-mensaje');
    const loadingElement = document.getElementById('validacion-loading');
    
    if (!containerElement) {
        console.error('❌ Container de registros no encontrado');
        return;
    }

    console.log(`📦 Mostrando ${this.registrosFiltrados.length} registros`);

    // ASEGURAR QUE LOADING ESTÉ OCULTO
    if (loadingElement) loadingElement.classList.add('hidden');

    if (this.registrosFiltrados.length === 0) {
        containerElement.classList.add('hidden');
        if (sinRegistrosElement) {
            sinRegistrosElement.classList.remove('hidden');
        }
        return;
    }

    // CREAR HTML PRIMERO
    const registrosHtml = this.registrosFiltrados.map(registro => {
        const badgeColor = registro.tipo_usuaria === 'nueva' ? 'bg-blue-100 text-blue-800' :
                          registro.tipo_usuaria === 'reconsulta' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800';
        
        return `
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 overflow-hidden" data-registro-id="${registro.id}">
                <!-- Header del Card -->
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
    <h3 class="text-xl font-bold text-gray-900">${registro.metodo || 'Método Desconocido'}</h3>
    <p class="text-sm text-gray-600">${registro.usuaria_nombre || 'Usuaria sin nombre'}</p>
</div>
                        <div class="flex gap-2">
                            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                Pendiente
                            </span>
                            <span class="px-3 py-1 ${badgeColor} rounded-full text-sm font-medium capitalize">
                                ${registro.tipo_usuaria || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Detalles del Registro -->
                <div class="p-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <!-- Auxiliar -->
                        <div class="space-y-1">
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Auxiliar</p>
                            <p class="text-base font-semibold text-gray-900">${registro.registrado_por || 'N/A'}</p>
                            <p class="text-sm text-gray-600">${registro.cargo_registrador || ''}</p>
                        </div>
                        
                        <!-- Comunidad -->
                        <div class="space-y-1">
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Comunidad</p>
                            <p class="text-base font-semibold text-gray-900">${registro.comunidad || 'N/A'}</p>
                            <p class="text-sm text-gray-600">${registro.codigo_comunidad || ''}</p>
                        </div>
                        
                        <!-- Cantidad -->
                        <div class="space-y-1">
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Cantidad</p>
                            <p class="text-3xl font-bold text-indigo-600">${registro.cantidad_administrada || 0}</p>
                            <p class="text-sm text-gray-600">usuaria${registro.cantidad_administrada !== 1 ? 's' : ''}</p>
                        </div>
                        
                        <!-- Fecha -->
                        <div class="space-y-1">
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha Registro</p>
                            <p class="text-base font-semibold text-gray-900">${this.formatearFecha(registro.fecha_hora_registro)}</p>
                        </div>
                    </div>
                    
                    <!-- Botones de Acción -->
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button onclick="ValidacionSystem.validarRegistro(${registro.id})" 
                                class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Validar
                        </button>
                        <button onclick="ValidacionSystem.rechazarRegistro(${registro.id})" 
                                class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Rechazar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // INSERTAR HTML
    containerElement.innerHTML = registrosHtml;
    
    // MOSTRAR CONTAINER DESPUÉS DE INSERTAR
    containerElement.classList.remove('hidden');
    
    // OCULTAR MENSAJE VACÍO
    if (sinRegistrosElement) {
        sinRegistrosElement.classList.add('hidden');
    }
    
    console.log('✅ Container mostrado');
    console.log('Container classes:', containerElement.className);

    // Mostrar botón de validar todos
    const btnValidarTodos = document.getElementById('btn-validar-todos');
    if (btnValidarTodos) {
        if (this.registrosFiltrados.length > 1) {
            btnValidarTodos.classList.remove('hidden');
            btnValidarTodos.classList.add('flex');
        } else {
            btnValidarTodos.classList.add('hidden');
            btnValidarTodos.classList.remove('flex');
        }
    }

    // Cargar filtros
    setTimeout(() => this.cargarFiltros(), 100);
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

    // ===== EJECUTAR VALIDACIÓN CON ANIMACIÓN =====
async ejecutarValidacion(registroId) {
    try {
        // Cerrar modal primero
        const modal = document.getElementById('modal-confirmacion');
        if (modal) modal.classList.add('hidden');
        
        SGPF.showLoading(true);

        const response = await SGPF.apiCall(`/validacion/registro/${registroId}`, 'PUT', {
            accion: 'aprobar',
            observaciones_validacion: 'Validado en módulo de validación'
        });

        if (response && response.success) {
            SGPF.showLoading(false);
            
            // 🎭 ANIMACIÓN DE ÉXITO
            const card = document.querySelector(`[data-registro-id="${registroId}"]`);
            if (card) {
                // Cambiar a verde y animar hacia la derecha
                card.style.transition = 'all 0.6s ease-out';
                card.style.backgroundColor = '#10b981';
                card.style.transform = 'translateX(100%)';
                card.style.opacity = '0';
                
                // Esperar a que termine la animación
                await new Promise(resolve => setTimeout(resolve, 600));
            }
            
            SGPF.showToast('✅ Registro validado exitosamente', 'success');
            
            // Recargar registros
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

// ===== EJECUTAR RECHAZO CON ANIMACIÓN =====
async ejecutarRechazo(registroId) {
    try {
        // Cerrar modal primero
        const modal = document.getElementById('modal-confirmacion');
        if (modal) modal.classList.add('hidden');
        
        SGPF.showLoading(true);

        const response = await SGPF.apiCall(`/validacion/registro/${registroId}`, 'DELETE');

        if (response && response.success) {
            SGPF.showLoading(false);
            
            // 🎭 ANIMACIÓN DE RECHAZO
            const card = document.querySelector(`[data-registro-id="${registroId}"]`);
            if (card) {
                // Cambiar a rojo y animar hacia la izquierda
                card.style.transition = 'all 0.6s ease-out';
                card.style.backgroundColor = '#ef4444';
                card.style.transform = 'translateX(-100%)';
                card.style.opacity = '0';
                
                // Esperar a que termine la animación
                await new Promise(resolve => setTimeout(resolve, 600));
            }
            
            SGPF.showToast('🗑️ Registro eliminado permanentemente', 'success');
            
            // Recargar registros
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
        modal.classList.remove('hidden');
        
        this.accionPendiente = accionConfirmar;
    }
},

    // ===== EJECUTAR ACCIÓN CONFIRMADA =====
ejecutarAccionConfirmada() {
    // NO cerrar el modal aquí, cada función lo cierra
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