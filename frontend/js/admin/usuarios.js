// ===== GESTIÓN DE USUARIOS - SGPF ADMIN (VERSIÓN CORREGIDA) =====
window.UsuariosAdmin = window.UsuariosAdmin || {
  // Estado local
  usuarios: [],
  usuariosFiltrados: [],
  roles: [],
  territorios: [],
  comunidades: [],
  modoEdicion: false,
  usuarioEditando: null,
  guardando: false,

  // ===== INICIALIZAR =====
  async init() {
    console.log("👥 Inicializando módulo de gestión de usuarios");

    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const user = SGPF.getCurrentUser();
      const rolNormalizado = SGPF.getNormalizedRole();

      if (
        !user ||
        (rolNormalizado !== "coordinador" && rolNormalizado !== "encargado")
      ) {
        console.error("❌ Sin permisos para gestión de usuarios");
        SGPF.showToast("No tienes permisos para esta sección", "error");
        return;
      }

      await Promise.all([
        this.cargarRoles(),
        this.cargarTerritorios(),
        this.cargarComunidades(),
        this.cargarUsuarios(),
      ]);

      this.configurarEventListeners();
      console.log("✅ Módulo de usuarios inicializado");
    } catch (error) {
      console.error("❌ Error inicializando gestión de usuarios:", error);
      SGPF.showToast("Error cargando módulo de usuarios", "error");
    }
  },

  // ===== CARGAR COMUNIDADES =====
  async cargarComunidades() {
    try {
      const response = await SGPF.apiCall("/admin/comunidades");

      if (response && response.success) {
        this.comunidades = response.data || [];
        console.log("✅ Comunidades cargadas:", this.comunidades.length);
      }
    } catch (error) {
      console.error("❌ Error cargando comunidades:", error);
      this.comunidades = [];
    }
  },

  // ===== CARGAR ROLES =====
  async cargarRoles() {
    try {
      const response = await SGPF.apiCall("/admin/roles");

      if (response && response.success) {
        this.roles = response.data || [];
        console.log("✅ Roles cargados:", this.roles.length);
      }
    } catch (error) {
      console.error("❌ Error cargando roles:", error);
      this.roles = [];
    }
  },

  // ===== CARGAR TERRITORIOS =====
  async cargarTerritorios() {
    try {
      const response = await SGPF.apiCall("/admin/territorios");

      if (response && response.success) {
        this.territorios = response.data || [];
        console.log("✅ Territorios cargados:", this.territorios.length);
      }
    } catch (error) {
      console.error("❌ Error cargando territorios:", error);
      this.territorios = [];
    }
  },

  // ===== CARGAR USUARIOS =====
  async cargarUsuarios() {
    try {
      const loadingElement = document.getElementById("usuarios-loading");
      if (loadingElement) loadingElement.style.display = "block";

      const response = await SGPF.apiCall("/admin/usuarios");

      if (response && response.success) {
        const currentUser = SGPF.getCurrentUser();
        const rolNormalizado = SGPF.getNormalizedRole();

        // Filtrar usuarios según permisos
        this.usuarios = (response.data || []).filter((usuario) => {
          // No mostrar el propio usuario
          if (usuario.id === currentUser.id) return false;

          // Si es encargado, no mostrar coordinadores
          if (
            rolNormalizado === "encargado" &&
            usuario.codigo_rol === "coordinador_municipal"
          ) {
            return false;
          }

          return true;
        });

        this.usuariosFiltrados = [...this.usuarios];

        this.actualizarResumen();
        this.mostrarUsuarios();
      } else {
        throw new Error("Error en respuesta del servidor");
      }
    } catch (error) {
      console.error("❌ Error cargando usuarios:", error);
      SGPF.showToast("Error cargando usuarios", "error");
      this.mostrarEstadoVacio();
    } finally {
      const loadingElement = document.getElementById("usuarios-loading");
      if (loadingElement) loadingElement.style.display = "none";
    }
  },

  // ===== ACTUALIZAR RESUMEN =====
  actualizarResumen() {
    const totalElement = document.getElementById("total-usuarios");
    const activosElement = document.getElementById("total-activos");
    const auxiliaresElement = document.getElementById("total-auxiliares");
    const asistentesElement = document.getElementById("total-asistentes");

    if (totalElement) totalElement.textContent = this.usuarios.length;

    if (activosElement) {
      const activos = this.usuarios.filter(
        (u) => u.activo === 1 || u.activo === true
      ).length;
      activosElement.textContent = activos;
    }

    if (auxiliaresElement) {
      const auxiliares = this.usuarios.filter(
        (u) => u.codigo_rol === "auxiliar_enfermeria"
      ).length;
      auxiliaresElement.textContent = auxiliares;
    }

    if (asistentesElement) {
      const asistentes = this.usuarios.filter(
        (u) => u.codigo_rol === "asistente_tecnico"
      ).length;
      asistentesElement.textContent = asistentes;
    }
  },

  // ===== GENERAR CÓDIGO DE EMPLEADO AUTOMÁTICO =====
  async generarCodigoEmpleado(rolCodigo) {
    try {
      // Mapeo de prefijos por rol
      const prefijos = {
        coordinador_municipal: "COORD",
        encargado_sr: "ENC",
        asistente_tecnico: "ASIST",
        auxiliar_enfermeria: "AUX",
      };

      const prefijo = prefijos[rolCodigo] || "USR";

      // Contar usuarios existentes con este rol
      const usuariosDelRol = this.usuarios.filter(
        (u) => u.codigo_rol === rolCodigo
      );
      const numero = (usuariosDelRol.length + 1).toString().padStart(3, "0");

      return `${prefijo}${numero}`;
    } catch (error) {
      console.error("Error generando código:", error);
      return "USR001";
    }
  },

  // ===== MOSTRAR USUARIOS =====
  mostrarUsuarios() {
    const tablaBody = document.getElementById("usuarios-tabla-body");
    const tablaWrapper = document.getElementById("usuarios-tabla-wrapper");
    const emptyElement = document.getElementById("usuarios-empty");

    if (!tablaBody) return;

    if (this.usuariosFiltrados.length === 0) {
      if (tablaWrapper) tablaWrapper.style.display = "none";
      if (emptyElement) emptyElement.style.display = "block";
      return;
    }

    if (tablaWrapper) tablaWrapper.style.display = "block";
    if (emptyElement) emptyElement.style.display = "none";

    tablaBody.innerHTML = this.usuariosFiltrados
      .map((usuario) => {
        const iniciales = this.obtenerIniciales(
          usuario.nombres,
          usuario.apellidos
        );
        const rolNormalizado = this.normalizarRol(usuario.codigo_rol);
        const estadoBadge = usuario.activo
          ? '<span class="badge-estado activo">✓ Activo</span>'
          : '<span class="badge-estado inactivo">✗ Inactivo</span>';

        const rolDisplay = usuario.rol_nombre || "Sin rol";

        return `
            <tr>
                <td>
                    <div class="usuario-info">
                        <div class="usuario-avatar">${iniciales}</div>
                        <div>
                            <div class="usuario-nombre">${usuario.nombres} ${
          usuario.apellidos
        }</div>
                            <div class="usuario-email">${
                              usuario.email || "Sin email"
                            }</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge-rol ${rolNormalizado}">${rolDisplay}</span></td>
                <td>${
                  usuario.territorio_nombre || usuario.distrito_nombre || "-"
                }</td>
                <td>${estadoBadge}</td>
                <!-- COLUMNA "ÚLTIMO ACCESO" ELIMINADA -->
                <td>
                    <div class="acciones-usuario">
                        <button class="btn-accion btn-editar" 
                            onclick="UsuariosAdmin.editarUsuario(${usuario.id})"
                            title="Editar">✏️</button>
                        <button class="btn-accion btn-password" 
                            onclick="UsuariosAdmin.abrirModalResetPassword(${
                              usuario.id
                            }, '${usuario.nombres} ${usuario.apellidos}')"
                            title="Restablecer contraseña">🔐</button>
                        <button class="btn-accion btn-toggle-estado" 
                            onclick="UsuariosAdmin.toggleEstadoUsuario(${
                              usuario.id
                            }, ${!usuario.activo})"
                            title="${
                              usuario.activo ? "Desactivar" : "Activar"
                            }">${usuario.activo ? "🔴" : "🟢"}</button>
                    </div>
                </td>
            </tr>
        `;
      })
      .join("");
  },

  // ===== CONFIGURAR EVENT LISTENERS =====
  configurarEventListeners() {
    const btnCrear = document.getElementById("btn-crear-usuario");
    if (btnCrear)
      btnCrear.addEventListener("click", () => this.abrirModalCrear());

    const inputBuscar = document.getElementById("buscar-usuario");
    if (inputBuscar)
      inputBuscar.addEventListener("input", () => this.filtrarUsuarios());

    const filtroRol = document.getElementById("filtro-rol");
    if (filtroRol)
      filtroRol.addEventListener("change", () => this.filtrarUsuarios());

    const filtroEstado = document.getElementById("filtro-estado");
    if (filtroEstado)
      filtroEstado.addEventListener("change", () => this.filtrarUsuarios());

    const btnGuardar = document.getElementById("btn-guardar-usuario");
    if (btnGuardar)
      btnGuardar.addEventListener("click", () => this.guardarUsuario());

    const btnResetConfirm = document.getElementById("btn-confirmar-reset");
    if (btnResetConfirm)
      btnResetConfirm.addEventListener("click", () =>
        this.confirmarResetPassword()
      );

    const selectRol = document.getElementById("usuario-rol");
    if (selectRol) {
      selectRol.addEventListener("change", async (e) => {
        await this.toggleCamposEspecificos(e.target.value);
      });
    }

    // NUEVO: Listener para autocompletar email
    const emailPrefix = document.getElementById("usuario-email-prefix");
    if (emailPrefix) {
      emailPrefix.addEventListener("input", (e) => {
        const hiddenEmail = document.getElementById("usuario-email");
        if (hiddenEmail) {
          hiddenEmail.value = e.target.value + "@mspas.gob.gt";
        }
      });
    }
  },

  // ===== FILTRAR USUARIOS =====
  filtrarUsuarios() {
    const busqueda =
      document.getElementById("buscar-usuario")?.value.toLowerCase() || "";
    const rolFiltro = document.getElementById("filtro-rol")?.value || "";
    const estadoFiltro = document.getElementById("filtro-estado")?.value || "";

    this.usuariosFiltrados = this.usuarios.filter((usuario) => {
      const matchBusqueda =
        !busqueda ||
        usuario.nombres?.toLowerCase().includes(busqueda) ||
        usuario.apellidos?.toLowerCase().includes(busqueda) ||
        usuario.email?.toLowerCase().includes(busqueda) ||
        usuario.dpi?.includes(busqueda);

      const matchRol = !rolFiltro || usuario.codigo_rol === rolFiltro;
      const matchEstado =
        !estadoFiltro ||
        (estadoFiltro === "1" && usuario.activo) ||
        (estadoFiltro === "0" && !usuario.activo);

      return matchBusqueda && matchRol && matchEstado;
    });

    this.mostrarUsuarios();
  },

  // ===== ABRIR MODAL CREAR =====
  abrirModalCrear() {
    this.modoEdicion = false;
    this.usuarioEditando = null;

    const titulo = document.getElementById("modal-titulo");
    if (titulo) titulo.textContent = "Crear Nuevo Usuario";

    this.limpiarFormulario();
    this.cargarRolesEnSelect();

    const passwordGroup = document.getElementById("usuario-password-group");
    const passwordConfirmGroup = document.getElementById(
      "usuario-password-confirm-group"
    );
    if (passwordGroup) passwordGroup.style.display = "block";
    if (passwordConfirmGroup) passwordConfirmGroup.style.display = "block";

    const passwordInput = document.getElementById("usuario-password");
    const passwordConfirmInput = document.getElementById(
      "usuario-password-confirm"
    );
    if (passwordInput) passwordInput.required = true;
    if (passwordConfirmInput) passwordConfirmInput.required = true;

    const modal = document.getElementById("modal-usuario");
    if (modal) modal.classList.add("active");
  },

  // ===== EDITAR USUARIO =====
  async editarUsuario(usuarioId) {
    this.modoEdicion = true;
    this.usuarioEditando = usuarioId;

    const titulo = document.getElementById("modal-titulo");
    if (titulo) titulo.textContent = "Editar Usuario";

    const usuario = this.usuarios.find((u) => u.id === usuarioId);
    if (!usuario) {
      SGPF.showToast("Usuario no encontrado", "error");
      return;
    }

    document.getElementById("usuario-id").value = usuario.id;
    document.getElementById("usuario-nombres").value = usuario.nombres || "";
    document.getElementById("usuario-apellidos").value =
      usuario.apellidos || "";

    // Separar email
    const emailPrefix = usuario.email
      ? usuario.email.replace("@mspas.gob.gt", "")
      : "";
    document.getElementById("usuario-email-prefix").value = emailPrefix;
    document.getElementById("usuario-email").value = usuario.email || "";

    document.getElementById("usuario-dpi").value = usuario.dpi || "";
    document.getElementById("usuario-telefono").value = usuario.telefono || "";
    document.getElementById("usuario-codigo").value =
      usuario.codigo_empleado || "";
    document.getElementById("usuario-cargo").value = usuario.cargo || "";

    this.cargarRolesEnSelect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    document.getElementById("usuario-rol").value = usuario.codigo_rol || "";

    if (usuario.codigo_rol === "asistente_tecnico") {
      await this.toggleCamposEspecificos("asistente_tecnico");
      this.cargarTerritoriosEnSelect();
      await new Promise((resolve) => setTimeout(resolve, 100));
      document.getElementById("usuario-territorio").value =
        usuario.territorio_id || "";
    } else if (usuario.codigo_rol === "auxiliar_enfermeria") {
      await this.toggleCamposEspecificos("auxiliar_enfermeria");
      await this.cargarComunidadesAsignadasUsuario(usuarioId);
    }

    const passwordGroup = document.getElementById("usuario-password-group");
    const passwordConfirmGroup = document.getElementById(
      "usuario-password-confirm-group"
    );
    if (passwordGroup) passwordGroup.style.display = "none";
    if (passwordConfirmGroup) passwordConfirmGroup.style.display = "none";

    const passwordInput = document.getElementById("usuario-password");
    const passwordConfirmInput = document.getElementById(
      "usuario-password-confirm"
    );
    if (passwordInput) passwordInput.required = false;
    if (passwordConfirmInput) passwordConfirmInput.required = false;

    const modal = document.getElementById("modal-usuario");
    if (modal) modal.classList.add("active");
  },

  // ===== GUARDAR USUARIO =====
  async guardarUsuario() {
    if (this.guardando) {
        console.log('⏳ Ya se está guardando...');
        return;
    }

    try {
        const nombres = document.getElementById('usuario-nombres').value.trim();
        const apellidos = document.getElementById('usuario-apellidos').value.trim();
        const emailPrefix = document.getElementById('usuario-email-prefix').value.trim();
        const email = emailPrefix + '@mspas.gob.gt';
        const rol = document.getElementById('usuario-rol').value;

        if (!emailPrefix || !nombres || !apellidos || !rol) {
            SGPF.showToast('Complete los campos requeridos', 'warning');
            return;
        }

        if (!this.modoEdicion) {
            const password = document.getElementById('usuario-password').value;
            const passwordConfirm = document.getElementById('usuario-password-confirm').value;

            if (!password || password.length < 6) {
                SGPF.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }

            if (password !== passwordConfirm) {
                SGPF.showToast('Las contraseñas no coinciden', 'warning');
                return;
            }
        }

        this.guardando = true;
        const btnGuardar = document.getElementById('btn-guardar-usuario');
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
        }

        SGPF.showLoading(true);

        const data = {
            nombres, 
            apellidos, 
            email,
            dpi: document.getElementById('usuario-dpi').value.trim() || null,
            telefono: document.getElementById('usuario-telefono').value.trim() || null,
            codigo_empleado: document.getElementById('usuario-codigo').value.trim() || null,
            cargo: document.getElementById('usuario-cargo').value.trim() || null,
            rol_codigo: rol
        };

        if (this.modoEdicion) {
            const usuarioActual = this.usuarios.find(u => u.id === parseInt(document.getElementById('usuario-id').value));
            if (usuarioActual) {
                data.activo = usuarioActual.activo;
                data.bloqueado = usuarioActual.bloqueado || false;
            }
        }

        if (rol === 'asistente_tecnico') {
            const territorioId = document.getElementById('usuario-territorio').value;
            if (!territorioId) {
                SGPF.showLoading(false);
                this.guardando = false;
                if (btnGuardar) {
                    btnGuardar.disabled = false;
                    btnGuardar.textContent = 'Guardar Usuario';
                }
                SGPF.showToast('Debe seleccionar un territorio para asistentes', 'warning');
                return;
            }
            data.territorio_id = parseInt(territorioId);
        }

        if (!this.modoEdicion) {
            data.password = document.getElementById('usuario-password').value;
        }

        let response;
        if (this.modoEdicion) {
            const usuarioId = document.getElementById('usuario-id').value;
            response = await SGPF.apiCall(`/admin/usuarios/${usuarioId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await SGPF.apiCall('/admin/usuarios', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response && response.success) {
            let mensajeFinal = this.modoEdicion ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente';
            
            // Asignar comunidades para auxiliares (SOLO si hay comunidades seleccionadas)
            if (rol === 'auxiliar_enfermeria') {
                const comunidadesSeleccionadas = this.obtenerComunidadesSeleccionadas();
                
                if (comunidadesSeleccionadas.length > 0) {
                    const usuarioId = this.modoEdicion ? 
                        document.getElementById('usuario-id').value : 
                        response.data.id;
                    
                    try {
                        const respuestaComunidades = await this.asignarComunidadesAUsuario(usuarioId, comunidadesSeleccionadas);
                        
                        if (respuestaComunidades) {
                            // No mostrar mensaje adicional, solo modificar el mensaje principal
                            mensajeFinal += ` y ${comunidadesSeleccionadas.length} comunidad(es) asignada(s)`;
                        }
                    } catch (errorComunidades) {
                        console.error('❌ Error asignando comunidades:', errorComunidades);
                        // No mostrar toast de error, solo modificar el mensaje
                        mensajeFinal += ', pero con errores al asignar comunidades';
                    }
                }
            }

            // Mostrar UN SOLO mensaje
            SGPF.showToast(mensajeFinal, 'success');
            this.cerrarModal();
            await this.cargarUsuarios();
        } else {
            throw new Error(response?.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error guardando usuario:', error);
        SGPF.showToast(error.message || 'Error al guardar usuario', 'error');
    } finally {
        SGPF.showLoading(false);
        this.guardando = false;
        const btnGuardar = document.getElementById('btn-guardar-usuario');
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Usuario';
        }
    }
},

// Modificar asignarComunidadesAUsuario para que NO muestre toasts
async asignarComunidadesAUsuario(usuarioId, comunidadesIds) {
    console.log(`📍 Asignando ${comunidadesIds.length} comunidades al usuario ${usuarioId}:`, comunidadesIds);
    
    const response = await SGPF.apiCall(`/admin/usuarios/${usuarioId}/comunidades`, {
        method: 'POST',
        body: JSON.stringify({ comunidades_ids: comunidadesIds })
    });

    if (response && response.success) {
        console.log('✅ Comunidades asignadas:', response.data);
        return true;
    } else {
        console.error('❌ Error en respuesta:', response);
        throw new Error(response?.message || 'Error asignando comunidades');
    }
},

  // ===== ASIGNAR COMUNIDADES A USUARIO =====
  async asignarComunidadesAUsuario(usuarioId, comunidadesIds) {
    try {
        console.log(`Asignando ${comunidadesIds.length} comunidades al usuario ${usuarioId}`);
        
        const response = await SGPF.apiCall(`/admin/usuarios/${usuarioId}/comunidades`, {
            method: 'POST',
            body: JSON.stringify({ comunidades_ids: comunidadesIds })
        });

        if (response && response.success) {
            console.log('Comunidades asignadas correctamente');
            return true;
        } else {
            throw new Error(response?.message || 'Error asignando comunidades');
        }
    } catch (error) {
        console.error('Error asignando comunidades:', error);
        throw error;
    }
},

  // ===== CARGAR COMUNIDADES ASIGNADAS A USUARIO =====
  async cargarComunidadesAsignadasUsuario(usuarioId) {
    try {
      const response = await SGPF.apiCall(
        `/admin/usuarios/${usuarioId}/comunidades`
      );

      if (response && response.success) {
        const comunidadesAsignadas = response.data.comunidades_asignadas || [];
        const idsAsignados = comunidadesAsignadas.map((c) => c.id);

        // Cargar lista de comunidades con checkboxes marcados
        this.cargarComunidadesEnLista(idsAsignados);
      }
    } catch (error) {
      console.error("❌ Error cargando comunidades asignadas:", error);
      this.cargarComunidadesEnLista([]);
    }
  },

  // ===== OBTENER COMUNIDADES SELECCIONADAS =====
  obtenerComunidadesSeleccionadas() {
    const checkboxes = document.querySelectorAll(
      '#usuario-comunidades-list input[type="checkbox"]:checked'
    );
    return Array.from(checkboxes).map((cb) => parseInt(cb.value));
  },

  // ===== TOGGLE CAMPOS ESPECÍFICOS =====
  async toggleCamposEspecificos(rol) {
    const territorioGroup = document.getElementById("usuario-territorio-group");
    const comunidadesGroup = document.getElementById(
      "usuario-comunidades-group"
    );
    const codigoInput = document.getElementById("usuario-codigo");

    // Ocultar todos primero
    if (territorioGroup) territorioGroup.style.display = "none";
    if (comunidadesGroup) comunidadesGroup.style.display = "none";

    // Generar código automático si NO estamos en modo edición
    if (!this.modoEdicion && rol && codigoInput) {
      const codigo = await this.generarCodigoEmpleado(rol);
      codigoInput.value = codigo;
    }

    if (rol === "asistente_tecnico") {
      if (territorioGroup) {
        territorioGroup.style.display = "block";
        this.cargarTerritoriosEnSelect();
      }
    } else if (rol === "auxiliar_enfermeria") {
      if (comunidadesGroup) {
        comunidadesGroup.style.display = "block";
        this.cargarComunidadesEnLista([]);
      }
    }
  },

  // ===== TOGGLE ESTADO USUARIO =====
  async toggleEstadoUsuario(usuarioId, nuevoEstado) {
    const usuario = this.usuarios.find((u) => u.id === usuarioId);
    const accion = nuevoEstado ? "activar" : "desactivar";

    const confirmacion = confirm(
      `¿Está seguro de ${accion} al usuario ${usuario?.nombres} ${usuario?.apellidos}?`
    );

    if (!confirmacion) return;

    try {
      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/admin/usuarios/${usuarioId}/estado`,
        {
          method: "PUT",
          body: JSON.stringify({ activo: nuevoEstado }),
        }
      );

      if (response && response.success) {
        SGPF.showToast(`Usuario ${accion}do exitosamente`, "success");
        await this.cargarUsuarios();
      } else {
        throw new Error(response?.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error cambiando estado:", error);
      SGPF.showToast("Error al cambiar estado del usuario", "error");
    } finally {
      SGPF.showLoading(false);
    }
  },

  // ===== ABRIR MODAL RESET PASSWORD =====
  abrirModalResetPassword(usuarioId, nombreCompleto) {
    document.getElementById("reset-usuario-id").value = usuarioId;
    document.getElementById("reset-usuario-nombre").textContent =
      nombreCompleto;
    document.getElementById("reset-nueva-password").value = "";
    document.getElementById("reset-confirm-password").value = "";

    const modal = document.getElementById("modal-reset-password");
    if (modal) modal.classList.add("active");
  },

  // ===== CONFIRMAR RESET PASSWORD =====
  async confirmarResetPassword() {
    const usuarioId = document.getElementById("reset-usuario-id").value;
    const nuevaPassword = document.getElementById("reset-nueva-password").value;
    const confirmPassword = document.getElementById(
      "reset-confirm-password"
    ).value;

    if (!nuevaPassword || nuevaPassword.length < 6) {
      SGPF.showToast(
        "La contraseña debe tener al menos 6 caracteres",
        "warning"
      );
      return;
    }

    if (nuevaPassword !== confirmPassword) {
      SGPF.showToast("Las contraseñas no coinciden", "warning");
      return;
    }

    try {
      SGPF.showLoading(true);

      const response = await SGPF.apiCall(
        `/admin/usuarios/${usuarioId}/reset-password`,
        {
          method: "PUT",
          body: JSON.stringify({ nueva_password: nuevaPassword }),
        }
      );

      if (response && response.success) {
        SGPF.showToast("Contraseña restablecida exitosamente", "success");
        this.cerrarModalResetPassword();
      } else {
        throw new Error(response?.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error restableciendo contraseña:", error);
      SGPF.showToast("Error al restablecer contraseña", "error");
    } finally {
      SGPF.showLoading(false);
    }
  },

  // ===== CARGAR ROLES EN SELECT =====
  cargarRolesEnSelect() {
    const select = document.getElementById("usuario-rol");
    if (!select) return;

    const userRole = SGPF.getNormalizedRole();

    let rolesPermitidos = [];
    if (userRole === "coordinador") {
      rolesPermitidos = this.roles;
    } else if (userRole === "encargado") {
      rolesPermitidos = this.roles.filter(
        (r) => r.codigo_rol !== "coordinador_municipal"
      );
    }

    select.innerHTML =
      '<option value="">Seleccionar rol...</option>' +
      rolesPermitidos
        .map(
          (rol) => `<option value="${rol.codigo_rol}">${rol.nombre}</option>`
        )
        .join("");
  },

  // ===== CARGAR TERRITORIOS EN SELECT =====
  cargarTerritoriosEnSelect() {
    const select = document.getElementById("usuario-territorio");
    if (!select) return;

    select.innerHTML =
      '<option value="">Seleccionar territorio...</option>' +
      this.territorios
        .map(
          (territorio) =>
            `<option value="${territorio.id}">${territorio.nombre}</option>`
        )
        .join("");
  },

  // ===== CARGAR COMUNIDADES EN LISTA =====
  cargarComunidadesEnLista(idsSeleccionados = []) {
    const container = document.getElementById('usuario-comunidades-list');
    if (!container) return;

    // Agrupar comunidades por territorio
    const comunidadesPorTerritorio = {};
    this.comunidades.forEach(comunidad => {
        const territorio = comunidad.territorio_nombre || 'Sin territorio';
        if (!comunidadesPorTerritorio[territorio]) {
            comunidadesPorTerritorio[territorio] = [];
        }
        comunidadesPorTerritorio[territorio].push(comunidad);
    });

    let html = '';
    Object.keys(comunidadesPorTerritorio).sort().forEach((territorio, idx) => {
        const territorioId = `territorio-${idx}`;
        const comunidadesDelTerritorio = comunidadesPorTerritorio[territorio];
        const todasSeleccionadas = comunidadesDelTerritorio.every(c => idsSeleccionados.includes(c.id));
        
        html += `<div style="margin-bottom: 1.25rem;">`;
        
        // Header del territorio con checkbox "Seleccionar todas"
        html += `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.5rem; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%); border-radius: 6px;">
                <input type="checkbox" 
                       id="${territorioId}" 
                       ${todasSeleccionadas ? 'checked' : ''}
                       onchange="UsuariosAdmin.toggleTodasComunidades('${territorio}')"
                       style="cursor: pointer; width: 18px; height: 18px;">
                <label for="${territorioId}" style="cursor: pointer; font-weight: 600; color: var(--mspas-primary); font-size: 0.95rem; flex: 1;">
                    ${territorio}
                </label>
                <small style="color: #666; font-size: 0.85rem;">${comunidadesDelTerritorio.length} comunidades</small>
            </div>
        `;
        
        // Lista de comunidades
        html += `<div style="padding-left: 1.5rem;">`;
        comunidadesDelTerritorio.forEach(comunidad => {
            const checked = idsSeleccionados.includes(comunidad.id) ? 'checked' : '';
            html += `
                <label class="comunidad-item" data-territorio="${territorio}" style="display: grid; grid-template-columns: 30px 1fr; gap: 0.5rem; align-items: start; padding: 0.4rem 0.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s;" 
                       onmouseover="this.style.backgroundColor='#f5f5f5'" 
                       onmouseout="this.style.backgroundColor='transparent'">
                    <input type="checkbox" value="${comunidad.id}" ${checked} 
                           onchange="UsuariosAdmin.verificarTerritorioCompleto('${territorio}')"
                           style="cursor: pointer; margin-top: 0.25rem; width: 18px; height: 18px;">
                    <span style="line-height: 1.5; font-size: 0.9rem;">
                        ${comunidad.nombre} 
                        <small style="color: #888; font-size: 0.85rem; display: block; margin-top: 0.1rem;">(${comunidad.codigo_comunidad})</small>
                    </span>
                </label>
            `;
        });
        html += `</div>`;
        html += `</div>`;
    });

    container.innerHTML = html;
},

// NUEVAS FUNCIONES para manejar selección por territorio
toggleTodasComunidades(territorio) {
    const container = document.getElementById('usuario-comunidades-list');
    if (!container) return;

    const labels = container.querySelectorAll(`.comunidad-item[data-territorio="${territorio}"]`);
    const territorioCheckbox = Array.from(document.querySelectorAll('input[type="checkbox"]'))
        .find(cb => cb.id.startsWith('territorio-') && cb.nextElementSibling?.textContent?.trim() === territorio);
    
    const marcar = territorioCheckbox?.checked || false;

    labels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = marcar;
        }
    });
},

verificarTerritorioCompleto(territorio) {
    const container = document.getElementById('usuario-comunidades-list');
    if (!container) return;

    const labels = container.querySelectorAll(`.comunidad-item[data-territorio="${territorio}"]`);
    const checkboxes = Array.from(labels).map(label => label.querySelector('input[type="checkbox"]'));
    
    const todasMarcadas = checkboxes.every(cb => cb.checked);
    
    const territorioCheckbox = Array.from(document.querySelectorAll('input[type="checkbox"]'))
        .find(cb => cb.id.startsWith('territorio-') && cb.nextElementSibling?.textContent?.trim() === territorio);
    
    if (territorioCheckbox) {
        territorioCheckbox.checked = todasMarcadas;
    }
},

  // ===== CERRAR MODALES =====
  cerrarModal() {
    const modal = document.getElementById("modal-usuario");
    if (modal) modal.classList.remove("active");
    this.limpiarFormulario();
  },

  cerrarModalResetPassword() {
    const modal = document.getElementById("modal-reset-password");
    if (modal) modal.classList.remove("active");
  },

  // ===== LIMPIAR FORMULARIO =====
  limpiarFormulario() {
    document.getElementById("usuario-id").value = "";
    document.getElementById("usuario-nombres").value = "";
    document.getElementById("usuario-apellidos").value = "";
    document.getElementById("usuario-email-prefix").value = "";
    document.getElementById("usuario-email").value = "";
    document.getElementById("usuario-dpi").value = "";
    document.getElementById("usuario-telefono").value = "";
    document.getElementById("usuario-codigo").value = "";
    document.getElementById("usuario-cargo").value = "";
    document.getElementById("usuario-rol").value = "";
    document.getElementById("usuario-password").value = "";
    document.getElementById("usuario-password-confirm").value = "";

    const territorioGroup = document.getElementById("usuario-territorio-group");
    const comunidadesGroup = document.getElementById(
      "usuario-comunidades-group"
    );
    if (territorioGroup) territorioGroup.style.display = "none";
    if (comunidadesGroup) comunidadesGroup.style.display = "none";
  },

  // ===== UTILIDADES =====
  obtenerIniciales(nombres, apellidos) {
    const inicial1 = nombres?.charAt(0)?.toUpperCase() || "";
    const inicial2 = apellidos?.charAt(0)?.toUpperCase() || "";
    return inicial1 + inicial2 || "??";
  },

  normalizarRol(codigoRol) {
    const mapeo = {
      coordinador_municipal: "coordinador",
      encargado_sr: "encargado",
      asistente_tecnico: "asistente",
      auxiliar_enfermeria: "auxiliar",
    };
    return mapeo[codigoRol] || "auxiliar";
  },

  formatearFecha(fecha) {
    if (!fecha) return "Nunca";
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora - date;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 60) return minutos < 1 ? "Ahora" : `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;

    return date.toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  },

  mostrarEstadoVacio() {
    const tablaWrapper = document.getElementById("usuarios-tabla-wrapper");
    const emptyElement = document.getElementById("usuarios-empty");

    if (tablaWrapper) tablaWrapper.style.display = "none";
    if (emptyElement) emptyElement.style.display = "block";
  },
};
