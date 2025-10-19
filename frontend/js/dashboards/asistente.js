// ===== DASHBOARD ASISTENTE TÉCNICO V2.0 - CORREGIDO =====
window.AsistenteDashboard = window.AsistenteDashboard || {
    
    // ===== INICIALIZAR DASHBOARD =====
    async init() {
        console.log('🏥 Inicializando dashboard asistente técnico V2.0');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const user = SGPF.getCurrentUser();
            console.log('👤 Usuario actual:', user);
            
            if (!user || user.rol !== 'asistente_tecnico') {
                console.error('❌ Usuario no es asistente técnico');
                SGPF.showToast('Acceso no autorizado', 'error');
                return;
            }

            // Cargar datos
            await Promise.all([
                this.cargarDatosUsuario(),
                this.cargarPendientesValidacion()
            ]);

            console.log('✅ Dashboard asistente técnico V2.0 cargado');
            
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            SGPF.showToast('Error cargando dashboard', 'error');
        }
    },

    // ===== CARGAR DATOS DEL USUARIO =====
    async cargarDatosUsuario() {
        const user = SGPF.getCurrentUser();
        
        const nombreElement = document.getElementById('asistente-nombre');
        if (nombreElement) {
            // Solo mostrar nombre completo, sin territorio
            nombreElement.textContent = `${user.nombres} ${user.apellidos}`;
        }
    },

    // ===== CARGAR PENDIENTES DE VALIDACIÓN (COPIADO DE VALIDACION.JS) =====
async cargarPendientesValidacion() {
    try {
        console.log('📋 Cargando visitas pendientes...');
        
        // ✅ USAR EL MISMO ENDPOINT QUE VALIDACION.JS
        const response = await SGPF.apiCall('/visitas?estado=registrado&limit=100');
        
        console.log('📡 Response completo:', response);

        const listaContainer = document.getElementById('lista-pendientes');
        const sinPendientes = document.getElementById('sin-pendientes');
        const totalTexto = document.getElementById('total-pendientes-texto');
        const contadorPendientes = document.getElementById('registros-pendientes');

        // ✅ VERIFICAR ESTRUCTURA IGUAL QUE VALIDACION.JS
        if (!response || !response.success || !response.data || !response.data.visitas || response.data.visitas.length === 0) {
            console.log('❌ No hay visitas pendientes');
            if (listaContainer) listaContainer.classList.add('hidden');
            if (sinPendientes) sinPendientes.classList.remove('hidden');
            if (totalTexto) totalTexto.textContent = 'Sin pendientes';
            if (contadorPendientes) contadorPendientes.textContent = '0';
            return;
        }

        // ✅ MAPEAR IGUAL QUE EN VALIDACION.JS
        const visitasPendientes = response.data.visitas.map(v => ({
            id: v.id,
            metodo: v.metodo,
            metodo_corto: v.nombre_corto,
            comunidad: v.comunidad,
            codigo_comunidad: v.codigo_comunidad,
            territorio: v.territorio,
            registrado_por: v.registrado_por,
            cantidad_administrada: 1,
            fecha_hora_registro: v.fecha_hora_registro,
            usuaria_nombre: v.usuaria_nombre,
            tipo_usuaria: v.tipo_usuaria,
            estado: v.estado
        }));
        
        console.log('📊 Visitas mapeadas:', visitasPendientes.length);
        console.log('🔍 Primera visita:', visitasPendientes[0]);

        const mostrarEnTabla = visitasPendientes.slice(0, 10);

        // Actualizar contador principal
        if (contadorPendientes) {
            contadorPendientes.textContent = visitasPendientes.length;
            
            // Color según urgencia
            contadorPendientes.classList.remove('text-orange-600', 'text-red-600', 'text-green-600');
            if (visitasPendientes.length > 20) {
                contadorPendientes.classList.add('text-red-600');
            } else if (visitasPendientes.length > 10) {
                contadorPendientes.classList.add('text-orange-600');
            } else {
                contadorPendientes.classList.add('text-green-600');
            }
        }

        if (totalTexto) {
            totalTexto.textContent = `${visitasPendientes.length} registro${visitasPendientes.length !== 1 ? 's' : ''}`;
        }

        if (listaContainer) {
            listaContainer.classList.remove('hidden');
            if (sinPendientes) sinPendientes.classList.add('hidden');
            
            // Generar HTML de la tabla
            const tablaHTML = `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b-2 border-gray-200">
                            <tr class="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th class="px-6 py-4">Usuaria</th>
                                <th class="px-6 py-4">Método</th>
                                <th class="px-6 py-4">Comunidad</th>
                                <th class="px-6 py-4">Fecha</th>
                                <th class="px-6 py-4">Registrado por</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${mostrarEnTabla.map(registro => `
                                <tr class="hover:bg-orange-50 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="font-semibold text-gray-900">
                                            ${registro.usuaria_nombre || 'Sin nombre'}
                                        </div>
                                        <div class="text-xs mt-1">
                                            ${this.getBadgeTipo(registro.tipo_usuaria)}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="font-medium text-gray-800">
                                            ${registro.metodo || 'N/D'}
                                        </span>
                                        <div class="text-xs text-gray-500 mt-1">
                                            ${registro.metodo_corto || ''}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            ${registro.comunidad || 'N/D'}
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">
                                            ${registro.codigo_comunidad || ''}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-700">
                                        ${this.formatearFecha(registro.fecha_hora_registro)}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-700">
                                        ${registro.registrado_por || 'N/D'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            listaContainer.innerHTML = tablaHTML;
            console.log('✅ Tabla renderizada exitosamente');
        }

        console.log(`✅ Dashboard actualizado: ${mostrarEnTabla.length} de ${visitasPendientes.length} registros mostrados`);
        
    } catch (error) {
        console.error('❌ Error cargando pendientes:', error);
        const listaContainer = document.getElementById('lista-pendientes');
        if (listaContainer) {
            listaContainer.innerHTML = `
                <div class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-red-600 font-semibold">Error cargando registros pendientes</p>
                    <p class="text-sm text-gray-600 mt-2">${error.message}</p>
                    <button onclick="window.AsistenteDashboard.cargarPendientesValidacion()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }
},

    // ===== FUNCIONES DE UTILIDAD =====
formatearFecha(fecha) {
    if (!fecha) {
        console.warn('⚠️ Fecha vacía recibida');
        return '--';
    }
    
    try {
        console.log('📅 Formateando fecha:', fecha);
        
        // La fecha viene como "2025-10-19 15:36:58"
        const date = new Date(fecha);
        
        if (isNaN(date.getTime())) {
            console.error('❌ Fecha inválida:', fecha);
            return '--';
        }
        
        const resultado = date.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        console.log('✅ Fecha formateada:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('❌ Error formateando fecha:', fecha, error);
        return '--';
    }
},

    getBadgeTipo(tipo) {
        const badges = {
            'nueva': '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Nueva</span>',
            'reconsulta': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Reconsulta</span>',
            'activa': '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Activa</span>'
        };
        return badges[tipo] || '';
    }
};