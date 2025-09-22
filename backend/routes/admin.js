// ===== RUTAS DE ADMINISTRACIÓN =====
const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ===== LISTAR USUARIOS =====
router.get('/usuarios', authenticateToken, requirePermission('admin'), (req, res) => {
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
                u.id, u.codigo_empleado, u.dpi, u.nombres, u.apellidos, u.email, 
                u.telefono, u.cargo, u.fecha_ingreso, u.activo, u.bloqueado,
                r.codigo_rol, r.nombre as rol_nombre,
                t.nombre as territorio_nombre,
                d.nombre as distrito_nombre
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN territorios t ON u.territorio_id = t.id
            LEFT JOIN distritos_salud d ON u.distrito_id = d.id
            ORDER BY r.nivel_jerarquico DESC, u.nombres
        `;

        db.all(query, [], (err, usuarios) => {
            if (err) {
                console.error('Error obteniendo usuarios:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo usuarios'
                });
            }

            console.log(`👥 ${usuarios.length} usuarios listados por ${req.user.email}`);

            res.json({
                success: true,
                data: usuarios || []
            });
        });

    } catch (error) {
        console.error('❌ Error listando usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CREAR USUARIO =====
router.post('/usuarios', authenticateToken, requirePermission('admin'), async (req, res) => {
    try {
        const {
            codigo_empleado, dpi, nombres, apellidos, email, telefono,
            password, rol_codigo, cargo, territorio_id, distrito_id
        } = req.body;
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Validaciones básicas
        if (!nombres || !apellidos || !email || !password || !rol_codigo) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: nombres, apellidos, email, password, rol_codigo'
            });
        }

        // Verificar si el email ya existe
        db.get('SELECT id FROM usuarios WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error verificando email'
                });
            }

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Obtener ID del rol
            db.get('SELECT id FROM roles WHERE codigo_rol = ?', [rol_codigo], async (err, rol) => {
                if (err || !rol) {
                    return res.status(400).json({
                        success: false,
                        message: 'Rol no válido'
                    });
                }

                try {
                    // Hashear contraseña
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Insertar usuario
                    const insertQuery = `
                        INSERT INTO usuarios 
                        (codigo_empleado, dpi, nombres, apellidos, email, telefono, password_hash, 
                         rol_id, cargo, territorio_id, distrito_id, fecha_ingreso)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
                    `;

                    db.run(insertQuery, [
                        codigo_empleado, dpi, nombres, apellidos, email, telefono,
                        hashedPassword, rol.id, cargo, territorio_id || null, distrito_id || null
                    ], function(err) {
                        if (err) {
                            console.error('Error creando usuario:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error creando usuario'
                            });
                        }

                        console.log(`✅ Usuario creado: ${nombres} ${apellidos} (${rol_codigo}) por ${req.user.email}`);

                        res.json({
                            success: true,
                            message: 'Usuario creado exitosamente',
                            data: {
                                id: this.lastID,
                                nombres: nombres,
                                apellidos: apellidos,
                                email: email,
                                rol: rol_codigo
                            }
                        });
                    });

                } catch (hashError) {
                    console.error('Error hasheando contraseña:', hashError);
                    res.status(500).json({
                        success: false,
                        message: 'Error procesando contraseña'
                    });
                }
            });
        });

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER ROLES =====
router.get('/roles', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT codigo_rol, nombre, descripcion, nivel_jerarquico,
                   puede_registrar, puede_validar, puede_aprobar, 
                   puede_generar_reportes, puede_administrar
            FROM roles 
            WHERE activo = 1 
            ORDER BY nivel_jerarquico DESC
        `;

        db.all(query, [], (err, roles) => {
            if (err) {
                console.error('Error obteniendo roles:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo roles'
                });
            }

            res.json({
                success: true,
                data: roles || []
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER TERRITORIOS =====
router.get('/territorios', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const db = req.app.locals.db;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT t.id, t.nombre, t.codigo, t.descripcion,
                   d.nombre as distrito_nombre
            FROM territorios t
            JOIN distritos_salud d ON t.distrito_id = d.id
            WHERE t.activo = 1
            ORDER BY t.nombre
        `;

        db.all(query, [], (err, territorios) => {
            if (err) {
                console.error('Error obteniendo territorios:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo territorios'
                });
            }

            res.json({
                success: true,
                data: territorios || []
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo territorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== OBTENER METAS =====
router.get('/metas/:year', authenticateToken, requirePermission('admin'), (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const db = req.app.locals.db;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT 
                cma.id, cma.año, cma.porcentaje_meta, cma.observaciones,
                cma.fecha_aprobacion, cma.activo,
                mp.id as metodo_id, mp.codigo_metodo, mp.nombre as metodo_nombre, 
                mp.categoria, mp.tipo_administracion
            FROM configuracion_metas_anuales cma
            JOIN metodos_planificacion mp ON cma.metodo_id = mp.id
            WHERE cma.año = ? AND cma.activo = 1
            ORDER BY mp.orden_visualizacion
        `;

        db.all(query, [year], (err, metas) => {
            if (err) {
                console.error('Error obteniendo metas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo metas'
                });
            }

            console.log(`🎯 Metas de ${year} consultadas por ${req.user.email}`);

            res.json({
                success: true,
                data: {
                    año: year,
                    metas: metas || []
                }
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;