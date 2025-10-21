// ===== RUTAS DE VALIDACIÓN PARA VISITAS V2.0 =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== OBTENER VISITAS PENDIENTES DE VALIDACIÓN =====
router.get('/pendientes', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`🔍 [VALIDACIÓN] Visitas pendientes solicitadas por: ${user.email}`);

        // Construir WHERE clause según rol
        let whereClause = "WHERE v.estado = 'registrado'";
        let params = [];

        // Filtrar por territorio si es asistente técnico
        if (user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(user.territorio_id);
        }
        // Encargado ve todo (sin filtro adicional)

        const query = `
            SELECT 
                v.id,
                v.fecha_visita,
                v.observaciones,
                v.estado,
                v.fecha_hora_registro,
                u.nombres || ' ' || u.apellidos as usuaria_nombre,
                u.dpi as usuaria_dpi,
                u.tipo_usuaria,
                m.nombre as metodo,
                m.nombre_corto as metodo_corto,
                m.categoria as metodo_categoria,
                c.nombre as comunidad,
                c.codigo_comunidad,
                t.nombre as territorio,
                ur.nombres || ' ' || ur.apellidos as registrado_por,
                ur.cargo as cargo_registrador
            FROM visitas v
            JOIN usuarias u ON v.usuaria_id = u.id
            JOIN metodos_planificacion m ON v.metodo_id = m.id
            JOIN comunidades c ON u.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN usuarios ur ON v.registrado_por = ur.id
            ${whereClause}
            ORDER BY v.fecha_hora_registro DESC
        `;

        db.all(query, params, (err, visitas) => {
            if (err) {
                console.error('❌ [VALIDACIÓN] Error obteniendo visitas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo visitas pendientes'
                });
            }

            console.log(`✅ [VALIDACIÓN] ${visitas.length} visitas pendientes encontradas`);

            // Calcular resumen
            const resumen = {
                total_pendientes: visitas.length,
                comunidades_unicas: new Set(visitas.map(v => v.comunidad)).size,
                territorios_unicos: new Set(visitas.map(v => v.territorio)).size,
                auxiliares_unicos: new Set(visitas.map(v => v.registrado_por)).size
            };

            res.json({
                success: true,
                data: {
                    visitas_pendientes: visitas,
                    resumen: resumen
                }
            });
        });

    } catch (error) {
        console.error('❌ [VALIDACIÓN] Error general:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== VALIDAR VISITA =====
router.put('/:id', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const visitaId = req.params.id;
        const { observaciones_validacion } = req.body;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`✅ [VALIDACIÓN] Validando visita ID:${visitaId} por ${user.email}`);

        // Actualizar estado a 'validado'
        const updateQuery = `
            UPDATE visitas 
            SET estado = 'validado',
                validado_por = ?,
                fecha_hora_validacion = CURRENT_TIMESTAMP,
                observaciones_validacion = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND estado = 'registrado'
        `;

        db.run(updateQuery, [user.id, observaciones_validacion || null, visitaId], function(err) {
            if (err) {
                console.error('❌ [VALIDACIÓN] Error actualizando visita:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error validando visita'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Visita no encontrada o ya validada'
                });
            }

            console.log(`✅ [VALIDACIÓN] Visita ${visitaId} validada exitosamente`);

            res.json({
                success: true,
                message: 'Visita validada exitosamente',
                data: {
                    id: visitaId,
                    estado: 'validado',
                    validado_por: user.id
                }
            });
        });

    } catch (error) {
        console.error('❌ [VALIDACIÓN] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== RECHAZAR VISITA (Eliminar) =====
router.delete('/:id', authenticateToken, requirePermission('validar'), (req, res) => {
    try {
        const visitaId = req.params.id;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`🗑️ [VALIDACIÓN] Eliminando visita ID:${visitaId} por ${user.email}`);

        // Obtener datos de la visita antes de eliminar
        db.get('SELECT usuaria_id FROM visitas WHERE id = ?', [visitaId], (err, visita) => {
            if (err || !visita) {
                return res.status(404).json({
                    success: false,
                    message: 'Visita no encontrada'
                });
            }

            // Eliminar visita
            db.run('DELETE FROM visitas WHERE id = ?', [visitaId], function(err) {
                if (err) {
                    console.error('❌ [VALIDACIÓN] Error eliminando:', err);
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
                    [visita.usuaria_id],
                    () => {
                        console.log(`✅ [VALIDACIÓN] Visita ${visitaId} eliminada`);

                        res.json({
                            success: true,
                            message: 'Visita eliminada permanentemente'
                        });
                    }
                );
            });
        });

    } catch (error) {
        console.error('❌ [VALIDACIÓN] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;