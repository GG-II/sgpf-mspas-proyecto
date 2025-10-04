// ===== SCRIPT PERFIL DE USUARIO - SGPF =====
window.PerfilUsuario = window.PerfilUsuario || {
    // Estado del perfil
    perfilData: null,
    
// ===== INICIALIZACIÓN (VERSIÓN CORREGIDA) =====
async init() {
    console.log('👤 Inicializando perfil de usuario');
    
    // Esperar múltiples ciclos de renderizado del DOM
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Verificar que los elementos críticos existan antes de continuar
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
        const codigoElement = document.getElementById('perfil-codigo');
        if (codigoElement) {
            console.log('✅ DOM listo, continuando...');
            break;
        }
        
        console.log(`⏳ Esperando DOM... intento ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        retries++;
    }
    
    if (retries >= maxRetries) {
        console.error('❌ Timeout esperando que el DOM esté listo');
        this.mostrarError('Error: No se pudo cargar la interfaz del perfil');
        return;
    }
    
    try {
        await this.cargarPerfilUsuario();
        await this.cargarEstadisticasPersonales();
        await this.configurarEventListeners();
        
        console.log('✅ Perfil de usuario cargado exitosamente');
    } catch (error) {
        console.error('❌ Error inicializando perfil:', error);
        this.mostrarError('Error cargando el perfil de usuario');
    }
},

// ===== VERIFICAR ELEMENTOS DOM =====
verificarElementosDOM() {
    const elementos = [
        'perfil-codigo', 'perfil-dpi', 'perfil-email', 'perfil-cargo', 
        'perfil-rol', 'perfil-territorio', 'fecha-ingreso', 'ultimo-acceso',
        'lista-permisos', 'edit-nombres', 'edit-apellidos', 'edit-telefono'
    ];
    
    console.log('🔍 Verificando elementos DOM:');
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        console.log(`  ${id}: ${elemento ? '✅' : '❌'}`);
    });
},

    // ===== CARGAR PERFIL DEL USUARIO (VERSIÓN CORREGIDA) =====
async cargarPerfilUsuario() {
    try {
        console.log('📋 Cargando datos del perfil...');
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        console.log('🔑 Token encontrado, haciendo petición...');
        
        const response = await fetch('http://gerbert.hopitalbarillas.cloud/api/perfil/', {  // ✅ URL completa
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Respuesta recibida:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('📋 Datos del perfil:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Error obteniendo perfil');
        }

        this.perfilData = result.data;
        this.mostrarDatosPerfil(result.data);
        
        console.log('✅ Datos del perfil cargados exitosamente');
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        this.mostrarError('Error cargando los datos del perfil: ' + error.message);
    }
},

    // ===== MOSTRAR DATOS DEL PERFIL (VERSIÓN CORREGIDA) =====
mostrarDatosPerfil(data) {
    console.log('📋 Mostrando datos del perfil:', data);
    
    // Función auxiliar para establecer contenido de forma segura
    const setElementContent = (id, content) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content || '-';
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${id}`);
        }
    };
    
    const setElementDisplay = (id, display) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = display;
        }
    };
    
    // Información básica
    setElementContent('perfil-codigo', data.codigo_empleado);
    setElementContent('perfil-dpi', data.dpi);
    setElementContent('perfil-email', data.email);
    setElementContent('perfil-cargo', data.cargo);
    setElementContent('perfil-rol', data.rol_nombre);

    // Territorio (solo si aplica)
    if (data.territorio_nombre) {
        setElementContent('perfil-territorio', `${data.territorio_nombre} (${data.territorio_codigo})`);
        setElementDisplay('perfil-territorio-container', 'block');
    }

    // Fechas
    setElementContent('fecha-ingreso', this.formatearFecha(data.fecha_ingreso));
    setElementContent('ultimo-acceso', this.formatearFechaHora(data.ultimo_acceso));

    // Permisos
    this.mostrarPermisos(data.permisos);

    // Comunidades asignadas (solo para auxiliares)
    if (data.comunidades_asignadas && data.comunidades_asignadas.length > 0) {
        this.mostrarComunidadesAsignadas(data.comunidades_asignadas);
    }

    // Prellenar formulario de edición
    const editNombres = document.getElementById('edit-nombres');
    const editApellidos = document.getElementById('edit-apellidos');
    const editTelefono = document.getElementById('edit-telefono');
    
    if (editNombres) editNombres.value = data.nombres || '';
    if (editApellidos) editApellidos.value = data.apellidos || '';
    if (editTelefono) editTelefono.value = data.telefono || '';
},

    // ===== MOSTRAR PERMISOS (VERSIÓN CORREGIDA) =====
mostrarPermisos(permisos) {
    const listaPermisos = document.getElementById('lista-permisos');
    if (!listaPermisos) {
        console.warn('⚠️ Elemento lista-permisos no encontrado');
        return;
    }
    
    const permisosTexto = [];
    if (permisos.registrar) permisosTexto.push('Registrar datos');
    if (permisos.validar) permisosTexto.push('Validar registros');
    if (permisos.aprobar) permisosTexto.push('Aprobar registros');
    if (permisos.reportes) permisosTexto.push('Generar reportes');
    if (permisos.admin) permisosTexto.push('Administrar sistema');

    listaPermisos.innerHTML = permisosTexto.length > 0 
        ? permisosTexto.join(', ') 
        : 'Permisos básicos';
},

    // ===== MOSTRAR COMUNIDADES ASIGNADAS =====
    mostrarComunidadesAsignadas(comunidades) {
        const container = document.getElementById('comunidades-container');
        const listaComunidades = document.getElementById('lista-comunidades');
        
        container.style.display = 'block';
        
        const html = comunidades.map(com => `
            <div class="comunidad-item">
                <strong>${com.nombre}</strong>
                <span class="comunidad-codigo">(${com.codigo_comunidad})</span>
                <small>Población MEF: ${com.poblacion_mef || 'N/D'}</small>
            </div>
        `).join('');
        
        listaComunidades.innerHTML = html;
    },

    // ===== CARGAR ESTADÍSTICAS PERSONALES (VERSIÓN CORREGIDA) =====
async cargarEstadisticasPersonales() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('⚠️ No hay token, omitiendo estadísticas');
            return;
        }

        const response = await fetch('http://gerbert.hopitalbarillas.cloud/api/perfil/estadisticas', {  // URL completa
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                this.mostrarEstadisticas(result.data);
            }
        } else {
            console.log('⚠️ No se pudieron cargar estadísticas:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas personales:', error);
        // No mostrar error porque las estadísticas son opcionales
    }
},

    // ===== MOSTRAR ESTADÍSTICAS (VERSIÓN CORREGIDA) =====
mostrarEstadisticas(data) {
    const stats = data.resumen;
    
    const setStatContent = (id, content) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content || 0;
        }
    };
    
    setStatContent('stat-registros', stats.total_registros);
    setStatContent('stat-usuarias', stats.total_usuarias);
    setStatContent('stat-comunidades', stats.comunidades_registradas);
    setStatContent('stat-meses', stats.meses_activos);
    setStatContent('primer-registro', this.formatearFechaHora(stats.primer_registro) || 'Sin registros');
    setStatContent('ultimo-registro', this.formatearFechaHora(stats.ultimo_registro) || 'Sin registros');
},

    // ===== CONFIGURAR EVENT LISTENERS =====
    configurarEventListeners() {
        // Formulario actualizar perfil
        const formActualizar = document.getElementById('form-actualizar-perfil');
        if (formActualizar) {
            formActualizar.addEventListener('submit', (e) => this.actualizarPerfil(e));
        }

        // Formulario cambiar contraseña
        const formPassword = document.getElementById('form-cambiar-password');
        if (formPassword) {
            formPassword.addEventListener('submit', (e) => this.cambiarPassword(e));
        }

        // Validación en tiempo real de contraseñas
        const passwordNueva = document.getElementById('password-nueva');
        const confirmarPassword = document.getElementById('confirmar-password');
        
        if (passwordNueva && confirmarPassword) {
            confirmarPassword.addEventListener('input', () => {
                this.validarPasswordMatch();
            });
        }
    },

    // ===== ACTUALIZAR PERFIL (VERSION DEBUG) =====
async actualizarPerfil(event) {
    event.preventDefault();
    
    const btnActualizar = document.getElementById('btn-actualizar-perfil');
    const loadingActualizar = document.getElementById('loading-actualizar');
    
    try {
        btnActualizar.disabled = true;
        loadingActualizar.style.display = 'inline-block';
        
        const formData = new FormData(event.target);
        const datos = {
            nombres: formData.get('nombres').trim(),
            apellidos: formData.get('apellidos').trim(),
            telefono: formData.get('telefono').trim()
        };

        console.log('📝 Datos a enviar:', datos);

        if (!datos.nombres || !datos.apellidos) {
            throw new Error('Nombres y apellidos son requeridos');
        }

        const response = await fetch('http://gerbert.hopitalbarillas.cloud/api/perfil/', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);

        const result = await response.json();
        console.log('📋 Response data:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Error actualizando perfil');
        }

        // Actualizar datos locales
        if (this.perfilData) {
            this.perfilData.nombres = datos.nombres;
            this.perfilData.apellidos = datos.apellidos;
            this.perfilData.telefono = datos.telefono;
        }

        this.mostrarToast('Perfil actualizado exitosamente', 'success');
        console.log('✅ Perfil actualizado');

    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        this.mostrarToast(error.message || 'Error actualizando perfil', 'error');
    } finally {
        btnActualizar.disabled = false;
        loadingActualizar.style.display = 'none';
    }
},

    // ===== CAMBIAR CONTRASEÑA =====
    async cambiarPassword(event) {
        event.preventDefault();
        
        const btnPassword = document.getElementById('btn-cambiar-password');
        const loadingPassword = document.getElementById('loading-password');
        
        try {
            // Mostrar loading
            btnPassword.disabled = true;
            loadingPassword.style.display = 'inline-block';
            
            const formData = new FormData(event.target);
            const datos = {
                password_actual: formData.get('password_actual'),
                password_nueva: formData.get('password_nueva'),
                confirmar_password: formData.get('confirmar_password')
            };

            // Validaciones
            if (!datos.password_actual || !datos.password_nueva || !datos.confirmar_password) {
                throw new Error('Todos los campos son requeridos');
            }

            if (datos.password_nueva !== datos.confirmar_password) {
                throw new Error('Las contraseñas no coinciden');
            }

            if (datos.password_nueva.length < 6) {
                throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
            }

            const response = await fetch('http://gerbert.hopitalbarillas.cloud/api/perfil/password', {  // ✅ URL completa
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error cambiando contraseña');
            }

            // Limpiar formulario
            event.target.reset();
            
            this.mostrarToast('Contraseña cambiada exitosamente', 'success');
            console.log('🔐 Contraseña cambiada');

        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            this.mostrarToast(error.message || 'Error cambiando contraseña', 'error');
        } finally {
            btnPassword.disabled = false;
            loadingPassword.style.display = 'none';
        }
    },

    // ===== VALIDAR COINCIDENCIA DE CONTRASEÑAS =====
    validarPasswordMatch() {
        const passwordNueva = document.getElementById('password-nueva');
        const confirmarPassword = document.getElementById('confirmar-password');
        
        if (passwordNueva.value && confirmarPassword.value) {
            if (passwordNueva.value !== confirmarPassword.value) {
                confirmarPassword.setCustomValidity('Las contraseñas no coinciden');
            } else {
                confirmarPassword.setCustomValidity('');
            }
        }
    },

    // ===== UTILIDADES DE FORMATO =====
    formatearFecha(fechaString) {
        if (!fechaString) return null;
        
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleDateString('es-GT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return fechaString;
        }
    },

    formatearFechaHora(fechaString) {
        if (!fechaString) return null;
        
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleString('es-GT', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return fechaString;
        }
    },

    // ===== MOSTRAR TOAST =====
    mostrarToast(mensaje, tipo = 'info') {
        // Usar el sistema de toast existente si está disponible
        if (window.SGPF && window.SGPF.showToast) {
            window.SGPF.showToast(mensaje, tipo);
        } else {
            // Fallback simple
            alert(mensaje);
        }
    },

    // ===== MOSTRAR ERROR =====
    mostrarError(mensaje) {
        console.error('❌ Error en perfil:', mensaje);
        this.mostrarToast(mensaje, 'error');
    }
};

// ===== AUTO-INICIALIZACIÓN =====
// El component-loader llamará a init() cuando cargue la vista
console.log('📋 Script de perfil de usuario cargado');