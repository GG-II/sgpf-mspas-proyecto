// ===== DASHBOARD AUXILIAR - ENDPOINTS OPTIMIZADOS =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== ESTADÍSTICAS DEL MES ACTUAL (OPTIMIZADO) =====
router.get('/stats/mes-actual', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Calcular rango del mes actual
        const hoy = new Date();
        const year = hoy.getFullYear();
        const mes = hoy.getMonth() + 1; // 1-12
        
        const primerDia = `${year}-${String(mes).padStart(2, '0')}-01`;
        const ultimoDia = new Date(year, mes, 0);
        const ultimoDiaStr = `${year}-${String(mes).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`;

        console.log(`📊 [DASHBOARD AUXILIAR] Stats mes actual: ${primerDia} a ${ultimoDiaStr} - Usuario: ${user.email}`);

        // ===== QUERY OPTIMIZADA: Cuenta USUARIAS ÚNICAS por tipo =====
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT CASE WHEN u.tipo_usuaria = 'nueva' THEN u.id END) as usuarias_nuevas,
                COUNT(DISTINCT CASE WHEN u.tipo_usuaria = 'reconsulta' THEN u.id END) as usuarias_reconsulta,
                COUNT(DISTINCT CASE WHEN u.tipo_usuaria = 'activa' THEN u.id END) as usuarias_activas,
                COUNT(DISTINCT u.id) as total_usuarias_unicas,
                COUNT(v.id) as total_visitas,
                COUNT(CASE WHEN v.estado = 'registrado' THEN 1 END) as visitas_pendientes,
                COUNT(CASE WHEN v.estado = 'validado' THEN 1 END) as visitas_validadas
            FROM visitas v
            JOIN usuarias u ON v.usuaria_id = u.id
            WHERE v.fecha_visita >= ? 
              AND v.fecha_visita <= ?
              AND v.registrado_por = ?
        `;

        db.get(statsQuery, [primerDia, ultimoDiaStr, user.id], (err, stats) => {
            if (err) {
                console.error('❌ [DASHBOARD AUXILIAR] Error en query stats:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo estadísticas'
                });
            }

            // Si no hay datos, devolver zeros
            if (!stats || stats.total_visitas === 0) {
                console.log('ℹ️ [DASHBOARD AUXILIAR] Sin visitas registradas este mes');
                return res.json({
                    success: true,
                    data: {
                        periodo: { 
                            year, 
                            mes, 
                            primer_dia: primerDia, 
                            ultimo_dia: ultimoDiaStr,
                            descripcion: `${getNombreMes(mes)} ${year}`
                        },
                        usuarias_nuevas: 0,
                        usuarias_reconsulta: 0,
                        usuarias_activas: 0,
                        total_usuarias_unicas: 0,
                        total_visitas: 0,
                        visitas_pendientes: 0,
                        visitas_validadas: 0
                    }
                });
            }

            console.log(`✅ [DASHBOARD AUXILIAR] Stats calculadas:`, {
                nuevas: stats.usuarias_nuevas,
                reconsulta: stats.usuarias_reconsulta,
                activas: stats.usuarias_activas,
                total: stats.total_usuarias_unicas
            });

            res.json({
                success: true,
                data: {
                    periodo: { 
                        year, 
                        mes, 
                        primer_dia: primerDia, 
                        ultimo_dia: ultimoDiaStr,
                        descripcion: `${getNombreMes(mes)} ${year}`
                    },
                    usuarias_nuevas: stats.usuarias_nuevas || 0,
                    usuarias_reconsulta: stats.usuarias_reconsulta || 0,
                    usuarias_activas: stats.usuarias_activas || 0,
                    total_usuarias_unicas: stats.total_usuarias_unicas || 0,
                    total_visitas: stats.total_visitas || 0,
                    visitas_pendientes: stats.visitas_pendientes || 0,
                    visitas_validadas: stats.visitas_validadas || 0
                }
            });
        });

    } catch (error) {
        console.error('❌ [DASHBOARD AUXILIAR] Error general:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ÚLTIMAS VISITAS DEL AUXILIAR =====
router.get('/ultimas-visitas', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`📋 [DASHBOARD AUXILIAR] Últimas ${limit} visitas - Usuario: ${user.email}`);

        const query = `
            SELECT 
                v.id,
                v.fecha_visita,
                v.observaciones,
                v.estado,
                v.fecha_hora_registro,
                u.id as usuaria_id,
                u.nombres as usuaria_nombres,
                u.apellidos as usuaria_apellidos,
                u.tipo_usuaria,
                m.nombre as metodo_nombre,
                m.nombre_corto as metodo_corto,
                c.nombre as comunidad_nombre
            FROM visitas v
            JOIN usuarias u ON v.usuaria_id = u.id
            JOIN metodos_planificacion m ON v.metodo_id = m.id
            JOIN comunidades c ON u.comunidad_id = c.id
            WHERE v.registrado_por = ?
            ORDER BY v.fecha_visita DESC, v.fecha_hora_registro DESC
            LIMIT ?
        `;

        db.all(query, [user.id, parseInt(limit)], (err, visitas) => {
            if (err) {
                console.error('❌ [DASHBOARD AUXILIAR] Error obteniendo visitas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo visitas'
                });
            }

            console.log(`✅ [DASHBOARD AUXILIAR] ${visitas?.length || 0} visitas obtenidas`);

            res.json({
                success: true,
                data: {
                    visitas: visitas || [],
                    total: visitas?.length || 0
                }
            });
        });

    } catch (error) {
        console.error('❌ [DASHBOARD AUXILIAR] Error general:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== INFORMACIÓN DE COMUNIDADES DEL AUXILIAR (TODAS) =====
router.get('/mis-comunidades', authenticateToken, requirePermission('registrar'), (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`🏘️ [DASHBOARD AUXILIAR] Comunidades asignadas - Usuario: ${user.email}`);

        // Obtener TODAS las comunidades asignadas al auxiliar
        const comunidadesQuery = `
            SELECT 
                c.id,
                c.nombre,
                c.codigo_comunidad,
                c.poblacion_mef,
                c.poblacion_total,
                c.distancia_km,
                c.acceso_vehicular,
                t.nombre as territorio_nombre,
                t.codigo as territorio_codigo
            FROM permisos_comunidad pc
            JOIN comunidades c ON pc.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            WHERE pc.usuario_id = ? AND pc.activo = 1
            ORDER BY t.nombre, c.nombre
        `;

        db.all(comunidadesQuery, [user.id], (err, comunidades) => {
            if (err) {
                console.error('❌ [DASHBOARD AUXILIAR] Error obteniendo comunidades:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo comunidades'
                });
            }

            if (!comunidades || comunidades.length === 0) {
                console.log('ℹ️ [DASHBOARD AUXILIAR] Sin comunidades asignadas');
                return res.json({
                    success: true,
                    data: {
                        comunidades: [],
                        total: 0
                    },
                    message: 'Sin comunidades asignadas'
                });
            }

            console.log(`✅ [DASHBOARD AUXILIAR] ${comunidades.length} comunidades obtenidas`);

            res.json({
                success: true,
                data: {
                    comunidades: comunidades,
                    total: comunidades.length
                }
            });
        });

    } catch (error) {
        console.error('❌ [DASHBOARD AUXILIAR] Error general:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== HELPER: Obtener nombre del mes en español =====
function getNombreMes(mes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || 'Desconocido';
}

module.exports = router;