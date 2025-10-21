// backend/routes/planificacion.js - ADAPTADO PARA SQLITE
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// ===== MIDDLEWARES =====
const requireConfigPermission = (req, res, next) => {
    const rol = req.user.rol;
    
    if (rol !== 'coordinador_municipal' && rol !== 'encargado_sr') {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para configurar planificación'
        });
    }
    
    next();
};

// ===== FUNCIONES AUXILIARES =====
function calcularProyeccion(mef, manual = null) {
    // Si hay proyección manual, usarla
    if (manual !== null && manual !== undefined) {
        return parseInt(manual);
    }
    // Sino, calcular automáticamente
    const calculado = Math.round((mef * 0.35) - 70);
    return Math.max(0, calculado); // No permitir negativos
}

function distribuirProyeccionEnMetodos(proyeccionAnual, porcentajes) {
    const distribucion = [];
    let sumaDistribuida = 0;
    
    porcentajes.forEach(metodo => {
        const calculado = proyeccionAnual * (metodo.porcentaje_meta / 100.0);
        const redondeado = Math.floor(calculado); // ⬇️ Siempre hacia abajo
        
        distribucion.push({
            metodo_id: metodo.metodo_id,
            metodo_nombre: metodo.nombre || metodo.metodo_nombre,
            porcentaje: metodo.porcentaje_meta,
            calculado_exacto: calculado,
            asignado: redondeado
        });
        
        sumaDistribuida += redondeado;
    });
    
    const sobrantes = proyeccionAnual - sumaDistribuida;
    
    return {
        distribucion: distribucion,
        suma_distribuida: sumaDistribuida,
        sobrantes: sobrantes,
        proyeccion_total: proyeccionAnual
    };
}

function validarSumaPorcentajes(porcentajes) {
    const suma = porcentajes.reduce((acc, p) => acc + parseFloat(p.porcentaje_meta || 0), 0);
    const redondeado = Math.round(suma * 100) / 100;
    return redondeado === 100.0;
}

function validarSumaMensual(meses, metaAnual) {
    const suma = meses.reduce((acc, val) => acc + parseInt(val || 0), 0);
    return suma === parseInt(metaAnual);
}

// ===== 1. OBTENER AÑOS DISPONIBLES =====
router.get('/anios', authenticateToken, (req, res) => {
    const db = req.app.locals.db;
    
    try {
        const query = `
            SELECT DISTINCT año
            FROM configuracion_metas_anuales
            WHERE activo = 1
            ORDER BY año DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('❌ Error obteniendo años:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener años disponibles'
                });
            }
            
            const anios = rows.map(row => row.año);
            
            res.json({
                success: true,
                data: anios,
                anio_actual: new Date().getFullYear()
            });
        });
        
    } catch (error) {
        console.error('❌ Error en GET /anios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 2. OBTENER PORCENTAJES GLOBALES =====
router.get('/porcentajes/:anio', authenticateToken, (req, res) => {
    const { anio } = req.params;
    const db = req.app.locals.db;
    
    try {
        const query = `
            SELECT 
                cma.id,
                cma.año,
                cma.metodo_id,
                m.nombre as metodo_nombre,
                m.codigo_metodo,
                m.categoria,
                cma.porcentaje_meta,
                cma.observaciones,
                cma.fecha_aprobacion,
                cma.activo
            FROM configuracion_metas_anuales cma
            INNER JOIN metodos_planificacion m ON cma.metodo_id = m.id
            WHERE cma.año = ? AND cma.activo = 1
            ORDER BY m.orden_visualizacion
        `;
        
        db.all(query, [anio], (err, rows) => {
            if (err) {
                console.error('❌ Error obteniendo porcentajes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener configuración de porcentajes'
                });
            }
            
            if (!rows || rows.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: `No hay configuración para el año ${anio}`
                });
            }
            
            const sumaTotal = rows.reduce((acc, row) => acc + parseFloat(row.porcentaje_meta), 0);
            const sumaValida = Math.abs(sumaTotal - 100.0) < 0.01;
            
            res.json({
                success: true,
                data: rows,
                suma_total: Math.round(sumaTotal * 100) / 100,
                suma_valida: sumaValida
            });
        });
        
    } catch (error) {
        console.error('❌ Error en GET /porcentajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 3. ACTUALIZAR PORCENTAJES =====
router.put('/porcentajes/:anio', authenticateToken, requireConfigPermission, (req, res) => {
    const { anio } = req.params;
    const { porcentajes } = req.body;
    const db = req.app.locals.db;
    
    try {
        if (!validarSumaPorcentajes(porcentajes)) {
            const suma = porcentajes.reduce((acc, p) => acc + parseFloat(p.porcentaje_meta), 0);
            return res.status(400).json({
                success: false,
                message: `La suma de porcentajes debe ser 100%. Actualmente es ${suma.toFixed(2)}%`
            });
        }
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            let actualizados = 0;
            let errores = null;
            
            // PASO 1: Actualizar porcentajes en configuracion_metas_anuales
            const actualizarPorcentaje = (index) => {
                if (index >= porcentajes.length) {
                    if (errores) {
                        db.run('ROLLBACK');
                        return res.status(500).json({
                            success: false,
                            message: 'Error al actualizar porcentajes'
                        });
                    }
                    
                    // PASO 2: Obtener todas las proyecciones activas del año
                    const obtenerProyeccionesQuery = `
                        SELECT 
                            pc.id as proyeccion_id,
                            pc.comunidad_id,
                            CASE 
                                WHEN pc.es_manual = 1 THEN pc.proyeccion_manual
                                ELSE CAST((pc.poblacion_mef * pc.porcentaje_proyeccion) - pc.ajuste_fijo AS INTEGER)
                            END as proyeccion_total
                        FROM proyecciones_comunidad pc
                        WHERE pc.año = ? AND pc.activo = 1
                    `;
                    
                    db.all(obtenerProyeccionesQuery, [anio], (err, proyecciones) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({
                                success: false,
                                message: 'Error al obtener proyecciones'
                            });
                        }
                        
                        if (!proyecciones || proyecciones.length === 0) {
                            db.run('COMMIT');
                            return res.json({
                                success: true,
                                message: 'Porcentajes actualizados (sin proyecciones activas)',
                                porcentajes_actualizados: actualizados
                            });
                        }
                        
                        // PASO 3: Para cada proyección, crear/actualizar metas por método
                        let proyeccionesProcessadas = 0;
                        
                        proyecciones.forEach(proyeccion => {
                            let metasCreadas = 0;
                            let sumaDistribuida = 0;
                            
                            // Para cada método, calcular meta truncada
                            const procesarMetodo = (metodoIndex) => {
                                if (metodoIndex >= porcentajes.length) {
                                    // Calcular sobrante
                                    const sobrante = proyeccion.proyeccion_total - sumaDistribuida;
                                    
                                    // Actualizar unidades_sin_distribuir
                                    const actualizarSobranteQuery = `
                                        UPDATE proyecciones_comunidad
                                        SET unidades_sin_distribuir = ?
                                        WHERE id = ?
                                    `;
                                    
                                    db.run(actualizarSobranteQuery, [sobrante, proyeccion.proyeccion_id], (err) => {
                                        if (err) {
                                            console.error('⚠️ Error actualizando sobrante:', err);
                                        }
                                        
                                        proyeccionesProcessadas++;
                                        
                                        // Si terminamos todas las proyecciones, commit
                                        if (proyeccionesProcessadas === proyecciones.length) {
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    return res.status(500).json({
                                                        success: false,
                                                        message: 'Error al confirmar cambios'
                                                    });
                                                }
                                                
                                                res.json({
                                                    success: true,
                                                    message: 'Porcentajes actualizados exitosamente',
                                                    porcentajes_actualizados: actualizados,
                                                    proyecciones_recalculadas: proyecciones.length,
                                                    advertencia: 'Las distribuciones mensuales pueden requerir ajustes'
                                                });
                                            });
                                        }
                                    });
                                    return;
                                }
                                
                                const metodo = porcentajes[metodoIndex];
                                
                                // Calcular meta truncada (floor)
                                const metaExacta = proyeccion.proyeccion_total * (metodo.porcentaje_meta / 100.0);
                                const metaTruncada = Math.floor(metaExacta);
                                
                                sumaDistribuida += metaTruncada;
                                
                                // UPSERT en metas_metodo_comunidad
                                const upsertMetaQuery = `
                                    INSERT INTO metas_metodo_comunidad (
                                        proyeccion_id,
                                        metodo_id,
                                        año,
                                        porcentaje_metodo,
                                        proyeccion_anual_metodo
                                    ) VALUES (?, ?, ?, ?, ?)
                                    ON CONFLICT(proyeccion_id, metodo_id, año)
                                    DO UPDATE SET 
                                        porcentaje_metodo = excluded.porcentaje_metodo,
                                        proyeccion_anual_metodo = excluded.proyeccion_anual_metodo
                                `;
                                
                                db.run(upsertMetaQuery, [
                                    proyeccion.proyeccion_id,
                                    metodo.metodo_id,
                                    anio,
                                    metodo.porcentaje_meta,
                                    metaTruncada
                                ], (err) => {
                                    if (err) {
                                        console.error('❌ Error insertando meta:', err);
                                    }
                                    
                                    metasCreadas++;
                                    procesarMetodo(metodoIndex + 1);
                                });
                            };
                            
                            procesarMetodo(0);
                        });
                    });
                    return;
                }
                
                const config = porcentajes[index];
                const updateQuery = `
                    UPDATE configuracion_metas_anuales 
                    SET porcentaje_meta = ?,
                        fecha_aprobacion = date('now'),
                        aprobado_por = ?
                    WHERE año = ? AND metodo_id = ?
                `;
                
                db.run(updateQuery, [config.porcentaje_meta, req.user.id, anio, config.metodo_id], function(err) {
                    if (err) {
                        errores = err;
                        db.run('ROLLBACK');
                        return res.status(500).json({
                            success: false,
                            message: 'Error al actualizar porcentajes'
                        });
                    }
                    
                    actualizados++;
                    actualizarPorcentaje(index + 1);
                });
            };
            
            actualizarPorcentaje(0);
        });
        
    } catch (error) {
        console.error('❌ Error en PUT /porcentajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 4. AVANCE POR TERRITORIO =====
router.get('/avance/:territorio_id/:anio', authenticateToken, (req, res) => {
    const { territorio_id, anio } = req.params;
    const db = req.app.locals.db;
    
    try {
        // Primero obtener el territorio
        const territorioQuery = `SELECT id, nombre, codigo FROM territorios WHERE id = ?`;
        
        db.get(territorioQuery, [territorio_id], (err, territorio) => {
            if (err || !territorio) {
                return res.status(404).json({
                    success: false,
                    message: 'Territorio no encontrado'
                });
            }
            
            // Obtener comunidades con avance
            const comunidadesQuery = `
                SELECT 
                    c.id as comunidad_id,
                    c.nombre as comunidad_nombre,
                    c.codigo_comunidad,
                    pc.poblacion_mef,
                    CASE 
                        WHEN pc.es_manual = 1 THEN pc.proyeccion_manual
                        ELSE pc.proyeccion_anual
                    END as meta_anual,
                    pc.es_manual,
                    pc.proyeccion_manual,
                    pc.proyeccion_anual as meta_calculada,
                    pc.unidades_sin_distribuir,
                    (SELECT COUNT(*) 
                     FROM visitas v
                     INNER JOIN usuarias u ON v.usuaria_id = u.id
                     WHERE u.comunidad_id = c.id
                       AND strftime('%Y', v.fecha_visita) = ?
                       AND v.estado = 'validado'
                    ) as ejecutado_total
                FROM comunidades c
                LEFT JOIN proyecciones_comunidad pc 
                    ON c.id = pc.comunidad_id AND pc.año = ? AND pc.activo = 1
                WHERE c.territorio_id = ? AND c.activa = 1
                ORDER BY c.nombre
            `;
            
            db.all(comunidadesQuery, [anio, anio, territorio_id], (err, comunidades) => {
                if (err) {
                    console.error('❌ Error obteniendo comunidades:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al obtener datos de avance'
                    });
                }
                
                const comunidadesConAvance = comunidades.map(com => {
                    const proyeccionCalculada = com.meta_anual || Math.max(0, Math.round((com.poblacion_mef * 0.35) - 70));
                    const metaAnual = com.meta_anual || 0;
                    const ejecutado = com.ejecutado_total || 0;
                    const porcentaje = metaAnual > 0 ? (ejecutado / metaAnual) * 100 : 0;
                    
                    let estado = 'danger';
                    if (porcentaje >= 100) estado = 'success';
                    else if (porcentaje >= 50) estado = 'warning';
                    
                    return {
                        comunidad_id: com.comunidad_id,
                        comunidad_nombre: com.comunidad_nombre,
                        codigo_comunidad: com.codigo_comunidad,
                        mef: com.poblacion_mef || 0,
                        meta_anual: metaAnual,
                        ejecutado: ejecutado,
                        porcentaje_alcanzado: Math.round(porcentaje * 10) / 10,
                        estado: estado
                    };
                });
                
                res.json({
                    success: true,
                    territorio: {
                        id: territorio.id,
                        nombre: territorio.nombre,
                        codigo: territorio.codigo
                    },
                    anio: parseInt(anio),
                    comunidades: comunidadesConAvance
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en GET /avance:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 5. DETALLE DE COMUNIDAD =====
router.get('/comunidad/:id/:anio', authenticateToken, (req, res) => {
    const { id, anio } = req.params;
    const db = req.app.locals.db;
    
    try {

        const proyeccionQuery = `
            SELECT 
                CASE 
                    WHEN es_manual = 1 THEN proyeccion_manual
                    ELSE proyeccion_anual
                END as proyeccion_total,
                unidades_sin_distribuir,
                es_manual,
                proyeccion_anual as calculada
            FROM proyecciones_comunidad
            WHERE comunidad_id = ? AND año = ?
        `;
        
        db.get(proyeccionQuery, [id, anio], (err, proyeccion) => {
            if (err || !proyeccion) {
                proyeccion = { proyeccion_total: 0, unidades_sin_distribuir: 0 };
            }

        const query = `
            SELECT 
                m.id as metodo_id,
                m.nombre as metodo_nombre,
                m.nombre_corto,
                m.codigo_metodo,
                m.categoria,
                cma.porcentaje_meta as porcentaje_global,
                mmc.id as meta_id,
                mmc.proyeccion_anual_metodo as meta_anual,
                mmc.porcentaje_metodo,
                (SELECT GROUP_CONCAT(meta_mensual, ',') 
                 FROM (SELECT meta_mensual FROM planificacion_mensual 
                       WHERE meta_metodo_comunidad_id = mmc.id 
                       ORDER BY mes)
                ) as meses,
                (SELECT COUNT(*) 
                 FROM visitas v
                 INNER JOIN usuarias u ON v.usuaria_id = u.id
                 WHERE u.comunidad_id = ?
                   AND v.metodo_id = m.id
                   AND strftime('%Y', v.fecha_visita) = ?
                   AND v.estado = 'validado'
                ) as ejecutado
            FROM metodos_planificacion m
            LEFT JOIN configuracion_metas_anuales cma 
                ON m.id = cma.metodo_id AND cma.año = ?
            LEFT JOIN metas_metodo_comunidad mmc 
                ON m.id = mmc.metodo_id 
                AND mmc.proyeccion_id IN (
                    SELECT id FROM proyecciones_comunidad 
                    WHERE comunidad_id = ? AND año = ?
                )
            WHERE m.activo = 1
            ORDER BY m.orden_visualizacion
        `;
        
        db.all(query, [id, anio, anio, id, anio], (err, rows) => {
            if (err) {
                console.error('❌ Error obteniendo metas de comunidad:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener metas'
                });
            }
            
            const metas = rows.map(row => {
                const meses = row.meses ? row.meses.split(',').map(Number) : Array(12).fill(0);
                const sumaMeses = meses.reduce((a, b) => a + b, 0);
                const ejecutado = row.ejecutado || 0;
                const metaAnual = row.meta_anual || 0;
                const porcentajeAlcanzado = metaAnual > 0 ? (ejecutado / metaAnual) * 100 : 0;
                
                let estado = 'danger';
                if (porcentajeAlcanzado >= 100) estado = 'success';
                else if (porcentajeAlcanzado >= 50) estado = 'warning';
                
                return {
                    metodo_id: row.metodo_id,
                    metodo_nombre: row.metodo_nombre,
                    metodo_corto: row.nombre_corto,
                    categoria: row.categoria,
                    porcentaje_global: row.porcentaje_global || 0,
                    meta_id: row.meta_id,
                    meta_anual: metaAnual,
                    meses: meses,
                    suma_meses: sumaMeses,
                    distribucion_valida: sumaMeses === metaAnual,
                    ejecutado: ejecutado,
                    porcentaje_alcanzado: Math.round(porcentajeAlcanzado * 10) / 10,
                    estado: estado
                };
            });
            
            res.json({
                success: true,
                data: metas,
                proyeccion: {
                    total: proyeccion.proyeccion_total,
                    distribuida: metas.reduce((sum, m) => sum + (m.meta_anual || 0), 0),
                    sin_distribuir: proyeccion.unidades_sin_distribuir,
                    es_manual: proyeccion.es_manual === 1
                }
            });
        });
        }); // Cerrar el callback de proyeccionQuery
        
    } catch (error) {
        console.error('❌ Error en GET /comunidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 6. GUARDAR DISTRIBUCIÓN MENSUAL =====
router.put('/distribucion/:meta_id', authenticateToken, requireConfigPermission, (req, res) => {
    const { meta_id } = req.params;
    const { meses } = req.body;
    const db = req.app.locals.db;
    
    try {
        if (!Array.isArray(meses) || meses.length !== 12) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar exactamente 12 valores'
            });
        }
        
        const mesesNum = meses.map(m => parseInt(m) || 0);
        
        db.get('SELECT proyeccion_anual_metodo as meta_anual FROM metas_metodo_comunidad WHERE id = ?', 
            [meta_id], 
            (err, meta) => {
                if (err || !meta) {
                    return res.status(404).json({
                        success: false,
                        message: 'Meta no encontrada'
                    });
                }
                
                if (!validarSumaMensual(mesesNum, meta.meta_anual)) {
                    const suma = mesesNum.reduce((a, b) => a + b, 0);
                    return res.status(400).json({
                        success: false,
                        message: `La suma mensual (${suma}) debe ser igual a la meta anual (${meta.meta_anual})`
                    });
                }
                
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    
                    let errores = null;
                    const guardarMes = (index) => {
                        if (index >= 12) {
                            if (errores) {
                                db.run('ROLLBACK');
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error al guardar distribución'
                                });
                            }
                            
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error al confirmar cambios'
                                    });
                                }
                                
                                res.json({
                                    success: true,
                                    message: 'Distribución mensual guardada exitosamente',
                                    meses: mesesNum,
                                    suma_total: mesesNum.reduce((a, b) => a + b, 0)
                                });
                            });
                            return;
                        }
                        
                        const mes = index + 1;
                        const cantidad = mesesNum[index];
                        
                        const upsertQuery = `
                            INSERT INTO planificacion_mensual (meta_metodo_comunidad_id, mes, meta_mensual, creado_por)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT(meta_metodo_comunidad_id, mes)
                            DO UPDATE SET 
                                meta_mensual = excluded.meta_mensual,
                                creado_por = excluded.creado_por
                        `;
                        
                        db.run(upsertQuery, [meta_id, mes, cantidad, req.user.id], (err) => {
                            if (err) {
                                errores = err;
                                db.run('ROLLBACK');
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error al guardar distribución'
                                });
                            }
                            
                            guardarMes(index + 1);
                        });
                    };
                    
                    guardarMes(0);
                });
            }
        );
        
    } catch (error) {
        console.error('❌ Error en PUT /distribucion:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 7. INICIALIZAR AÑO =====
router.post('/inicializar/:anio', authenticateToken, requireConfigPermission, (req, res) => {
    const { anio } = req.params;
    const { copiar_desde } = req.body;
    const db = req.app.locals.db;
    
    try {
        const anioNum = parseInt(anio);
        
        db.get('SELECT COUNT(*) as count FROM configuracion_metas_anuales WHERE año = ?', [anioNum], (err, row) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al verificar año'
                });
            }
            
            if (row.count > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe configuración para el año ${anioNum}`
                });
            }
            
            if (copiar_desde) {
                copiarConfiguracion(db, copiar_desde, anioNum, req.user.id, (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Error al copiar configuración'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: `Año ${anioNum} creado copiando desde ${copiar_desde}`,
                        ...result
                    });
                });
            } else {
                crearConfiguracionNueva(db, anioNum, req.user.id, (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Error al crear configuración'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: `Año ${anioNum} creado con configuración por defecto`,
                        ...result
                    });
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Error en POST /inicializar:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== FUNCIONES AUXILIARES =====
function copiarConfiguracion(db, anioOrigen, anioDestino, usuarioId, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const copyMetasQuery = `
            INSERT INTO configuracion_metas_anuales (año, metodo_id, porcentaje_meta, aprobado_por)
            SELECT ?, metodo_id, porcentaje_meta, ?
            FROM configuracion_metas_anuales
            WHERE año = ?
        `;
        
        db.run(copyMetasQuery, [anioDestino, usuarioId, anioOrigen], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return callback(err);
            }
            
            const metasCopiadas = this.changes;
            
            const copyProyeccionesQuery = `
                INSERT INTO proyecciones_comunidad (comunidad_id, año, poblacion_mef, configurado_por)
                SELECT c.id, ?, c.poblacion_mef, ?
                FROM comunidades c
                WHERE c.activa = 1
            `;
            
            db.run(copyProyeccionesQuery, [anioDestino, usuarioId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return callback(err);
                }
                
                const proyeccionesCreadas = this.changes;
                
                db.run('COMMIT', (err) => {
                    if (err) {
                        return callback(err);
                    }
                    
                    callback(null, {
                        metas_copiadas: metasCopiadas,
                        proyecciones_creadas: proyeccionesCreadas
                    });
                });
            });
        });
    });
}

function crearConfiguracionNueva(db, anio, usuarioId, callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const porcentajes = [
            [anio, 1, 10.0, usuarioId], [anio, 2, 10.0, usuarioId],
            [anio, 3, 45.0, usuarioId], [anio, 4, 12.0, usuarioId],
            [anio, 5, 2.0, usuarioId], [anio, 6, 8.0, usuarioId],
            [anio, 7, 6.0, usuarioId], [anio, 8, 1.0, usuarioId],
            [anio, 9, 5.5, usuarioId], [anio, 10, 0.25, usuarioId],
            [anio, 11, 0.25, usuarioId]
        ];
        
        const insertQuery = `INSERT INTO configuracion_metas_anuales (año, metodo_id, porcentaje_meta, aprobado_por) VALUES (?, ?, ?, ?)`;
        
        let insertados = 0;
        porcentajes.forEach(values => {
            db.run(insertQuery, values, function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return callback(err);
                }
                
                insertados++;
                if (insertados === porcentajes.length) {
                    const proyeccionesQuery = `
                        INSERT INTO proyecciones_comunidad (comunidad_id, año, poblacion_mef, configurado_por)
                        SELECT id, ?, poblacion_mef, ? FROM comunidades WHERE activa = 1
                    `;
                    
                    db.run(proyeccionesQuery, [anio, usuarioId], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return callback(err);
                        }
                        
                        db.run('COMMIT', (err) => {
                            if (err) return callback(err);
                            callback(null, {
                                metas_creadas: insertados,
                                proyecciones_creadas: this.changes
                            });
                        });
                    });
                }
            });
        });
    });
}

// ===== 8. ACTUALIZAR PROYECCIÓN MANUAL =====
router.put('/proyeccion-manual/:comunidad_id/:anio', authenticateToken, requireConfigPermission, (req, res) => {
    const { comunidad_id, anio } = req.params;
    const { proyeccion_manual } = req.body;
    const db = req.app.locals.db;
    
    try {
        if (!proyeccion_manual || proyeccion_manual < 0) {
            return res.status(400).json({
                success: false,
                message: 'Proyección manual debe ser un número positivo'
            });
        }
        
        const updateQuery = `
            UPDATE proyecciones_comunidad 
            SET proyeccion_manual = ?,
                es_manual = 1,
                configurado_por = ?
            WHERE comunidad_id = ? AND año = ?
        `;
        
        db.run(updateQuery, [proyeccion_manual, req.user.id, comunidad_id, anio], function(err) {
            if (err) {
                console.error('❌ Error actualizando proyección:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar proyección'
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyección no encontrada'
                });
            }
            
            // Recalcular metas por método
            const recalcularQuery = `
                UPDATE metas_metodo_comunidad
                SET proyeccion_anual_metodo = (
                    SELECT CAST((? * (cma.porcentaje_meta / 100.0)) AS INTEGER)
                    FROM configuracion_metas_anuales cma
                    WHERE cma.metodo_id = metas_metodo_comunidad.metodo_id
                      AND cma.año = ?
                )
                WHERE proyeccion_id = (
                    SELECT id FROM proyecciones_comunidad 
                    WHERE comunidad_id = ? AND año = ?
                )
            `;
            
            db.run(recalcularQuery, [proyeccion_manual, anio, comunidad_id, anio], (err) => {
                if (err) {
                    console.error('❌ Error recalculando metas:', err);
                }
                
                res.json({
                    success: true,
                    message: 'Proyección manual guardada exitosamente',
                    proyeccion_manual: proyeccion_manual,
                    metas_recalculadas: true
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en PUT /proyeccion-manual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 9. DISTRIBUIR UNIDADES SOBRANTES =====
router.post('/distribuir-sobrantes/:comunidad_id/:anio', authenticateToken, requireConfigPermission, (req, res) => {
    const { comunidad_id, anio } = req.params;
    const { ajustes } = req.body; // Array de { metodo_id, cantidad_adicional }
    const db = req.app.locals.db;
    
    try {
        if (!Array.isArray(ajustes) || ajustes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar ajustes a realizar'
            });
        }
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            let errores = null;
            const aplicarAjuste = (index) => {
                if (index >= ajustes.length) {
                    if (errores) {
                        db.run('ROLLBACK');
                        return res.status(500).json({
                            success: false,
                            message: 'Error aplicando ajustes'
                        });
                    }
                    
                    // Recalcular sobrantes
                    const actualizarSobrantesQuery = `
                        UPDATE proyecciones_comunidad
                        SET unidades_sin_distribuir = unidades_sin_distribuir - ?
                        WHERE comunidad_id = ? AND año = ?
                    `;
                    
                    const totalAjustado = ajustes.reduce((sum, a) => sum + parseInt(a.cantidad_adicional || 0), 0);
                    
                    db.run(actualizarSobrantesQuery, [totalAjustado, comunidad_id, anio], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({
                                success: false,
                                message: 'Error actualizando sobrantes'
                            });
                        }
                        
                        db.run('COMMIT', (err) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error confirmando cambios'
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Sobrantes distribuidos exitosamente',
                                ajustes_aplicados: ajustes.length,
                                unidades_distribuidas: totalAjustado
                            });
                        });
                    });
                    return;
                }
                
                const ajuste = ajustes[index];
                const updateQuery = `
                    UPDATE metas_metodo_comunidad
                    SET proyeccion_anual_metodo = proyeccion_anual_metodo + ?
                    WHERE proyeccion_id = (
                        SELECT id FROM proyecciones_comunidad 
                        WHERE comunidad_id = ? AND año = ?
                    ) AND metodo_id = ?
                `;
                
                db.run(updateQuery, [ajuste.cantidad_adicional, comunidad_id, anio, ajuste.metodo_id], (err) => {
                    if (err) {
                        errores = err;
                        db.run('ROLLBACK');
                        return res.status(500).json({
                            success: false,
                            message: 'Error aplicando ajuste'
                        });
                    }
                    
                    aplicarAjuste(index + 1);
                });
            };
            
            aplicarAjuste(0);
        });
        
    } catch (error) {
        console.error('❌ Error distribuyendo sobrantes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== 10. DISTRIBUIR PROYECCIÓN MANUALMENTE =====
router.post('/distribuir-proyeccion-manual/:comunidad_id/:anio', authenticateToken, requireConfigPermission, async (req, res) => {
    const { comunidad_id, anio } = req.params;
    const { distribucion } = req.body; // Array: [{ metodo_id, unidades }]
    const db = req.app.locals.db;
    
    try {
        if (!Array.isArray(distribucion) || distribucion.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar la distribución'
            });
        }
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // 1. Obtener proyección actual
            const getProyeccionQuery = `
                SELECT 
                    id,
                    CASE 
                        WHEN es_manual = 1 THEN proyeccion_manual
                        ELSE proyeccion_anual
                    END as proyeccion_total
                FROM proyecciones_comunidad
                WHERE comunidad_id = ? AND año = ?
            `;
            
            db.get(getProyeccionQuery, [comunidad_id, anio], (err, proyeccion) => {
                if (err || !proyeccion) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Proyección no encontrada' 
                    });
                }
                
                const proyeccionId = proyeccion.id;
                const proyeccionTotal = proyeccion.proyeccion_total;
                
                // 2. Validar que suma = proyección total
                const sumaDistribuida = distribucion.reduce((acc, d) => acc + parseInt(d.unidades || 0), 0);
                
                if (sumaDistribuida !== proyeccionTotal) {
                    db.run('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: `La suma distribuida (${sumaDistribuida}) debe ser igual a la proyección total (${proyeccionTotal})`
                    });
                }
                
                let procesados = 0;
                let erroresUpsert = false;
                
                // 3. UPSERT en metas_metodo_comunidad
                distribucion.forEach(item => {
                    const upsertQuery = `
                        INSERT INTO metas_metodo_comunidad (
                            proyeccion_id,
                            metodo_id,
                            año,
                            porcentaje_metodo,
                            proyeccion_anual_metodo
                        ) VALUES (?, ?, ?, 0, ?)
                        ON CONFLICT(proyeccion_id, metodo_id, año)
                        DO UPDATE SET proyeccion_anual_metodo = excluded.proyeccion_anual_metodo
                    `;
                    
                    db.run(upsertQuery, [proyeccionId, item.metodo_id, anio, item.unidades], (err) => {
                        if (err) {
                            console.error('❌ Error en UPSERT:', err);
                            erroresUpsert = true;
                        }
                        
                        procesados++;
                        
                        if (procesados === distribucion.length) {
                            if (erroresUpsert) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error guardando distribución' 
                                });
                            }
                            
                            // 4. Actualizar unidades_sin_distribuir = 0
                            const updateSobrantesQuery = `
                                UPDATE proyecciones_comunidad
                                SET unidades_sin_distribuir = 0
                                WHERE id = ?
                            `;
                            
                            db.run(updateSobrantesQuery, [proyeccionId], (err) => {
                                if (err) {
                                    console.error('⚠️ Error actualizando sobrantes:', err);
                                }
                                
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error confirmando cambios' 
                                        });
                                    }
                                    
                                    console.log('✅ Distribución manual guardada correctamente');
                                    res.json({
                                        success: true,
                                        message: 'Distribución guardada exitosamente',
                                        proyeccion_total: proyeccionTotal,
                                        distribuidos: sumaDistribuida
                                    });
                                });
                            });
                        }
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en distribuir-proyeccion-manual:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;