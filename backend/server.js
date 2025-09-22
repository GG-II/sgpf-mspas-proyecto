// ===== SERVIDOR PRINCIPAL ACTUALIZADO - SGPF MSPAS =====
// Con autenticación real usando bcrypt y base de datos completa

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sgpf_mspas_secret_key_desarrollo_2025';

// ===== MIDDLEWARES DE SEGURIDAD =====
app.use(helmet({
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones, intenta de nuevo en 15 minutos' }
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== LOGGING MIDDLEWARE =====
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ===== INICIALIZAR BASE DE DATOS =====
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database/sgpf_complete.db');

let db;
try {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error conectando a la base de datos:', err.message);
            console.log('⚠️  Ejecuta: npm run setup-db para crear la base de datos');
        } else {
            console.log('✅ Conectado a la base de datos completa');
        }
    });
} catch (error) {
    console.error('❌ Error crítico con la base de datos:', error);
    console.log('⚠️  Asegúrate de haber ejecutado: npm run setup-db');
}

// ===== MIDDLEWARE DE AUTENTICACIÓN =====
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        req.user = user;
        next();
    });
};

// ===== ENDPOINTS PRINCIPALES =====

// Endpoint de salud del servidor
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor SGPF-MSPAS funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: db ? 'Conectada' : 'Desconectada'
    });
});

// ===== AUTENTICACIÓN REAL =====
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔐 Intento de login: ${email}`);
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible. Ejecuta: npm run setup-db'
            });
        }

        // Buscar usuario en la base de datos
        const query = `
            SELECT u.*, r.codigo_rol, r.nombre as rol_nombre, r.nivel_jerarquico,
                   r.puede_registrar, r.puede_validar, r.puede_aprobar, r.puede_generar_reportes, r.puede_administrar,
                   t.nombre as territorio_nombre, d.nombre as distrito_nombre
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
                permisos: {
                    registrar: usuario.puede_registrar,
                    validar: usuario.puede_validar,
                    aprobar: usuario.puede_aprobar,
                    reportes: usuario.puede_generar_reportes,
                    admin: usuario.puede_administrar
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

// ===== ESTADÍSTICAS CON DATOS REALES =====
app.get('/api/estadisticas/:year', authenticateToken, (req, res) => {
    try {
        const year = parseInt(req.params.year);
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        console.log(`📊 Estadísticas solicitadas para año ${year} por usuario ${req.user.email}`);

        // Query para obtener estadísticas reales
        const estadisticasQuery = `
            SELECT 
                COUNT(DISTINCT r.id) as total_registros,
                SUM(r.cantidad_administrada) as total_usuarias,
                COUNT(CASE WHEN r.estado = 'registrado' THEN 1 END) as pendientes,
                COUNT(CASE WHEN r.estado = 'validado' THEN 1 END) as validados,
                COUNT(CASE WHEN r.estado = 'aprobado' THEN 1 END) as aprobados,
                COUNT(DISTINCT r.comunidad_id) as comunidades_activas
            FROM registros_mensuales r 
            WHERE r.año = ?
        `;

        db.get(estadisticasQuery, [year], (err, stats) => {
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
                WHERE r.año = ? 
                GROUP BY r.mes 
                ORDER BY r.mes
            `;

            db.all(mensualQuery, [year], (err, porMes) => {
                if (err) {
                    console.error('Error obteniendo datos mensuales:', err);
                    porMes = [];
                }

                // Calcular meta anual (suma de todas las metas por método)
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

// ===== REGISTROS CON DATOS REALES =====
app.get('/api/registros', authenticateToken, (req, res) => {
    try {
        const { limit = 10, offset = 0, estado, comunidad_id } = req.query;
        
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let whereClause = 'WHERE 1=1';
        let params = [];

        // Filtrar por estado si se proporciona
        if (estado) {
            whereClause += ' AND r.estado = ?';
            params.push(estado);
        }

        // Filtrar por comunidad si se proporciona
        if (comunidad_id) {
            whereClause += ' AND r.comunidad_id = ?';
            params.push(comunidad_id);
        }

        // Filtrar por permisos del usuario
        if (req.user.rol === 'auxiliar_enfermeria') {
            whereClause += ` AND r.comunidad_id IN (
                SELECT pc.comunidad_id FROM permisos_comunidad pc 
                WHERE pc.usuario_id = ? AND pc.activo = 1
            )`;
            params.push(req.user.id);
        }

        const registrosQuery = `
            SELECT 
                r.id, r.año, r.mes, r.cantidad_administrada, r.fecha_registro, r.estado,
                r.observaciones, r.fecha_hora_registro,
                c.nombre as comunidad, c.codigo_comunidad,
                mp.nombre as metodo, mp.nombre_corto,
                u.nombres || ' ' || u.apellidos as registrado_por
            FROM registros_mensuales r
            JOIN comunidades c ON r.comunidad_id = c.id
            JOIN metodos_planificacion mp ON r.metodo_id = mp.id
            JOIN usuarios u ON r.registrado_por = u.id
            ${whereClause}
            ORDER BY r.fecha_hora_registro DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        db.all(registrosQuery, params, (err, registros) => {
            if (err) {
                console.error('Error obteniendo registros:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo registros'
                });
            }

            // Contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM registros_mensuales r
                JOIN comunidades c ON r.comunidad_id = c.id
                ${whereClause.replace('LIMIT ? OFFSET ?', '')}
            `;

            const countParams = params.slice(0, -2); // Quitar limit y offset

            db.get(countQuery, countParams, (err, countResult) => {
                if (err) {
                    console.error('Error contando registros:', err);
                    countResult = { total: 0 };
                }

                console.log(`📋 ${registros.length} registros obtenidos para usuario ${req.user.email}`);

                res.json({
                    success: true,
                    data: {
                        registros: registros || [],
                        total: countResult.total || 0,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                });
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo registros:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== COMUNIDADES (para auxiliares) =====
app.get('/api/comunidades', authenticateToken, (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        let query, params = [];

        if (req.user.rol === 'auxiliar_enfermeria') {
            // Auxiliares solo ven sus comunidades asignadas
            query = `
                SELECT c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef, t.nombre as territorio
                FROM comunidades c
                JOIN territorios t ON c.territorio_id = t.id
                JOIN permisos_comunidad pc ON c.id = pc.comunidad_id
                WHERE pc.usuario_id = ? AND pc.activo = 1 AND c.activa = 1
                ORDER BY c.nombre
            `;
            params.push(req.user.id);
        } else {
            // Otros roles ven todas las comunidades de su territorio/distrito
            if (req.user.rol === 'asistente_tecnico') {
                query = `
                    SELECT c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef, t.nombre as territorio
                    FROM comunidades c
                    JOIN territorios t ON c.territorio_id = t.id
                    JOIN usuarios u ON u.territorio_id = t.id
                    WHERE u.id = ? AND c.activa = 1
                    ORDER BY c.nombre
                `;
                params.push(req.user.id);
            } else {
                // Encargados y coordinadores ven todas
                query = `
                    SELECT c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef, t.nombre as territorio
                    FROM comunidades c
                    JOIN territorios t ON c.territorio_id = t.id
                    WHERE c.activa = 1
                    ORDER BY t.nombre, c.nombre
                `;
            }
        }

        db.all(query, params, (err, comunidades) => {
            if (err) {
                console.error('Error obteniendo comunidades:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo comunidades'
                });
            }

            res.json({
                success: true,
                data: comunidades || []
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo comunidades:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== MÉTODOS DE PLANIFICACIÓN =====
app.get('/api/metodos', authenticateToken, (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        const query = `
            SELECT id, codigo_metodo, nombre, nombre_corto, categoria, tipo_administracion
            FROM metodos_planificacion 
            WHERE activo = 1 
            ORDER BY orden_visualizacion
        `;

        db.all(query, [], (err, metodos) => {
            if (err) {
                console.error('Error obteniendo métodos:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo métodos'
                });
            }

            res.json({
                success: true,
                data: metodos || []
            });
        });

    } catch (error) {
        console.error('❌ Error obteniendo métodos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== CREAR NUEVO REGISTRO =====
app.post('/api/registros', authenticateToken, (req, res) => {
    try {
        const { comunidad_id, metodo_id, año, mes, cantidad, observaciones } = req.body;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Base de datos no disponible'
            });
        }

        // Validaciones
        if (!comunidad_id || !metodo_id || !año || !mes || cantidad === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        if (parseInt(cantidad) < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            });
        }

        // Verificar permisos del usuario en la comunidad (solo para auxiliares)
        if (req.user.rol === 'auxiliar_enfermeria') {
            const permisosQuery = `
                SELECT 1 FROM permisos_comunidad 
                WHERE usuario_id = ? AND comunidad_id = ? AND puede_registrar = 1 AND activo = 1
            `;

            db.get(permisosQuery, [req.user.id, comunidad_id], (err, permiso) => {
                if (err || !permiso) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para registrar en esta comunidad'
                    });
                }

                insertarRegistro();
            });
        } else {
            insertarRegistro();
        }

        function insertarRegistro() {
            const insertQuery = `
                INSERT OR REPLACE INTO registros_mensuales 
                (comunidad_id, metodo_id, año, mes, cantidad_administrada, fecha_registro, observaciones, 
                 estado, registrado_por, fecha_hora_registro, uuid_local)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
            `;

            const uuid = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            db.run(insertQuery, [
                comunidad_id, metodo_id, año, mes, parseInt(cantidad),
                new Date().toISOString().split('T')[0],
                observaciones || null,
                'registrado',
                req.user.id,
                uuid
            ], function(err) {
                if (err) {
                    console.error('Error insertando registro:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error guardando el registro'
                    });
                }

                console.log(`✅ Registro creado: ${cantidad} usuarias - ${req.user.email}`);

                res.json({
                    success: true,
                    message: 'Registro guardado exitosamente',
                    data: {
                        id: this.lastID,
                        uuid: uuid
                    }
                });
            });
        }

    } catch (error) {
        console.error('❌ Error creando registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== MANEJO DE ERRORES 404 =====
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`,
        availableEndpoints: [
            'GET /api/health',
            'POST /api/auth/login',
            'GET /api/estadisticas/:year',
            'GET /api/registros',
            'GET /api/comunidades',
            'GET /api/metodos',
            'POST /api/registros'
        ]
    });
});

// ===== MANEJO DE ERRORES GLOBALES =====
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
    console.log('\n🚀 ===== SERVIDOR SGPF-MSPAS ACTUALIZADO =====');
    console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Base de datos: ${db ? 'Conectada' : 'Desconectada'}`);
    
    if (!db) {
        console.log('\n⚠️  ===== ACCIÓN REQUERIDA =====');
        console.log('🔧 Ejecuta: npm run setup-db');
        console.log('⏱️  Espera 30 segundos para la configuración');
        console.log('🔄 Luego reinicia con: npm run dev');
    } else {
        console.log('\n🔐 Usuarios disponibles:');
        console.log('   👑 admin@mspas.gob.gt / 123456 (Coordinador)');
        console.log('   👩‍⚕️ encargado@mspas.gob.gt / 123456 (Encargado SR)');
        console.log('   👨‍💼 asist01@mspas.gob.gt / 123456 (Asistente Norte)');
        console.log('   👩‍🔬 aux01@mspas.gob.gt / 123456 (Auxiliar Norte)');
    }
    
    console.log('\n✅ Backend con autenticación real listo\n');
});

module.exports = app;