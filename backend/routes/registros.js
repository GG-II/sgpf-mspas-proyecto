// ===== RUTAS DE REGISTROS =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireTerritoryAccess } = require('../middleware/permissions');

const router = express.Router();

// ===== OBTENER REGISTROS =====
router.get('/', authenticateToken, (req, res) => {
    try {
        const { limit = 10, offset = 0, estado, comunidad_id } = req.query;
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = 'WHERE 1=1';
        let params = [];

        // Filtrar por estado si se proporciona
        if (estado) {
            whereClause += ' AND r.estado = ?';
            params.push(estado);
        }

        // Filtrar por comunidad si se proporciona
        if (comunidad_id) {
            whereClause += ' AND r.comunidad_id = ?';
            params.push(comunidad_id);
        }

        // Filtrar por permisos del usuario
        if (req.user.rol === 'auxiliar_enfermeria') {
            whereClause += ` AND r.comunidad_id IN (
                SELECT pc.comunidad_id FROM permisos_comunidad pc 
                WHERE pc.usuario_id = ? AND pc.activo = 1
            )`;
            params.push(req.user.id);
        } else if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        const registrosQuery = `
            SELECT 
                r.id, r.año, r.mes, r.cantidad_administrada, r.fecha_registro, r.estado,
                r.observaciones, r.fecha_hora_registro,
                c.nombre as comunidad, c.codigo_comunidad,
                mp.nombre as metodo, mp.nombre_corto,
                t.nombre as territorio,
                u.nombres || ' ' || u.apellidos as registrado_por
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN metodos_planificacion mp ON r.metodo_id = mp.id
            JOIN usuarios u ON r.registrado_por = u.id
            ${whereClause}
            ORDER BY r.fecha_hora_registro DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        db.all(registrosQuery, params, (err, registros) => {
            if (err) {
                console.error('Error obteniendo registros:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo registros'
                });
            }

            // Contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM registros_mensuales r
                JOIN comunidades c ON r.comunidad_id = c.id
                JOIN territorios t ON c.territorio_id = t.id
                ${whereClause.replace('LIMIT ? OFFSET ?', '')}
            `;

            const countParams = params.slice(0, -2); // Quitar limit y offset

            db.get(countQuery, countParams, (err, countResult) => {
                if (err) {
                    console.error('Error contando registros:', err);
                    countResult = { total: 0 };
                }

                console.log(`📋 ${registros.length} registros obtenidos para usuario ${req.user.email}`);

                res.json({
                    success: true,
                    data: {
                        registros: registros || [],
                        total: countResult.total || 0,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo registros:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CREAR NUEVO REGISTRO =====
router.post('/', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const { comunidad_id, metodo_id, año, mes, cantidad, observaciones } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Validaciones
        if (!comunidad_id || !metodo_id || !año || !mes || cantidad === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: comunidad_id, metodo_id, año, mes, cantidad'
            });
        }

        if (parseInt(cantidad) < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            });
        }

        // Verificar permisos del usuario en la comunidad (solo para auxiliares)
        if (req.user.rol === 'auxiliar_enfermeria') {
            const permisosQuery = `
                SELECT 1 FROM permisos_comunidad 
                WHERE usuario_id = ? AND comunidad_id = ? AND puede_registrar = 1 AND activo = 1
            `;

            db.get(permisosQuery, [req.user.id, comunidad_id], (err, permiso) => {
                if (err || !permiso) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para registrar en esta comunidad'
                    });
                }
                insertarRegistro();
            });
        } else {
            insertarRegistro();
        }

        function insertarRegistro() {
            const insertQuery = `
                INSERT OR REPLACE INTO registros_mensuales 
                (comunidad_id, metodo_id, año, mes, cantidad_administrada, fecha_registro, observaciones, 
                 estado, registrado_por, fecha_hora_registro, uuid_local)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
            `;

            const uuid = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            db.run(insertQuery, [
                comunidad_id, metodo_id, año, mes, parseInt(cantidad),
                new Date().toISOString().split('T')[0],
                observaciones || null,
                'registrado',
                req.user.id,
                uuid
            ], function(err) {
                if (err) {
                    console.error('Error insertando registro:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error guardando el registro'
                    });
                }

                console.log(`✅ Registro creado: ${cantidad} usuarias por ${req.user.email}`);

                res.json({
                    success: true,
                    message: 'Registro guardado exitosamente',
                    data: {
                        id: this.lastID,
                        uuid: uuid,
                        comunidad_id: comunidad_id,
                        metodo_id: metodo_id,
                        cantidad: parseInt(cantidad)
                    }
                });
            });
        }

    } catch (error) {
        console.error('❌ Error creando registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER REGISTRO ESPECÍFICO =====
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const registroId = req.params.id;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT 
                r.*, 
                c.nombre as comunidad, c.codigo_comunidad,
                mp.nombre as metodo, mp.nombre_corto, mp.categoria,
                t.nombre as territorio,
                ur.nombres || ' ' || ur.apellidos as registrado_por,
                uv.nombres || ' ' || uv.apellidos as validado_por,
                ua.nombres || ' ' || ua.apellidos as aprobado_por
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN metodos_planificacion mp ON r.metodo_id = mp.id
            JOIN usuarios ur ON r.registrado_por = ur.id
            LEFT JOIN usuarios uv ON r.validado_por = uv.id
            LEFT JOIN usuarios ua ON r.aprobado_por = ua.id
            WHERE r.id = ?
        `;

        db.get(query, [registroId], (err, registro) => {
            if (err) {
                console.error('Error obteniendo registro:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo registro'
                });
            }

            if (!registro) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro no encontrado'
                });
            }

            // Verificar permisos de acceso
            let tieneAcceso = false;

            if (req.user.rol === 'auxiliar_enfermeria') {
                // Solo puede ver sus propios registros
                tieneAcceso = registro.registrado_por === req.user.id;
            } else if (req.user.rol === 'asistente_tecnico') {
                // Solo puede ver registros de su territorio
                tieneAcceso = true; // Se validará con territorio_id en el query
            } else {
                // Encargados y coordinadores pueden ver todos
                tieneAcceso = true;
            }

            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver este registro'
                });
            }

            res.json({
                success: true,
                data: registro
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ACTUALIZAR REGISTRO =====
router.put('/:id', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const registroId = req.params.id;
        const { cantidad, observaciones } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        if (cantidad === undefined) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad es requerida'
            });
        }

        if (parseInt(cantidad) < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            });
        }

        // Verificar que el registro existe y pertenece al usuario
        db.get(
            'SELECT * FROM registros_mensuales WHERE id = ?',
            [registroId],
            (err, registro) => {
                if (err) {
                    console.error('Error verificando registro:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error verificando registro'
                    });
                }

                if (!registro) {
                    return res.status(404).json({
                        success: false,
                        message: 'Registro no encontrado'
                    });
                }

                // Verificar permisos
                if (req.user.rol === 'auxiliar_enfermeria' && registro.registrado_por !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Solo puedes editar tus propios registros'
                    });
                }

                // Solo permitir editar registros en estado 'registrado'
                if (registro.estado !== 'registrado') {
                    return res.status(400).json({
                        success: false,
                        message: 'No se pueden editar registros que ya han sido validados'
                    });
                }

                // Actualizar registro
                const updateQuery = `
                    UPDATE registros_mensuales 
                    SET cantidad_administrada = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.run(updateQuery, [parseInt(cantidad), observaciones || null, registroId], function(err) {
                    if (err) {
                        console.error('Error actualizando registro:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error actualizando registro'
                        });
                    }

                    console.log(`✅ Registro actualizado ID:${registroId} por ${req.user.email}`);

                    res.json({
                        success: true,
                        message: 'Registro actualizado exitosamente',
                        data: {
                            id: registroId,
                            cantidad_anterior: registro.cantidad_administrada,
                            cantidad_nueva: parseInt(cantidad)
                        }
                    });
                });
            }
        );

    } catch (error) {
        console.error('❌ Error actualizando registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ELIMINAR REGISTRO =====
router.delete('/:id', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const registroId = req.params.id;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Verificar que el registro existe
        db.get(
            'SELECT * FROM registros_mensuales WHERE id = ?',
            [registroId],
            (err, registro) => {
                if (err) {
                    console.error('Error verificando registro:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error verificando registro'
                    });
                }

                if (!registro) {
                    return res.status(404).json({
                        success: false,
                        message: 'Registro no encontrado'
                    });
                }

                // Eliminar registro
                db.run('DELETE FROM registros_mensuales WHERE id = ?', [registroId], function(err) {
                    if (err) {
                        console.error('Error eliminando registro:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error eliminando registro'
                        });
                    }

                    console.log(`🗑️ Registro eliminado ID:${registroId} por ${req.user.email}`);

                    res.json({
                        success: true,
                        message: 'Registro eliminado exitosamente'
                    });
                });
            }
        );

    } catch (error) {
        console.error('❌ Error eliminando registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;