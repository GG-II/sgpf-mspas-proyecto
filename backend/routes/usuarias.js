// ===== RUTAS DE USUARIAS (PACIENTES) - V2.0 CON CONTROL DE ALCANCE =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { getComunidadesAccesibles, tieneAccesoComunidad } = require('../services/acceso');

const router = express.Router();

// ===== HELPER: CALCULAR TIPO DE USUARIA =====
const calcularTipoUsuaria = (fechaPrimeraVisita, totalVisitas) => {
    if (totalVisitas === 1) return 'nueva';
    
    const primera = new Date(fechaPrimeraVisita);
    const hoy = new Date();
    const diasDesde = Math.floor((hoy - primera) / (1000 * 60 * 60 * 24));
    
    if (diasDesde <= 365 && totalVisitas >= 2) return 'reconsulta';
    if (diasDesde > 365) return 'activa';
    
    return 'nueva';
};

// ===== BUSCAR USUARIA POR DPI =====
router.get('/buscar/:dpi', authenticateToken, requirePermission('registrar'), async (req, res) => {
    try {
        const dpi = req.params.dpi;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Validar DPI (13 dígitos)
        if (!/^\d{13}$/.test(dpi)) {
            return res.status(400).json({
                success: false,
                message: 'DPI inválido. Debe contener 13 dígitos'
            });
        }

        const query = `
            SELECT 
                u.id, u.dpi, u.nombres, u.apellidos, u.fecha_nacimiento,
                u.telefono, u.tipo_usuaria, u.fecha_primera_visita, 
                u.fecha_ultima_visita, u.total_visitas, u.activa,
                c.id as comunidad_id, c.nombre as comunidad_nombre, 
                c.codigo_comunidad,
                t.id as territorio_id, t.nombre as territorio_nombre,
                uc.nombres || ' ' || uc.apellidos as creada_por
            FROM usuarias u
            JOIN comunidades c ON u.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN usuarios uc ON u.creada_por = uc.id
            WHERE u.dpi = ? AND u.activa = 1
        `;

        db.get(query, [dpi], async (err, usuaria) => {
            if (err) {
                console.error('❌ Error buscando usuaria:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error buscando usuaria'
                });
            }

            if (!usuaria) {
                return res.json({
                    success: true,
                    exists: false,
                    message: 'Usuaria no encontrada. Puede registrarla como nueva.'
                });
            }

            // ===== VALIDAR ALCANCE =====
            const tieneAcceso = await tieneAccesoComunidad(user, usuaria.comunidad_id, db);
            
            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    exists: true,
                    sin_permisos: true,
                    message: 'No tiene permisos para ver esta usuaria. Pertenece a una comunidad fuera de su alcance.'
                });
            }

            // Obtener historial de visitas
            const visitasQuery = `
                SELECT 
                    v.id, v.fecha_visita, v.observaciones, v.estado,
                    m.nombre as metodo, m.nombre_corto,
                    u.nombres || ' ' || u.apellidos as registrado_por
                FROM visitas v
                JOIN metodos_planificacion m ON v.metodo_id = m.id
                JOIN usuarios u ON v.registrado_por = u.id
                WHERE v.usuaria_id = ?
                ORDER BY v.fecha_visita DESC
                LIMIT 10
            `;

            db.all(visitasQuery, [usuaria.id], (err, visitas) => {
                if (err) {
                    console.error('❌ Error obteniendo visitas:', err);
                    visitas = [];
                }

                console.log(`🔍 Usuaria encontrada: ${usuaria.nombres} ${usuaria.apellidos} (${dpi}) - Territorio: ${usuaria.territorio_nombre}`);

                res.json({
                    success: true,
                    exists: true,
                    data: {
                        usuaria: usuaria,
                        historial_visitas: visitas || []
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error buscando usuaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CREAR NUEVA USUARIA =====
router.post('/', authenticateToken, requirePermission('registrar'), async (req, res) => {
    try {
        const { dpi, nombres, apellidos, comunidad_id, fecha_nacimiento, telefono } = req.body;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Validaciones
        if (!dpi || !nombres || !apellidos || !comunidad_id) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: dpi, nombres, apellidos, comunidad_id'
            });
        }

        if (!/^\d{13}$/.test(dpi)) {
            return res.status(400).json({
                success: false,
                message: 'DPI inválido. Debe contener 13 dígitos'
            });
        }

        // ===== VALIDAR ALCANCE: Usuario puede registrar en esta comunidad? =====
        const tieneAcceso = await tieneAccesoComunidad(user, comunidad_id, db);
        
        if (!tieneAcceso) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para registrar en esta comunidad. Está fuera de su alcance territorial.'
            });
        }

        // Verificar que el DPI no exista
        db.get('SELECT id, nombres, apellidos FROM usuarias WHERE dpi = ?', [dpi], (err, existing) => {
            if (err) {
                console.error('❌ Error verificando DPI:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error verificando DPI'
                });
            }

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una usuaria con este DPI: ${existing.nombres} ${existing.apellidos}`
                });
            }

            // Insertar nueva usuaria
            const insertQuery = `
                INSERT INTO usuarias 
                (dpi, nombres, apellidos, comunidad_id, fecha_nacimiento, telefono, 
                 tipo_usuaria, fecha_primera_visita, fecha_ultima_visita, total_visitas, creada_por)
                VALUES (?, ?, ?, ?, ?, ?, 'nueva', CURRENT_DATE, CURRENT_DATE, 0, ?)
            `;

            db.run(insertQuery, [
                dpi, 
                nombres.trim(), 
                apellidos.trim(), 
                comunidad_id,
                fecha_nacimiento || null,
                telefono || null,
                user.id
            ], function(err) {
                if (err) {
                    console.error('❌ Error creando usuaria:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error guardando usuaria'
                    });
                }

                console.log(`✅ Usuaria creada: ${nombres} ${apellidos} (${dpi}) por ${user.email} en comunidad ${comunidad_id}`);

                res.json({
                    success: true,
                    message: 'Usuaria registrada exitosamente',
                    data: {
                        id: this.lastID,
                        dpi: dpi,
                        nombres: nombres,
                        apellidos: apellidos,
                        tipo_usuaria: 'nueva',
                        comunidad_id: comunidad_id
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error creando usuaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== LISTAR USUARIAS CON FILTROS Y CONTROL DE ALCANCE =====
router.get('/', authenticateToken, requirePermission('registrar'), async (req, res) => {
    try {
        const { limit = 20, offset = 0, comunidad_id, tipo_usuaria, buscar } = req.query;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // ===== OBTENER COMUNIDADES ACCESIBLES =====
        const comunidadesAccesibles = await getComunidadesAccesibles(user, db);
        
        if (comunidadesAccesibles.length === 0) {
            return res.json({
                success: true,
                data: {
                    usuarias: [],
                    total: 0,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                message: 'Sin comunidades asignadas'
            });
        }

        // ===== CONSTRUIR QUERY CON FILTROS =====
        let whereClause = `WHERE u.activa = 1 AND u.comunidad_id IN (${comunidadesAccesibles.join(',')})`;
        let params = [];

        // Filtrar por comunidad específica (si está dentro del alcance)
        if (comunidad_id && comunidadesAccesibles.includes(parseInt(comunidad_id))) {
            whereClause += ' AND u.comunidad_id = ?';
            params.push(comunidad_id);
        }

        // Filtrar por tipo de usuaria
        if (tipo_usuaria && ['nueva', 'reconsulta', 'activa'].includes(tipo_usuaria)) {
            whereClause += ' AND u.tipo_usuaria = ?';
            params.push(tipo_usuaria);
        }

        // Buscar por nombre, apellido o DPI
        if (buscar) {
            whereClause += ` AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.dpi LIKE ?)`;
            const searchTerm = `%${buscar}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        const query = `
            SELECT 
                u.id, u.dpi, u.nombres, u.apellidos, u.tipo_usuaria,
                u.fecha_primera_visita, u.fecha_ultima_visita, u.total_visitas,
                c.id as comunidad_id, c.nombre as comunidad, c.codigo_comunidad,
                t.id as territorio_id, t.nombre as territorio
            FROM usuarias u
            JOIN comunidades c ON u.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            ${whereClause}
            ORDER BY u.fecha_ultima_visita DESC, u.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        db.all(query, params, (err, usuarias) => {
            if (err) {
                console.error('❌ Error obteniendo usuarias:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo usuarias'
                });
            }

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM usuarias u
                ${whereClause}
            `;

            const countParams = params.slice(0, -2); // Quitar limit y offset

            db.get(countQuery, countParams, (err, countResult) => {
                if (err) {
                    console.error('❌ Error contando usuarias:', err);
                    countResult = { total: 0 };
                }

                console.log(`👩‍⚕️ ${usuarias.length} usuarias obtenidas para ${user.email} (${user.rol}) - Alcance: ${comunidadesAccesibles.length} comunidades`);

                res.json({
                    success: true,
                    data: {
                        usuarias: usuarias || [],
                        total: countResult.total || 0,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        comunidades_accesibles: comunidadesAccesibles.length
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error listando usuarias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER USUARIA ESPECÍFICA CON HISTORIAL =====
router.get('/:id', authenticateToken, requirePermission('registrar'), async (req, res) => {
    try {
        const usuariaId = req.params.id;
        const db = req.app.locals.db;
        const user = req.user;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT 
                u.*, 
                c.id as comunidad_id, c.nombre as comunidad_nombre, c.codigo_comunidad,
                t.id as territorio_id, t.nombre as territorio_nombre,
                uc.nombres || ' ' || uc.apellidos as creada_por
            FROM usuarias u
            JOIN comunidades c ON u.comunidad_id = c.id
            JOIN territorios t ON c.territorio_id = t.id
            JOIN usuarios uc ON u.creada_por = uc.id
            WHERE u.id = ?
        `;

        db.get(query, [usuariaId], async (err, usuaria) => {
            if (err) {
                console.error('❌ Error obteniendo usuaria:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo usuaria'
                });
            }

            if (!usuaria) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuaria no encontrada'
                });
            }

            // ===== VALIDAR ALCANCE =====
            const tieneAcceso = await tieneAccesoComunidad(user, usuaria.comunidad_id, db);
            
            if (!tieneAcceso) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ver esta usuaria'
                });
            }

            // Obtener historial completo de visitas
            const visitasQuery = `
                SELECT 
                    v.id, v.fecha_visita, v.observaciones, v.estado,
                    m.nombre as metodo, m.nombre_corto, m.categoria,
                    u.nombres || ' ' || u.apellidos as registrado_por,
                    v.fecha_hora_registro
                FROM visitas v
                JOIN metodos_planificacion m ON v.metodo_id = m.id
                JOIN usuarios u ON v.registrado_por = u.id
                WHERE v.usuaria_id = ?
                ORDER BY v.fecha_visita DESC
            `;

            db.all(visitasQuery, [usuariaId], (err, visitas) => {
                if (err) {
                    console.error('❌ Error obteniendo visitas:', err);
                    visitas = [];
                }

                res.json({
                    success: true,
                    data: {
                        usuaria: usuaria,
                        historial_visitas: visitas || []
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo usuaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ACTUALIZAR TIPO DE USUARIA (automático al crear visita) =====
router.put('/:id/tipo', authenticateToken, (req, res) => {
    try {
        const usuariaId = req.params.id;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Obtener datos actuales
        db.get(
            'SELECT fecha_primera_visita, total_visitas FROM usuarias WHERE id = ?',
            [usuariaId],
            (err, usuaria) => {
                if (err || !usuaria) {
                    return res.status(404).json({
                        success: false,
                        message: 'Usuaria no encontrada'
                    });
                }

                const nuevoTipo = calcularTipoUsuaria(
                    usuaria.fecha_primera_visita, 
                    usuaria.total_visitas
                );

                db.run(
                    'UPDATE usuarias SET tipo_usuaria = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [nuevoTipo, usuariaId],
                    (err) => {
                        if (err) {
                            console.error('❌ Error actualizando tipo:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error actualizando tipo de usuaria'
                            });
                        }

                        console.log(`✅ Tipo de usuaria actualizado: ${nuevoTipo} (ID:${usuariaId})`);

                        res.json({
                            success: true,
                            message: 'Tipo de usuaria actualizado',
                            data: {
                                id: usuariaId,
                                tipo_nuevo: nuevoTipo
                            }
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error('❌ Error actualizando tipo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;