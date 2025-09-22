// ===== RUTAS DE PERFIL DE USUARIO =====
const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ===== VER MI PERFIL =====
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT 
                u.id, u.codigo_empleado, u.dpi, u.nombres, u.apellidos, 
                u.email, u.telefono, u.cargo, u.fecha_ingreso, u.ultimo_acceso,
                r.codigo_rol, r.nombre as rol_nombre, r.descripcion as rol_descripcion,
                r.puede_registrar, r.puede_validar, r.puede_aprobar, 
                r.puede_generar_reportes, r.puede_administrar,
                t.nombre as territorio_nombre, t.codigo as territorio_codigo,
                d.nombre as distrito_nombre
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN territorios t ON u.territorio_id = t.id
            LEFT JOIN distritos_salud d ON u.distrito_id = d.id
            WHERE u.id = ? AND u.activo = 1
        `;

        db.get(query, [req.user.id], (err, usuario) => {
            if (err) {
                console.error('Error obteniendo perfil:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo perfil'
                });
            }

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Obtener comunidades asignadas si es auxiliar
            if (usuario.codigo_rol === 'auxiliar_enfermeria') {
                const comunidadesQuery = `
                    SELECT c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef
                    FROM comunidades c
                    JOIN permisos_comunidad pc ON c.id = pc.comunidad_id
                    WHERE pc.usuario_id = ? AND pc.activo = 1
                    ORDER BY c.nombre
                `;

                db.all(comunidadesQuery, [req.user.id], (err, comunidades) => {
                    if (err) {
                        console.error('Error obteniendo comunidades:', err);
                        comunidades = [];
                    }

                    res.json({
                        success: true,
                        data: {
                            ...usuario,
                            permisos: {
                                registrar: Boolean(usuario.puede_registrar),
                                validar: Boolean(usuario.puede_validar),
                                aprobar: Boolean(usuario.puede_aprobar),
                                reportes: Boolean(usuario.puede_generar_reportes),
                                admin: Boolean(usuario.puede_administrar)
                            },
                            comunidades_asignadas: comunidades || []
                        }
                    });
                });
            } else {
                res.json({
                    success: true,
                    data: {
                        ...usuario,
                        permisos: {
                            registrar: Boolean(usuario.puede_registrar),
                            validar: Boolean(usuario.puede_validar),
                            aprobar: Boolean(usuario.puede_aprobar),
                            reportes: Boolean(usuario.puede_generar_reportes),
                            admin: Boolean(usuario.puede_administrar)
                        }
                    }
                });
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ACTUALIZAR MI PERFIL =====
router.put('/', authenticateToken, (req, res) => {
    try {
        const { nombres, apellidos, telefono } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        if (!nombres || !apellidos) {
            return res.status(400).json({
                success: false,
                message: 'Nombres y apellidos son requeridos'
            });
        }

        const updateQuery = `
            UPDATE usuarios 
            SET nombres = ?, apellidos = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(updateQuery, [nombres, apellidos, telefono, req.user.id], function(err) {
            if (err) {
                console.error('Error actualizando perfil:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error actualizando perfil'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            console.log(`✅ Perfil actualizado por ${req.user.email}`);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    nombres: nombres,
                    apellidos: apellidos,
                    telefono: telefono
                }
            });
        });

    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CAMBIAR MI CONTRASEÑA =====
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { password_actual, password_nueva, confirmar_password } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        if (!password_actual || !password_nueva || !confirmar_password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos de contraseña son requeridos'
            });
        }

        if (password_nueva !== confirmar_password) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña y su confirmación no coinciden'
            });
        }

        if (password_nueva.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener contraseña actual del usuario
        db.get(
            'SELECT password_hash FROM usuarios WHERE id = ?',
            [req.user.id],
            async (err, usuario) => {
                if (err) {
                    console.error('Error obteniendo usuario:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error verificando usuario'
                    });
                }

                if (!usuario) {
                    return res.status(404).json({
                        success: false,
                        message: 'Usuario no encontrado'
                    });
                }

                try {
                    // Verificar contraseña actual
                    const passwordValid = await bcrypt.compare(password_actual, usuario.password_hash);
                    
                    if (!passwordValid) {
                        return res.status(400).json({
                            success: false,
                            message: 'La contraseña actual es incorrecta'
                        });
                    }

                    // Hashear nueva contraseña
                    const hashedNewPassword = await bcrypt.hash(password_nueva, 10);

                    // Actualizar contraseña
                    db.run(
                        'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [hashedNewPassword, req.user.id],
                        function(err) {
                            if (err) {
                                console.error('Error actualizando contraseña:', err);
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error actualizando contraseña'
                                });
                            }

                            console.log(`🔐 Contraseña cambiada por ${req.user.email}`);

                            res.json({
                                success: true,
                                message: 'Contraseña actualizada exitosamente'
                            });
                        }
                    );

                } catch (hashError) {
                    console.error('Error hasheando contraseña:', hashError);
                    res.status(500).json({
                        success: false,
                        message: 'Error procesando nueva contraseña'
                    });
                }
            }
        );

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER MIS ESTADÍSTICAS PERSONALES =====
router.get('/estadisticas', authenticateToken, (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = 'WHERE r.registrado_por = ? AND r.año = ?';
        let params = [req.user.id, parseInt(year)];

        const estadisticasQuery = `
            SELECT 
                COUNT(r.id) as total_registros,
                SUM(r.cantidad_administrada) as total_usuarias,
                COUNT(CASE WHEN r.estado = 'registrado' THEN 1 END) as pendientes,
                COUNT(CASE WHEN r.estado = 'validado' THEN 1 END) as validados,
                COUNT(CASE WHEN r.estado = 'aprobado' THEN 1 END) as aprobados,
                COUNT(DISTINCT r.comunidad_id) as comunidades_registradas,
                COUNT(DISTINCT r.mes) as meses_activos,
                MIN(r.fecha_hora_registro) as primer_registro,
                MAX(r.fecha_hora_registro) as ultimo_registro
            FROM registros_mensuales r
            ${whereClause}
        `;

        db.get(estadisticasQuery, params, (err, stats) => {
            if (err) {
                console.error('Error obteniendo estadísticas personales:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo estadísticas'
                });
            }

            // Estadísticas por mes
            const porMesQuery = `
                SELECT 
                    r.mes,
                    COUNT(r.id) as registros,
                    SUM(r.cantidad_administrada) as usuarias
                FROM registros_mensuales r
                ${whereClause}
                GROUP BY r.mes
                ORDER BY r.mes
            `;

            db.all(porMesQuery, params, (err, porMes) => {
                if (err) {
                    console.error('Error obteniendo datos mensuales:', err);
                    porMes = [];
                }

                res.json({
                    success: true,
                    data: {
                        año: parseInt(year),
                        resumen: {
                            total_registros: stats.total_registros || 0,
                            total_usuarias: stats.total_usuarias || 0,
                            comunidades_registradas: stats.comunidades_registradas || 0,
                            meses_activos: stats.meses_activos || 0,
                            primer_registro: stats.primer_registro,
                            ultimo_registro: stats.ultimo_registro
                        },
                        por_estado: {
                            pendientes: stats.pendientes || 0,
                            validados: stats.validados || 0,
                            aprobados: stats.aprobados || 0
                        },
                        actividad_mensual: porMes,
                        usuario: req.user.email
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas personales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;