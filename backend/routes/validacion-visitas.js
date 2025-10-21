// ===== RUTAS DE VALIDACIÓN V2.0 - PARA VISITAS INDIVIDUALES =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== OBTENER VISITAS PENDIENTES (YA FUNCIONA - NO TOCAR) =====
router.get('/pendientes', authenticateToken, requirePermission('validar'), async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`🔍 [VALIDACIÓN V2.0] Usuario: ${user.email} (${user.rol})`);

        // Obtener comunidades accesibles
        let comunidadesAccesibles = [];

        if (user.rol === 'auxiliar_enfermeria') {
            const query = `SELECT comunidad_id FROM permisos_comunidad WHERE usuario_id = ? AND activo = 1`;
            comunidadesAccesibles = await new Promise((resolve, reject) => {
                db.all(query, [user.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.comunidad_id));
                });
            });
        } else if (user.rol === 'asistente_tecnico') {
            const territoriosQuery = `SELECT territorio_id FROM user_territorios WHERE usuario_id = ? AND activo = 1`;
            const territorios = await new Promise((resolve, reject) => {
                db.all(territoriosQuery, [user.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.territorio_id));
                });
            });

            if (territorios.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        registros_pendientes: [],
                        resumen: { total_pendientes: 0, comunidades_unicas: 0, territorios_unicos: 0 }
                    }
                });
            }

            const comunidadesQuery = `SELECT id FROM comunidades WHERE territorio_id IN (${territorios.join(',')}) AND activa = 1`;
            comunidadesAccesibles = await new Promise((resolve, reject) => {
                db.all(comunidadesQuery, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.id));
                });
            });
        } else {
            const query = `SELECT id FROM comunidades WHERE activa = 1`;
            comunidadesAccesibles = await new Promise((resolve, reject) => {
                db.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.id));
                });
            });
        }

        if (comunidadesAccesibles.length === 0) {
            return res.json({
                success: true,
                data: {
                    registros_pendientes: [],
                    resumen: { total_pendientes: 0, comunidades_unicas: 0, territorios_unicos: 0 }
                }
            });
        }

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
            WHERE v.estado = 'registrado'
              AND u.comunidad_id IN (${comunidadesAccesibles.join(',')})
            ORDER BY v.fecha_hora_registro DESC
            LIMIT 100
        `;

        const visitas = await new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        console.log(`✅ ${visitas.length} visitas pendientes encontradas`);

        const registros_pendientes = visitas.map(v => ({
            id: v.id,
            metodo: v.metodo,
            metodo_corto: v.metodo_corto,
            comunidad: v.comunidad,
            codigo_comunidad: v.codigo_comunidad,
            territorio: v.territorio,
            registrado_por: v.registrado_por,
            cargo_registrador: v.cargo_registrador || 'Auxiliar de Enfermería',
            cantidad_administrada: 1,
            fecha_hora_registro: v.fecha_hora_registro,
            usuaria_nombre: v.usuaria_nombre,
            tipo_usuaria: v.tipo_usuaria,
            estado: v.estado
        }));

        res.json({
            success: true,
            data: {
                registros_pendientes: registros_pendientes,
                resumen: {
                    total_pendientes: registros_pendientes.length,
                    comunidades_unicas: new Set(registros_pendientes.map(r => r.comunidad)).size,
                    territorios_unicos: new Set(registros_pendientes.map(r => r.territorio)).size
                }
            }
        });

    } catch (error) {
        console.error('❌ [VALIDACIÓN] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ===== VALIDAR VISITA =====
router.put('/registro/:id', authenticateToken, requirePermission('validar'), async (req, res) => {
    try {
        const visitaId = req.params.id;
        const { accion, observaciones_validacion } = req.body;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`✅ [VALIDACIÓN V2.0] ${accion} visita ${visitaId} por ${user.email}`);
        console.log('📦 Body recibido:', req.body);

        // Verificar que la visita existe
        const visita = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM visitas WHERE id = ? AND estado = "registrado"', [visitaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!visita) {
            return res.status(404).json({
                success: false,
                message: 'Visita no encontrada o ya procesada'
            });
        }

        if (accion === 'aprobar') {
            // Validar visita
            await new Promise((resolve, reject) => {
                const updateQuery = `
                    UPDATE visitas 
                    SET estado = 'validado',
                        validado_por = ?,
                        fecha_hora_validacion = CURRENT_TIMESTAMP,
                        observaciones_validacion = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;

                db.run(updateQuery, [user.id, observaciones_validacion || null, visitaId], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`✅ Visita ${visitaId} validada`);

            res.json({
                success: true,
                message: 'Registro validado exitosamente',
                data: { id: visitaId, estado: 'validado' }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Acción no válida. Use "aprobar"'
            });
        }

    } catch (error) {
        console.error('❌ [VALIDACIÓN] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ===== ELIMINAR VISITA =====
router.delete('/registro/:id', authenticateToken, requirePermission('validar'), async (req, res) => {
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

        console.log(`🗑️ [VALIDACIÓN V2.0] Eliminando visita ${visitaId} por ${user.email}`);

        // Obtener datos de la visita
        const visita = await new Promise((resolve, reject) => {
            db.get('SELECT usuaria_id FROM visitas WHERE id = ?', [visitaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!visita) {
            return res.status(404).json({
                success: false,
                message: 'Visita no encontrada'
            });
        }

        // Eliminar visita
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM visitas WHERE id = ?', [visitaId], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // Actualizar contador
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE usuarias 
                 SET total_visitas = total_visitas - 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND total_visitas > 0`,
                [visita.usuaria_id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        console.log(`✅ Visita ${visitaId} eliminada`);

        res.json({
            success: true,
            message: 'Visita eliminada permanentemente'
        });

    } catch (error) {
        console.error('❌ [VALIDACIÓN] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;