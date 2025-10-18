// ===== RUTAS DE VISITAS (1 usuaria → 1 método → 1 visita) - NUEVO V2.0 =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== REGISTRAR NUEVA VISITA =====
router.post('/', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const { usuaria_id, metodo_id, fecha_visita, observaciones } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Validaciones
        if (!usuaria_id || !metodo_id || !fecha_visita) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: usuaria_id, metodo_id, fecha_visita'
            });
        }

        // Verificar que la usuaria existe
        db.get('SELECT id, comunidad_id, total_visitas FROM usuarias WHERE id = ? AND activa = 1', [usuaria_id], (err, usuaria) => {
            if (err || !usuaria) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuaria no encontrada'
                });
            }

            // Verificar permisos en la comunidad (solo para auxiliares)
            const verificarPermisos = (callback) => {
                if (req.user.rol === 'auxiliar_enfermeria') {
                    const permisosQuery = `
                        SELECT 1 FROM permisos_comunidad 
                        WHERE usuario_id = ? AND comunidad_id = ? AND puede_registrar = 1 AND activo = 1
                    `;

                    db.get(permisosQuery, [req.user.id, usuaria.comunidad_id], (err, permiso) => {
                        if (err || !permiso) {
                            return res.status(403).json({
                                success: false,
                                message: 'No tienes permisos para registrar en esta comunidad'
                            });
                        }
                        callback();
                    });
                } else {
                    callback();
                }
            };

            verificarPermisos(() => {
                // Insertar visita
                const insertQuery = `
                    INSERT INTO visitas 
                    (usuaria_id, metodo_id, fecha_visita, observaciones, estado, registrado_por)
                    VALUES (?, ?, ?, ?, 'registrado', ?)
                `;

                db.run(insertQuery, [
                    usuaria_id, 
                    metodo_id, 
                    fecha_visita, 
                    observaciones || null,
                    req.user.id
                ], function(err) {
                    if (err) {
                        console.error('Error registrando visita:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error guardando visita'
                        });
                    }

                    const visitaId = this.lastID;

                    // Actualizar usuaria: total_visitas y fecha_ultima_visita
                    const updateUsuariaQuery = `
                        UPDATE usuarias 
                        SET total_visitas = total_visitas + 1,
                            fecha_ultima_visita = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;

                    db.run(updateUsuariaQuery, [fecha_visita, usuaria_id], (err) => {
                        if (err) {
                            console.error('Error actualizando usuaria:', err);
                            // Continuar aunque falle la actualización
                        }

                        // Recalcular tipo de usuaria
                        const nuevoTotal = usuaria.total_visitas + 1;
                        let nuevoTipo = 'nueva';
                        
                        if (nuevoTotal === 1) {
                            nuevoTipo = 'nueva';
                        } else if (nuevoTotal >= 2) {
                            // Verificar tiempo desde primera visita
                            db.get(
                                'SELECT fecha_primera_visita FROM usuarias WHERE id = ?',
                                [usuaria_id],
                                (err, row) => {
                                    if (!err && row) {
                                        const primera = new Date(row.fecha_primera_visita);
                                        const hoy = new Date();
                                        const diasDesde = Math.floor((hoy - primera) / (1000 * 60 * 60 * 24));
                                        
                                        if (diasDesde <= 365) {
                                            nuevoTipo = 'reconsulta';
                                        } else {
                                            nuevoTipo = 'activa';
                                        }
                                    }

                                    // Actualizar tipo
                                    db.run(
                                        'UPDATE usuarias SET tipo_usuaria = ? WHERE id = ?',
                                        [nuevoTipo, usuaria_id],
                                        () => {
                                            console.log(`✅ Visita registrada ID:${visitaId} - Usuaria ahora es "${nuevoTipo}" por ${req.user.email}`);

                                            res.json({
                                                success: true,
                                                message: 'Visita registrada exitosamente',
                                                data: {
                                                    id: visitaId,
                                                    usuaria_id: usuaria_id,
                                                    metodo_id: metodo_id,
                                                    fecha_visita: fecha_visita,
                                                    tipo_usuaria_actualizado: nuevoTipo
                                                }
                                            });
                                        }
                                    );
                                }
                            );
                        } else {
                            res.json({
                                success: true,
                                message: 'Visita registrada exitosamente',
                                data: {
                                    id: visitaId,
                                    usuaria_id: usuaria_id,
                                    metodo_id: metodo_id,
                                    fecha_visita: fecha_visita
                                }
                            });
                        }
                    });
                });
            });
        });

    } catch (error) {
        console.error('❌ Error registrando visita:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== LISTAR VISITAS (con filtros) =====
router.get('/', authenticateToken, (req, res) => {
    try {
        const { limit = 20, offset = 0, comunidad_id, estado, fecha_desde, fecha_hasta } = req.query;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = 'WHERE 1=1';
        let params = [];

        // Filtrar por estado
        if (estado && ['registrado', 'validado', 'rechazado'].includes(estado)) {
            whereClause += ' AND v.estado = ?';
            params.push(estado);
        }

        // Filtrar por comunidad
        if (comunidad_id) {
            whereClause += ' AND u.comunidad_id = ?';
            params.push(comunidad_id);
        }

        // Filtrar por rango de fechas
        if (fecha_desde) {
            whereClause += ' AND v.fecha_visita >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            whereClause += ' AND v.fecha_visita <= ?';
            params.push(fecha_hasta);
        }

        // Filtrar por permisos del usuario
        if (req.user.rol === 'auxiliar_enfermeria') {
            whereClause += ` AND u.comunidad_id IN (
                SELECT pc.comunidad_id FROM permisos_comunidad pc 
                WHERE pc.usuario_id = ? AND pc.activo = 1
            )`;
            params.push(req.user.id);
        } else if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        const query = `
            SELECT 
                v.id, v.fecha_visita, v.observaciones, v.estado,
                v.fecha_hora_registro,
                u.nombres || ' ' || u.apellidos as usuaria_nombre,
                u.dpi as usuaria_dpi, u.tipo_usuaria,
                m.nombre as metodo, m.nombre_corto, m.categoria,
                c.nombre as comunidad, c.codigo_comunidad,
                t.nombre as territorio,
                ur.nombres || ' ' || ur.apellidos as registrado_por
            FROM visitas v
            JOIN usuarias u ON v.usuaria_id = u.id
            JOIN metodos_planificacion m ON v.metodo_id = m.id
            JOIN comunidades c ON u.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN usuarios ur ON v.registrado_por = ur.id
            ${whereClause}
            ORDER BY v.fecha_visita DESC, v.fecha_hora_registro DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        db.all(query, params, (err, visitas) => {
            if (err) {
                console.error('Error obteniendo visitas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo visitas'
                });
            }

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM visitas v
                JOIN usuarias u ON v.usuaria_id = u.id
                JOIN comunidades c ON u.comunidad_id = c.id
                JOIN territorios t ON c.territorio_id = t.id
                ${whereClause}
            `;

            const countParams = params.slice(0, -2);

            db.get(countQuery, countParams, (err, countResult) => {
                if (err) {
                    console.error('Error contando visitas:', err);
                    countResult = { total: 0 };
                }

                console.log(`💉 ${visitas.length} visitas obtenidas para ${req.user.email}`);

                res.json({
                    success: true,
                    data: {
                        visitas: visitas || [],
                        total: countResult.total || 0,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error listando visitas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER VISITA ESPECÍFICA =====
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const visitaId = req.params.id;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT 
                v.*,
                u.dpi as usuaria_dpi,
                u.nombres || ' ' || u.apellidos as usuaria_nombre,
                u.tipo_usuaria,
                m.nombre as metodo, m.nombre_corto, m.categoria,
                c.nombre as comunidad, c.codigo_comunidad,
                t.nombre as territorio,
                ur.nombres || ' ' || ur.apellidos as registrado_por,
                uv.nombres || ' ' || uv.apellidos as validado_por
            FROM visitas v
            JOIN usuarias u ON v.usuaria_id = u.id
            JOIN metodos_planificacion m ON v.metodo_id = m.id
            JOIN comunidades c ON u.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN usuarios ur ON v.registrado_por = ur.id
            LEFT JOIN usuarios uv ON v.validado_por = uv.id
            WHERE v.id = ?
        `;

        db.get(query, [visitaId], (err, visita) => {
            if (err) {
                console.error('Error obteniendo visita:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo visita'
                });
            }

            if (!visita) {
                return res.status(404).json({
                    success: false,
                    message: 'Visita no encontrada'
                });
            }

            res.json({
                success: true,
                data: visita
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo visita:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER VISITAS DE UNA USUARIA =====
router.get('/usuaria/:usuaria_id', authenticateToken, (req, res) => {
    try {
        const usuariaId = req.params.usuaria_id;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT 
                v.id, v.fecha_visita, v.observaciones, v.estado,
                m.nombre as metodo, m.nombre_corto, m.categoria,
                ur.nombres || ' ' || ur.apellidos as registrado_por,
                v.fecha_hora_registro
            FROM visitas v
            JOIN metodos_planificacion m ON v.metodo_id = m.id
            JOIN usuarios ur ON v.registrado_por = ur.id
            WHERE v.usuaria_id = ?
            ORDER BY v.fecha_visita DESC
        `;

        db.all(query, [usuariaId], (err, visitas) => {
            if (err) {
                console.error('Error obteniendo visitas de usuaria:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo visitas'
                });
            }

            console.log(`📋 ${visitas.length} visitas de usuaria ID:${usuariaId}`);

            res.json({
                success: true,
                data: {
                    usuaria_id: usuariaId,
                    visitas: visitas || [],
                    total: visitas.length
                }
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo visitas de usuaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ACTUALIZAR VISITA (solo observaciones si está en estado 'registrado') =====
router.put('/:id', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const visitaId = req.params.id;
        const { observaciones } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Verificar que la visita existe y está en estado correcto
        db.get(
            'SELECT * FROM visitas WHERE id = ?',
            [visitaId],
            (err, visita) => {
                if (err) {
                    console.error('Error verificando visita:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error verificando visita'
                    });
                }

                if (!visita) {
                    return res.status(404).json({
                        success: false,
                        message: 'Visita no encontrada'
                    });
                }

                // Solo permitir editar si está en estado 'registrado'
                if (visita.estado !== 'registrado') {
                    return res.status(400).json({
                        success: false,
                        message: 'No se pueden editar visitas que ya han sido validadas o rechazadas'
                    });
                }

                // Verificar permisos (solo el que la creó puede editarla)
                if (req.user.rol === 'auxiliar_enfermeria' && visita.registrado_por !== req.user.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Solo puedes editar tus propias visitas'
                    });
                }

                // Actualizar observaciones
                const updateQuery = `
                    UPDATE visitas 
                    SET observaciones = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.run(updateQuery, [observaciones || null, visitaId], function(err) {
                    if (err) {
                        console.error('Error actualizando visita:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error actualizando visita'
                        });
                    }

                    console.log(`✅ Visita actualizada ID:${visitaId} por ${req.user.email}`);

                    res.json({
                        success: true,
                        message: 'Visita actualizada exitosamente',
                        data: {
                            id: visitaId,
                            observaciones: observaciones
                        }
                    });
                });
            }
        );

    } catch (error) {
        console.error('❌ Error actualizando visita:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ELIMINAR VISITA (solo admin o encargado) =====
router.delete('/:id', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const visitaId = req.params.id;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Verificar que la visita existe
        db.get(
            'SELECT * FROM visitas WHERE id = ?',
            [visitaId],
            (err, visita) => {
                if (err) {
                    console.error('Error verificando visita:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error verificando visita'
                    });
                }

                if (!visita) {
                    return res.status(404).json({
                        success: false,
                        message: 'Visita no encontrada'
                    });
                }

                const usuariaId = visita.usuaria_id;

                // Eliminar visita
                db.run('DELETE FROM visitas WHERE id = ?', [visitaId], function(err) {
                    if (err) {
                        console.error('Error eliminando visita:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error eliminando visita'
                        });
                    }

                    // Actualizar contador de visitas de la usuaria
                    db.run(
                        `UPDATE usuarias 
                         SET total_visitas = total_visitas - 1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE id = ? AND total_visitas > 0`,
                        [usuariaId],
                        (err) => {
                            if (err) {
                                console.error('Error actualizando contador:', err);
                            }

                            console.log(`🗑️ Visita eliminada ID:${visitaId} por ${req.user.email}`);

                            res.json({
                                success: true,
                                message: 'Visita eliminada exitosamente'
                            });
                        }
                    );
                });
            }
        );

    } catch (error) {
        console.error('❌ Error eliminando visita:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ESTADÍSTICAS DE VISITAS =====
router.get('/stats/general', authenticateToken, (req, res) => {
    try {
        const { year = 2025, mes } = req.query;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = `WHERE strftime('%Y', v.fecha_visita) = ?`;
        let params = [year.toString()];

        if (mes) {
            whereClause += ` AND strftime('%m', v.fecha_visita) = ?`;
            params.push(mes.toString().padStart(2, '0'));
        }

        // Filtrar por permisos
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        const statsQuery = `
            SELECT 
                COUNT(DISTINCT v.id) as total_visitas,
                COUNT(DISTINCT v.usuaria_id) as total_usuarias_atendidas,
                COUNT(DISTINCT u.comunidad_id) as comunidades_con_actividad,
                SUM(CASE WHEN v.estado = 'registrado' THEN 1 ELSE 0 END) as visitas_pendientes,
                SUM(CASE WHEN v.estado = 'validado' THEN 1 ELSE 0 END) as visitas_validadas
            FROM visitas v
            JOIN usuarias u ON v.usuaria_id = u.id
            JOIN comunidades c ON u.comunidad_id = c.id
            ${whereClause}
        `;

        db.get(statsQuery, params, (err, stats) => {
            if (err) {
                console.error('Error obteniendo estadísticas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo estadísticas'
                });
            }

            // Estadísticas por método
            const metodoQuery = `
                SELECT 
                    m.nombre as metodo,
                    m.nombre_corto,
                    COUNT(v.id) as total_visitas
                FROM visitas v
                JOIN usuarias u ON v.usuaria_id = u.id
                JOIN comunidades c ON u.comunidad_id = c.id
                JOIN metodos_planificacion m ON v.metodo_id = m.id
                ${whereClause}
                GROUP BY m.id, m.nombre, m.nombre_corto
                ORDER BY total_visitas DESC
            `;

            db.all(metodoQuery, params, (err, metodos) => {
                if (err) {
                    console.error('Error obteniendo stats por método:', err);
                    metodos = [];
                }

                console.log(`📊 Estadísticas generadas para ${year}${mes ? '/' + mes : ''}`);

                res.json({
                    success: true,
                    data: {
                        periodo: { year, mes: mes || 'anual' },
                        resumen: stats || {},
                        por_metodo: metodos || []
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;