// ===== RUTAS DE REPORTES =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== REPORTE MENSUAL =====
router.get('/mensual/:year/:mes', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const { year, mes } = req.params;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = 'WHERE r.año = ? AND r.mes = ? AND r.estado IN (?, ?)';
        let params = [parseInt(year), parseInt(mes), 'validado', 'aprobado'];

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        const query = `
            SELECT 
                c.nombre as comunidad, c.codigo_comunidad, c.poblacion_mef,
                t.nombre as territorio,
                mp.nombre as metodo, mp.nombre_corto, mp.categoria,
                r.cantidad_administrada,
                r.fecha_registro, r.estado,
                ur.nombres || ' ' || ur.apellidos as registrado_por,
                -- Calcular porcentaje vs población MEF
                ROUND((r.cantidad_administrada * 100.0 / c.poblacion_mef), 2) as porcentaje_poblacion
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN metodos_planificacion mp ON r.metodo_id = mp.id
            JOIN usuarios ur ON r.registrado_por = ur.id
            ${whereClause}
            ORDER BY t.nombre, c.nombre, mp.orden_visualizacion
        `;

        db.all(query, params, (err, reporteData) => {
            if (err) {
                console.error('Error generando reporte mensual:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error generando reporte mensual'
                });
            }

            // Calcular resumen
            const resumen = {
                total_usuarias: reporteData.reduce((sum, item) => sum + (item.cantidad_administrada || 0), 0),
                total_comunidades: new Set(reporteData.map(item => item.comunidad)).size,
                total_territorios: new Set(reporteData.map(item => item.territorio)).size,
                metodos_utilizados: new Set(reporteData.map(item => item.metodo)).size
            };

            console.log(`📊 Reporte mensual ${mes}/${year} generado para ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    periodo: { año: parseInt(year), mes: parseInt(mes) },
                    resumen: resumen,
                    registros: reporteData,
                    generado_por: req.user.email,
                    fecha_generacion: new Date().toISOString()
                }
            });
        });

    } catch (error) {
        console.error('❌ Error generando reporte mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== REPORTE ANUAL =====
router.get('/anual/:year', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = 'WHERE r.año = ? AND r.estado IN (?, ?)';
        let params = [year, 'validado', 'aprobado'];

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ` AND c.territorio_id = ?`;
            params.push(req.user.territorio_id);
        }

        const queryAnual = `
            SELECT 
                t.nombre as territorio,
                c.nombre as comunidad, c.poblacion_mef,
                mp.nombre as metodo, mp.categoria,
                SUM(r.cantidad_administrada) as total_anual,
                COUNT(DISTINCT r.mes) as meses_con_registros
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN metodos_planificacion mp ON r.metodo_id = mp.id
            ${whereClause}
            GROUP BY c.id, mp.id
            ORDER BY t.nombre, c.nombre, mp.orden_visualizacion
        `;

        db.all(queryAnual, params, (err, datosAnuales) => {
            if (err) {
                console.error('Error en query anual:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error generando reporte anual'
                });
            }

            // Calcular totales
            const totalUsuarias = datosAnuales.reduce((sum, item) => sum + (item.total_anual || 0), 0);

            const resumen = {
                año: year,
                total_usuarias_atendidas: totalUsuarias,
                comunidades_participantes: new Set(datosAnuales.map(item => item.comunidad)).size,
                territorios_activos: new Set(datosAnuales.map(item => item.territorio)).size,
                metodos_utilizados: new Set(datosAnuales.map(item => item.metodo)).size
            };

            console.log(`📈 Reporte anual ${year} generado para ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    resumen: resumen,
                    detalle_completo: datosAnuales,
                    generado_por: req.user.email,
                    fecha_generacion: new Date().toISOString()
                }
            });
        });

    } catch (error) {
        console.error('❌ Error generando reporte anual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;