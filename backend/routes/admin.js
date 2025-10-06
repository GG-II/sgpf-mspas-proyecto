// ===== RUTAS DE ADMINISTRACIÓN - VERSIÓN CORREGIDA =====
const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== FUNCIÓN HELPER PARA BD =====
const getDb = (req) => {
    const db = req.app.locals.db;
    if (!db) {
        throw new Error('Base de datos no disponible');
    }
    return db;
};

// ===== LISTAR USUARIOS =====
router.get('/usuarios', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const db = getDb(req);
        if (!db) {
          return res.status(500).json({
            success: false,
            message: "Base de datos no disponible",
          });
        }

        const query = `
            SELECT 
                u.id, u.codigo_empleado, u.dpi, u.nombres, u.apellidos, u.email, 
                u.telefono, u.cargo, u.fecha_ingreso, u.activo, u.bloqueado,
                r.codigo_rol, r.nombre as rol_nombre,
                t.nombre as territorio_nombre,
                d.nombre as distrito_nombre
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN territorios t ON u.territorio_id = t.id
            LEFT JOIN distritos_salud d ON u.distrito_id = d.id
            ORDER BY r.nivel_jerarquico DESC, u.nombres
        `;

        db.all(query, [], (err, usuarios) => {
            if (err) {
                console.error('Error obteniendo usuarios:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo usuarios'
                });
            }

            console.log(`👥 ${usuarios.length} usuarios listados por ${req.user.email}`);

            res.json({
                success: true,
                data: usuarios || []
            });
        });

    } catch (error) {
        console.error('❌ Error listando usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CREAR USUARIO =====
router.post('/usuarios', authenticateToken, requirePermission('admin'), async (req, res) => {
    try {
        const {
            codigo_empleado, dpi, nombres, apellidos, email, telefono,
            password, rol_codigo, cargo, territorio_id, distrito_id
        } = req.body;
        const db = getDb(req);

        // Validaciones básicas
        if (!nombres || !apellidos || !email || !password || !rol_codigo) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: nombres, apellidos, email, password, rol_codigo'
            });
        }

        // Normalizar email a minúsculas
        const emailNormalizado = email.toLowerCase().trim();

        // Verificar si el email ya existe
        const emailExistente = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM usuarios WHERE LOWER(email) = ?', [emailNormalizado], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

        if (emailExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Verificar DPI solo si se proporciona
        if (dpi && dpi.trim() !== '') {
            const dpiCheck = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM usuarios WHERE dpi = ?', [dpi.trim()], (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                });
            });

            if (dpiCheck) {
                return res.status(400).json({
                    success: false,
                    message: 'El DPI ya está registrado'
                });
            }
        }

        // Verificar código empleado solo si se proporciona
        if (codigo_empleado && codigo_empleado.trim() !== '') {
            const codigoCheck = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM usuarios WHERE codigo_empleado = ?', [codigo_empleado.trim()], (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                });
            });

            if (codigoCheck) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de empleado ya está registrado'
                });
            }
        }

        // Obtener ID del rol
        db.get('SELECT id FROM roles WHERE codigo_rol = ?', [rol_codigo], async (err, rol) => {
            if (err || !rol) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol no válido'
                });
            }

            try {
                // Hashear contraseña
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insertar usuario
                const insertQuery = `
                    INSERT INTO usuarios 
                    (codigo_empleado, dpi, nombres, apellidos, email, telefono, password_hash, 
                     rol_id, cargo, territorio_id, distrito_id, fecha_ingreso)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
                `;

                db.run(insertQuery, [
                    codigo_empleado && codigo_empleado.trim() !== '' ? codigo_empleado.trim() : null,
                    dpi && dpi.trim() !== '' ? dpi.trim() : null,
                    nombres.trim(), 
                    apellidos.trim(), 
                    emailNormalizado,  // Usar email normalizado
                    telefono && telefono.trim() !== '' ? telefono.trim() : null,
                    hashedPassword, 
                    rol.id, 
                    cargo && cargo.trim() !== '' ? cargo.trim() : null,
                    territorio_id || null, 
                    distrito_id || null
                ], function(err) {
                    if (err) {
                        console.error('Error creando usuario:', err);
                        
                        // Mensajes de error más específicos
                        let mensaje = 'Error creando usuario';
                        if (err.message.includes('email')) {
                            mensaje = 'El email ya está registrado';
                        } else if (err.message.includes('codigo_empleado')) {
                            mensaje = 'El código de empleado ya está registrado';
                        } else if (err.message.includes('dpi')) {
                            mensaje = 'El DPI ya está registrado';
                        }
                        
                        return res.status(500).json({
                            success: false,
                            message: mensaje
                        });
                    }

                    console.log(`✅ Usuario creado: ${nombres} ${apellidos} (${rol_codigo}) por ${req.user.email}`);

                    res.json({
                        success: true,
                        message: 'Usuario creado exitosamente',
                        data: {
                            id: this.lastID,
                            nombres: nombres,
                            apellidos: apellidos,
                            email: emailNormalizado,
                            rol: rol_codigo
                        }
                    });
                });

            } catch (hashError) {
                console.error('Error hasheando contraseña:', hashError);
                res.status(500).json({
                    success: false,
                    message: 'Error procesando contraseña'
                });
            }
        });

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER ROLES =====
router.get('/roles', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const db = getDb(req);

        const query = `
            SELECT codigo_rol, nombre, descripcion, nivel_jerarquico,
                   puede_registrar, puede_validar, puede_aprobar, 
                   puede_generar_reportes, puede_administrar
            FROM roles 
            WHERE activo = 1 
            ORDER BY nivel_jerarquico DESC
        `;

        db.all(query, [], (err, roles) => {
            if (err) {
                console.error('Error obteniendo roles:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo roles'
                });
            }

            res.json({
                success: true,
                data: roles || []
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});


// ===== OBTENER TERRITORIOS =====
router.get('/territorios', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const db = getDb(req);

        const query = `
            SELECT t.id, t.nombre, t.codigo, t.descripcion,
                   d.nombre as distrito_nombre
            FROM territorios t
            JOIN distritos_salud d ON t.distrito_id = d.id
            WHERE t.activo = 1
            ORDER BY t.nombre
        `;

        db.all(query, [], (err, territorios) => {
            if (err) {
                console.error('Error obteniendo territorios:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo territorios'
                });
            }

            res.json({
                success: true,
                data: territorios || []
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo territorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER METAS =====
router.get('/metas/:year', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = getDb(req);

        const query = `
            SELECT 
                cma.id, cma.año, cma.porcentaje_meta, cma.observaciones,
                cma.fecha_aprobacion, cma.activo,
                mp.id as metodo_id, mp.codigo_metodo, mp.nombre as metodo_nombre, 
                mp.categoria, mp.tipo_administracion
            FROM configuracion_metas_anuales cma
            JOIN metodos_planificacion mp ON cma.metodo_id = mp.id
            WHERE cma.año = ? AND cma.activo = 1
            ORDER BY mp.orden_visualizacion
        `;

        db.all(query, [year], (err, metas) => {
            if (err) {
                console.error('Error obteniendo metas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo metas'
                });
            }

            console.log(`🎯 Metas de ${year} consultadas por ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    año: year,
                    metas: metas || []
                }
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ACTUALIZAR METAS ANUALES =====
router.put(
  "/metas/:year",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const { metas } = req.body; // Array de { metodo_id, porcentaje_meta, observaciones }
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      if (!Array.isArray(metas) || metas.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un array de metas",
        });
      }

      // Validar que las metas sumen máximo 100%
      const totalPorcentaje = metas.reduce(
        (sum, meta) => sum + parseFloat(meta.porcentaje_meta || 0),
        0
      );
      if (totalPorcentaje > 100) {
        return res.status(400).json({
          success: false,
          message: `El total de metas (${totalPorcentaje}%) no puede exceder 100%`,
        });
      }

      // Actualizar o insertar cada meta
      let processedMetas = 0;
      let errors = [];

      metas.forEach((meta) => {
        const { metodo_id, porcentaje_meta, observaciones } = meta;

        if (!metodo_id || porcentaje_meta === undefined) {
          errors.push(`Meta inválida: se requiere metodo_id y porcentaje_meta`);
          processedMetas++;
          return;
        }

        const upsertQuery = `
                INSERT OR REPLACE INTO configuracion_metas_anuales 
                (año, metodo_id, porcentaje_meta, observaciones, fecha_aprobacion, aprobado_por, activo)
                VALUES (?, ?, ?, ?, CURRENT_DATE, ?, 1)
            `;

        db.run(
          upsertQuery,
          [year, metodo_id, porcentaje_meta, observaciones, req.user.id],
          (err) => {
            if (err) {
              console.error(
                `Error actualizando meta método ${metodo_id}:`,
                err
              );
              errors.push(`Error en método ${metodo_id}: ${err.message}`);
            }

            processedMetas++;

            // Cuando se procesen todas las metas
            if (processedMetas === metas.length) {
              if (errors.length > 0) {
                return res.status(400).json({
                  success: false,
                  message: "Errores procesando metas",
                  errors: errors,
                });
              }

              console.log(
                `✅ ${metas.length} metas de ${year} actualizadas por ${req.user.email}`
              );

              res.json({
                success: true,
                message: `Metas de ${year} actualizadas exitosamente`,
                data: {
                  año: year,
                  metas_actualizadas: metas.length,
                  total_porcentaje: Math.round(totalPorcentaje * 100) / 100,
                  aprobado_por: req.user.email,
                },
              });
            }
          }
        );
      });
    } catch (error) {
      console.error("❌ Error actualizando metas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== CREAR METAS PARA NUEVO AÑO =====
router.post('/metas/:year', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const { copiar_de_año } = req.body;
        const db = getDb(req);

        // Verificar que no existan metas para este año
        db.get(
            'SELECT COUNT(*) as count FROM configuracion_metas_anuales WHERE año = ?',
            [year],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error verificando metas existentes'
                    });
                }

                if (result.count > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Ya existen metas configuradas para el año ${year}. Use PUT para actualizar.`
                    });
                }

                // Copiar de año anterior
                if (copiar_de_año) {
                    const copyQuery = `
                        INSERT INTO configuracion_metas_anuales 
                        (año, metodo_id, porcentaje_meta, observaciones, fecha_aprobacion, aprobado_por, activo)
                        SELECT ?, metodo_id, porcentaje_meta, 
                               'Copiado de ' || año || ': ' || COALESCE(observaciones, ''),
                               CURRENT_DATE, ?, 1
                        FROM configuracion_metas_anuales 
                        WHERE año = ? AND activo = 1
                    `;

                    db.run(copyQuery, [year, req.user.id, copiar_de_año], function(err) {
                        if (err) {
                            console.error('Error copiando metas:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error copiando metas del año anterior'
                            });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({
                                success: false,
                                message: `No se encontraron metas para copiar del año ${copiar_de_año}`
                            });
                        }

                        console.log(`✅ ${this.changes} metas copiadas de ${copiar_de_año} a ${year} por ${req.user.email}`);

                        res.json({
                            success: true,
                            message: `Metas de ${year} creadas copiando de ${copiar_de_año}`,
                            data: {
                                año_nuevo: year,
                                año_origen: copiar_de_año,
                                metas_copiadas: this.changes,
                                creado_por: req.user.email
                            }
                        });
                    });
                } else {
                    // Crear metas por defecto
                    const metasPorDefecto = [
                        { metodo_id: 1, porcentaje: 10.00 },
                        { metodo_id: 2, porcentaje: 10.00 },
                        { metodo_id: 3, porcentaje: 45.00 },
                        { metodo_id: 4, porcentaje: 12.00 },
                        { metodo_id: 5, porcentaje: 2.00 },
                        { metodo_id: 6, porcentaje: 8.00 },
                        { metodo_id: 7, porcentaje: 6.00 },
                        { metodo_id: 8, porcentaje: 1.00 },
                        { metodo_id: 9, porcentaje: 5.50 },
                        { metodo_id: 10, porcentaje: 0.25 },
                        { metodo_id: 11, porcentaje: 0.25 }
                    ];

                    let processedDefaults = 0;

                    metasPorDefecto.forEach(meta => {
                        const insertQuery = `
                            INSERT INTO configuracion_metas_anuales 
                            (año, metodo_id, porcentaje_meta, observaciones, fecha_aprobacion, aprobado_por, activo)
                            VALUES (?, ?, ?, ?, CURRENT_DATE, ?, 1)
                        `;

                        db.run(insertQuery, [
                            year, meta.metodo_id, meta.porcentaje, 
                            'Meta por defecto', req.user.id
                        ], (err) => {
                            if (err) {
                                console.error('Error creando meta por defecto:', err);
                            }

                            processedDefaults++;

                            if (processedDefaults === metasPorDefecto.length) {
                                console.log(`✅ ${metasPorDefecto.length} metas por defecto creadas para ${year}`);

                                res.json({
                                    success: true,
                                    message: `Metas por defecto de ${year} creadas exitosamente`,
                                    data: {
                                        año: year,
                                        metas_creadas: metasPorDefecto.length,
                                        tipo: 'por_defecto'
                                    }
                                });
                            }
                        });
                    });
                }
            }
        );

    } catch (error) {
        console.error('❌ Error creando metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ELIMINAR METAS DE UN AÑO =====
router.delete(
  "/metas/:year",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      // Verificar que existan metas para este año
      db.get(
        "SELECT COUNT(*) as count FROM configuracion_metas_anuales WHERE año = ?",
        [year],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error verificando metas",
            });
          }

          if (result.count === 0) {
            return res.status(404).json({
              success: false,
              message: `No existen metas para el año ${year}`,
            });
          }

          // Eliminar metas (soft delete)
          db.run(
            "UPDATE configuracion_metas_anuales SET activo = 0 WHERE año = ?",
            [year],
            function (err) {
              if (err) {
                console.error("Error eliminando metas:", err);
                return res.status(500).json({
                  success: false,
                  message: "Error eliminando metas",
                });
              }

              console.log(
                `🗑️ ${this.changes} metas de ${year} desactivadas por ${req.user.email}`
              );

              res.json({
                success: true,
                message: `Metas de ${year} eliminadas exitosamente`,
                data: {
                  año: year,
                  metas_eliminadas: this.changes,
                  eliminado_por: req.user.email,
                },
              });
            }
          );
        }
      );
    } catch (error) {
      console.error("❌ Error eliminando metas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== LISTAR TODAS LAS COMUNIDADES =====
router.get(
  "/comunidades",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      const query = `
            SELECT 
                c.id, c.nombre, c.codigo_comunidad, c.poblacion_total, c.poblacion_mef,
                c.distancia_km, c.acceso_vehicular, c.activa,
                t.nombre as territorio_nombre, t.codigo as territorio_codigo,
                d.nombre as distrito_nombre
            FROM comunidades c
            JOIN territorios t ON c.territorio_id = t.id
            JOIN distritos_salud d ON t.distrito_id = d.id
            ORDER BY t.nombre, c.nombre
        `;

      db.all(query, [], (err, comunidades) => {
        if (err) {
          console.error("Error obteniendo comunidades:", err);
          return res.status(500).json({
            success: false,
            message: "Error obteniendo comunidades",
          });
        }

        console.log(
          `🏘️ ${comunidades.length} comunidades listadas por ${req.user.email}`
        );

        res.json({
          success: true,
          data: comunidades || [],
        });
      });
    } catch (error) {
      console.error("❌ Error listando comunidades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== ACTUALIZAR DATOS DE COMUNIDAD =====
router.put(
  "/comunidades/:id",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const comunidadId = req.params.id;
      const {
        poblacion_total,
        poblacion_mef,
        distancia_km,
        acceso_vehicular,
        activa,
      } = req.body;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      if (poblacion_mef < 0 || poblacion_total < 0) {
        return res.status(400).json({
          success: false,
          message: "Las poblaciones no pueden ser negativas",
        });
      }

      if (poblacion_mef > poblacion_total) {
        return res.status(400).json({
          success: false,
          message: "La población MEF no puede ser mayor que la población total",
        });
      }

      const updateQuery = `
            UPDATE comunidades 
            SET poblacion_total = ?, poblacion_mef = ?, distancia_km = ?, 
                acceso_vehicular = ?, activa = ?
            WHERE id = ?
        `;

      db.run(
        updateQuery,
        [
          poblacion_total,
          poblacion_mef,
          distancia_km,
          acceso_vehicular,
          activa,
          comunidadId,
        ],
        function (err) {
          if (err) {
            console.error("Error actualizando comunidad:", err);
            return res.status(500).json({
              success: false,
              message: "Error actualizando comunidad",
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              message: "Comunidad no encontrada",
            });
          }

          console.log(
            `✅ Comunidad actualizada ID:${comunidadId} por ${req.user.email}`
          );

          res.json({
            success: true,
            message: "Comunidad actualizada exitosamente",
            data: {
              id: comunidadId,
              poblacion_total: poblacion_total,
              poblacion_mef: poblacion_mef,
              distancia_km: distancia_km,
              acceso_vehicular: acceso_vehicular,
              activa: activa,
            },
          });
        }
      );
    } catch (error) {
      console.error("❌ Error actualizando comunidad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== CREAR NUEVA COMUNIDAD =====
router.post(
  "/comunidades",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const {
        nombre,
        codigo_comunidad,
        territorio_id,
        poblacion_total,
        poblacion_mef,
        distancia_km,
        acceso_vehicular = true,
      } = req.body;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      if (!nombre || !codigo_comunidad || !territorio_id) {
        return res.status(400).json({
          success: false,
          message: "Nombre, código y territorio son requeridos",
        });
      }

      // Verificar que el código no exista
      db.get(
        "SELECT id FROM comunidades WHERE codigo_comunidad = ?",
        [codigo_comunidad],
        (err, existing) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error verificando código de comunidad",
            });
          }

          if (existing) {
            return res.status(400).json({
              success: false,
              message: "El código de comunidad ya existe",
            });
          }

          // Verificar que el territorio existe
          db.get(
            "SELECT id FROM territorios WHERE id = ?",
            [territorio_id],
            (err, territorio) => {
              if (err || !territorio) {
                return res.status(400).json({
                  success: false,
                  message: "Territorio no válido",
                });
              }

              const insertQuery = `
                    INSERT INTO comunidades 
                    (nombre, codigo_comunidad, territorio_id, poblacion_total, poblacion_mef, 
                     distancia_km, acceso_vehicular, activa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `;

              db.run(
                insertQuery,
                [
                  nombre,
                  codigo_comunidad,
                  territorio_id,
                  poblacion_total || 0,
                  poblacion_mef || 0,
                  distancia_km || 0,
                  acceso_vehicular,
                ],
                function (err) {
                  if (err) {
                    console.error("Error creando comunidad:", err);
                    return res.status(500).json({
                      success: false,
                      message: "Error creando comunidad",
                    });
                  }

                  console.log(
                    `✅ Comunidad creada: ${nombre} (${codigo_comunidad}) por ${req.user.email}`
                  );

                  res.json({
                    success: true,
                    message: "Comunidad creada exitosamente",
                    data: {
                      id: this.lastID,
                      nombre: nombre,
                      codigo_comunidad: codigo_comunidad,
                      territorio_id: territorio_id,
                    },
                  });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      console.error("❌ Error creando comunidad:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== ACTUALIZAR USUARIO =====
router.put(
  "/usuarios/:id",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const userId = req.params.id;
      const { nombres, apellidos, telefono, cargo, activo, bloqueado } =
        req.body;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      if (!nombres || !apellidos) {
        return res.status(400).json({
          success: false,
          message: "Nombres y apellidos son requeridos",
        });
      }

      const updateQuery = `
            UPDATE usuarios 
            SET nombres = ?, apellidos = ?, telefono = ?, cargo = ?, 
                activo = ?, bloqueado = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

      db.run(
        updateQuery,
        [nombres, apellidos, telefono, cargo, activo, bloqueado, userId],
        function (err) {
          if (err) {
            console.error("Error actualizando usuario:", err);
            return res.status(500).json({
              success: false,
              message: "Error actualizando usuario",
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado",
            });
          }

          console.log(
            `✅ Usuario actualizado ID:${userId} por ${req.user.email}`
          );

          res.json({
            success: true,
            message: "Usuario actualizado exitosamente",
            data: {
              id: userId,
              nombres: nombres,
              apellidos: apellidos,
              activo: activo,
              bloqueado: bloqueado,
            },
          });
        }
      );
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== CAMBIAR ESTADO DE USUARIO (ACTIVAR/DESACTIVAR) =====
router.put(
  "/usuarios/:id/estado",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const userId = req.params.id;
      const { activo } = req.body;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      // Validar que activo sea booleano
      if (typeof activo !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "El campo 'activo' debe ser true o false",
        });
      }

      // No permitir desactivar el propio usuario
      if (parseInt(userId) === req.user.id && !activo) {
        return res.status(400).json({
          success: false,
          message: "No puedes desactivar tu propia cuenta",
        });
      }

      const updateQuery = `
        UPDATE usuarios 
        SET activo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(updateQuery, [activo ? 1 : 0, userId], function (err) {
        if (err) {
          console.error("Error cambiando estado de usuario:", err);
          return res.status(500).json({
            success: false,
            message: "Error cambiando estado de usuario",
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado",
          });
        }

        const accion = activo ? "activado" : "desactivado";
        console.log(
          `✅ Usuario ${accion} ID:${userId} por ${req.user.email}`
        );

        res.json({
          success: true,
          message: `Usuario ${accion} exitosamente`,
          data: {
            id: userId,
            activo: activo,
            modificado_por: req.user.email,
          },
        });
      });
    } catch (error) {
      console.error("❌ Error cambiando estado de usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== RESTABLECER CONTRASEÑA DE USUARIO =====
router.put(
  "/usuarios/:id/reset-password",
  authenticateToken,
  requirePermission("admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { nueva_password } = req.body;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      // Validaciones
      if (!nueva_password || nueva_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }

      // Verificar que el usuario existe
      db.get(
        "SELECT id, nombres, apellidos, email FROM usuarios WHERE id = ?",
        [userId],
        async (err, usuario) => {
          if (err || !usuario) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado",
            });
          }

          try {
            // Hashear nueva contraseña
            const hashedPassword = await bcrypt.hash(nueva_password, 10);

            const updateQuery = `
              UPDATE usuarios 
              SET password_hash = ?, 
                  debe_cambiar_password = 1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;

            db.run(updateQuery, [hashedPassword, userId], function (err) {
              if (err) {
                console.error("Error actualizando contraseña:", err);
                return res.status(500).json({
                  success: false,
                  message: "Error actualizando contraseña",
                });
              }

              console.log(
                `🔐 Contraseña restablecida para usuario ${usuario.email} por ${req.user.email}`
              );

              res.json({
                success: true,
                message: "Contraseña restablecida exitosamente",
                data: {
                  id: userId,
                  usuario: `${usuario.nombres} ${usuario.apellidos}`,
                  email: usuario.email,
                  debe_cambiar_password: true,
                  modificado_por: req.user.email,
                },
              });
            });
          } catch (hashError) {
            console.error("Error hasheando contraseña:", hashError);
            return res.status(500).json({
              success: false,
              message: "Error procesando contraseña",
            });
          }
        }
      );
    } catch (error) {
      console.error("❌ Error restableciendo contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== OBTENER DETALLE COMPLETO DE USUARIO =====
router.get(
  "/usuarios/:id",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const userId = req.params.id;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      // Obtener información del usuario
      const userQuery = `
        SELECT 
          u.id, u.codigo_empleado, u.dpi, u.nombres, u.apellidos, 
          u.email, u.telefono, u.cargo, u.fecha_ingreso, u.ultimo_acceso,
          u.activo, u.bloqueado, u.debe_cambiar_password,
          r.codigo_rol, r.nombre as rol_nombre, r.nivel_jerarquico,
          t.id as territorio_id, t.nombre as territorio_nombre,
          d.id as distrito_id, d.nombre as distrito_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        LEFT JOIN territorios t ON u.territorio_id = t.id
        LEFT JOIN distritos_salud d ON u.distrito_id = d.id
        WHERE u.id = ?
      `;

      db.get(userQuery, [userId], (err, usuario) => {
        if (err) {
          console.error("Error obteniendo usuario:", err);
          return res.status(500).json({
            success: false,
            message: "Error obteniendo usuario",
          });
        }

        if (!usuario) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado",
          });
        }

        // Obtener estadísticas del usuario
        const statsQuery = `
          SELECT 
            COUNT(DISTINCT r.id) as total_registros,
            COUNT(DISTINCT r.comunidad_id) as comunidades_activas,
            MIN(r.fecha_registro) as primer_registro,
            MAX(r.fecha_registro) as ultimo_registro,
            SUM(r.cantidad) as total_usuarias_atendidas
          FROM registros_planificacion r
          WHERE r.registrado_por_id = ?
        `;

        db.get(statsQuery, [userId], (err, stats) => {
          if (err) {
            console.error("Error obteniendo estadísticas:", err);
            // Continuar sin estadísticas
            stats = {
              total_registros: 0,
              comunidades_activas: 0,
              primer_registro: null,
              ultimo_registro: null,
              total_usuarias_atendidas: 0,
            };
          }

          // Obtener comunidades asignadas (si es auxiliar)
          if (usuario.codigo_rol === "auxiliar_enfermeria") {
            const comunidadesQuery = `
              SELECT 
                c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef,
                t.nombre as territorio
              FROM permisos_comunidad pc
              JOIN comunidades c ON pc.comunidad_id = c.id
              JOIN territorios t ON c.territorio_id = t.id
              WHERE pc.usuario_id = ? AND pc.activo = 1
              ORDER BY t.nombre, c.nombre
            `;

            db.all(comunidadesQuery, [userId], (err, comunidades) => {
              if (err) {
                console.error("Error obteniendo comunidades:", err);
                comunidades = [];
              }

              res.json({
                success: true,
                data: {
                  usuario: usuario,
                  estadisticas: stats,
                  comunidades_asignadas: comunidades,
                },
              });
            });
          } else {
            // Para otros roles, no hay comunidades asignadas
            res.json({
              success: true,
              data: {
                usuario: usuario,
                estadisticas: stats,
                comunidades_asignadas: [],
              },
            });
          }
        });
      });
    } catch (error) {
      console.error("❌ Error obteniendo detalle de usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

// ===== ASIGNAR COMUNIDADES A USUARIO =====
router.post(
  "/usuarios/:id/comunidades",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const userId = req.params.id;
      const { comunidades_ids } = req.body;
      const db = getDb(req);

      console.log(`📍 Asignando comunidades a usuario ${userId}:`, comunidades_ids);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      // Validar que comunidades_ids exista y sea un array
      if (!comunidades_ids || !Array.isArray(comunidades_ids)) {
        console.error('❌ comunidades_ids no es un array:', comunidades_ids);
        return res.status(400).json({
          success: false,
          message: "Se requiere un array de IDs de comunidades (comunidades_ids)",
        });
      }

      // Verificar que el usuario existe
      db.get(
        "SELECT id, nombres, apellidos, rol_id FROM usuarios WHERE id = ?",
        [userId],
        (err, usuario) => {
          if (err) {
            console.error('Error buscando usuario:', err);
            return res.status(500).json({
              success: false,
              message: "Error verificando usuario"
            });
          }

          if (!usuario) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado",
            });
          }

          // Permitir array vacío para deseleccionar todas
          if (comunidades_ids.length === 0) {
            db.run("DELETE FROM permisos_comunidad WHERE usuario_id = ?", [userId], (err) => {
              if (err) {
                console.error("Error eliminando asignaciones:", err);
                return res.status(500).json({
                  success: false,
                  message: "Error eliminando asignaciones previas"
                });
              }

              console.log(`✅ Comunidades desasignadas para usuario ${userId}`);
              
              res.json({
                success: true,
                message: "Todas las comunidades fueron desasignadas",
                data: {
                  usuario_id: userId,
                  comunidades_asignadas: 0
                }
              });
            });
            return;
          }

          // Eliminar asignaciones existentes
          db.run(
            "DELETE FROM permisos_comunidad WHERE usuario_id = ?",
            [userId],
            (err) => {
              if (err) {
                console.error("Error eliminando asignaciones existentes:", err);
                return res.status(500).json({
                  success: false,
                  message: "Error actualizando asignaciones",
                });
              }

              // Insertar nuevas asignaciones
              let insertedCount = 0;
              let successCount = 0;
              let errors = [];

              comunidades_ids.forEach((comunidadId) => {
                // Validar que sea un número
                const idNumerico = parseInt(comunidadId);
                if (isNaN(idNumerico)) {
                  console.error(`❌ ID de comunidad inválido: ${comunidadId}`);
                  errors.push(`ID inválido: ${comunidadId}`);
                  insertedCount++;
                  return;
                }

                const insertQuery = `
                  INSERT INTO permisos_comunidad 
                  (usuario_id, comunidad_id, puede_registrar, activo)
                  VALUES (?, ?, 1, 1)
                `;

                db.run(insertQuery, [userId, idNumerico], function(err) {
                  if (err) {
                    console.error(`❌ Error asignando comunidad ${idNumerico}:`, err);
                    errors.push(`Error en comunidad ${idNumerico}: ${err.message}`);
                  } else {
                    successCount++;
                  }

                  insertedCount++;

                  // Cuando se hayan procesado todas
                  if (insertedCount === comunidades_ids.length) {
                    if (errors.length > 0 && successCount === 0) {
                      return res.status(400).json({
                        success: false,
                        message: "Error asignando todas las comunidades",
                        errors: errors,
                      });
                    }

                    console.log(
                      `✅ ${successCount}/${comunidades_ids.length} comunidades asignadas a usuario ${userId}`
                    );

                    res.json({
                      success: true,
                      message: `${successCount} comunidades asignadas exitosamente`,
                      data: {
                        usuario_id: userId,
                        usuario_nombre: `${usuario.nombres} ${usuario.apellidos}`,
                        comunidades_asignadas: successCount,
                        errores: errors.length > 0 ? errors : undefined
                      },
                    });
                  }
                });
              });
            }
          );
        }
      );
    } catch (error) {
      console.error("❌ Error asignando comunidades:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor: " + error.message,
      });
    }
  }
);

// ===== VER COMUNIDADES ASIGNADAS A USUARIO =====
router.get(
  "/usuarios/:id/comunidades",
  authenticateToken,
  requirePermission("admin"),
  (req, res) => {
    try {
      const userId = req.params.id;
      const db = getDb(req);

      if (!db) {
        return res.status(500).json({
          success: false,
          message: "Base de datos no disponible",
        });
      }

      const query = `
            SELECT 
                c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef,
                t.nombre as territorio,
                pc.puede_registrar, pc.activo
            FROM permisos_comunidad pc
            JOIN comunidades c ON pc.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            WHERE pc.usuario_id = ? AND pc.activo = 1
            ORDER BY t.nombre, c.nombre
        `;

      db.all(query, [userId], (err, comunidades) => {
        if (err) {
          console.error("Error obteniendo comunidades asignadas:", err);
          return res.status(500).json({
            success: false,
            message: "Error obteniendo comunidades asignadas",
          });
        }

        res.json({
          success: true,
          data: {
            usuario_id: userId,
            comunidades_asignadas: comunidades || [],
            total_comunidades: comunidades.length,
          },
        });
      });
    } catch (error) {
      console.error("❌ Error obteniendo comunidades asignadas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
);

module.exports = router;
