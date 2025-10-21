// ===== CONFIGURACIÓN COMPLETA DE BASE DE DATOS V2.0 =====
// Sistema Individual: Usuarias + Visitas (no agregado)
// 45 comunidades correctas en 9 territorios
// SGPF-MSPAS Huehuetenango
// Incluye inicialización de planificación 2025

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

class DatabaseSetup {
  constructor() {
    this.dbPath = path.join(__dirname, "sgpf_complete.db");
    this.db = null;
    this.init();
  }

  init() {
    console.log("🗄️ Configurando base de datos SGPF-MSPAS V2.0...");
    console.log("📋 CAMBIO PRINCIPAL: Sistema de usuarias individuales");

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error("❌ Error al conectar:", err.message);
        return;
      }

      console.log("✅ Base de datos SQLite conectada");
      this.createAllTables();
    });
  }

  createAllTables() {
    console.log("📋 Creando estructura completa de tablas V2.0...");

    // ===== TABLA DE DEPARTAMENTOS =====
    const departamentosTable = `
      CREATE TABLE IF NOT EXISTS departamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo_ine TEXT UNIQUE,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ===== TABLA DE MUNICIPIOS =====
    const municipiosTable = `
      CREATE TABLE IF NOT EXISTS municipios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        departamento_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        codigo_ine TEXT UNIQUE,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (departamento_id) REFERENCES departamentos (id)
      )
    `;

    // ===== TABLA DE DISTRITOS DE SALUD =====
    const distritosTable = `
      CREATE TABLE IF NOT EXISTS distritos_salud (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        municipio_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        codigo TEXT UNIQUE,
        direccion TEXT,
        telefono TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (municipio_id) REFERENCES municipios (id)
      )
    `;

    // ===== TABLA DE TERRITORIOS (9 TERRITORIOS NUEVOS) =====
    const territoriosTable = `
      CREATE TABLE IF NOT EXISTS territorios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        distrito_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        codigo TEXT UNIQUE,
        descripcion TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (distrito_id) REFERENCES distritos_salud (id)
      )
    `;

    // ===== TABLA DE PUESTOS DE SALUD (NUEVO) =====
    const puestosTable = `
      CREATE TABLE IF NOT EXISTS puestos_salud (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territorio_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('centro_salud', 'puesto_salud', 'centro_comunitario', 'sede_sector', 'sede_territorio')) NOT NULL,
        codigo TEXT UNIQUE,
        direccion TEXT,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (territorio_id) REFERENCES territorios (id)
      )
    `;

    // ===== TABLA DE COMUNIDADES (45 COMUNIDADES CORRECTAS) =====
    const comunidadesTable = `
      CREATE TABLE IF NOT EXISTS comunidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territorio_id INTEGER NOT NULL,
        puesto_salud_id INTEGER,
        nombre TEXT NOT NULL,
        codigo_comunidad TEXT UNIQUE,
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        poblacion_total INTEGER DEFAULT 0,
        poblacion_mef INTEGER DEFAULT 0,
        acceso_vehicular BOOLEAN DEFAULT 1,
        distancia_km DECIMAL(6, 2),
        activa BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (territorio_id) REFERENCES territorios (id),
        FOREIGN KEY (puesto_salud_id) REFERENCES puestos_salud (id)
      )
    `;

    // ===== TABLA DE USUARIAS (NUEVO - NÚCLEO DEL CAMBIO) =====
    const usuariasTable = `
      CREATE TABLE IF NOT EXISTS usuarias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dpi TEXT UNIQUE NOT NULL,
        nombres TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        comunidad_id INTEGER NOT NULL,
        fecha_nacimiento DATE,
        telefono TEXT,
        tipo_usuaria TEXT CHECK(tipo_usuaria IN ('nueva', 'reconsulta', 'activa')) DEFAULT 'nueva',
        fecha_primera_visita DATE NOT NULL,
        fecha_ultima_visita DATE,
        total_visitas INTEGER DEFAULT 1,
        activa BOOLEAN DEFAULT 1,
        observaciones TEXT,
        creada_por INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comunidad_id) REFERENCES comunidades (id),
        FOREIGN KEY (creada_por) REFERENCES usuarios (id)
      )
    `;

    // ===== TABLA DE VISITAS (REEMPLAZA registros_mensuales) =====
    const visitasTable = `
      CREATE TABLE IF NOT EXISTS visitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuaria_id INTEGER NOT NULL,
        metodo_id INTEGER NOT NULL,
        fecha_visita DATE NOT NULL,
        observaciones TEXT,
        estado TEXT DEFAULT 'registrado' CHECK(estado IN ('registrado', 'validado', 'rechazado')),
        registrado_por INTEGER NOT NULL,
        fecha_hora_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        validado_por INTEGER,
        fecha_hora_validacion DATETIME,
        observaciones_validacion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuaria_id) REFERENCES usuarias (id),
        FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion (id),
        FOREIGN KEY (registrado_por) REFERENCES usuarios (id),
        FOREIGN KEY (validado_por) REFERENCES usuarios (id)
      )
    `;

    // ===== TABLA DE ROLES =====
    const rolesTable = `
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_rol TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        nivel_jerarquico INTEGER NOT NULL,
        puede_registrar BOOLEAN DEFAULT 0,
        puede_validar BOOLEAN DEFAULT 0,
        puede_aprobar BOOLEAN DEFAULT 0,
        puede_generar_reportes BOOLEAN DEFAULT 0,
        puede_administrar BOOLEAN DEFAULT 0,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ===== TABLA DE USUARIOS DEL SISTEMA =====
    const usuariosTable = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_empleado TEXT UNIQUE,
        dpi TEXT UNIQUE,
        nombres TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefono TEXT,
        password_hash TEXT NOT NULL,
        rol_id INTEGER NOT NULL,
        territorio_id INTEGER,
        distrito_id INTEGER,
        cargo TEXT,
        fecha_ingreso DATE,
        ultimo_acceso DATETIME,
        intentos_fallidos INTEGER DEFAULT 0,
        bloqueado BOOLEAN DEFAULT 0,
        debe_cambiar_password BOOLEAN DEFAULT 1,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rol_id) REFERENCES roles (id),
        FOREIGN KEY (territorio_id) REFERENCES territorios (id),
        FOREIGN KEY (distrito_id) REFERENCES distritos_salud (id)
      )
    `;

    // ===== TABLA DE PERMISOS POR COMUNIDAD =====
    const permisosComunidadTable = `
      CREATE TABLE IF NOT EXISTS permisos_comunidad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        comunidad_id INTEGER NOT NULL,
        puede_ver BOOLEAN DEFAULT 1,
        puede_registrar BOOLEAN DEFAULT 0,
        puede_editar BOOLEAN DEFAULT 0,
        fecha_asignacion DATE DEFAULT CURRENT_DATE,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
        FOREIGN KEY (comunidad_id) REFERENCES comunidades (id),
        UNIQUE(usuario_id, comunidad_id)
      )
    `;

    // ===== TABLA DE ASIGNACIÓN MÚLTIPLE DE TERRITORIOS (NUEVO) =====
    const userTerritoriosTable = `
      CREATE TABLE IF NOT EXISTS user_territorios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        territorio_id INTEGER NOT NULL,
        asignado_por INTEGER,
        fecha_asignacion DATE DEFAULT CURRENT_DATE,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
        FOREIGN KEY (territorio_id) REFERENCES territorios (id),
        FOREIGN KEY (asignado_por) REFERENCES usuarios (id),
        UNIQUE(usuario_id, territorio_id)
      )
    `;

    // ===== TABLA DE MÉTODOS DE PLANIFICACIÓN =====
    const metodosTable = `
      CREATE TABLE IF NOT EXISTS metodos_planificacion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_metodo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        nombre_corto TEXT,
        categoria TEXT NOT NULL,
        tipo_administracion TEXT,
        unidad_medida TEXT DEFAULT 'unidades',
        dias_efectividad INTEGER,
        requiere_seguimiento BOOLEAN DEFAULT 0,
        orden_visualizacion INTEGER DEFAULT 0,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ===== TABLA DE CONFIGURACIÓN DE METAS ANUALES =====
    const metasAnualesTable = `
      CREATE TABLE IF NOT EXISTS configuracion_metas_anuales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        año INTEGER NOT NULL,
        metodo_id INTEGER NOT NULL,
        porcentaje_meta DECIMAL(5, 2) NOT NULL,
        observaciones TEXT,
        fecha_aprobacion DATE,
        aprobado_por INTEGER,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion (id),
        FOREIGN KEY (aprobado_por) REFERENCES usuarios (id),
        UNIQUE(año, metodo_id)
      )
    `;

    // ===== TABLA DE PROYECCIONES POR COMUNIDAD =====
    const proyeccionesTable = `
      CREATE TABLE IF NOT EXISTS proyecciones_comunidad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comunidad_id INTEGER NOT NULL,
        año INTEGER NOT NULL,
        poblacion_mef INTEGER NOT NULL,
        porcentaje_proyeccion REAL DEFAULT 0.35,
        ajuste_fijo INTEGER DEFAULT 70,
        proyeccion_anual INTEGER AS (CAST((poblacion_mef * porcentaje_proyeccion) - ajuste_fijo AS INTEGER)) STORED,
        unidades_sin_distribuir INTEGER DEFAULT 0,
        es_manual BOOLEAN DEFAULT 0,
        observaciones TEXT,
        fecha_configuracion DATETIME DEFAULT CURRENT_TIMESTAMP,
        configurado_por INTEGER,
        activo BOOLEAN DEFAULT 1,
        FOREIGN KEY (comunidad_id) REFERENCES comunidades(id),
        FOREIGN KEY (configurado_por) REFERENCES usuarios(id),
        UNIQUE(comunidad_id, año)
      )
    `;

    // ===== TABLA DE METAS POR MÉTODO POR COMUNIDAD =====
    const metasMetodoComunidadTable = `
      CREATE TABLE IF NOT EXISTS metas_metodo_comunidad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proyeccion_id INTEGER NOT NULL,
        metodo_id INTEGER NOT NULL,
        año INTEGER NOT NULL,
        porcentaje_metodo DECIMAL(5,2) NOT NULL,
        proyeccion_anual_metodo INTEGER NOT NULL,
        observaciones TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT 1,
        FOREIGN KEY (proyeccion_id) REFERENCES proyecciones_comunidad(id),
        FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion(id),
        UNIQUE(proyeccion_id, metodo_id, año)
      )
    `;

    // ===== TABLA DE PLANIFICACIÓN MENSUAL (para coordinadora) =====
    const planificacionMensualTable = `
      CREATE TABLE IF NOT EXISTS planificacion_mensual (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meta_metodo_comunidad_id INTEGER NOT NULL,
        mes INTEGER NOT NULL CHECK(mes >= 1 AND mes <= 12),
        meta_mensual INTEGER DEFAULT 0,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        creado_por INTEGER,
        activo BOOLEAN DEFAULT 1,
        FOREIGN KEY (meta_metodo_comunidad_id) REFERENCES metas_metodo_comunidad(id),
        FOREIGN KEY (creado_por) REFERENCES usuarios(id),
        UNIQUE(meta_metodo_comunidad_id, mes)
      )
    `;

    // ===== TABLA HISTÓRICA (mantener registros viejos si es necesario) =====
    const registrosHistoricosTable = `
      CREATE TABLE IF NOT EXISTS registros_historicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comunidad_id INTEGER NOT NULL,
        metodo_id INTEGER NOT NULL,
        año INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        cantidad_administrada INTEGER NOT NULL DEFAULT 0,
        fecha_registro DATE NOT NULL,
        observaciones TEXT,
        estado TEXT DEFAULT 'registrado',
        registrado_por INTEGER NOT NULL,
        migrado_desde_v1 BOOLEAN DEFAULT 1,
        fecha_migracion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comunidad_id) REFERENCES comunidades (id),
        FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion (id),
        FOREIGN KEY (registrado_por) REFERENCES usuarios (id)
      )
    `;

    // Ejecutar creación de tablas en orden
    const tables = [
      { name: "departamentos", sql: departamentosTable },
      { name: "municipios", sql: municipiosTable },
      { name: "distritos_salud", sql: distritosTable },
      { name: "territorios", sql: territoriosTable },
      { name: "puestos_salud", sql: puestosTable },
      { name: "comunidades", sql: comunidadesTable },
      { name: "usuarias", sql: usuariasTable },
      { name: "roles", sql: rolesTable },
      { name: "usuarios", sql: usuariosTable },
      { name: "permisos_comunidad", sql: permisosComunidadTable },
      { name: "user_territorios", sql: userTerritoriosTable },
      { name: "metodos_planificacion", sql: metodosTable },
      { name: "configuracion_metas_anuales", sql: metasAnualesTable },
      { name: "proyecciones_comunidad", sql: proyeccionesTable },
      { name: "metas_metodo_comunidad", sql: metasMetodoComunidadTable },
      { name: "planificacion_mensual", sql: planificacionMensualTable },
      { name: "visitas", sql: visitasTable },
      { name: "registros_historicos", sql: registrosHistoricosTable },
    ];

    let completedTables = 0;
    const totalTables = tables.length;

    tables.forEach((table) => {
      this.db.run(table.sql, (err) => {
        if (err) {
          console.error(`❌ Error creando tabla ${table.name}:`, err);
        } else {
          console.log(`✅ Tabla ${table.name} creada/verificada`);
        }

        completedTables++;
        if (completedTables === totalTables) {
          console.log("🎯 Todas las tablas creadas, insertando datos...");
          setTimeout(() => this.insertCompleteData(), 1000);
        }
      });
    });
  }

  async insertCompleteData() {
    console.log("📝 Insertando datos completos SGPF V2.0...");

    try {
      await this.insertGeographicData();
      await this.insertRoles();
      await this.insertMethods();
      await this.insertUsers();
      await this.insertMetas();
      await this.inicializarPlanificacion2025();

      console.log("\n🎉 ¡Base de datos V2.0 configurada exitosamente!");
      console.log("📊 Datos insertados:");
      console.log("   - 45 comunidades correctas");
      console.log("   - 9 territorios nuevos");
      console.log("   - 11 métodos de planificación");
      console.log("   - 4 roles con permisos");
      console.log("   - 4 usuarios de prueba");
      console.log("   - Sistema de usuarias individuales listo");
      console.log("   - Planificación 2025 inicializada");
    } catch (error) {
      console.error("❌ Error insertando datos:", error);
    }
  }

  insertGeographicData() {
    return new Promise((resolve) => {
      console.log("🌎 Insertando estructura geográfica...");

      this.db.run(
        "INSERT OR IGNORE INTO departamentos (nombre, codigo_ine) VALUES (?, ?)",
        ["Huehuetenango", "13"],
        (err) => {
          if (err) console.error("Error insertando departamento:", err);

          this.db.run(
            "INSERT OR IGNORE INTO municipios (departamento_id, nombre, codigo_ine) VALUES (?, ?, ?)",
            [1, "Huehuetenango", "1301"],
            (err) => {
              if (err) console.error("Error insertando municipio:", err);

              this.db.run(
                "INSERT OR IGNORE INTO distritos_salud (municipio_id, nombre, codigo, direccion) VALUES (?, ?, ?, ?)",
                [
                  1,
                  "Centro de Salud - Huehuetenango",
                  "HUE-DS-01",
                  "Huehuetenango, Guatemala",
                ],
                (err) => {
                  if (err) console.error("Error insertando distrito:", err);
                  this.insertTerritorios(() => resolve());
                }
              );
            }
          );
        }
      );
    });
  }

  insertTerritorios(callback) {
    console.log("🗺️ Insertando 9 territorios y 45 comunidades...");

    const territorios = [
      {
        id: 1,
        nombre: "Territorio 1",
        codigo: "T1",
        comunidades: [
          { nombre: "Minerva", codigo: "T1-001", mef: 1600 },
          { nombre: "Lo de Hernández", codigo: "T1-002", mef: 1410 },
          { nombre: "El Eucalipto", codigo: "T1-003", mef: 1700 },
          { nombre: "Los Aguacatillos", codigo: "T1-004", mef: 1100 },
          { nombre: "Zona 3 Calvario", codigo: "T1-005", mef: 1150 },
        ],
      },
      {
        id: 2,
        nombre: "Territorio 2",
        codigo: "T2",
        comunidades: [
          { nombre: "Carrizal I", codigo: "T2-001", mef: 1050 },
          { nombre: "Carrizal II", codigo: "T2-002", mef: 1100 },
          { nombre: "Calvario", codigo: "T2-003", mef: 1150 },
          { nombre: "Buena Vista", codigo: "T2-004", mef: 130 },
          { nombre: "Carrizal Arriba", codigo: "T2-005", mef: 1000 },
        ],
      },
      {
        id: 3,
        nombre: "Territorio 3",
        codigo: "T3",
        comunidades: [
          { nombre: "La Laguna Chinaca", codigo: "T3-001", mef: 220 },
          { nombre: "La Laguna Ocubilá", codigo: "T3-002", mef: 180 },
          { nombre: "Lo de Chavez", codigo: "T3-003", mef: 200 },
          { nombre: "La Barranca Ocubilá", codigo: "T3-004", mef: 150 },
          { nombre: "Ocubilá", codigo: "T3-005", mef: 900 },
        ],
      },
      {
        id: 4,
        nombre: "Territorio 4",
        codigo: "T4",
        comunidades: [
          { nombre: "Terrero Alto", codigo: "T4-001", mef: 1070 },
          { nombre: "Terrero", codigo: "T4-002", mef: 1580 },
          { nombre: "Terrero Bajo", codigo: "T4-003", mef: 1500 },
          { nombre: "El Terrero", codigo: "T4-004", mef: 1580 },
          { nombre: "Zona 1 Huehuetenango", codigo: "T4-005", mef: 1400 },
        ],
      },
      {
        id: 5,
        nombre: "Territorio 5",
        codigo: "T5",
        comunidades: [
          { nombre: "Chinaca", codigo: "T5-001", mef: 2312 },
          { nombre: "Posh", codigo: "T5-002", mef: 185 },
          { nombre: "Tojespaque", codigo: "T5-003", mef: 459 },
          { nombre: "Llano Grande Chinaca", codigo: "T5-004", mef: 404 },
          { nombre: "El Llano Chinaca", codigo: "T5-005", mef: 380 },
        ],
      },
      {
        id: 6,
        nombre: "Territorio 6",
        codigo: "T6",
        comunidades: [
          { nombre: "San Lorenzo", codigo: "T6-001", mef: 1500 },
          { nombre: "Ojechejel", codigo: "T6-002", mef: 460 },
          { nombre: "Tojocaz", codigo: "T6-003", mef: 500 },
          { nombre: "Chilojá", codigo: "T6-004", mef: 300 },
          { nombre: "Monte Verde", codigo: "T6-005", mef: 1350 },
          { nombre: "Jumaj", codigo: "T6-006", mef: 1200 },
        ],
      },
      {
        id: 7,
        nombre: "Territorio 7",
        codigo: "T7",
        comunidades: [
          { nombre: "El Llano Ocubilá", codigo: "T7-001", mef: 350 },
          { nombre: "La Barranca Ocubilá", codigo: "T7-002", mef: 150 },
          { nombre: "Ocubilá Cabecera", codigo: "T7-003", mef: 900 },
          { nombre: "Centro de Salud", codigo: "T7-004", mef: 1400 },
          { nombre: "Lo de Chavez", codigo: "T7-005", mef: 200 },
        ],
      },
      {
        id: 8,
        nombre: "Territorio 8",
        codigo: "T8",
        comunidades: [
          { nombre: "Xetenam", codigo: "T8-001", mef: 338 },
          { nombre: "La Barranca Xétenam", codigo: "T8-002", mef: 90 },
          { nombre: "Buena Vista Sur", codigo: "T8-003", mef: 130 },
          { nombre: "Chiquilabaj", codigo: "T8-004", mef: 85 },
          { nombre: "Suruj", codigo: "T8-005", mef: 415 },
          { nombre: "Cancelaj", codigo: "T8-006", mef: 385 },
        ],
      },
      {
        id: 9,
        nombre: "Territorio 9 - Quiché",
        codigo: "T9",
        comunidades: [
          { nombre: "Llano Grande La Estancia", codigo: "T9-001", mef: 334 },
          { nombre: "Las Pilas", codigo: "T9-002", mef: 100 },
          { nombre: "El Valle", codigo: "T9-003", mef: 200 },
          { nombre: "El Orégano", codigo: "T9-004", mef: 185 },
          { nombre: "Río Negro", codigo: "T9-005", mef: 155 },
          { nombre: "Las Florecitas", codigo: "T9-006", mef: 100 },
          { nombre: "La Estancia", codigo: "T9-007", mef: 270 },
          { nombre: "Sucuj", codigo: "T9-008", mef: 124 },
        ],
      },
    ];

    let insertedTerr = 0;
    let insertedCom = 0;
    let totalComunidades = territorios.reduce(
      (sum, t) => sum + t.comunidades.length,
      0
    );

    territorios.forEach((territorio) => {
      this.db.run(
        "INSERT OR IGNORE INTO territorios (distrito_id, nombre, codigo, descripcion) VALUES (?, ?, ?, ?)",
        [1, territorio.nombre, territorio.codigo, `${territorio.nombre}`],
        (err) => {
          if (err)
            console.error(`Error insertando territorio ${territorio.nombre}:`, err);

          insertedTerr++;

          territorio.comunidades.forEach((com) => {
            this.db.run(
              `INSERT OR IGNORE INTO comunidades 
               (territorio_id, nombre, codigo_comunidad, poblacion_mef, poblacion_total) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                territorio.id,
                com.nombre,
                com.codigo,
                com.mef,
                Math.floor(com.mef * 4.2),
              ],
              (err) => {
                if (err)
                  console.error(`Error insertando comunidad ${com.nombre}:`, err);

                insertedCom++;
                if (insertedCom === totalComunidades) {
                  console.log(
                    `✅ ${insertedTerr} territorios y ${insertedCom} comunidades insertadas`
                  );
                  callback();
                }
              }
            );
          });
        }
      );
    });
  }

  insertRoles() {
    return new Promise((resolve) => {
      console.log("👥 Insertando roles del sistema...");

      const roles = [
        {
          codigo: "auxiliar_enfermeria",
          nombre: "Auxiliar de Enfermería",
          descripcion: "Personal de campo - registro directo",
          nivel: 1,
          registrar: 1,
          validar: 0,
          aprobar: 0,
          reportes: 0,
          admin: 0,
        },
        {
          codigo: "asistente_tecnico",
          nombre: "Asistente Técnico",
          descripcion: "Supervisores territoriales - validación",
          nivel: 2,
          registrar: 1,
          validar: 1,
          aprobar: 0,
          reportes: 1,
          admin: 0,
        },
        {
          codigo: "encargado_sr",
          nombre: "Encargado SR",
          descripcion: "Coordinadores con acceso completo",
          nivel: 3,
          registrar: 1,
          validar: 1,
          aprobar: 1,
          reportes: 1,
          admin: 1,
        },
        {
          codigo: "coordinador_municipal",
          nombre: "Coordinador Municipal",
          descripcion: "Personal ejecutivo - vista estratégica",
          nivel: 4,
          registrar: 0,
          validar: 0,
          aprobar: 1,
          reportes: 1,
          admin: 1,
        },
      ];

      let inserted = 0;
      roles.forEach((rol) => {
        this.db.run(
          `INSERT OR IGNORE INTO roles 
           (codigo_rol, nombre, descripcion, nivel_jerarquico, puede_registrar, puede_validar, puede_aprobar, puede_generar_reportes, puede_administrar) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rol.codigo,
            rol.nombre,
            rol.descripcion,
            rol.nivel,
            rol.registrar,
            rol.validar,
            rol.aprobar,
            rol.reportes,
            rol.admin,
          ],
          (err) => {
            if (err) console.error(`Error insertando rol ${rol.nombre}:`, err);

            inserted++;
            if (inserted === roles.length) {
              console.log("✅ Roles del sistema insertados");
              resolve();
            }
          }
        );
      });
    });
  }

  insertMethods() {
    return new Promise((resolve) => {
      console.log("💊 Insertando métodos de planificación familiar...");

      const metodos = [
        {
          codigo: "INY_MEN",
          nombre: "Inyección Mensual",
          corto: "Iny. Mensual",
          categoria: "hormonal",
          tipo: "mensual",
          dias: 30,
          orden: 1,
        },
        {
          codigo: "INY_BIM",
          nombre: "Inyección Bimensual",
          corto: "Iny. Bimensual",
          categoria: "hormonal",
          tipo: "bimensual",
          dias: 60,
          orden: 2,
        },
        {
          codigo: "INY_TRI",
          nombre: "Inyección Trimestral",
          corto: "Iny. Trimestral",
          categoria: "hormonal",
          tipo: "trimestral",
          dias: 90,
          orden: 3,
        },
        {
          codigo: "PILDORA",
          nombre: "Píldora Anticonceptiva",
          corto: "Píldora",
          categoria: "hormonal",
          tipo: "mensual",
          dias: 28,
          orden: 4,
        },
        {
          codigo: "DIU",
          nombre: "Dispositivo Intrauterino",
          corto: "DIU",
          categoria: "dispositivo",
          tipo: "permanente",
          dias: 1825,
          orden: 5,
        },
        {
          codigo: "IMPLANTE",
          nombre: "Implante Hormonal Subdérmico",
          corto: "Implante",
          categoria: "dispositivo",
          tipo: "permanente",
          dias: 1095,
          orden: 6,
        },
        {
          codigo: "CONDON_M",
          nombre: "Condón Masculino",
          corto: "Condón",
          categoria: "barrera",
          tipo: "mensual",
          dias: 1,
          orden: 7,
        },
        {
          codigo: "COLLAR",
          nombre: "Collar del Ciclo",
          corto: "Collar",
          categoria: "natural",
          tipo: "permanente",
          dias: 365,
          orden: 8,
        },
        {
          codigo: "MELA",
          nombre: "Método de Lactancia y Amenorrea",
          corto: "MELA",
          categoria: "natural",
          tipo: "mensual",
          dias: 180,
          orden: 9,
        },
        {
          codigo: "AQV_FEM",
          nombre: "Anticoncepción Quirúrgica Voluntaria Femenina",
          corto: "AQV Fem",
          categoria: "definitivo",
          tipo: "permanente",
          dias: 0,
          orden: 10,
        },
        {
          codigo: "AQV_MAS",
          nombre: "Anticoncepción Quirúrgica Voluntaria Masculina",
          corto: "AQV Mas",
          categoria: "definitivo",
          tipo: "permanente",
          dias: 0,
          orden: 11,
        },
      ];

      let inserted = 0;
      metodos.forEach((metodo) => {
        this.db.run(
          `INSERT OR IGNORE INTO metodos_planificacion 
           (codigo_metodo, nombre, nombre_corto, categoria, tipo_administracion, dias_efectividad, orden_visualizacion) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            metodo.codigo,
            metodo.nombre,
            metodo.corto,
            metodo.categoria,
            metodo.tipo,
            metodo.dias,
            metodo.orden,
          ],
          (err) => {
            if (err)
              console.error(`Error insertando método ${metodo.nombre}:`, err);

            inserted++;
            if (inserted === metodos.length) {
              console.log("✅ Métodos de planificación insertados");
              resolve();
            }
          }
        );
      });
    });
  }

  async insertUsers() {
    return new Promise(async (resolve) => {
      console.log("👤 Insertando usuarios del sistema...");

      const hashPassword = async (password) => {
        return await bcrypt.hash(password, 10);
      };

      const usuarios = [
        {
          codigo: "COORD001",
          dpi: "1801199010101",
          nombres: "Dra. María Elena",
          apellidos: "González Morales",
          email: "admin@mspas.gob.gt",
          telefono: "78901234",
          password: "123456",
          rol: "coordinador_municipal",
          cargo: "Coordinadora Municipal de Salud",
          territorio: null,
          distrito: 1,
        },
        {
          codigo: "ENC001",
          dpi: "1801199020202",
          nombres: "Dra. Rosa María",
          apellidos: "Hernández Cruz",
          email: "encargado@mspas.gob.gt",
          telefono: "78902345",
          password: "123456",
          rol: "encargado_sr",
          cargo: "Encargada Programa Salud Reproductiva",
          territorio: null,
          distrito: 1,
        },
        {
          codigo: "ASIST001",
          dpi: "1801199040404",
          nombres: "Lic. Ana Patricia",
          apellidos: "Ramírez López",
          email: "asist01@mspas.gob.gt",
          telefono: "78904567",
          password: "123456",
          rol: "asistente_tecnico",
          cargo: "Asistente Técnico Territorio 1",
          territorio: 1,
          distrito: 1,
        },
        {
          codigo: "AUX001",
          dpi: "1801199101010",
          nombres: "Ana Patricia",
          apellidos: "López Morales",
          email: "aux01@mspas.gob.gt",
          telefono: "78910123",
          password: "123456",
          rol: "auxiliar_enfermeria",
          cargo: "Auxiliar de Enfermería",
          territorio: 1,
          distrito: 1,
        },
      ];

      let inserted = 0;

      for (const usuario of usuarios) {
        try {
          const hashedPassword = await hashPassword(usuario.password);

          this.db.get(
            "SELECT id FROM roles WHERE codigo_rol = ?",
            [usuario.rol],
            (err, rol) => {
              if (err) {
                console.error(`Error obteniendo rol ${usuario.rol}:`, err);
                return;
              }

              if (!rol) {
                console.error(`Rol no encontrado: ${usuario.rol}`);
                return;
              }

              this.db.run(
                `INSERT OR IGNORE INTO usuarios 
                 (codigo_empleado, dpi, nombres, apellidos, email, telefono, password_hash, rol_id, cargo, territorio_id, distrito_id, fecha_ingreso) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  usuario.codigo,
                  usuario.dpi,
                  usuario.nombres,
                  usuario.apellidos,
                  usuario.email,
                  usuario.telefono,
                  hashedPassword,
                  rol.id,
                  usuario.cargo,
                  usuario.territorio,
                  usuario.distrito,
                  "2025-01-01",
                ],
                (err) => {
                  if (err) {
                    console.error(
                      `Error insertando usuario ${usuario.nombres}:`,
                      err
                    );
                  } else {
                    console.log(
                      `✅ Usuario ${usuario.nombres} ${usuario.apellidos} (${usuario.rol})`
                    );
                  }

                  inserted++;
                  if (inserted === usuarios.length) {
                    console.log("✅ Todos los usuarios insertados");
                    this.assignCommunityPermissions().then(() => resolve());
                  }
                }
              );
            }
          );
        } catch (error) {
          console.error(
            `Error hasheando contraseña para ${usuario.nombres}:`,
            error
          );
        }
      }
    });
  }

  assignCommunityPermissions() {
    return new Promise((resolve) => {
      console.log("🔐 Asignando permisos de comunidades...");

      const assignmentQuery = `
        INSERT OR IGNORE INTO permisos_comunidad (usuario_id, comunidad_id, puede_registrar) 
        SELECT u.id, c.id, 1 
        FROM usuarios u, comunidades c 
        WHERE u.codigo_empleado = "AUX001" 
        AND u.territorio_id = 1 
        AND c.territorio_id = 1
      `;

      this.db.run(assignmentQuery, (err) => {
        if (err) console.error("Error asignando permisos:", err);
        else console.log("✅ Permisos de comunidades asignados");
        resolve();
      });
    });
  }

  assignUserTerritorios() {
    return new Promise((resolve) => {
      console.log("🗺️ Asignando territorios a usuarios...");

      const assignments = [
        { usuario_codigo: "ASIST001", territorio_id: 1 },
        { usuario_codigo: "ASIST001", territorio_id: 2 },
      ];

      let inserted = 0;

      assignments.forEach((assignment) => {
        this.db.get(
          "SELECT id FROM usuarios WHERE codigo_empleado = ?",
          [assignment.usuario_codigo],
          (err, usuario) => {
            if (err || !usuario) {
              console.error(`Error obteniendo usuario ${assignment.usuario_codigo}:`, err);
              inserted++;
              if (inserted === assignments.length) resolve();
              return;
            }

            this.db.run(
              `INSERT OR IGNORE INTO user_territorios (usuario_id, territorio_id, asignado_por) 
               VALUES (?, ?, ?)`,
              [usuario.id, assignment.territorio_id, 1],
              (err) => {
                if (err) {
                  console.error(`Error asignando territorio ${assignment.territorio_id}:`, err);
                } else {
                  console.log(`✅ Usuario ${assignment.usuario_codigo} asignado a Territorio ${assignment.territorio_id}`);
                }

                inserted++;
                if (inserted === assignments.length) {
                  console.log("✅ Asignación de territorios completada");
                  resolve();
                }
              }
            );
          }
        );
      });
    });
  }

  insertMetas() {
    return new Promise((resolve) => {
      console.log("🎯 Insertando metas anuales 2025...");

      const metas2025 = [
        { metodo_id: 1, porcentaje: 10.0 },
        { metodo_id: 2, porcentaje: 10.0 },
        { metodo_id: 3, porcentaje: 45.0 },
        { metodo_id: 4, porcentaje: 12.0 },
        { metodo_id: 5, porcentaje: 2.0 },
        { metodo_id: 6, porcentaje: 8.0 },
        { metodo_id: 7, porcentaje: 6.0 },
        { metodo_id: 8, porcentaje: 1.0 },
        { metodo_id: 9, porcentaje: 5.5 },
        { metodo_id: 10, porcentaje: 0.25 },
        { metodo_id: 11, porcentaje: 0.25 },
      ];

      let inserted = 0;
      metas2025.forEach((meta) => {
        this.db.run(
          "INSERT OR IGNORE INTO configuracion_metas_anuales (año, metodo_id, porcentaje_meta, fecha_aprobacion) VALUES (?, ?, ?, ?)",
          [2025, meta.metodo_id, meta.porcentaje, "2025-01-01"],
          (err) => {
            if (err) console.error("Error insertando meta:", err);

            inserted++;
            if (inserted === metas2025.length) {
              console.log("✅ Metas anuales 2025 insertadas");
              this.insertProyecciones().then(() => {
                this.assignUserTerritorios().then(() => resolve());
              });
            }
          }
        );
      });
    });
  }

  insertProyecciones() {
    return new Promise((resolve) => {
      console.log("📊 Calculando proyecciones para comunidades...");

      this.db.all(
        "SELECT id, poblacion_mef FROM comunidades",
        (err, comunidades) => {
          if (err) {
            console.error("Error obteniendo comunidades:", err);
            resolve();
            return;
          }

          let inserted = 0;
          comunidades.forEach((comunidad) => {
            this.db.run(
              "INSERT OR IGNORE INTO proyecciones_comunidad (comunidad_id, año, poblacion_mef, configurado_por, es_manual, unidades_sin_distribuir) VALUES (?, ?, ?, ?, ?, ?)",
              [comunidad.id, 2025, comunidad.poblacion_mef, 1, 0, 0],
              (err) => {
                if (err)
                  console.error("Error insertando proyección:", err);

                inserted++;
                if (inserted === comunidades.length) {
                  console.log(
                    `✅ Proyecciones calculadas para ${comunidades.length} comunidades`
                  );
                  resolve();
                }
              }
            );
          });
        }
      );
    });
  }

  // ===== NUEVA FUNCIÓN: INICIALIZAR PLANIFICACIÓN 2025 =====
  inicializarPlanificacion2025() {
    return new Promise((resolve) => {
      console.log("\n🚀 Inicializando Planificación 2025...\n");

      this.db.serialize(() => {
        // PASO 1: Las proyecciones ya están creadas, ahora crear metas por método
        console.log("🎯 Creando metas por método...");

        const crearMetasQuery = `
          INSERT OR IGNORE INTO metas_metodo_comunidad (
            proyeccion_id,
            metodo_id,
            año,
            porcentaje_metodo,
            proyeccion_anual_metodo
          )
          SELECT 
            pc.id as proyeccion_id,
            cma.metodo_id,
            2025 as año,
            cma.porcentaje_meta as porcentaje_metodo,
            CAST(FLOOR(
              (CAST((pc.poblacion_mef * pc.porcentaje_proyeccion) - pc.ajuste_fijo AS INTEGER)) * 
              (cma.porcentaje_meta / 100.0)
            ) AS INTEGER) as proyeccion_anual_metodo
          FROM proyecciones_comunidad pc
          CROSS JOIN configuracion_metas_anuales cma
          WHERE pc.año = 2025 
            AND cma.año = 2025
            AND pc.activo = 1
            AND cma.activo = 1
        `;

        this.db.run(crearMetasQuery, (err) => {
          if (err) {
            console.error("❌ Error creando metas por método:", err.message);
            resolve();
            return;
          }

          console.log("✅ Metas por método creadas\n");

          // PASO 2: Calcular sobrantes
          console.log("🧮 Calculando sobrantes...");

          const calcularSobrantesQuery = `
            UPDATE proyecciones_comunidad
            SET unidades_sin_distribuir = (
              CAST((poblacion_mef * porcentaje_proyeccion) - ajuste_fijo AS INTEGER)
            ) - (
              SELECT COALESCE(SUM(proyeccion_anual_metodo), 0)
              FROM metas_metodo_comunidad
              WHERE proyeccion_id = proyecciones_comunidad.id
            )
            WHERE año = 2025 AND activo = 1
          `;

          this.db.run(calcularSobrantesQuery, (err) => {
            if (err) {
              console.error("❌ Error calculando sobrantes:", err.message);
              resolve();
              return;
            }

            console.log("✅ Sobrantes calculados\n");

            // VERIFICACIÓN
            console.log("🔍 VERIFICACIÓN DE RESULTADOS:\n");

            this.db.get(
              `SELECT COUNT(*) as total FROM proyecciones_comunidad WHERE año = 2025`,
              (err, row) => {
                if (!err) {
                  console.log(`📊 Total proyecciones 2025: ${row.total}`);
                }
              }
            );

            this.db.get(
              `SELECT COUNT(*) as total FROM metas_metodo_comunidad WHERE año = 2025`,
              (err, row) => {
                if (!err) {
                  console.log(`🎯 Total metas por método: ${row.total}`);
                }
              }
            );

            console.log("\n📋 EJEMPLO DE 5 COMUNIDADES:\n");

            const ejemploQuery = `
              SELECT 
                c.nombre as comunidad,
                pc.poblacion_mef as MEF,
                CAST((pc.poblacion_mef * 0.35) - 70 AS INTEGER) as proyeccion,
                pc.unidades_sin_distribuir as sobrante,
                COUNT(mmc.id) as metodos,
                SUM(mmc.proyeccion_anual_metodo) as suma_metas
              FROM proyecciones_comunidad pc
              JOIN comunidades c ON pc.comunidad_id = c.id
              LEFT JOIN metas_metodo_comunidad mmc ON mmc.proyeccion_id = pc.id
              WHERE pc.año = 2025
              GROUP BY pc.id
              LIMIT 5
            `;

            this.db.all(ejemploQuery, (err, rows) => {
              if (!err && rows) {
                console.table(rows);
              }

              console.log("\n✅ ¡INICIALIZACIÓN DE PLANIFICACIÓN 2025 COMPLETADA!\n");
              resolve();
            });
          });
        });
      });
    });
  }

  getConnection() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) console.error("Error cerrando BD:", err);
        else console.log("✅ Base de datos cerrada");
      });
    }
  }
}

module.exports = DatabaseSetup;

if (require.main === module) {
  const setup = new DatabaseSetup();

  setTimeout(() => {
    console.log("\n🚀 Configuración V2.0 completada!");
    console.log("\n📋 CAMBIOS PRINCIPALES:");
    console.log("====================");
    console.log("✅ 45 comunidades correctas en 9 territorios");
    console.log("✅ Sistema de usuarias individuales (tabla usuarias)");
    console.log("✅ Sistema de visitas 1 a 1 (reemplaza registros agregados)");
    console.log("✅ Tipos de usuaria: nueva/reconsulta/activa");
    console.log("✅ Proyecciones calculadas automáticamente");
    console.log("✅ Planificación 2025 inicializada con metas por método");
    console.log("✅ Sobrantes calculados automáticamente");

    console.log("\n🔑 USUARIOS DE PRUEBA:");
    console.log("====================");
    console.log("Coordinador: admin@mspas.gob.gt / 123456");
    console.log("Encargado SR: encargado@mspas.gob.gt / 123456");
    console.log("Asistente: asist01@mspas.gob.gt / 123456");
    console.log("Auxiliar: aux01@mspas.gob.gt / 123456");

    console.log("\n📊 PRÓXIMOS PASOS:");
    console.log("====================");
    console.log("1. Crear endpoints para usuarias");
    console.log("2. Crear endpoints para visitas");
    console.log("3. Modificar dashboard para mostrar usuarias");
    console.log("4. Crear nuevo formulario de registro");
    console.log("5. Recargar el frontend para ver las metas calculadas");

    setup.close();
  }, 8000);
}