// ===== RUTAS DE AUTENTICACIÓN =====
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sgpf_mspas_secret_key_desarrollo_2025';

// ===== LOGIN =====
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔐 Intento de login: ${email}`);
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const db = req.app.locals.db;
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Buscar usuario en la base de datos
        const query = `
            SELECT u.*, r.codigo_rol, r.nombre as rol_nombre, r.nivel_jerarquico,
                   r.puede_registrar, r.puede_validar, r.puede_aprobar, r.puede_generar_reportes, r.puede_administrar,
                   t.nombre as territorio_nombre, t.id as territorio_id, d.nombre as distrito_nombre
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
            LEFT JOIN territorios t ON u.territorio_id = t.id
            LEFT JOIN distritos_salud d ON u.distrito_id = d.id
            WHERE u.email = ? AND u.activo = 1 AND u.bloqueado = 0
        `;

        db.get(query, [email.toLowerCase()], async (err, usuario) => {
            if (err) {
                console.error('❌ Error en consulta de usuario:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }

            if (!usuario) {
                console.log(`❌ Usuario no encontrado: ${email}`);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            // Verificar contraseña
            const passwordValid = await bcrypt.compare(password, usuario.password_hash);
            
            if (!passwordValid) {
                console.log(`❌ Contraseña incorrecta para: ${email}`);
                
                // Incrementar intentos fallidos
                db.run(
                    'UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?',
                    [usuario.id]
                );

                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            // Generar token JWT
            const tokenPayload = {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.codigo_rol,
                nivel: usuario.nivel_jerarquico,
                territorio_id: usuario.territorio_id,
                permisos: {
                    registrar: Boolean(usuario.puede_registrar),
                    validar: Boolean(usuario.puede_validar),
                    aprobar: Boolean(usuario.puede_aprobar),
                    reportes: Boolean(usuario.puede_generar_reportes),
                    admin: Boolean(usuario.puede_administrar)
                }
            };

            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

            // Actualizar último acceso y resetear intentos fallidos
            db.run(
                'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP, intentos_fallidos = 0 WHERE id = ?',
                [usuario.id]
            );

            console.log(`✅ Login exitoso: ${usuario.nombres} ${usuario.apellidos} (${usuario.codigo_rol})`);

            // Obtener comunidades asignadas (solo para auxiliares)
            if (usuario.codigo_rol === 'auxiliar_enfermeria') {
                const comunidadesQuery = `
                    SELECT c.id, c.nombre, c.codigo_comunidad 
                    FROM comunidades c
                    JOIN permisos_comunidad pc ON c.id = pc.comunidad_id
                    WHERE pc.usuario_id = ? AND pc.puede_registrar = 1 AND pc.activo = 1
                `;
                
                db.all(comunidadesQuery, [usuario.id], (err, comunidades) => {
                    if (err) {
                        console.error('Error obteniendo comunidades:', err);
                        comunidades = [];
                    }

                    res.json({
                        success: true,
                        message: 'Login exitoso',
                        user: {
                            id: usuario.id,
                            codigo: usuario.codigo_empleado,
                            email: usuario.email,
                            nombres: usuario.nombres,
                            apellidos: usuario.apellidos,
                            rol: usuario.codigo_rol,
                            rol_nombre: usuario.rol_nombre,
                            cargo: usuario.cargo,
                            territorio: usuario.territorio_nombre,
                            territorio_id: usuario.territorio_id,
                            distrito: usuario.distrito_nombre,
                            permisos: tokenPayload.permisos,
                            comunidades: comunidades || []
                        },
                        token: token
                    });
                });
            } else {
                res.json({
                    success: true,
                    message: 'Login exitoso',
                    user: {
                        id: usuario.id,
                        codigo: usuario.codigo_empleado,
                        email: usuario.email,
                        nombres: usuario.nombres,
                        apellidos: usuario.apellidos,
                        rol: usuario.codigo_rol,
                        rol_nombre: usuario.rol_nombre,
                        cargo: usuario.cargo,
                        territorio: usuario.territorio_nombre,
                        territorio_id: usuario.territorio_id,
                        distrito: usuario.distrito_nombre,
                        permisos: tokenPayload.permisos
                    },
                    token: token
                });
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== VERIFICAR TOKEN =====
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        user: {
            id: req.user.id,
            email: req.user.email,
            rol: req.user.rol,
            permisos: req.user.permisos
        }
    });
});

// ===== RENOVAR TOKEN =====
router.post('/refresh', authenticateToken, (req, res) => {
    try {
        // Generar nuevo token con misma información
        const newToken = jwt.sign({
            id: req.user.id,
            email: req.user.email,
            rol: req.user.rol,
            nivel: req.user.nivel,
            permisos: req.user.permisos
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            message: 'Token renovado',
            token: newToken
        });

    } catch (error) {
        console.error('❌ Error renovando token:', error);
        res.status(500).json({
            success: false,
            message: 'Error renovando token'
        });
    }
});

// ===== LOGOUT =====
router.post('/logout', authenticateToken, (req, res) => {
    // En una implementación más compleja, aquí se invalidaría el token
    // Por ahora, simplemente confirmamos el logout
    console.log(`👋 Logout: ${req.user.email}`);
    
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

module.exports = router;