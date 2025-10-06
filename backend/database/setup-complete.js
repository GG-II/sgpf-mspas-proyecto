// ===== CONFIGURACIÓN COMPLETA DE BASE DE DATOS =====
// Con datos reales del MSPAS Huehuetenango - Centro Norte

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
    console.log("🗄️ Configurando base de datos completa SGPF-MSPAS...");

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
    console.log("📋 Creando estructura completa de tablas...");

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

    // ===== TABLA DE TERRITORIOS =====
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

    // ===== TABLA DE COMUNIDADES (45 comunidades reales) =====
    const comunidadesTable = `
            CREATE TABLE IF NOT EXISTS comunidades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                territorio_id INTEGER NOT NULL,
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
                FOREIGN KEY (territorio_id) REFERENCES territorios (id)
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

    // ===== TABLA DE USUARIOS COMPLETA =====
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

    // ===== TABLA DE MÉTODOS DE PLANIFICACIÓN COMPLETA =====
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

    // ===== TABLA DE CONFIGURACIÓN DE METAS =====
    const metasTable = `
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

    // ===== TABLA DE POBLACIÓN MEF =====
    const poblacionMEFTable = `
            CREATE TABLE IF NOT EXISTS poblacion_mef (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                comunidad_id INTEGER NOT NULL,
                año INTEGER NOT NULL,
                poblacion_total INTEGER NOT NULL,
                poblacion_mef INTEGER NOT NULL,
                fuente TEXT DEFAULT 'INE',
                fecha_actualizacion DATE,
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (comunidad_id) REFERENCES comunidades (id),
                UNIQUE(comunidad_id, año)
            )
        `;

    // ===== TABLA DE PROYECCIONES ANUALES (CORREGIDA) =====
    const proyeccionesTable = `
    CREATE TABLE IF NOT EXISTS proyecciones_comunidad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comunidad_id INTEGER NOT NULL,
        año INTEGER NOT NULL,
        poblacion_mef INTEGER NOT NULL,
        porcentaje_proyeccion REAL DEFAULT 0.35,
        ajuste_fijo INTEGER DEFAULT 70,
        proyeccion_anual INTEGER AS (CAST((poblacion_mef * porcentaje_proyeccion) - ajuste_fijo AS INTEGER)) STORED,
        observaciones TEXT,
        fecha_configuracion DATETIME DEFAULT CURRENT_TIMESTAMP,
        configurado_por INTEGER,
        activo BOOLEAN DEFAULT 1,
        FOREIGN KEY (comunidad_id) REFERENCES comunidades(id),
        FOREIGN KEY (configurado_por) REFERENCES usuarios(id),
        UNIQUE(comunidad_id, año, activo)
    )
`;

    // ===== TABLA DE METAS POR MÉTODO POR COMUNIDAD (NUEVA) =====
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

    // ===== TABLA DE PLANIFICACIÓN MENSUAL =====
    const planificacionTable = `
    CREATE TABLE IF NOT EXISTS planificacion_mensual (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meta_metodo_comunidad_id INTEGER NOT NULL,
        mes INTEGER NOT NULL CHECK(mes >= 1 AND mes <= 12),
        meta_mensual INTEGER DEFAULT 0,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT 1,
        FOREIGN KEY (meta_metodo_comunidad_id) REFERENCES metas_metodo_comunidad(id),
        UNIQUE(meta_metodo_comunidad_id, mes)
    )
`;

    // ===== TABLA DE REGISTROS MENSUALES =====
    const registrosTable = `
            CREATE TABLE IF NOT EXISTS registros_mensuales (
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
                fecha_hora_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                validado_por INTEGER,
                fecha_hora_validacion DATETIME,
                observaciones_validacion TEXT,
                aprobado_por INTEGER,
                fecha_hora_aprobacion DATETIME,
                observaciones_aprobacion TEXT,
                origen_registro TEXT DEFAULT 'app',
                uuid_local TEXT,
                sincronizado BOOLEAN DEFAULT 1,
                fecha_sincronizacion DATETIME,
                version_app TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (comunidad_id) REFERENCES comunidades (id),
                FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion (id),
                FOREIGN KEY (registrado_por) REFERENCES usuarios (id),
                FOREIGN KEY (validado_por) REFERENCES usuarios (id),
                FOREIGN KEY (aprobado_por) REFERENCES usuarios (id),
                UNIQUE(comunidad_id, metodo_id, año, mes)
            )
        `;

    // Ejecutar creación de tablas en orden
    const tables = [
      { name: "departamentos", sql: departamentosTable },
      { name: "municipios", sql: municipiosTable },
      { name: "distritos_salud", sql: distritosTable },
      { name: "territorios", sql: territoriosTable },
      { name: "comunidades", sql: comunidadesTable },
      { name: "roles", sql: rolesTable },
      { name: "usuarios", sql: usuariosTable },
      { name: "permisos_comunidad", sql: permisosComunidadTable },
      { name: "metodos_planificacion", sql: metodosTable },
      { name: "configuracion_metas_anuales", sql: metasTable },
      { name: "poblacion_mef", sql: poblacionMEFTable },
      { name: "proyecciones_comunidad", sql: proyeccionesTable },
      { name: "metas_metodo_comunidad", sql: metasMetodoComunidadTable },
      { name: "planificacion_mensual", sql: planificacionTable },
      { name: "registros_mensuales", sql: registrosTable },
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
    console.log("📝 Insertando datos completos del MSPAS Huehuetenango...");

    try {
      // ===== INSERTAR DATOS GEOGRÁFICOS =====
      await this.insertGeographicData();

      // ===== INSERTAR ROLES =====
      await this.insertRoles();

      // ===== INSERTAR MÉTODOS DE PLANIFICACIÓN =====
      await this.insertMethods();

      // ===== INSERTAR USUARIOS CON ROLES =====
      await this.insertUsers();

      // ===== INSERTAR METAS ANUALES =====
      await this.insertMetas();

      // ===== INSERTAR DATOS DE POBLACIÓN =====
      await this.insertPoblacionData();

      // ===== INSERTAR REGISTROS DE EJEMPLO =====
      await this.insertSampleRegistros();

      console.log("🎉 ¡Base de datos completa configurada exitosamente!");
      console.log("📊 Datos insertados:");
      console.log("   - 45 comunidades del Centro Norte");
      console.log("   - 11 métodos de planificación familiar");
      console.log("   - 4 roles de usuario con permisos");
      console.log("   - 4 usuarios de prueba (1 por rol)");
      console.log("   - Datos de población MEF 2025");
      console.log("   - Registros de ejemplo con estados reales");
    } catch (error) {
      console.error("❌ Error insertando datos:", error);
    }
  }

  // Método para insertar datos geográficos
  insertGeographicData() {
    return new Promise((resolve) => {
      console.log("🌍 Insertando estructura geográfica...");

      // Departamento
      this.db.run(
        "INSERT OR IGNORE INTO departamentos (nombre, codigo_ine) VALUES (?, ?)",
        ["Huehuetenango", "13"],
        (err) => {
          if (err) console.error("Error insertando departamento:", err);

          // Municipio
          this.db.run(
            "INSERT OR IGNORE INTO municipios (departamento_id, nombre, codigo_ine) VALUES (?, ?, ?)",
            [1, "Huehuetenango", "1301"],
            (err) => {
              if (err) console.error("Error insertando municipio:", err);

              // Distrito de Salud
              this.db.run(
                "INSERT OR IGNORE INTO distritos_salud (municipio_id, nombre, codigo, direccion) VALUES (?, ?, ?, ?)",
                [
                  1,
                  "Centro de Salud Norte - Huehuetenango",
                  "HUE-NORTE-01",
                  "Zona 1, Huehuetenango, Guatemala",
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

  // Insertar territorios y comunidades
  insertTerritorios(callback) {
    console.log("🏘️ Insertando territorio y comunidades del Centro Norte...");

    // Solo 1 territorio: Centro Norte
    this.db.run(
      "INSERT OR IGNORE INTO territorios (distrito_id, nombre, codigo, descripcion) VALUES (?, ?, ?, ?)",
      [1, "Centro Norte", "TER-CN", "Territorio Centro Norte - Huehuetenango"],
      (err) => {
        if (err) console.error("Error insertando territorio:", err);

        // Las 45 comunidades reales del Excel con su población MEF
        const comunidades = [
          { nombre: "Centro de Salud", codigo: "CN-001", poblacion_mef: 1400 },
          { nombre: "Minerva", codigo: "CN-002", poblacion_mef: 1600 },
          { nombre: "Los Aguacatillos", codigo: "CN-003", poblacion_mef: 1100 },
          { nombre: "Carrizal II", codigo: "CN-004", poblacion_mef: 1100 },
          { nombre: "Carrizal I", codigo: "CN-005", poblacion_mef: 1050 },
          { nombre: "Zona 3 Calvario", codigo: "CN-006", poblacion_mef: 1150 },
          { nombre: "Carrizal Arriba", codigo: "CN-007", poblacion_mef: 1000 },
          { nombre: "Lo De Hernández", codigo: "CN-008", poblacion_mef: 1410 },
          { nombre: "El Eucalipto", codigo: "CN-009", poblacion_mef: 1700 },
          { nombre: "Brasilia", codigo: "CN-010", poblacion_mef: 900 },
          { nombre: "Terrero", codigo: "CN-011", poblacion_mef: 1580 },
          { nombre: "Terrero Bajo", codigo: "CN-012", poblacion_mef: 1500 },
          { nombre: "Terrero Alto", codigo: "CN-013", poblacion_mef: 1070 },
          { nombre: "Chinaca", codigo: "CN-014", poblacion_mef: 2312 },
          { nombre: "Tojespaque", codigo: "CN-015", poblacion_mef: 459 },
          { nombre: "Posh", codigo: "CN-016", poblacion_mef: 185 },
          {
            nombre: "Llano Grande Chinaca",
            codigo: "CN-017",
            poblacion_mef: 404,
          },
          { nombre: "San Lorenzo", codigo: "CN-018", poblacion_mef: 1500 },
          { nombre: "Ojechejel", codigo: "CN-019", poblacion_mef: 460 },
          { nombre: "Tojocaz", codigo: "CN-020", poblacion_mef: 500 },
          { nombre: "Chilojá", codigo: "CN-021", poblacion_mef: 300 },
          { nombre: "Jumaj", codigo: "CN-022", poblacion_mef: 1200 },
          { nombre: "Monte Verde", codigo: "CN-023", poblacion_mef: 1350 },
          { nombre: "Ocubilá", codigo: "CN-024", poblacion_mef: 900 },
          {
            nombre: "La Barranca Ocubilá",
            codigo: "CN-025",
            poblacion_mef: 150,
          },
          { nombre: "Lo De Chavez", codigo: "CN-026", poblacion_mef: 200 },
          { nombre: "LA Laguna Chinaca", codigo: "CN-027", poblacion_mef: 220 },
          { nombre: "La Laguna Ocubilá", codigo: "CN-028", poblacion_mef: 180 },
          { nombre: "EL Llano Chinaca", codigo: "CN-029", poblacion_mef: 380 },
          { nombre: "El Llano Ocubilá", codigo: "CN-030", poblacion_mef: 350 },
          { nombre: "Xetenam", codigo: "CN-031", poblacion_mef: 338 },
          {
            nombre: "La Barranca Xétenam",
            codigo: "CN-032",
            poblacion_mef: 90,
          },
          { nombre: "Buena Vista", codigo: "CN-033", poblacion_mef: 130 },
          { nombre: "Chiquilabaj", codigo: "CN-034", poblacion_mef: 85 },
          { nombre: "Suruj", codigo: "CN-035", poblacion_mef: 415 },
          { nombre: "Cancelaj", codigo: "CN-036", poblacion_mef: 385 },
          { nombre: "Guisquivac", codigo: "CN-037", poblacion_mef: 58 },
          {
            nombre: "Llano Grande la Estancia",
            codigo: "CN-038",
            poblacion_mef: 334,
          },
          { nombre: "Las Pilas", codigo: "CN-039", poblacion_mef: 100 },
          { nombre: "El Valle", codigo: "CN-040", poblacion_mef: 200 },
          { nombre: "El Oregano", codigo: "CN-041", poblacion_mef: 185 },
          { nombre: "Río Negro", codigo: "CN-042", poblacion_mef: 155 },
          { nombre: "Las Florecitas", codigo: "CN-043", poblacion_mef: 100 },
          { nombre: "La Estancia", codigo: "CN-044", poblacion_mef: 270 },
          { nombre: "Sucuj", codigo: "CN-045", poblacion_mef: 124 },
        ];

        let insertedCom = 0;
        comunidades.forEach((comunidad) => {
          this.db.run(
            `INSERT OR IGNORE INTO comunidades 
                        (territorio_id, nombre, codigo_comunidad, poblacion_mef, poblacion_total) 
                        VALUES (?, ?, ?, ?, ?)`,
            [
              1, // Territorio Centro Norte
              comunidad.nombre,
              comunidad.codigo,
              comunidad.poblacion_mef,
              Math.floor(comunidad.poblacion_mef * 4.2), // Estimación población total
            ],
            (err) => {
              if (err)
                console.error(
                  `Error insertando comunidad ${comunidad.nombre}:`,
                  err
                );

              insertedCom++;
              if (insertedCom === comunidades.length) {
                console.log(`✅ ${comunidades.length} comunidades insertadas`);
                callback();
              }
            }
          );
        });
      }
    );
  }

  // Insertar roles del sistema
  insertRoles() {
    return new Promise((resolve) => {
      console.log("👥 Insertando roles del sistema...");

      const roles = [
        {
          codigo: "auxiliar_enfermeria",
          nombre: "Auxiliar de Enfermería",
          descripcion:
            "Personal de campo responsable del registro directo de datos",
          nivel: 1,
          registrar: 1,
          validar: 0,
          aprobar: 0,
          reportes: 0,
          admin: 0,
        },
        {
          codigo: "asistente_tecnico",
          nombre: "Asistente Técnico de Territorio",
          descripcion: "Supervisores territoriales encargados de validación",
          nivel: 2,
          registrar: 1,
          validar: 1,
          aprobar: 0,
          reportes: 1,
          admin: 0,
        },
        {
          codigo: "encargado_sr",
          nombre: "Encargado de Salud Reproductiva",
          descripcion: "Coordinadores con acceso completo al sistema",
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
          descripcion: "Personal ejecutivo con vista estratégica",
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

  // Insertar métodos de planificación familiar
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

  // Insertar usuarios con roles y contraseñas hasheadas
  async insertUsers() {
    return new Promise(async (resolve) => {
      console.log("👤 Insertando usuarios del sistema...");

      // Hashear contraseñas de manera asíncrona
      const hashPassword = async (password) => {
        return await bcrypt.hash(password, 10);
      };

      const usuarios = [
        // ===== COORDINADOR MUNICIPAL =====
        {
          codigo: "COORD001",
          dpi: "1801199010101",
          nombres: "Dr. María Elena",
          apellidos: "González Morales",
          email: "admin@mspas.gob.gt",
          telefono: "78901234",
          password: "123456",
          rol: "coordinador_municipal",
          cargo: "Coordinadora Municipal de Salud",
          territorio: null,
          distrito: 1,
        },

        // ===== ENCARGADO DE SALUD REPRODUCTIVA =====
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

        // ===== ASISTENTE TÉCNICO =====
        {
          codigo: "ASIST001",
          dpi: "1801199040404",
          nombres: "Lic. Ana Patricia",
          apellidos: "Ramírez López",
          email: "asist01@mspas.gob.gt",
          telefono: "78904567",
          password: "123456",
          rol: "asistente_tecnico",
          cargo: "Asistente Técnico Centro Norte",
          territorio: 1,
          distrito: 1,
        },

        // ===== AUXILIAR DE ENFERMERÍA =====
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

          // Obtener el ID del rol
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

  // Asignar permisos de comunidades a auxiliares
  assignCommunityPermissions() {
    return new Promise((resolve) => {
      console.log("🔑 Asignando permisos de comunidades...");

      // El auxiliar tiene permisos en todas las comunidades del Centro Norte
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

  // Insertar metas anuales para 2025
  insertMetas() {
    return new Promise((resolve) => {
      console.log("🎯 Insertando metas anuales 2025...");

      const metas2025 = [
        { metodo_id: 1, porcentaje: 10.0 }, // Inyección mensual
        { metodo_id: 2, porcentaje: 10.0 }, // Inyección bimensual
        { metodo_id: 3, porcentaje: 45.0 }, // Inyección trimestral (principal)
        { metodo_id: 4, porcentaje: 12.0 }, // Píldora
        { metodo_id: 5, porcentaje: 2.0 }, // DIU
        { metodo_id: 6, porcentaje: 8.0 }, // Implante
        { metodo_id: 7, porcentaje: 6.0 }, // Condón
        { metodo_id: 8, porcentaje: 1.0 }, // Collar
        { metodo_id: 9, porcentaje: 5.5 }, // MELA
        { metodo_id: 10, porcentaje: 0.25 }, // AQV Femenina
        { metodo_id: 11, porcentaje: 0.25 }, // AQV Masculina
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
              resolve();
            }
          }
        );
      });
    });
  }

  // Insertar datos de población MEF
  insertPoblacionData() {
    return new Promise((resolve) => {
      console.log("👥 Insertando datos de población MEF 2025...");

      // Generar datos de población MEF para cada comunidad
      this.db.all(
        "SELECT id, poblacion_mef, poblacion_total FROM comunidades",
        (err, comunidades) => {
          if (err) {
            console.error("Error obteniendo comunidades:", err);
            resolve();
            return;
          }

          let inserted = 0;
          comunidades.forEach((comunidad) => {
            this.db.run(
              "INSERT OR IGNORE INTO poblacion_mef (comunidad_id, año, poblacion_total, poblacion_mef, fuente, fecha_actualizacion) VALUES (?, ?, ?, ?, ?, ?)",
              [
                comunidad.id,
                2025,
                comunidad.poblacion_total,
                comunidad.poblacion_mef,
                "Excel Centro Norte 2025",
                "2025-01-01",
              ],
              (err) => {
                if (err) console.error("Error insertando población MEF:", err);

                inserted++;
                if (inserted === comunidades.length) {
                  console.log(
                    `✅ Datos de población MEF insertados para ${comunidades.length} comunidades`
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

  // Insertar registros de ejemplo con datos realistas
  insertSampleRegistros() {
    return new Promise((resolve) => {
      console.log("📊 Insertando registros de ejemplo...");

      // Generar registros realistas para enero-septiembre 2025
      const registrosEjemplo = [];

      // Para algunas comunidades, generar registros de ejemplo
      for (let comunidadId = 1; comunidadId <= 10; comunidadId++) {
        for (let mes = 1; mes <= 9; mes++) {
          // Registros más frecuentes para inyección trimestral
          if (Math.random() > 0.3) {
            registrosEjemplo.push({
              comunidad_id: comunidadId,
              metodo_id: 3, // Inyección trimestral
              año: 2025,
              mes: mes,
              cantidad: Math.floor(Math.random() * 25) + 5, // 5-30 usuarias
              estado: ["registrado", "validado"][Math.floor(Math.random() * 2)],
              registrado_por: 4, // ID del auxiliar
            });
          }

          // Algunos registros de otros métodos
          if (Math.random() > 0.7) {
            registrosEjemplo.push({
              comunidad_id: comunidadId,
              metodo_id: Math.floor(Math.random() * 11) + 1,
              año: 2025,
              mes: mes,
              cantidad: Math.floor(Math.random() * 15) + 1,
              estado: ["registrado", "validado"][Math.floor(Math.random() * 2)],
              registrado_por: 4,
            });
          }
        }
      }

      let inserted = 0;
      if (registrosEjemplo.length === 0) {
        console.log("✅ No se generaron registros de ejemplo");
        resolve();
        return;
      }

      registrosEjemplo.forEach((registro) => {
        this.db.run(
          `INSERT OR IGNORE INTO registros_mensuales 
                    (comunidad_id, metodo_id, año, mes, cantidad_administrada, fecha_registro, estado, registrado_por, fecha_hora_registro) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            registro.comunidad_id,
            registro.metodo_id,
            registro.año,
            registro.mes,
            registro.cantidad,
            `2025-${registro.mes.toString().padStart(2, "0")}-15`,
            registro.estado,
            registro.registrado_por,
            `2025-${registro.mes.toString().padStart(2, "0")}-15 10:00:00`,
          ],
          (err) => {
            if (err && !err.message.includes("UNIQUE constraint")) {
              console.error("Error insertando registro:", err);
            }

            inserted++;
            if (inserted === registrosEjemplo.length) {
              console.log(
                `✅ ${registrosEjemplo.length} registros de ejemplo insertados`
              );
              resolve();
            }
          }
        );
      });
    });
  }

  // Método para obtener conexión
  getConnection() {
    return this.db;
  }

  // Método para cerrar conexión
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) console.error("Error cerrando BD:", err);
        else console.log("✅ Base de datos cerrada");
      });
    }
  }
}

// Exportar para uso en otros archivos
module.exports = DatabaseSetup;

// Si se ejecuta directamente
if (require.main === module) {
  const setup = new DatabaseSetup();
  console.log("\n🚀 Configuración completada!");
  console.log("\n📝 USUARIOS DE PRUEBA:");
  console.log("====================");
  console.log("Coordinador: admin@mspas.gob.gt / 123456");
  console.log("Encargado SR: encargado@mspas.gob.gt / 123456");
  console.log("Asistente: asist01@mspas.gob.gt / 123456");
  console.log("Auxiliar: aux01@mspas.gob.gt / 123456");
}
