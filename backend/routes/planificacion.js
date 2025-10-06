// ===== backend/routes/planificacion.js - VERSIÓN CORREGIDA =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== OBTENER CONFIGURACIÓN DE POBLACIÓN MEF Y PROYECCIONES =====
router.get('/configuracion/:year', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Obtener datos combinados de población y proyecciones, ordenados por ID
        const query = `
            SELECT 
                c.id as comunidad_id,
                c.nombre as comunidad,
                c.codigo_comunidad,
                COALESCE(pm.poblacion_mef, c.poblacion_mef) as poblacion_mef,
                COALESCE(pc.proyeccion_anual, 0) as proyeccion_anual,
                pc.id as proyeccion_id
            FROM comunidades c
            LEFT JOIN poblacion_mef pm ON c.id = pm.comunidad_id AND pm.año = ?
            LEFT JOIN proyecciones_comunidad pc ON c.id = pc.comunidad_id AND pc.año = ?
            WHERE c.territorio_id = 1
            ORDER BY c.id
        `;

        db.all(query, [year, year], (err, datos) => {
            if (err) {
                console.error('Error obteniendo configuración:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo configuración'
                });
            }

            console.log(`📊 Configuración ${year} consultada por ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    año: year,
                    comunidades: datos
                }
            });
        });

    } catch (error) {
        console.error('Error en endpoint configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== GUARDAR CONFIGURACIÓN COMPLETA (COORDINADOR) =====
router.post('/configuracion/guardar/:year', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'Solo el coordinador municipal puede guardar configuración'
            });
        }

        const year = parseInt(req.params.year);
        const { comunidades } = req.body;
        const db = req.app.locals.db;

        if (!db || !Array.isArray(comunidades) || comunidades.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos'
            });
        }

        let procesados = 0;
        const total = comunidades.length;

        comunidades.forEach(comunidad => {
            const { comunidad_id, poblacion_mef, proyeccion_anual } = comunidad;

            // Primero actualizar población MEF
            db.run(`
                INSERT INTO poblacion_mef (comunidad_id, año, poblacion_mef, poblacion_total, fuente, fecha_actualizacion)
                VALUES (?, ?, ?, ?, 'Manual', date('now'))
                ON CONFLICT(comunidad_id, año) 
                DO UPDATE SET 
                    poblacion_mef = excluded.poblacion_mef,
                    fecha_actualizacion = date('now')
            `, [comunidad_id, year, poblacion_mef, poblacion_mef * 2.5], (err) => {
                if (err) {
                    console.error('Error actualizando población MEF:', err);
                }

                // Luego actualizar proyección
                db.run(`
                    INSERT INTO proyecciones_comunidad (comunidad_id, año, poblacion_mef, proyeccion_anual, configurado_por)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(comunidad_id, año, activo) 
                    DO UPDATE SET 
                        poblacion_mef = excluded.poblacion_mef,
                        proyeccion_anual = excluded.proyeccion_anual
                `, [comunidad_id, year, poblacion_mef, proyeccion_anual, req.user.id], (err2) => {
                    procesados++;
                    
                    if (procesados === total) {
                        console.log(`✅ Configuración guardada: ${total} comunidades`);
                        res.json({
                            success: true,
                            message: 'Configuración guardada exitosamente',
                            data: { procesados: total }
                        });
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error guardando configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== GUARDAR DISTRIBUCIÓN MENSUAL CON META_METODO_COMUNIDAD_ID =====
router.post('/planificacion-mensual/guardar', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'Solo el coordinador puede editar planificación mensual'
            });
        }

        const { comunidad_id, metodo_id, año, distribuciones } = req.body;
        const db = req.app.locals.db;

        if (!Array.isArray(distribuciones) || distribuciones.length !== 12) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar distribución para los 12 meses'
            });
        }

        // Obtener el meta_metodo_comunidad_id
        db.get(`
            SELECT mmc.id, mmc.proyeccion_anual_metodo
            FROM metas_metodo_comunidad mmc
            JOIN proyecciones_comunidad pc ON mmc.proyeccion_id = pc.id
            WHERE pc.comunidad_id = ? AND mmc.metodo_id = ? AND mmc.año = ?
        `, [comunidad_id, metodo_id, año], (err, meta) => {
            if (err || !meta) {
                return res.status(404).json({
                    success: false,
                    message: 'Meta no encontrada'
                });
            }

            // Validar que la suma sea exacta
            const suma = distribuciones.reduce((acc, d) => acc + parseInt(d.meta_mensual || 0), 0);
            if (suma !== meta.proyeccion_anual_metodo) {
                return res.status(400).json({
                    success: false,
                    message: `La suma (${suma}) debe ser exactamente ${meta.proyeccion_anual_metodo}`
                });
            }

            let procesados = 0;
            distribuciones.forEach(dist => {
                db.run(`
                    INSERT INTO planificacion_mensual (meta_metodo_comunidad_id, mes, meta_mensual)
                    VALUES (?, ?, ?)
                    ON CONFLICT(meta_metodo_comunidad_id, mes) DO UPDATE SET
                        meta_mensual = excluded.meta_mensual
                `, [meta.id, dist.mes, dist.meta_mensual], (err) => {
                    if (err) console.error('Error guardando mes:', err);
                    
                    procesados++;
                    if (procesados === 12) {
                        res.json({
                            success: true,
                            message: 'Distribución mensual guardada'
                        });
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error guardando distribución:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER PORCENTAJES GLOBALES DE MÉTODOS =====
router.get('/porcentajes-metodos/:year', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        const query = `
            SELECT 
                metodo_id,
                porcentaje_meta
            FROM configuracion_metas_anuales
            WHERE año = ? AND activo = 1
            ORDER BY metodo_id
        `;

        db.all(query, [year], (err, porcentajes) => {
            if (err) {
                console.error('Error obteniendo porcentajes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo porcentajes'
                });
            }

            res.json({
                success: true,
                data: { porcentajes }
            });
        });

    } catch (error) {
        console.error('Error en endpoint porcentajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== GUARDAR PORCENTAJES GLOBALES (COORDINADOR) =====
router.post('/porcentajes-metodos/guardar/:year', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'Solo el coordinador puede modificar porcentajes'
            });
        }

        const year = parseInt(req.params.year);
        const { porcentajes } = req.body;
        const db = req.app.locals.db;

        if (!Array.isArray(porcentajes)) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos'
            });
        }

        // Validar que sume 100%
        const suma = porcentajes.reduce((acc, p) => acc + parseFloat(p.porcentaje_meta), 0);
        if (Math.abs(suma - 100) > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Los porcentajes deben sumar 100% (actualmente: ${suma.toFixed(2)}%)`
            });
        }

        let procesados = 0;
        porcentajes.forEach(p => {
            db.run(`
                UPDATE configuracion_metas_anuales
                SET porcentaje_meta = ?
                WHERE año = ? AND metodo_id = ?
            `, [p.porcentaje_meta, year, p.metodo_id], (err) => {
                if (err) console.error('Error actualizando porcentaje:', err);
                
                procesados++;
                if (procesados === porcentajes.length) {
                    res.json({
                        success: true,
                        message: 'Porcentajes actualizados'
                    });
                }
            });
        });

    } catch (error) {
        console.error('Error guardando porcentajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== REPORTE CONSOLIDADO CON PORCENTAJES =====
router.get('/reporte-consolidado/:year', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        const query = `
            SELECT 
                c.id as comunidad_id,
                c.nombre as comunidad,
                c.codigo_comunidad,
                pc.poblacion_mef,
                pc.proyeccion_anual,
                mp.id as metodo_id,
                mp.nombre as metodo,
                mp.orden_visualizacion,
                cma.porcentaje_meta,
                mmc.proyeccion_anual_metodo
            FROM proyecciones_comunidad pc
            JOIN comunidades c ON pc.comunidad_id = c.id
            CROSS JOIN metodos_planificacion mp
            LEFT JOIN configuracion_metas_anuales cma ON cma.metodo_id = mp.id AND cma.año = ?
            LEFT JOIN metas_metodo_comunidad mmc ON (
                mmc.proyeccion_id = pc.id AND 
                mmc.metodo_id = mp.id AND 
                mmc.año = ?
            )
            WHERE pc.año = ? AND c.territorio_id = 1
            ORDER BY c.id, mp.orden_visualizacion
        `;

        db.all(query, [year, year, year], (err, datos) => {
            if (err) {
                console.error('Error generando consolidado:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error generando consolidado'
                });
            }

            res.json({
                success: true,
                data: {
                    año: year,
                    consolidado: datos
                }
            });
        });

    } catch (error) {
        console.error('Error en consolidado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CALCULAR METAS POR MÉTODO (COORDINADOR) =====
router.post('/calcular-metas/:year', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'Solo el coordinador puede calcular metas'
            });
        }

        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        const query = `
            INSERT INTO metas_metodo_comunidad (proyeccion_id, metodo_id, año, porcentaje_metodo, proyeccion_anual_metodo)
            SELECT 
                pc.id,
                cma.metodo_id,
                pc.año,
                cma.porcentaje_meta,
                CAST(pc.proyeccion_anual * (cma.porcentaje_meta / 100.0) AS INTEGER)
            FROM proyecciones_comunidad pc
            CROSS JOIN configuracion_metas_anuales cma
            WHERE pc.año = ? AND cma.año = ? AND cma.activo = 1
            ON CONFLICT(proyeccion_id, metodo_id, año) DO UPDATE SET
                porcentaje_metodo = excluded.porcentaje_metodo,
                proyeccion_anual_metodo = excluded.proyeccion_anual_metodo
        `;

        db.run(query, [year, year], function(err) {
            if (err) {
                console.error('Error calculando metas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error calculando metas'
                });
            }

            res.json({
                success: true,
                message: `Cálculo completado: ${this.changes} metas generadas`
            });
        });

    } catch (error) {
        console.error('Error calculando metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== GUARDAR METAS INDIVIDUALES EDITADAS (COORDINADOR) =====
router.post('/metas-individuales/guardar', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'Solo el coordinador puede editar metas'
            });
        }

        const { metas } = req.body;
        const db = req.app.locals.db;

        if (!Array.isArray(metas)) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos'
            });
        }

        let procesados = 0;
        metas.forEach(meta => {
            db.run(`
                UPDATE metas_metodo_comunidad
                SET proyeccion_anual_metodo = ?
                WHERE proyeccion_id = (
                    SELECT id FROM proyecciones_comunidad 
                    WHERE comunidad_id = ? AND año = ?
                )
                AND metodo_id = ?
            `, [meta.proyeccion_anual_metodo, meta.comunidad_id, meta.año, meta.metodo_id], (err) => {
                if (err) console.error('Error actualizando meta:', err);
                
                procesados++;
                if (procesados === metas.length) {
                    res.json({
                        success: true,
                        message: 'Metas actualizadas'
                    });
                }
            });
        });

    } catch (error) {
        console.error('Error guardando metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER PLANIFICACIÓN MENSUAL POR MÉTODO =====
router.get('/planificacion-mensual/metodo/:metodoId/:year', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const metodoId = parseInt(req.params.metodoId);
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        const query = `
            SELECT 
                c.id as comunidad_id,
                c.nombre as comunidad,
                mmc.id as meta_metodo_comunidad_id,
                mmc.proyeccion_anual_metodo as meta_anual,
                pm.mes,
                pm.meta_mensual as planificado,
                COALESCE(rm.cantidad_administrada, 0) as ejecutado
            FROM metas_metodo_comunidad mmc
            JOIN proyecciones_comunidad pc ON mmc.proyeccion_id = pc.id
            JOIN comunidades c ON pc.comunidad_id = c.id
            LEFT JOIN planificacion_mensual pm ON pm.meta_metodo_comunidad_id = mmc.id
            LEFT JOIN registros_mensuales rm ON (
                rm.comunidad_id = c.id AND
                rm.metodo_id = mmc.metodo_id AND
                rm.año = mmc.año AND
                rm.mes = pm.mes
            )
            WHERE mmc.metodo_id = ? AND mmc.año = ? AND c.territorio_id = 1
            ORDER BY c.id, pm.mes
        `;

        db.all(query, [metodoId, year], (err, datos) => {
            if (err) {
                console.error('Error obteniendo planificación:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo planificación'
                });
            }

            res.json({
                success: true,
                data: { planificacion: datos }
            });
        });

    } catch (error) {
        console.error('Error en planificación mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER PLANIFICACIÓN MENSUAL POR COMUNIDAD =====
router.get('/planificacion-mensual/comunidad/:comunidadId/:year', authenticateToken, requirePermission('reportes'), (req, res) => {
    try {
        const comunidadId = parseInt(req.params.comunidadId);
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        const query = `
            SELECT 
                mp.id as metodo_id,
                mp.nombre as metodo,
                mmc.id as meta_metodo_comunidad_id,
                mmc.proyeccion_anual_metodo as meta_anual,
                pm.mes,
                pm.meta_mensual as planificado,
                COALESCE(rm.cantidad_administrada, 0) as ejecutado
            FROM metas_metodo_comunidad mmc
            JOIN proyecciones_comunidad pc ON mmc.proyeccion_id = pc.id
            JOIN metodos_planificacion mp ON mmc.metodo_id = mp.id
            LEFT JOIN planificacion_mensual pm ON pm.meta_metodo_comunidad_id = mmc.id
            LEFT JOIN registros_mensuales rm ON (
                rm.comunidad_id = pc.comunidad_id AND
                rm.metodo_id = mmc.metodo_id AND
                rm.año = mmc.año AND
                rm.mes = pm.mes
            )
            WHERE pc.comunidad_id = ? AND mmc.año = ?
            ORDER BY mp.orden_visualizacion, pm.mes
        `;

        db.all(query, [comunidadId, year], (err, datos) => {
            if (err) {
                console.error('Error obteniendo planificación:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo planificación'
                });
            }

            res.json({
                success: true,
                data: { planificacion: datos }
            });
        });

    } catch (error) {
        console.error('Error en planificación mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== GUARDAR DISTRIBUCIÓN MENSUAL SIMPLIFICADO =====
router.post('/planificacion-mensual/guardar', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'Solo el coordinador puede editar planificación mensual'
            });
        }

        const { meta_metodo_comunidad_id, meta_anual, distribuciones } = req.body;
        const db = req.app.locals.db;

        if (!meta_metodo_comunidad_id || !Array.isArray(distribuciones) || distribuciones.length !== 12) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos'
            });
        }

        // Validar que la suma sea exacta
        const suma = distribuciones.reduce((acc, d) => acc + parseInt(d.meta_mensual || 0), 0);
        if (suma !== meta_anual) {
            return res.status(400).json({
                success: false,
                message: `La suma (${suma}) debe ser exactamente ${meta_anual}`
            });
        }

        let procesados = 0;
        let errores = 0;

        distribuciones.forEach(dist => {
            db.run(`
                INSERT INTO planificacion_mensual (meta_metodo_comunidad_id, mes, meta_mensual)
                VALUES (?, ?, ?)
                ON CONFLICT(meta_metodo_comunidad_id, mes) DO UPDATE SET
                    meta_mensual = excluded.meta_mensual
            `, [meta_metodo_comunidad_id, dist.mes, dist.meta_mensual], (err) => {
                if (err) {
                    console.error('Error guardando mes:', err);
                    errores++;
                } else {
                    procesados++;
                }
                
                if (procesados + errores === 12) {
                    if (errores === 0) {
                        res.json({
                            success: true,
                            message: 'Distribución mensual guardada'
                        });
                    } else {
                        res.status(500).json({
                            success: false,
                            message: `Errores al guardar: ${errores} de 12`
                        });
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error guardando distribución:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ASEGURAR QUE EXISTA META_METODO_COMUNIDAD =====
router.post('/asegurar-meta', authenticateToken, (req, res) => {
    try {
        const { comunidad_id, metodo_id, año } = req.body;
        const db = req.app.locals.db;

        // Obtener proyección de la comunidad
        db.get(`
            SELECT id, proyeccion_anual 
            FROM proyecciones_comunidad 
            WHERE comunidad_id = ? AND año = ?
        `, [comunidad_id, año], (err, proyeccion) => {
            if (err || !proyeccion) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyección no encontrada'
                });
            }

            // Obtener porcentaje del método
            db.get(`
                SELECT porcentaje_meta 
                FROM configuracion_metas_anuales 
                WHERE metodo_id = ? AND año = ?
            `, [metodo_id, año], (err2, config) => {
                if (err2 || !config) {
                    return res.status(404).json({
                        success: false,
                        message: 'Configuración de meta no encontrada'
                    });
                }

                const proyeccion_metodo = Math.round(proyeccion.proyeccion_anual * (config.porcentaje_meta / 100.0));

                // Insertar o actualizar meta
                db.run(`
                    INSERT INTO metas_metodo_comunidad (proyeccion_id, metodo_id, año, porcentaje_metodo, proyeccion_anual_metodo)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(proyeccion_id, metodo_id, año) DO UPDATE SET
                        porcentaje_metodo = excluded.porcentaje_metodo,
                        proyeccion_anual_metodo = excluded.proyeccion_anual_metodo
                    RETURNING id
                `, [proyeccion.id, metodo_id, año, config.porcentaje_meta, proyeccion_metodo], function(err3) {
                    if (err3) {
                        console.error('Error creando meta:', err3);
                        return res.status(500).json({
                            success: false,
                            message: 'Error creando meta'
                        });
                    }

                    res.json({
                        success: true,
                        data: {
                            meta_metodo_comunidad_id: this.lastID,
                            proyeccion_anual_metodo: proyeccion_metodo
                        }
                    });
                });
            });
        });

    } catch (error) {
        console.error('Error asegurando meta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// LLENAR LAS CAJAS VACÍAS (ejecutar solo una vez)
router.post('/inicializar/:year', authenticateToken, (req, res) => {
    const year = parseInt(req.params.year);
    const db = req.app.locals.db;

    // Paso 1: Llenar proyecciones
    db.run(`
        INSERT OR IGNORE INTO proyecciones_comunidad (comunidad_id, año, poblacion_mef, configurado_por)
        SELECT id, ?, poblacion_mef, ?
        FROM comunidades
        WHERE territorio_id = 1
    `, [year, req.user.id], function(err) {
        if (err) {
            console.error('Error paso 1:', err);
            return res.json({ success: false, message: 'Error paso 1' });
        }

        // Paso 2: Llenar metas por método
        db.run(`
            INSERT OR IGNORE INTO metas_metodo_comunidad (proyeccion_id, metodo_id, año, porcentaje_metodo, proyeccion_anual_metodo)
            SELECT pc.id, cma.metodo_id, pc.año, cma.porcentaje_meta,
                   CAST(pc.proyeccion_anual * (cma.porcentaje_meta / 100.0) AS INTEGER)
            FROM proyecciones_comunidad pc
            CROSS JOIN configuracion_metas_anuales cma
            WHERE pc.año = ? AND cma.año = ?
        `, [year, year], function(err2) {
            if (err2) {
                console.error('Error paso 2:', err2);
                return res.json({ success: false, message: 'Error paso 2' });
            }

            // Paso 3: NUEVO - Crear planificación mensual en 0 para todos
            db.run(`
                INSERT OR IGNORE INTO planificacion_mensual (meta_metodo_comunidad_id, mes, meta_mensual)
                SELECT mmc.id, m.mes, 0
                FROM metas_metodo_comunidad mmc
                CROSS JOIN (
                    SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
                    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 
                    UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
                ) m
                WHERE mmc.año = ?
            `, [year], function(err3) {
                if (err3) {
                    console.error('Error paso 3:', err3);
                    return res.json({ success: false, message: 'Error paso 3' });
                }

                res.json({ 
                    success: true, 
                    message: 'Sistema completamente inicializado' 
                });
            });
        });
    });
});

module.exports = router;