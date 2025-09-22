// ===== RUTAS DE DASHBOARD =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ===== ESTADÍSTICAS GENERALES =====
router.get('/estadisticas/:year', authenticateToken, (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`📊 Estadísticas solicitadas para año ${year} por usuario ${req.user.email}`);

        // Query para obtener estadísticas reales
        let whereClause = 'WHERE r.año = ?';
        let params = [year];

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause += ' AND c.territorio_id = ?';
            params.push(req.user.territorio_id);
        }

        const estadisticasQuery = `
            SELECT 
                COUNT(DISTINCT r.id) as total_registros,
                SUM(r.cantidad_administrada) as total_usuarias,
                COUNT(CASE WHEN r.estado = 'registrado' THEN 1 END) as pendientes,
                COUNT(CASE WHEN r.estado = 'validado' THEN 1 END) as validados,
                COUNT(CASE WHEN r.estado = 'aprobado' THEN 1 END) as aprobados,
                COUNT(DISTINCT r.comunidad_id) as comunidades_activas
            FROM registros_mensuales r 
            JOIN comunidades c ON r.comunidad_id = c.id
            ${whereClause}
        `;

        db.get(estadisticasQuery, params, (err, stats) => {
            if (err) {
                console.error('Error obteniendo estadísticas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo estadísticas'
                });
            }

            // Query para datos mensuales
            const mensualQuery = `
                SELECT 
                    r.mes,
                    SUM(r.cantidad_administrada) as usuarias,
                    COUNT(DISTINCT r.comunidad_id) as comunidades
                FROM registros_mensuales r 
                JOIN comunidades c ON r.comunidad_id = c.id
                ${whereClause}
                GROUP BY r.mes 
                ORDER BY r.mes
            `;

            db.all(mensualQuery, params, (err, porMes) => {
                if (err) {
                    console.error('Error obteniendo datos mensuales:', err);
                    porMes = [];
                }

                // Calcular meta anual
                const metaQuery = `
                    SELECT SUM(
                        (pm.poblacion_mef * cma.porcentaje_meta / 100)
                    ) as meta_total
                    FROM poblacion_mef pm
                    JOIN configuracion_metas_anuales cma ON cma.año = ?
                    WHERE pm.año = ?
                `;

                db.get(metaQuery, [year, year], (err, metaData) => {
                    if (err) {
                        console.error('Error obteniendo meta:', err);
                        metaData = { meta_total: 2100 };
                    }

                    const metaAnual = metaData.meta_total || 2100;
                    const totalUsuarias = stats.total_usuarias || 0;
                    const porcentajeCumplimiento = metaAnual > 0 ? (totalUsuarias / metaAnual) * 100 : 0;

                    const estadisticas = {
                        año: year,
                        total_usuarias: totalUsuarias,
                        meta_anual: Math.round(metaAnual),
                        porcentaje_cumplimiento: Math.round(porcentajeCumplimiento * 100) / 100,
                        total_registros: stats.total_registros || 0,
                        registros_pendientes: stats.pendientes || 0,
                        por_estado: {
                            pendiente: stats.pendientes || 0,
                            validado: stats.validados || 0,
                            aprobado: stats.aprobados || 0
                        },
                        por_mes: porMes.map(mes => ({
                            mes: mes.mes,
                            usuarias: mes.usuarias || 0,
                            meta: Math.round(metaAnual / 12),
                            comunidades: mes.comunidades || 0
                        })),
                        comunidades_activas: stats.comunidades_activas || 0,
                        ultima_actualizacion: new Date().toISOString()
                    };

                    res.json({
                        success: true,
                        data: estadisticas
                    });
                });
            });
        });

    } catch (error) {
        console.error('❌ Error en estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== DASHBOARD EJECUTIVO (KPIs EN TIEMPO REAL) =====
router.get('/ejecutivo', authenticateToken, (req, res) => {
    try {
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        let whereClause = '';
        let params = [];

        // Filtrar por territorio si es asistente técnico
        if (req.user.rol === 'asistente_tecnico') {
            whereClause = 'JOIN comunidades c ON r.comunidad_id = c.id WHERE c.territorio_id = ?';
            params.push(req.user.territorio_id);
        }

        // Query para KPIs principales
        const kpisQuery = `
            SELECT 
                -- Datos del año actual
                COUNT(CASE WHEN r.año = ? THEN 1 END) as registros_año_actual,
                SUM(CASE WHEN r.año = ? THEN r.cantidad_administrada ELSE 0 END) as usuarias_año_actual,
                
                -- Datos del mes actual
                COUNT(CASE WHEN r.año = ? AND r.mes = ? THEN 1 END) as registros_mes_actual,
                SUM(CASE WHEN r.año = ? AND r.mes = ? THEN r.cantidad_administrada ELSE 0 END) as usuarias_mes_actual,
                
                -- Estados de registros
                COUNT(CASE WHEN r.estado = 'registrado' THEN 1 END) as pendientes_validacion,
                COUNT(CASE WHEN r.estado = 'validado' THEN 1 END) as pendientes_aprobacion,
                
                -- Comunidades activas (con registros en los últimos 3 meses)
                COUNT(DISTINCT CASE WHEN r.año = ? AND r.mes >= ? THEN r.comunidad_id END) as comunidades_activas_trimestre
                
            FROM registros_mensuales r
            ${whereClause}
            ${whereClause ? 'AND' : 'WHERE'} r.estado IN ('registrado', 'validado', 'aprobado')
        `;

        const kpisParams = [
            ...params,
            currentYear, currentYear, // año actual
            currentYear, currentMonth, currentYear, currentMonth, // mes actual
            currentYear, Math.max(1, currentMonth - 2) // último trimestre
        ];

        db.get(kpisQuery, kpisParams, (err, kpis) => {
            if (err) {
                console.error('Error obteniendo KPIs:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo KPIs'
                });
            }

            // Query para evolución últimos 6 meses
            const evolucionQuery = `
                SELECT 
                    r.año, r.mes,
                    SUM(r.cantidad_administrada) as total_usuarias,
                    COUNT(DISTINCT r.comunidad_id) as comunidades_activas
                FROM registros_mensuales r
                ${whereClause}
                ${whereClause ? 'AND' : 'WHERE'} r.estado IN ('validado', 'aprobado')
                  AND (
                    (r.año = ? AND r.mes >= ?) OR
                    (r.año = ? AND r.mes <= ?)
                  )
                GROUP BY r.año, r.mes
                ORDER BY r.año DESC, r.mes DESC
                LIMIT 6
            `;

            const mesInicio = Math.max(1, currentMonth - 5);
            const evolucionParams = [
                ...params,
                currentYear, mesInicio,
                currentYear - (mesInicio > currentMonth ? 1 : 0), 12
            ];
            
            db.all(evolucionQuery, evolucionParams, (err, evolucion) => {
                if (err) {
                    console.error('Error obteniendo evolución:', err);
                    evolucion = [];
                }

                // Query para top 5 comunidades del mes
                const topComunidadesQuery = `
                    SELECT 
                        c.nombre as comunidad,
                        t.nombre as territorio,
                        SUM(r.cantidad_administrada) as total_usuarias
                    FROM registros_mensuales r
                    JOIN comunidades c ON r.comunidad_id = c.id
                    JOIN territorios t ON c.territorio_id = t.id
                    WHERE r.año = ? AND r.mes = ? AND r.estado IN ('validado', 'aprobado')
                    ${req.user.rol === 'asistente_tecnico' ? 'AND c.territorio_id = ?' : ''}
                    GROUP BY c.id
                    ORDER BY total_usuarias DESC
                    LIMIT 5
                `;

                const topParams = [currentYear, currentMonth];
                if (req.user.rol === 'asistente_tecnico') {
                    topParams.push(req.user.territorio_id);
                }

                db.all(topComunidadesQuery, topParams, (err, topComunidades) => {
                    if (err) {
                        console.error('Error obteniendo top comunidades:', err);
                        topComunidades = [];
                    }

                    // Calcular meta anual total
                    const metaQuery = `
                        SELECT 
                            SUM(pm.poblacion_mef * cma.porcentaje_meta / 100) as meta_total
                        FROM poblacion_mef pm
                        JOIN configuracion_metas_anuales cma ON cma.año = ?
                        ${req.user.rol === 'asistente_tecnico' ? 
                            'JOIN comunidades c ON pm.comunidad_id = c.id WHERE c.territorio_id = ? AND' : 'WHERE'} 
                        pm.año = ?
                    `;

                    const metaParams = [currentYear];
                    if (req.user.rol === 'asistente_tecnico') {
                        metaParams.push(req.user.territorio_id);
                    }
                    metaParams.push(currentYear);

                    db.get(metaQuery, metaParams, (err, metaData) => {
                        if (err) {
                            console.error('Error obteniendo meta:', err);
                            metaData = { meta_total: 2100 };
                        }

                        const metaAnual = metaData.meta_total || 2100;
                        const porcentajeCumplimiento = metaAnual > 0 ? 
                            Math.round((kpis.usuarias_año_actual / metaAnual) * 100 * 100) / 100 : 0;

                        const dashboard = {
                            kpis_principales: {
                                usuarias_año_actual: kpis.usuarias_año_actual || 0,
                                usuarias_mes_actual: kpis.usuarias_mes_actual || 0,
                                meta_anual: Math.round(metaAnual),
                                porcentaje_cumplimiento: porcentajeCumplimiento,
                                registros_pendientes: (kpis.pendientes_validacion || 0) + (kpis.pendientes_aprobacion || 0),
                                comunidades_activas: kpis.comunidades_activas_trimestre || 0
                            },
                            alertas: {
                                pendientes_validacion: kpis.pendientes_validacion || 0,
                                pendientes_aprobacion: kpis.pendientes_aprobacion || 0,
                                cumplimiento_bajo: porcentajeCumplimiento < 75,
                                actividad_baja: (kpis.comunidades_activas_trimestre || 0) < 30
                            },
                            evolucion_mensual: evolucion.reverse(),
                            top_comunidades_mes: topComunidades,
                            periodo: {
                                año: currentYear,
                                mes: currentMonth,
                                ultimo_trimestre: `${Math.max(1, currentMonth - 2)}-${currentMonth}/${currentYear}`
                            },
                            usuario: {
                                email: req.user.email,
                                rol: req.user.rol,
                                territorio: req.user.territorio_id || 'Todos'
                            },
                            fecha_generacion: new Date().toISOString()
                        };

                        console.log(`📊 Dashboard ejecutivo generado para ${req.user.email}`);

                        res.json({
                            success: true,
                            data: dashboard
                        });
                    });
                });
            });
        });

    } catch (error) {
        console.error('❌ Error generando dashboard ejecutivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== MÉTRICAS POR COMUNIDAD =====
router.get('/comunidades/:comunidad_id', authenticateToken, (req, res) => {
    try {
        const { comunidad_id } = req.params;
        const { year = new Date().getFullYear() } = req.query;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Verificar acceso a la comunidad
        let accessQuery = 'SELECT 1 FROM comunidades WHERE id = ?';
        let accessParams = [comunidad_id];

        if (req.user.rol === 'auxiliar_enfermeria') {
            accessQuery = `
                SELECT 1 FROM permisos_comunidad pc
                JOIN comunidades c ON pc.comunidad_id = c.id
                WHERE pc.usuario_id = ? AND pc.comunidad_id = ? AND pc.activo = 1
            `;
            accessParams = [req.user.id, comunidad_id];
        } else if (req.user.rol === 'asistente_tecnico') {
            accessQuery = `
                SELECT 1 FROM comunidades c
                WHERE c.id = ? AND c.territorio_id = ?
            `;
            accessParams = [comunidad_id, req.user.territorio_id];
        }

        db.get(accessQuery, accessParams, (err, access) => {
            if (err || !access) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes acceso a esta comunidad'
                });
            }

            // Obtener información de la comunidad
            const comunidadQuery = `
                SELECT 
                    c.nombre, c.codigo_comunidad, c.poblacion_mef, c.poblacion_total,
                    c.distancia_km, c.acceso_vehicular,
                    t.nombre as territorio,
                    d.nombre as distrito
                FROM comunidades c
                JOIN territorios t ON c.territorio_id = t.id
                JOIN distritos_salud d ON t.distrito_id = d.id
                WHERE c.id = ?
            `;

            db.get(comunidadQuery, [comunidad_id], (err, comunidad) => {
                if (err || !comunidad) {
                    return res.status(404).json({
                        success: false,
                        message: 'Comunidad no encontrada'
                    });
                }

                // Obtener registros de la comunidad
                const registrosQuery = `
                    SELECT 
                        r.mes, r.cantidad_administrada, r.estado,
                        mp.nombre as metodo, mp.categoria
                    FROM registros_mensuales r
                    JOIN metodos_planificacion mp ON r.metodo_id = mp.id
                    WHERE r.comunidad_id = ? AND r.año = ?
                    ORDER BY r.mes, mp.orden_visualizacion
                `;

                db.all(registrosQuery, [comunidad_id, year], (err, registros) => {
                    if (err) {
                        console.error('Error obteniendo registros de comunidad:', err);
                        registros = [];
                    }

                    // Calcular estadísticas
                    const totalUsuarias = registros.reduce((sum, r) => sum + (r.cantidad_administrada || 0), 0);
                    const metodosMasUsados = {};
                    
                    registros.forEach(r => {
                        if (!metodosMasUsados[r.metodo]) {
                            metodosMasUsados[r.metodo] = 0;
                        }
                        metodosMasUsados[r.metodo] += r.cantidad_administrada || 0;
                    });

                    const ranking = Object.entries(metodosMasUsados)
                        .map(([metodo, cantidad]) => ({ metodo, cantidad }))
                        .sort((a, b) => b.cantidad - a.cantidad);

                    const porMes = {};
                    registros.forEach(r => {
                        if (!porMes[r.mes]) {
                            porMes[r.mes] = 0;
                        }
                        porMes[r.mes] += r.cantidad_administrada || 0;
                    });

                    const respuesta = {
                        comunidad: comunidad,
                        año: parseInt(year),
                        resumen: {
                            total_usuarias: totalUsuarias,
                            porcentaje_poblacion_mef: comunidad.poblacion_mef > 0 ? 
                                Math.round((totalUsuarias / comunidad.poblacion_mef) * 100 * 100) / 100 : 0,
                            meses_con_registros: Object.keys(porMes).length,
                            metodos_utilizados: ranking.length
                        },
                        evolucion_mensual: Object.entries(porMes)
                            .map(([mes, cantidad]) => ({ mes: parseInt(mes), cantidad }))
                            .sort((a, b) => a.mes - b.mes),
                        metodos_mas_usados: ranking,
                        registros_detallados: registros
                    };

                    res.json({
                        success: true,
                        data: respuesta
                    });
                });
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo métricas de comunidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== COMPARATIVO ENTRE TERRITORIOS =====
router.get('/territorios/comparativo/:year', authenticateToken, (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Solo encargados y coordinadores pueden ver comparativo completo
        if (!['encargado_sr', 'coordinador_municipal'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver este comparativo'
            });
        }

        const query = `
            SELECT 
                t.nombre as territorio,
                t.codigo as territorio_codigo,
                COUNT(DISTINCT c.id) as total_comunidades,
                COUNT(DISTINCT r.id) as total_registros,
                SUM(r.cantidad_administrada) as total_usuarias,
                SUM(c.poblacion_mef) as poblacion_mef_total,
                COUNT(DISTINCT r.mes) as meses_activos,
                COUNT(DISTINCT r.registrado_por) as auxiliares_activos
            FROM territorios t
            JOIN comunidades c ON t.id = c.territorio_id
            LEFT JOIN registros_mensuales r ON c.id = r.comunidad_id 
                AND r.año = ? AND r.estado IN ('validado', 'aprobado')
            WHERE t.activo = 1 AND c.activa = 1
            GROUP BY t.id
            ORDER BY total_usuarias DESC
        `;

        db.all(query, [year], (err, territorios) => {
            if (err) {
                console.error('Error obteniendo comparativo de territorios:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo comparativo'
                });
            }

            // Calcular totales generales
            const totales = {
                comunidades: territorios.reduce((sum, t) => sum + (t.total_comunidades || 0), 0),
                registros: territorios.reduce((sum, t) => sum + (t.total_registros || 0), 0),
                usuarias: territorios.reduce((sum, t) => sum + (t.total_usuarias || 0), 0),
                poblacion_mef: territorios.reduce((sum, t) => sum + (t.poblacion_mef_total || 0), 0)
            };

            // Calcular métricas por territorio
            const territoriosConMetricas = territorios.map(t => ({
                ...t,
                porcentaje_cobertura: t.poblacion_mef_total > 0 ? 
                    Math.round((t.total_usuarias / t.poblacion_mef_total) * 100 * 100) / 100 : 0,
                promedio_mensual: t.meses_activos > 0 ? 
                    Math.round(t.total_usuarias / t.meses_activos) : 0,
                eficiencia_auxiliares: t.auxiliares_activos > 0 ? 
                    Math.round(t.total_usuarias / t.auxiliares_activos) : 0
            }));

            res.json({
                success: true,
                data: {
                    año: year,
                    resumen_general: {
                        ...totales,
                        cobertura_promedio: totales.poblacion_mef > 0 ? 
                            Math.round((totales.usuarias / totales.poblacion_mef) * 100 * 100) / 100 : 0
                    },
                    territorios: territoriosConMetricas,
                    fecha_generacion: new Date().toISOString()
                }
            });
        });

    } catch (error) {
        console.error('❌ Error generando comparativo de territorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;