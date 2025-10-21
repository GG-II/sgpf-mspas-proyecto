// ===== BACKEND: ROUTES/REPORTES.JS - SISTEMA COMPLETO DE REPORTES =====
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// ===== MIDDLEWARE: VERIFICAR PERMISOS DE REPORTES =====
const requireReportPermission = (req, res, next) => {
    const rol = req.user.rol;
    
    // Solo coordinadores y encargados pueden ver reportes completos
    if (rol !== 'coordinador_municipal' && rol !== 'encargado_sr') {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a reportes ejecutivos'
        });
    }
    
    next();
};

// ===== 1. PROYECCIÓN GENERAL (Todos los métodos por territorio) =====
router.get('/proyeccion-general/:year', authenticateToken, requireReportPermission, (req, res) => {
    const { year } = req.params;
    const db = req.app.locals.db;
    
    try {
        console.log(`📊 Generando proyección general ${year}`);
        
        const query = `
            SELECT 
                t.id as territorio_id,
                t.nombre as territorio,
                t.codigo as codigo_territorio,
                SUM(c.poblacion_mef) as mef_total,
                SUM(
                    CASE 
                        WHEN pc.es_manual = 1 THEN pc.proyeccion_manual
                        ELSE pc.proyeccion_anual
                    END
                ) as proyeccion_anual_total
            FROM territorios t
            LEFT JOIN comunidades c ON t.id = c.territorio_id AND c.activa = 1
            LEFT JOIN proyecciones_comunidad pc ON c.id = pc.comunidad_id 
                AND pc.año = ? AND pc.activo = 1
            WHERE t.activo = 1
            GROUP BY t.id
            ORDER BY t.nombre
        `;
        
        db.all(query, [year], (err, territorios) => {
            if (err) {
                console.error('❌ Error en proyección general:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error generando proyección general'
                });
            }
            
            // Obtener proyección por método para cada territorio
            const queryMetodos = `
                SELECT 
                    t.id as territorio_id,
                    m.id as metodo_id,
                    m.nombre as metodo_nombre,
                    m.nombre_corto,
                    SUM(mmc.proyeccion_anual_metodo) as proyeccion_metodo
                FROM territorios t
                LEFT JOIN comunidades c ON t.id = c.territorio_id AND c.activa = 1
                LEFT JOIN proyecciones_comunidad pc ON c.id = pc.comunidad_id 
                    AND pc.año = ? AND pc.activo = 1
                LEFT JOIN metas_metodo_comunidad mmc ON pc.id = mmc.proyeccion_id
                LEFT JOIN metodos_planificacion m ON mmc.metodo_id = m.id
                WHERE t.activo = 1 AND m.activo = 1
                GROUP BY t.id, m.id
                ORDER BY t.nombre, m.orden_visualizacion
            `;
            
            db.all(queryMetodos, [year], (err, metodos) => {
                if (err) {
                    console.error('❌ Error en métodos:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error obteniendo métodos'
                    });
                }
                
                // Agrupar métodos por territorio
                const territoriosConMetodos = territorios.map(territorio => {
                    const metodosDelTerritorio = metodos
                        .filter(m => m.territorio_id === territorio.territorio_id)
                        .reduce((acc, m) => {
                            acc[m.metodo_nombre] = m.proyeccion_metodo || 0;
                            return acc;
                        }, {});
                    
                    return {
                        ...territorio,
                        metodos: metodosDelTerritorio
                    };
                });
                
                console.log(`✅ Proyección general ${year} generada: ${territorios.length} territorios`);
                
                res.json({
                    success: true,
                    año: parseInt(year),
                    data: territoriosConMetodos,
                    generado_por: req.user.email,
                    fecha_generacion: new Date().toISOString()
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en proyección general:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 2. PROYECCIÓN POR MÉTODO (Desglose mensual por territorio) =====
router.get('/proyeccion-metodo/:year/:metodoId', authenticateToken, requireReportPermission, (req, res) => {
    const { year, metodoId } = req.params;
    const db = req.app.locals.db;
    
    try {
        console.log(`📊 Generando proyección método ${metodoId} año ${year}`);
        
        // Primero obtener info del método
        db.get('SELECT * FROM metodos_planificacion WHERE id = ?', [metodoId], (err, metodo) => {
            if (err || !metodo) {
                return res.status(404).json({
                    success: false,
                    message: 'Método no encontrado'
                });
            }
            
            const query = `
                SELECT 
                    t.id as territorio_id,
                    t.nombre as territorio,
                    t.codigo,
                    SUM(c.poblacion_mef) as mef_total,
                    SUM(mmc.proyeccion_anual_metodo) as proyeccion_anual
                FROM territorios t
                LEFT JOIN comunidades c ON t.id = c.territorio_id AND c.activa = 1
                LEFT JOIN proyecciones_comunidad pc ON c.id = pc.comunidad_id 
                    AND pc.año = ? AND pc.activo = 1
                LEFT JOIN metas_metodo_comunidad mmc ON pc.id = mmc.proyeccion_id 
                    AND mmc.metodo_id = ?
                WHERE t.activo = 1
                GROUP BY t.id
                ORDER BY t.nombre
            `;
            
            db.all(query, [year, metodoId], (err, territorios) => {
                if (err) {
                    console.error('❌ Error obteniendo territorios:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error obteniendo datos del método'
                    });
                }
                
                // Obtener distribución mensual y registros ejecutados
                const queryMensual = `
                    SELECT 
                        t.id as territorio_id,
                        pm.mes,
                        SUM(pm.meta_mensual) as proyectado
                    FROM territorios t
                    LEFT JOIN comunidades c ON t.id = c.territorio_id AND c.activa = 1
                    LEFT JOIN proyecciones_comunidad pc ON c.id = pc.comunidad_id 
                        AND pc.año = ? AND pc.activo = 1
                    LEFT JOIN metas_metodo_comunidad mmc ON pc.id = mmc.proyeccion_id 
                        AND mmc.metodo_id = ?
                    LEFT JOIN planificacion_mensual pm ON mmc.id = pm.meta_metodo_comunidad_id
                    WHERE t.activo = 1
                    GROUP BY t.id, pm.mes
                    ORDER BY t.id, pm.mes
                `;
                
                db.all(queryMensual, [year, metodoId], (err, meses) => {
                    if (err) {
                        console.error('❌ Error obteniendo meses:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error obteniendo distribución mensual'
                        });
                    }
                    
                    // Obtener registros ejecutados por mes
                    const queryEjecutado = `
                        SELECT 
                            t.id as territorio_id,
                            CAST(strftime('%m', v.fecha_visita) AS INTEGER) as mes,
                            COUNT(*) as ejecutado
                        FROM territorios t
                        LEFT JOIN comunidades c ON t.id = c.territorio_id AND c.activa = 1
                        LEFT JOIN usuarias u ON c.id = u.comunidad_id
                        LEFT JOIN visitas v ON u.id = v.usuaria_id 
                            AND v.metodo_id = ?
                            AND strftime('%Y', v.fecha_visita) = ?
                            AND v.estado = 'validado'
                        WHERE t.activo = 1
                        GROUP BY t.id, mes
                    `;
                    
                    db.all(queryEjecutado, [metodoId, year], (err, ejecutados) => {
                        if (err) {
                            console.error('❌ Error obteniendo ejecutados:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error obteniendo registros ejecutados'
                            });
                        }
                        
                        // Consolidar datos
                        const territoriosConDetalle = territorios.map(territorio => {
                            const proyectadoMensual = Array(12).fill(0);
                            const ejecutadoMensual = Array(12).fill(0);
                            
                            // Llenar proyectado
                            meses
                                .filter(m => m.territorio_id === territorio.territorio_id)
                                .forEach(m => {
                                    if (m.mes >= 1 && m.mes <= 12) {
                                        proyectadoMensual[m.mes - 1] = m.proyectado || 0;
                                    }
                                });
                            
                            // Llenar ejecutado
                            ejecutados
                                .filter(e => e.territorio_id === territorio.territorio_id)
                                .forEach(e => {
                                    if (e.mes >= 1 && e.mes <= 12) {
                                        ejecutadoMensual[e.mes - 1] = e.ejecutado || 0;
                                    }
                                });
                            
                            const totalProyectado = proyectadoMensual.reduce((a, b) => a + b, 0);
                            const totalEjecutado = ejecutadoMensual.reduce((a, b) => a + b, 0);
                            const porcentaje = totalProyectado > 0 ? 
                                Math.round((totalEjecutado / totalProyectado) * 1000) / 10 : 0;
                            
                            return {
                                ...territorio,
                                proyectado_mensual: proyectadoMensual,
                                ejecutado_mensual: ejecutadoMensual,
                                total_proyectado: totalProyectado,
                                total_ejecutado: totalEjecutado,
                                porcentaje_alcanzado: porcentaje
                            };
                        });
                        
                        console.log(`✅ Proyección método ${metodo.nombre} generada`);
                        
                        res.json({
                            success: true,
                            año: parseInt(year),
                            metodo: {
                                id: metodo.id,
                                nombre: metodo.nombre,
                                nombre_corto: metodo.nombre_corto,
                                categoria: metodo.categoria
                            },
                            data: territoriosConDetalle,
                            generado_por: req.user.email,
                            fecha_generacion: new Date().toISOString()
                        });
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en proyección método:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 3. PROYECCIÓN POR TERRITORIO (Desglose de métodos) =====
router.get('/proyeccion-territorio/:year/:territorioId', authenticateToken, requireReportPermission, (req, res) => {
    const { year, territorioId } = req.params;
    const db = req.app.locals.db;
    
    try {
        console.log(`📊 Generando proyección territorio ${territorioId} año ${year}`);
        
        // Obtener info del territorio
        db.get('SELECT * FROM territorios WHERE id = ?', [territorioId], (err, territorio) => {
            if (err || !territorio) {
                return res.status(404).json({
                    success: false,
                    message: 'Territorio no encontrado'
                });
            }
            
            const query = `
                SELECT 
                    m.id as metodo_id,
                    m.nombre as metodo_nombre,
                    m.nombre_corto,
                    m.categoria,
                    SUM(c.poblacion_mef) as mef_total,
                    SUM(mmc.proyeccion_anual_metodo) as proyeccion_anual
                FROM metodos_planificacion m
                LEFT JOIN metas_metodo_comunidad mmc ON m.id = mmc.metodo_id
                LEFT JOIN proyecciones_comunidad pc ON mmc.proyeccion_id = pc.id 
                    AND pc.año = ? AND pc.activo = 1
                LEFT JOIN comunidades c ON pc.comunidad_id = c.id 
                    AND c.territorio_id = ? AND c.activa = 1
                WHERE m.activo = 1
                GROUP BY m.id
                ORDER BY m.orden_visualizacion
            `;
            
            db.all(query, [year, territorioId], (err, metodos) => {
                if (err) {
                    console.error('❌ Error obteniendo métodos:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error obteniendo datos del territorio'
                    });
                }
                
                // Similar a proyección por método pero agrupando por métodos
                const queryMensual = `
                    SELECT 
                        m.id as metodo_id,
                        pm.mes,
                        SUM(pm.meta_mensual) as proyectado
                    FROM metodos_planificacion m
                    LEFT JOIN metas_metodo_comunidad mmc ON m.id = mmc.metodo_id
                    LEFT JOIN proyecciones_comunidad pc ON mmc.proyeccion_id = pc.id 
                        AND pc.año = ? AND pc.activo = 1
                    LEFT JOIN comunidades c ON pc.comunidad_id = c.id 
                        AND c.territorio_id = ? AND c.activa = 1
                    LEFT JOIN planificacion_mensual pm ON mmc.id = pm.meta_metodo_comunidad_id
                    WHERE m.activo = 1
                    GROUP BY m.id, pm.mes
                `;
                
                db.all(queryMensual, [year, territorioId], (err, meses) => {
                    if (err) {
                        console.error('❌ Error obteniendo meses:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error obteniendo distribución mensual'
                        });
                    }
                    
                    const queryEjecutado = `
                        SELECT 
                            v.metodo_id,
                            CAST(strftime('%m', v.fecha_visita) AS INTEGER) as mes,
                            COUNT(*) as ejecutado
                        FROM visitas v
                        INNER JOIN usuarias u ON v.usuaria_id = u.id
                        INNER JOIN comunidades c ON u.comunidad_id = c.id
                        WHERE c.territorio_id = ?
                          AND strftime('%Y', v.fecha_visita) = ?
                          AND v.estado = 'validado'
                        GROUP BY v.metodo_id, mes
                    `;
                    
                    db.all(queryEjecutado, [territorioId, year], (err, ejecutados) => {
                        if (err) {
                            console.error('❌ Error obteniendo ejecutados:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error obteniendo registros ejecutados'
                            });
                        }
                        
                        const metodosConDetalle = metodos.map(metodo => {
                            const proyectadoMensual = Array(12).fill(0);
                            const ejecutadoMensual = Array(12).fill(0);
                            
                            meses
                                .filter(m => m.metodo_id === metodo.metodo_id)
                                .forEach(m => {
                                    if (m.mes >= 1 && m.mes <= 12) {
                                        proyectadoMensual[m.mes - 1] = m.proyectado || 0;
                                    }
                                });
                            
                            ejecutados
                                .filter(e => e.metodo_id === metodo.metodo_id)
                                .forEach(e => {
                                    if (e.mes >= 1 && e.mes <= 12) {
                                        ejecutadoMensual[e.mes - 1] = e.ejecutado || 0;
                                    }
                                });
                            
                            const totalProyectado = proyectadoMensual.reduce((a, b) => a + b, 0);
                            const totalEjecutado = ejecutadoMensual.reduce((a, b) => a + b, 0);
                            const porcentaje = totalProyectado > 0 ? 
                                Math.round((totalEjecutado / totalProyectado) * 1000) / 10 : 0;
                            
                            return {
                                ...metodo,
                                proyectado_mensual: proyectadoMensual,
                                ejecutado_mensual: ejecutadoMensual,
                                total_proyectado: totalProyectado,
                                total_ejecutado: totalEjecutado,
                                porcentaje_alcanzado: porcentaje
                            };
                        });
                        
                        console.log(`✅ Proyección territorio ${territorio.nombre} generada`);
                        
                        res.json({
                            success: true,
                            año: parseInt(year),
                            territorio: {
                                id: territorio.id,
                                nombre: territorio.nombre,
                                codigo: territorio.codigo
                            },
                            data: metodosConDetalle,
                            generado_por: req.user.email,
                            fecha_generacion: new Date().toISOString()
                        });
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en proyección territorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 4. LISTADO DE USUARIAS =====
router.get('/usuarias/listado', authenticateToken, requireReportPermission, (req, res) => {
    const db = req.app.locals.db;
    
    try {
        console.log('📋 Generando listado de usuarias');
        
        const query = `
            SELECT 
                u.id,
                u.dpi,
                u.nombres,
                u.apellidos,
                u.tipo_usuaria,
                u.fecha_nacimiento,
                u.telefono,
                u.activa,
                c.nombre as comunidad,
                t.nombre as territorio,
                u.fecha_primera_visita,
                u.fecha_ultima_visita,
                u.total_visitas,
                (SELECT COUNT(*) FROM visitas WHERE usuaria_id = u.id) as total_registros
            FROM usuarias u
            INNER JOIN comunidades c ON u.comunidad_id = c.id
            INNER JOIN territorios t ON c.territorio_id = t.id
            WHERE u.activa = 1
            ORDER BY u.apellidos, u.nombres
        `;
        
        db.all(query, [], (err, usuarias) => {
            if (err) {
                console.error('❌ Error obteniendo usuarias:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo listado de usuarias'
                });
            }
            
            console.log(`✅ Listado generado: ${usuarias.length} usuarias`);
            
            res.json({
                success: true,
                data: usuarias,
                total: usuarias.length,
                generado_por: req.user.email,
                fecha_generacion: new Date().toISOString()
            });
        });
        
    } catch (error) {
        console.error('❌ Error en listado usuarias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 5. FICHA INDIVIDUAL DE USUARIA =====
router.get('/usuaria/:id', authenticateToken, requireReportPermission, (req, res) => {
    const { id } = req.params;
    const db = req.app.locals.db;
    
    try {
        console.log(`📄 Generando ficha usuaria ${id}`);
        
        // Datos personales
        const queryUsuaria = `
            SELECT 
                u.*,
                c.nombre as comunidad,
                c.codigo_comunidad,
                t.nombre as territorio,
                t.codigo as codigo_territorio,
                usr.nombres as registrado_por_nombre,
                usr.apellidos as registrado_por_apellido
            FROM usuarias u
            INNER JOIN comunidades c ON u.comunidad_id = c.id
            INNER JOIN territorios t ON c.territorio_id = t.id
            INNER JOIN usuarios usr ON u.creada_por = usr.id
            WHERE u.id = ?
        `;
        
        db.get(queryUsuaria, [id], (err, usuaria) => {
            if (err || !usuaria) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuaria no encontrada'
                });
            }
            
            // Historial de visitas
            const queryVisitas = `
                SELECT 
                    v.id,
                    v.fecha_visita,
                    v.observaciones,
                    v.estado,
                    m.nombre as metodo,
                    m.categoria,
                    usr.nombres as registrado_por_nombre,
                    usr.apellidos as registrado_por_apellido,
                    val.nombres as validado_por_nombre,
                    val.apellidos as validado_por_apellido,
                    v.fecha_hora_validacion
                FROM visitas v
                INNER JOIN metodos_planificacion m ON v.metodo_id = m.id
                INNER JOIN usuarios usr ON v.registrado_por = usr.id
                LEFT JOIN usuarios val ON v.validado_por = val.id
                WHERE v.usuaria_id = ?
                ORDER BY v.fecha_visita DESC
            `;
            
            db.all(queryVisitas, [id], (err, visitas) => {
                if (err) {
                    console.error('❌ Error obteniendo visitas:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error obteniendo historial'
                    });
                }
                
                // Estadísticas de métodos usados
                const queryMetodos = `
                    SELECT 
                        m.nombre as metodo,
                        m.categoria,
                        COUNT(*) as veces_usado,
                        MAX(v.fecha_visita) as ultima_vez
                    FROM visitas v
                    INNER JOIN metodos_planificacion m ON v.metodo_id = m.id
                    WHERE v.usuaria_id = ?
                    GROUP BY m.id
                    ORDER BY veces_usado DESC
                `;
                
                db.all(queryMetodos, [id], (err, metodos) => {
                    if (err) {
                        console.error('❌ Error obteniendo métodos:', err);
                        metodos = [];
                    }
                    
                    console.log(`✅ Ficha usuaria ${usuaria.nombres} ${usuaria.apellidos} generada`);
                    
                    res.json({
                        success: true,
                        data: {
                            usuaria: usuaria,
                            historial_visitas: visitas,
                            metodos_utilizados: metodos,
                            resumen: {
                                total_visitas: visitas.length,
                                metodos_diferentes: metodos.length,
                                primera_visita: usuaria.fecha_primera_visita,
                                ultima_visita: usuaria.fecha_ultima_visita
                            }
                        },
                        generado_por: req.user.email,
                        fecha_generacion: new Date().toISOString()
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en ficha usuaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 6. CONSULTAS RÁPIDAS (KPIs y porcentajes) =====
router.get('/consultas-rapidas/:year', authenticateToken, requireReportPermission, (req, res) => {
    const { year } = req.params;
    const db = req.app.locals.db;
    
    try {
        console.log(`⚡ Generando consultas rápidas ${year}`);
        
        // Cumplimiento general
        const queryGeneral = `
            SELECT 
                SUM(
                    CASE 
                        WHEN pc.es_manual = 1 THEN pc.proyeccion_manual
                        ELSE pc.proyeccion_anual
                    END
                ) as proyeccion_total,
                (SELECT COUNT(*) 
                 FROM visitas v
                 INNER JOIN usuarias u ON v.usuaria_id = u.id
                 WHERE strftime('%Y', v.fecha_visita) = ?
                   AND v.estado = 'validado'
                ) as ejecutado_total
            FROM proyecciones_comunidad pc
            WHERE pc.año = ? AND pc.activo = 1
        `;
        
        db.get(queryGeneral, [year, year], (err, general) => {
            if (err) {
                console.error('❌ Error en cumplimiento general:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo cumplimiento general'
                });
            }
            
            // Cumplimiento por territorio
            const queryTerritorios = `
                SELECT 
                    t.id,
                    t.nombre as territorio,
                    SUM(
                        CASE 
                            WHEN pc.es_manual = 1 THEN pc.proyeccion_manual
                            ELSE pc.proyeccion_anual
                        END
                    ) as proyeccion,
                    (SELECT COUNT(*) 
                     FROM visitas v
                     INNER JOIN usuarias u ON v.usuaria_id = u.id
                     INNER JOIN comunidades c ON u.comunidad_id = c.id
                     WHERE c.territorio_id = t.id
                       AND strftime('%Y', v.fecha_visita) = ?
                       AND v.estado = 'validado'
                    ) as ejecutado
                FROM territorios t
                LEFT JOIN comunidades c ON t.id = c.territorio_id AND c.activa = 1
                LEFT JOIN proyecciones_comunidad pc ON c.id = pc.comunidad_id 
                    AND pc.año = ? AND pc.activo = 1
                WHERE t.activo = 1
                GROUP BY t.id
                ORDER BY t.nombre
            `;
            
            db.all(queryTerritorios, [year, year], (err, territorios) => {
                if (err) {
                    console.error('❌ Error en territorios:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error obteniendo cumplimiento por territorio'
                    });
                }
                
                // Cumplimiento por método
                const queryMetodos = `
                    SELECT 
                        m.id,
                        m.nombre as metodo,
                        m.nombre_corto,
                        m.categoria,
                        SUM(mmc.proyeccion_anual_metodo) as proyeccion,
                        (SELECT COUNT(*) 
                         FROM visitas v
                         WHERE v.metodo_id = m.id
                           AND strftime('%Y', v.fecha_visita) = ?
                           AND v.estado = 'validado'
                        ) as ejecutado
                    FROM metodos_planificacion m
                    LEFT JOIN metas_metodo_comunidad mmc ON m.id = mmc.metodo_id 
                        AND mmc.año = ?
                    WHERE m.activo = 1
                    GROUP BY m.id
                    ORDER BY m.orden_visualizacion
                `;
                
                db.all(queryMetodos, [year, year], (err, metodos) => {
                    if (err) {
                        console.error('❌ Error en métodos:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error obteniendo cumplimiento por método'
                        });
                    }
                    
                    // Calcular porcentajes
                    const porcentajeGeneral = general.proyeccion_total > 0 ? 
                        Math.round((general.ejecutado_total / general.proyeccion_total) * 1000) / 10 : 0;
                    
                    const territoriosConPorcentaje = territorios.map(t => ({
                        ...t,
                        porcentaje: t.proyeccion > 0 ? 
                            Math.round((t.ejecutado / t.proyeccion) * 1000) / 10 : 0
                    }));
                    
                    const metodosConPorcentaje = metodos.map(m => ({
                        ...m,
                        porcentaje: m.proyeccion > 0 ? 
                            Math.round((m.ejecutado / m.proyeccion) * 1000) / 10 : 0
                    }));
                    
                    console.log(`✅ Consultas rápidas ${year} generadas`);
                    
                    res.json({
                        success: true,
                        año: parseInt(year),
                        data: {
                            cumplimiento_general: {
                                proyeccion: general.proyeccion_total || 0,
                                ejecutado: general.ejecutado_total || 0,
                                porcentaje: porcentajeGeneral
                            },
                            por_territorio: territoriosConPorcentaje,
                            por_metodo: metodosConPorcentaje
                        },
                        generado_por: req.user.email,
                        fecha_generacion: new Date().toISOString()
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en consultas rápidas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 7. OBTENER LISTA DE MÉTODOS (para selectores) =====
router.get('/metodos', authenticateToken, (req, res) => {
    const db = req.app.locals.db;
    
    try {
        const query = `
            SELECT id, nombre, nombre_corto, categoria
            FROM metodos_planificacion
            WHERE activo = 1
            ORDER BY orden_visualizacion
        `;
        
        db.all(query, [], (err, metodos) => {
            if (err) {
                console.error('❌ Error obteniendo métodos:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo métodos'
                });
            }
            
            res.json({
                success: true,
                data: metodos
            });
        });
        
    } catch (error) {
        console.error('❌ Error en métodos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 8. OBTENER LISTA DE TERRITORIOS (para selectores) =====
router.get('/territorios', authenticateToken, (req, res) => {
    const db = req.app.locals.db;
    
    try {
        const query = `
            SELECT id, nombre, codigo
            FROM territorios
            WHERE activo = 1
            ORDER BY nombre
        `;
        
        db.all(query, [], (err, territorios) => {
            if (err) {
                console.error('❌ Error obteniendo territorios:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo territorios'
                });
            }
            
            res.json({
                success: true,
                data: territorios
            });
        });
        
    } catch (error) {
        console.error('❌ Error en territorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;