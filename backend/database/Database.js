// ===== CONFIGURACIÓN DE BASE DE DATOS =====
// SQLite para desarrollo, fácil migración a PostgreSQL en producción

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'sgpf.db');
        this.db = null;
        this.init();
    }

    init() {
        console.log('🗄️ Inicializando base de datos SQLite...');
        
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error al conectar con la base de datos:', err.message);
                return;
            }
            
            console.log('✅ Conectado a la base de datos SQLite');
            this.createTables();
        });
    }

    createTables() {
        console.log('📋 Creando tablas necesarias...');
        
        // Tabla de usuarios
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                rol TEXT NOT NULL,
                territorio TEXT,
                comunidad TEXT,
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabla de comunidades
        const createCommunityTable = `
            CREATE TABLE IF NOT EXISTS comunidades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                codigo TEXT UNIQUE,
                territorio TEXT,
                poblacion_mef INTEGER DEFAULT 0,
                activa BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Tabla de métodos de planificación
        const createMethodsTable = `
            CREATE TABLE IF NOT EXISTS metodos_planificacion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                categoria TEXT NOT NULL,
                activo BOOLEAN DEFAULT 1,
                orden INTEGER DEFAULT 0
            )
        `;

        // Tabla de registros mensuales
        const createRegistrosTable = `
            CREATE TABLE IF NOT EXISTS registros_mensuales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                comunidad_id INTEGER NOT NULL,
                metodo_id INTEGER NOT NULL,
                año INTEGER NOT NULL,
                mes INTEGER NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 0,
                observaciones TEXT,
                estado TEXT DEFAULT 'pendiente',
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                validado_por INTEGER,
                fecha_validacion DATETIME,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (comunidad_id) REFERENCES comunidades (id),
                FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion (id),
                UNIQUE(comunidad_id, metodo_id, año, mes)
            )
        `;

        // Ejecutar creación de tablas
        this.db.run(createUsersTable, (err) => {
            if (err) console.error('❌ Error creando tabla usuarios:', err);
            else console.log('✅ Tabla usuarios creada/verificada');
        });

        this.db.run(createCommunityTable, (err) => {
            if (err) console.error('❌ Error creando tabla comunidades:', err);
            else console.log('✅ Tabla comunidades creada/verificada');
        });

        this.db.run(createMethodsTable, (err) => {
            if (err) console.error('❌ Error creando tabla métodos:', err);
            else console.log('✅ Tabla métodos creada/verificada');
        });

        this.db.run(createRegistrosTable, (err) => {
            if (err) console.error('❌ Error creando tabla registros:', err);
            else console.log('✅ Tabla registros creada/verificada');
        });

        // Insertar datos iniciales
        setTimeout(() => this.insertInitialData(), 1000);
    }

    insertInitialData() {
        console.log('📝 Insertando datos iniciales...');
        
        // Comunidades de ejemplo
        const comunidades = [
            { nombre: 'San Juan Cotzal', codigo: 'SJC001', territorio: 'Norte' },
            { nombre: 'Santa María Nebaj', codigo: 'SMN002', territorio: 'Norte' },
            { nombre: 'San Gaspar Chajul', codigo: 'SGC003', territorio: 'Sur' },
            { nombre: 'Santa Cruz Barillas', codigo: 'SCB004', territorio: 'Oeste' },
            { nombre: 'San Mateo Ixtatán', codigo: 'SMI005', territorio: 'Este' }
        ];

        comunidades.forEach(comunidad => {
            this.db.run(
                'INSERT OR IGNORE INTO comunidades (nombre, codigo, territorio, poblacion_mef) VALUES (?, ?, ?, ?)',
                [comunidad.nombre, comunidad.codigo, comunidad.territorio, Math.floor(Math.random() * 500) + 100],
                (err) => {
                    if (err) console.error(`❌ Error insertando ${comunidad.nombre}:`, err);
                }
            );
        });

        // Métodos de planificación
        const metodos = [
            { codigo: 'INY_MEN', nombre: 'Inyección Mensual', categoria: 'hormonal', orden: 1 },
            { codigo: 'INY_BIM', nombre: 'Inyección Bimensual', categoria: 'hormonal', orden: 2 },
            { codigo: 'INY_TRI', nombre: 'Inyección Trimestral', categoria: 'hormonal', orden: 3 },
            { codigo: 'PILDORA', nombre: 'Píldora Anticonceptiva', categoria: 'hormonal', orden: 4 },
            { codigo: 'DIU', nombre: 'Dispositivo Intrauterino', categoria: 'dispositivo', orden: 5 },
            { codigo: 'IMPLANTE', nombre: 'Implante Subdérmico', categoria: 'dispositivo', orden: 6 },
            { codigo: 'CONDON_M', nombre: 'Condón Masculino', categoria: 'barrera', orden: 7 },
            { codigo: 'CONDON_F', nombre: 'Condón Femenino', categoria: 'barrera', orden: 8 },
            { codigo: 'MELA', nombre: 'Lactancia Materna (MELA)', categoria: 'natural', orden: 9 },
            { codigo: 'AQV_F', nombre: 'Esterilización Femenina', categoria: 'definitivo', orden: 10 }
        ];

        metodos.forEach(metodo => {
            this.db.run(
                'INSERT OR IGNORE INTO metodos_planificacion (codigo, nombre, categoria, orden) VALUES (?, ?, ?, ?)',
                [metodo.codigo, metodo.nombre, metodo.categoria, metodo.orden],
                (err) => {
                    if (err) console.error(`❌ Error insertando ${metodo.nombre}:`, err);
                }
            );
        });

        console.log('✅ Datos iniciales insertados correctamente');
    }

    // Método para obtener una conexión a la base de datos
    getConnection() {
        return this.db;
    }

    // Método para cerrar la conexión
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error cerrando la base de datos:', err.message);
                } else {
                    console.log('✅ Conexión a la base de datos cerrada');
                }
            });
        }
    }
}

module.exports = Database;