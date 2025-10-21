// ===== SERVIDOR PRINCIPAL MODULAR - SGPF MSPAS =====
// Arquitectura limpia con rutas modulares

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARES DE SEGURIDAD =====
app.use(helmet({
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Rate limiting - Configuración para desarrollo
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // 1000 requests por minuto
    message: { 
        error: 'Demasiadas peticiones, intenta de nuevo en 1 minuto' 
    }
});

// Solo aplicar en producción
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
    console.log('Rate limiting activado para producción');
} else {
    console.log('Rate limiting DESACTIVADO en desarrollo');
}
app.use('/api/', limiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== LOGGING MIDDLEWARE =====
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// ===== CONEXIÓN A BASE DE DATOS =====
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

// Hacer la conexión de BD disponible en toda la app
app.locals.db = db;

// ===== ENDPOINT DE SALUD =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor SGPF-MSPAS funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: db ? 'Conectada' : 'Desconectada',
        arquitectura: 'Modular'
    });
});

// ===== IMPORTAR Y USAR RUTAS MODULARES =====
const authRoutes = require('./routes/auth');
const registrosRoutes = require('./routes/registros');
const adminRoutes = require('./routes/admin');
//const validacionRoutes = require('./routes/validacion');
const reportesRoutes = require('./routes/reportes');
const dashboardRoutes = require('./routes/dashboard');
const perfilRoutes = require('./routes/perfil');
const usuariasRoutes = require('./routes/usuarias');
const visitasRoutes = require('./routes/visitas');
const comunidadesRouter = require('./routes/comunidades');
const dashboardAuxiliarRoutes = require('./routes/dashboard-auxiliar');
const validacionVisitasRoutes = require('./routes/validacion-visitas');
const planificacionRoutes = require('./routes/planificacion');
const backupRoutes = require('./routes/backup');

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/registros', registrosRoutes);
app.use('/api/admin', adminRoutes);
//app.use('/api/validacion', validacionRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/usuarias', usuariasRoutes);
app.use('/api/visitas', visitasRoutes);
app.use('/api/comunidades', comunidadesRouter);
app.use('/api/dashboard-auxiliar', dashboardAuxiliarRoutes);
app.use('/api/validacion', validacionVisitasRoutes);
app.use('/api/planificacion', planificacionRoutes);
app.use('/api/backup', backupRoutes);

// ===== RUTAS BÁSICAS (mantener compatibilidad) =====
// Estas las moveré gradualmente a módulos específicos

// Obtener estadísticas (temporal - mover a dashboard)
app.get('/api/estadisticas/:year', require('./middleware/auth').authenticateToken, (req, res) => {
    // Redirigir a la nueva ruta modular
    res.redirect(`/api/dashboard/estadisticas/${req.params.year}`);
});

// Obtener comunidades
app.get('/api/comunidades', require('./middleware/auth').authenticateToken, (req, res) => {
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
        } else if (req.user.rol === 'asistente_tecnico') {
            query = `
                SELECT c.id, c.nombre, c.codigo_comunidad, c.poblacion_mef, t.nombre as territorio
                FROM comunidades c
                JOIN territorios t ON c.territorio_id = t.id
                WHERE t.id = ? AND c.activa = 1
                ORDER BY c.nombre
            `;
            params.push(req.user.territorio_id);
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

// Obtener métodos
app.get('/api/metodos', require('./middleware/auth').authenticateToken, (req, res) => {
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

// ===== MANEJO DE ERRORES 404 =====
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`,
        availableEndpoints: [
            'GET /api/health',
            '--- AUTENTICACIÓN ---',
            'POST /api/auth/login',
            'GET /api/auth/verify',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            '--- REGISTROS ---',
            'GET /api/registros',
            'POST /api/registros',
            'PUT /api/registros/:id',
            '--- ADMINISTRACIÓN ---',
            'GET /api/admin/usuarios',
            'POST /api/admin/usuarios',
            'GET /api/admin/metas/:year',
            'PUT /api/admin/metas/:year',
            '--- VALIDACIÓN ---',
            'GET /api/validacion/pendientes',
            'PUT /api/validacion/registro/:id',
            '--- REPORTES ---',
            'GET /api/reportes/mensual/:year/:mes',
            'GET /api/reportes/trimestral/:year/:trimestre',
            'GET /api/reportes/anual/:year',
            '--- DASHBOARD ---',
            'GET /api/dashboard/ejecutivo',
            'GET /api/dashboard/estadisticas/:year',
            '--- BÁSICOS (compatibilidad) ---',
            'GET /api/comunidades',
            'GET /api/metodos'
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

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
    console.log('\n⚠️  Cerrando servidor...');
    
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('❌ Error cerrando base de datos:', err);
            } else {
                console.log('✅ Base de datos cerrada correctamente');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
    console.log('\n🚀 ===== SERVIDOR SGPF-MSPAS (MODULAR) =====');
    console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Base de datos: ${db ? 'Conectada' : 'Desconectada'}`);
    console.log(`🏗️  Arquitectura: Modular (6 módulos de rutas)`);
    
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
        console.log('\n📁 Estructura modular:');
        console.log('   🔐 /api/auth/* - Autenticación');
        console.log('   📋 /api/registros/* - Gestión de registros');
        console.log('   ⚙️  /api/admin/* - Administración');
        console.log('   ✅ /api/validacion/* - Workflow validación');
        console.log('   📊 /api/reportes/* - Sistema reportes');
        console.log('   📈 /api/dashboard/* - KPIs y dashboard');
    }
    
    console.log('\n✅ Backend modular listo para producción\n');
});

module.exports = app;