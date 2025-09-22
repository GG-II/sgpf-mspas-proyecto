// ===== RUTAS DE VALIDACIÓN =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireTerritoryAccess } = require('../middleware/permissions');

const router = express.Router();

// ===== OBTENER REGISTROS PENDIENTES DE VALIDACIÓN =====
router.get('/pendientes', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = "WHERE r.estado = 'registrado'";
        let params = [];

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        const query = `
            SELECT 
                r.id, r.año, r.mes, r.cantidad_administrada, r.fecha_registro, 
                r.observaciones, r.fecha_hora_registro,
                c.nombre as comunidad, c.codigo_comunidad, c.poblacion_mef,
                mp.nombre as metodo, mp.nombre_corto, mp.categoria,
                t.nombre as territorio,
                u.nombres || ' ' || u.apellidos as registrado_por,
                u.cargo as cargo_registrador,
                u.email as email_registrador
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN metodos_planificacion mp ON r.metodo_id = mp.id
            JOIN usuarios u ON r.registrado_por = u.id
            ${whereClause}
            ORDER BY r.fecha_hora_registro ASC
        `;

        db.all(query, params, (err, registros) => {
            if (err) {
                console.error('Error obteniendo registros pendientes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo registros pendientes'
                });
            }

            console.log(`📋 ${registros.length} registros pendientes para ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    registros_pendientes: registros || [],
                    total_pendientes: registros.length,
                    filtrado_por_territorio: req.user.rol === 'asistente_tecnico' ? req.user.territorio_id : null
                }
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo registros pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== VALIDAR REGISTRO (APROBAR/RECHAZAR) =====
router.put('/registro/:id', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const registroId = req.params.id;
        const { accion, observaciones_validacion } = req.body; // 'aprobar' o 'rechazar'
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
            return res.status(400).json({
                success: false,
                message: 'Acción debe ser "aprobar" o "rechazar"'
            });
        }

        if (accion === 'rechazar' && !observaciones_validacion) {
            return res.status(400).json({
                success: false,
                message: 'Las observaciones son requeridas para rechazar un registro'
            });
        }

        // Verificar que el registro existe y está pendiente
        db.get(
            `SELECT r.*, c.territorio_id, c.nombre as comunidad_nombre,
                    u.nombres || ' ' || u.apellidos as registrado_por_nombre
             FROM registros_mensuales r 
             JOIN comunidades c ON r.comunidad_id = c.id 
             JOIN usuarios u ON r.registrado_por = u.id
             WHERE r.id = ? AND r.estado = 'registrado'`,
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
                        message: 'Registro no encontrado o ya procesado'
                    });
                }

                // Verificar permisos territoriales para asistentes técnicos
                if (req.user.rol === 'asistente_tecnico') {
                    if (req.user.territorio_id !== registro.territorio_id) {
                        return res.status(403).json({
                            success: false,
                            message: 'No tienes permisos para validar registros de este territorio'
                        });
                    }
                }

                const nuevoEstado = accion === 'aprobar' ? 'validado' : 'registrado';
                
                const updateQuery = `
                    UPDATE registros_mensuales 
                    SET estado = ?, validado_por = ?, fecha_hora_validacion = CURRENT_TIMESTAMP,
                        observaciones_validacion = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.run(updateQuery, [nuevoEstado, req.user.id, observaciones_validacion, registroId], function(err) {
                    if (err) {
                        console.error('Error validando registro:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error procesando validación'
                        });
                    }

                    console.log(`✅ Registro ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} ID:${registroId} por ${req.user.email}`);

                    // Crear notificación para el usuario que registró el dato
                    // (Esto se implementaría con el sistema de notificaciones)

                    res.json({
                        success: true,
                        message: `Registro ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`,
                        data: {
                            registro_id: registroId,
                            estado_anterior: 'registrado',
                            estado_nuevo: nuevoEstado,
                            accion: accion,
                            validado_por: req.user.email,
                            registrado_por: registro.registrado_por_nombre,
                            comunidad: registro.comunidad_nombre
                        }
                    });
                });
            }
        );

    } catch (error) {
        console.error('❌ Error validando registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== APROBAR REGISTROS VALIDADOS (ENCARGADO SR/COORDINADOR) =====
router.put('/aprobacion/:id', authenticateToken, requirePermission('aprobar'), (req, res) => {
    try {
        const registroId = req.params.id;
        const { observaciones_aprobacion } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Verificar que el registro está validado
        db.get(
            `SELECT r.*, c.nombre as comunidad_nombre,
                    ur.nombres || ' ' || ur.apellidos as registrado_por_nombre,
                    uv.nombres || ' ' || uv.apellidos as validado_por_nombre
             FROM registros_mensuales r
             JOIN comunidades c ON r.comunidad_id = c.id
             JOIN usuarios ur ON r.registrado_por = ur.id
             LEFT JOIN usuarios uv ON r.validado_por = uv.id
             WHERE r.id = ? AND r.estado = 'validado'`,
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
                        message: 'Registro no encontrado o no está validado'
                    });
                }

                const updateQuery = `
                    UPDATE registros_mensuales 
                    SET estado = 'aprobado', aprobado_por = ?, fecha_hora_aprobacion = CURRENT_TIMESTAMP,
                        observaciones_aprobacion = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.run(updateQuery, [req.user.id, observaciones_aprobacion, registroId], function(err) {
                    if (err) {
                        console.error('Error aprobando registro:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error aprobando registro'
                        });
                    }

                    console.log(`✅ Registro aprobado ID:${registroId} por ${req.user.email}`);

                    res.json({
                        success: true,
                        message: 'Registro aprobado exitosamente',
                        data: {
                            registro_id: registroId,
                            estado_anterior: 'validado',
                            estado_nuevo: 'aprobado',
                            aprobado_por: req.user.email,
                            validado_por: registro.validado_por_nombre,
                            registrado_por: registro.registrado_por_nombre,
                            comunidad: registro.comunidad_nombre
                        }
                    });
                });
            }
        );

    } catch (error) {
        console.error('❌ Error aprobando registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER HISTORIAL DE VALIDACIONES =====
router.get('/historial', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const { limit = 50, estado, desde, hasta } = req.query;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = "WHERE r.estado != 'registrado'";
        let params = [];

        if (estado) {
            whereClause += ' AND r.estado = ?';
            params.push(estado);
        }

        if (desde) {
            whereClause += ' AND DATE(r.fecha_hora_validacion) >= ?';
            params.push(desde);
        }

        if (hasta) {
            whereClause += ' AND DATE(r.fecha_hora_validacion) <= ?';
            params.push(hasta);
        }

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        params.push(parseInt(limit));

        const query = `
            SELECT 
                r.id, r.año, r.mes, r.cantidad_administrada, r.fecha_registro, r.estado,
                r.observaciones, r.observaciones_validacion, r.observaciones_aprobacion,
                r.fecha_hora_registro, r.fecha_hora_validacion, r.fecha_hora_aprobacion,
                c.nombre as comunidad, c.codigo_comunidad,
                mp.nombre as metodo, mp.nombre_corto,
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
            ${whereClause}
            ORDER BY COALESCE(r.fecha_hora_aprobacion, r.fecha_hora_validacion, r.fecha_hora_registro) DESC
            LIMIT ?
        `;

        db.all(query, params, (err, historial) => {
            if (err) {
                console.error('Error obteniendo historial:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo historial'
                });
            }

            // Obtener estadísticas del historial
            const estadisticas = {
                total_registros: historial.length,
                por_estado: {
                    validado: historial.filter(h => h.estado === 'validado').length,
                    aprobado: historial.filter(h => h.estado === 'aprobado').length
                },
                por_territorio: {}
            };

            historial.forEach(h => {
                if (!estadisticas.por_territorio[h.territorio]) {
                    estadisticas.por_territorio[h.territorio] = 0;
                }
                estadisticas.por_territorio[h.territorio]++;
            });

            console.log(`📚 Historial de ${historial.length} registros para ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    historial: historial || [],
                    estadisticas: estadisticas,
                    filtros_aplicados: { estado, desde, hasta, limit }
                }
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== VALIDACIÓN MASIVA (para asistentes técnicos) =====
router.post('/masiva', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const { registros_ids, accion, observaciones_validacion } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        if (!Array.isArray(registros_ids) || registros_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de registros'
            });
        }

        if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
            return res.status(400).json({
                success: false,
                message: 'Acción debe ser "aprobar" o "rechazar"'
            });
        }

        if (registros_ids.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden procesar más de 50 registros a la vez'
            });
        }

        const placeholders = registros_ids.map(() => '?').join(',');
        let whereClause = `WHERE r.id IN (${placeholders}) AND r.estado = 'registrado'`;
        let params = [...registros_ids];

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        // Verificar que todos los registros son válidos y accesibles
        const verificarQuery = `
            SELECT r.id, c.nombre as comunidad
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            ${whereClause}
        `;

        db.all(verificarQuery, params, (err, registrosValidos) => {
            if (err) {
                console.error('Error verificando registros:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error verificando registros'
                });
            }

            if (registrosValidos.length !== registros_ids.length) {
                return res.status(400).json({
                    success: false,
                    message: `Solo ${registrosValidos.length} de ${registros_ids.length} registros son válidos para validar`
                });
            }

            // Procesar validación masiva
            const nuevoEstado = accion === 'aprobar' ? 'validado' : 'registrado';
            const updateQuery = `
                UPDATE registros_mensuales 
                SET estado = ?, validado_por = ?, fecha_hora_validacion = CURRENT_TIMESTAMP,
                    observaciones_validacion = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id IN (${placeholders})
            `;

            const updateParams = [nuevoEstado, req.user.id, observaciones_validacion, ...registros_ids];

            db.run(updateQuery, updateParams, function(err) {
                if (err) {
                    console.error('Error en validación masiva:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error procesando validación masiva'
                    });
                }

                console.log(`✅ Validación masiva: ${this.changes} registros ${accion === 'aprobar' ? 'aprobados' : 'rechazados'} por ${req.user.email}`);

                res.json({
                    success: true,
                    message: `Validación masiva completada: ${this.changes} registros ${accion === 'aprobar' ? 'aprobados' : 'rechazados'}`,
                    data: {
                        registros_procesados: this.changes,
                        accion: accion,
                        estado_nuevo: nuevoEstado,
                        validado_por: req.user.email
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error en validación masiva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;