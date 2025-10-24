// ===== GENERADOR MASIVO DE DATOS DE PRUEBA =====
// Sistema SGPF-MSPAS Huehuetenango V2.0
// Genera: Usuarios (156) + Usuarias (3000+) + Visitas (10000+)
// Optimizado para grandes volúmenes de datos

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

class MassiveDataSeeder {
  constructor() {
    this.dbPath = path.join(__dirname, "sgpf_complete.db");
    this.db = null;
    
    // ===== CONFIGURACIÓN DE VOLUMEN =====
    this.config = {
      usuarios: {
        coordinadores: 1,
        encargados: 10,
        asistentes: 45,
        auxiliares: 100
      },
      usuarias: {
        total: 3000,  // Ajustable según necesites
        minPorComunidad: 40,
        maxPorComunidad: 100
      },
      visitas: {
        minPorUsuaria: 2,
        maxPorUsuaria: 5
      }
    };
    
    // ===== DATOS GUATEMALTECOS REALISTAS =====
    this.nombresF = [
      "María", "Ana", "Rosa", "Carmen", "Juana", "Lucía", "Elena", "Isabel",
      "Francisca", "Petrona", "Candelaria", "Dominga", "Josefa", "Teresa",
      "Magdalena", "Catarina", "Margarita", "Ángela", "Claudia", "Sandra",
      "Patricia", "Mónica", "Silvia", "Gloria", "Victoria", "Beatriz",
      "Elvira", "Manuela", "Concepción", "Dolores", "Esperanza", "Fe",
      "Guadalupe", "Hortensia", "Inés", "Julia", "Lidia", "Mercedes",
      "Norma", "Ofelia", "Paula", "Raquel", "Sofía", "Tomasa", "Úrsula",
      "Verónica", "Yolanda", "Zenaida", "Adela", "Blanca", "Celina",
      "Delia", "Emilia", "Fabiola", "Gabriela", "Hilda", "Irma", "Jacqueline"
    ];
    
    this.nombresM = [
      "Juan", "Pedro", "Luis", "Jorge", "Miguel", "Roberto", "Francisco",
      "Antonio", "José", "Manuel", "Carlos", "Jesús", "Raúl", "Fernando",
      "Alberto", "Ricardo", "Héctor", "Ernesto", "Ramón", "Sergio"
    ];
    
    this.apellidos = [
      "López", "García", "Rodríguez", "Martínez", "Pérez", "González",
      "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
      "Díaz", "Cruz", "Morales", "Reyes", "Jiménez", "Hernández",
      "Ruiz", "Mendoza", "Castro", "Ortiz", "Romero", "Álvarez",
      "Vásquez", "Gutiérrez", "Chávez", "Ramos", "Mejía", "Campos",
      "Castillo", "Vargas", "Contreras", "Aguilar", "Méndez", "Maldonado",
      "Moreno", "Salazar", "Figueroa", "Sandoval", "Cabrera", "Guerrero",
      "Navarro", "Medina", "Santiago", "Luna", "Ochoa", "Paredes",
      "Soto", "Velásquez", "Carrillo", "Montoya", "Fuentes", "León",
      "Estrada", "Herrera", "Arias", "Cardona", "Barrios", "Miranda"
    ];
    
    this.comunidadesData = [];
    this.territoriosData = [];
    this.metodosIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
    this.usuariosCreados = 0;
    this.usuariasCreadas = 0;
    this.visitasCreadas = 0;
  }

  // ===== UTILIDADES =====
  
  random(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  generateDPI() {
    return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join("");
  }
  
  generatePhone() {
    const prefijo = this.random(["3", "4", "5"]);
    return prefijo + Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("");
  }
  
  generateFechaNacimiento() {
    const añoActual = 2025;
    const edad = this.randomInt(15, 49);
    const año = añoActual - edad;
    const mes = String(this.randomInt(1, 12)).padStart(2, "0");
    const dia = String(this.randomInt(1, 28)).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  }
  
  generateFechaVisita() {
    const mes = String(this.randomInt(1, 10)).padStart(2, "0");
    const dia = String(this.randomInt(1, 28)).padStart(2, "0");
    return `2025-${mes}-${dia}`;
  }

  // ===== CONEXIÓN Y CARGA INICIAL =====
  
  async init() {
    console.log("\n" + "=".repeat(60));
    console.log("🌱 GENERADOR MASIVO DE DATOS DE PRUEBA - SGPF V2.0");
    console.log("=".repeat(60) + "\n");
    
    console.log("📊 CONFIGURACIÓN:");
    console.log(`   • Usuarios: ${this.config.usuarios.coordinadores + this.config.usuarios.encargados + this.config.usuarios.asistentes + this.config.usuarios.auxiliares}`);
    console.log(`   • Usuarias: ~${this.config.usuarias.total}`);
    console.log(`   • Visitas estimadas: ~${this.config.usuarias.total * 3}\n`);
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          console.error("❌ Error conectando a BD:", err.message);
          reject(err);
          return;
        }
        
        console.log("✅ Conectado a la base de datos\n");
        
        try {
          await this.cargarDatosExistentes();
          await this.limpiarDatosPrevios();
          await this.generarUsuarios();
          await this.generarUsuarias();
          await this.generarVisitas();
          await this.asignarUsuariosAComunidades();
          await this.mostrarEstadisticas();
          
          console.log("\n" + "=".repeat(60));
          console.log("✅ ¡GENERACIÓN COMPLETADA EXITOSAMENTE!");
          console.log("=".repeat(60) + "\n");
          
          resolve();
        } catch (error) {
          console.error("❌ Error:", error);
          reject(error);
        }
      });
    });
  }

  // ===== CARGAR DATOS EXISTENTES =====
  
  cargarDatosExistentes() {
    return new Promise((resolve) => {
      console.log("📂 Cargando estructura de la BD...\n");
      
      this.db.all("SELECT id, nombre, territorio_id, poblacion_mef FROM comunidades WHERE activa = 1", (err, rows) => {
        if (!err && rows) {
          this.comunidadesData = rows;
          console.log(`   ✓ ${rows.length} comunidades activas`);
        }
        
        this.db.all("SELECT id, nombre FROM territorios WHERE activo = 1", (err2, rows2) => {
          if (!err2 && rows2) {
            this.territoriosData = rows2;
            console.log(`   ✓ ${rows2.length} territorios activos\n`);
          }
          resolve();
        });
      });
    });
  }

  // ===== LIMPIAR DATOS PREVIOS =====
  
  limpiarDatosPrevios() {
    return new Promise((resolve) => {
      console.log("🗑️  Limpiando datos de prueba previos...\n");
      
      const queries = [
        "DELETE FROM visitas",
        "DELETE FROM usuarias",
        "DELETE FROM permisos_comunidad",
        "DELETE FROM user_territorios",
        "DELETE FROM usuarios"
      ];
      
      let completed = 0;
      
      queries.forEach(query => {
        this.db.run(query, (err) => {
          if (!err) {
            completed++;
            console.log(`   ✓ Tabla limpiada (${completed}/${queries.length})`);
          }
          
          if (completed === queries.length) {
            console.log("");
            resolve();
          }
        });
      });
    });
  }

  // ===== GENERAR USUARIOS DEL SISTEMA =====
  
  async generarUsuarios() {
    console.log("👥 GENERANDO USUARIOS DEL SISTEMA...\n");
    
    const passwordHash = bcrypt.hashSync("123456", 10);
    const usuarios = [];
    
    // 1 COORDINADOR MUNICIPAL
    usuarios.push({
      codigo_empleado: "COORD-001",
      dpi: this.generateDPI(),
      nombres: "Carlos Eduardo",
      apellidos: "Pérez González",
      email: "coordinador.municipal@mspas.gob.gt",
      telefono: this.generatePhone(),
      password_hash: passwordHash,
      rol_id: 1,
      territorio_id: null,
      distrito_id: 1,
      cargo: "Coordinador Municipal de Planificación Familiar",
      fecha_ingreso: "2023-01-15"
    });
    
    // 10 ENCARGADOS SR
    for (let i = 1; i <= this.config.usuarios.encargados; i++) {
      const territorio = this.territoriosData[(i - 1) % this.territoriosData.length];
      usuarios.push({
        codigo_empleado: `ENC-${String(i).padStart(3, "0")}`,
        dpi: this.generateDPI(),
        nombres: this.random(this.nombresM),
        apellidos: `${this.random(this.apellidos)} ${this.random(this.apellidos)}`,
        email: `encargado.sr${String(i).padStart(2, "0")}@mspas.gob.gt`,
        telefono: this.generatePhone(),
        password_hash: passwordHash,
        rol_id: 2,
        territorio_id: territorio?.id || null,
        distrito_id: 1,
        cargo: "Encargado de Servicio Rural",
        fecha_ingreso: "2023-02-01"
      });
    }
    
    // 45 ASISTENTES TÉCNICOS
    for (let i = 1; i <= this.config.usuarios.asistentes; i++) {
      const comunidad = this.comunidadesData[(i - 1) % this.comunidadesData.length];
      usuarios.push({
        codigo_empleado: `ASIST-${String(i).padStart(3, "0")}`,
        dpi: this.generateDPI(),
        nombres: this.random(this.nombresF),
        apellidos: `${this.random(this.apellidos)} ${this.random(this.apellidos)}`,
        email: `asistente.tec${String(i).padStart(2, "0")}@mspas.gob.gt`,
        telefono: this.generatePhone(),
        password_hash: passwordHash,
        rol_id: 3,
        territorio_id: comunidad?.territorio_id || null,
        distrito_id: 1,
        cargo: "Asistente Técnico de Salud",
        fecha_ingreso: "2023-03-01"
      });
    }
    
    // 100 AUXILIARES DE ENFERMERÍA
    for (let i = 1; i <= this.config.usuarios.auxiliares; i++) {
      const comunidad = this.comunidadesData[i % this.comunidadesData.length];
      usuarios.push({
        codigo_empleado: `AUX-${String(i).padStart(3, "0")}`,
        dpi: this.generateDPI(),
        nombres: this.random(this.nombresF),
        apellidos: `${this.random(this.apellidos)} ${this.random(this.apellidos)}`,
        email: `auxiliar.enf${String(i).padStart(3, "0")}@mspas.gob.gt`,
        telefono: this.generatePhone(),
        password_hash: passwordHash,
        rol_id: 4,
        territorio_id: comunidad?.territorio_id || null,
        distrito_id: 1,
        cargo: "Auxiliar de Enfermería",
        fecha_ingreso: "2023-04-01"
      });
    }
    
    console.log(`   🎯 Creando ${usuarios.length} usuarios...\n`);
    
    return new Promise((resolve) => {
      let insertados = 0;
      
      usuarios.forEach((usuario) => {
        this.db.run(
          `INSERT INTO usuarios (
            codigo_empleado, dpi, nombres, apellidos, email, telefono,
            password_hash, rol_id, territorio_id, distrito_id, cargo,
            fecha_ingreso, activo, debe_cambiar_password
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
          [
            usuario.codigo_empleado, usuario.dpi, usuario.nombres, usuario.apellidos,
            usuario.email, usuario.telefono, usuario.password_hash, usuario.rol_id,
            usuario.territorio_id, usuario.distrito_id, usuario.cargo, usuario.fecha_ingreso
          ],
          (err) => {
            if (!err) this.usuariosCreados++;
            
            insertados++;
            if (insertados % 50 === 0) {
              console.log(`   ⏳ Progreso: ${insertados}/${usuarios.length}`);
            }
            
            if (insertados === usuarios.length) {
              console.log(`\n   ✅ ${this.usuariosCreados} usuarios creados\n`);
              resolve();
            }
          }
        );
      });
    });
  }

  // ===== GENERAR USUARIAS =====
  
  async generarUsuarias() {
    console.log("👩 GENERANDO USUARIAS...\n");
    
    const usuarias = [];
    const dpisUsados = new Set();
    
    // Distribuir usuarias por comunidad
    this.comunidadesData.forEach((comunidad) => {
      const numUsuarias = this.randomInt(
        this.config.usuarias.minPorComunidad,
        this.config.usuarias.maxPorComunidad
      );
      
      for (let i = 0; i < numUsuarias; i++) {
        let dpi;
        do {
          dpi = this.generateDPI();
        } while (dpisUsados.has(dpi));
        dpisUsados.add(dpi);
        
        const nombres = this.random(this.nombresF);
        const apellidos = `${this.random(this.apellidos)} ${this.random(this.apellidos)}`;
        const fechaNacimiento = this.generateFechaNacimiento();
        const fechaPrimeraVisita = this.generateFechaVisita();
        const telefono = Math.random() > 0.3 ? this.generatePhone() : null;
        const tipoUsuaria = this.random(["nueva", "reconsulta", "activa"]);
        
        // Usuario que registra: Asistente o Auxiliar (rol 3 o 4)
        const registradoPor = this.randomInt(12, 156); // Rango de asistentes y auxiliares
        
        usuarias.push({
          dpi,
          nombres,
          apellidos,
          comunidad_id: comunidad.id,
          fecha_nacimiento: fechaNacimiento,
          telefono,
          tipo_usuaria: tipoUsuaria,
          fecha_primera_visita: fechaPrimeraVisita,
          fecha_ultima_visita: fechaPrimeraVisita,
          total_visitas: 0,
          creada_por: registradoPor,
          activa: 1
        });
      }
    });
    
    console.log(`   🎯 Total a crear: ${usuarias.length} usuarias\n`);
    console.log("   ⏳ Insertando en base de datos (esto puede tardar)...\n");
    
    return new Promise((resolve) => {
      let insertadas = 0;
      
      usuarias.forEach((usuaria) => {
        this.db.run(
          `INSERT INTO usuarias (
            dpi, nombres, apellidos, comunidad_id, fecha_nacimiento,
            telefono, tipo_usuaria, fecha_primera_visita, fecha_ultima_visita,
            total_visitas, creada_por, activa
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            usuaria.dpi, usuaria.nombres, usuaria.apellidos, usuaria.comunidad_id,
            usuaria.fecha_nacimiento, usuaria.telefono, usuaria.tipo_usuaria,
            usuaria.fecha_primera_visita, usuaria.fecha_ultima_visita,
            usuaria.total_visitas, usuaria.creada_por, usuaria.activa
          ],
          (err) => {
            if (!err) this.usuariasCreadas++;
            
            insertadas++;
            if (insertadas % 500 === 0) {
              console.log(`   📊 ${insertadas}/${usuarias.length} (${((insertadas/usuarias.length)*100).toFixed(1)}%)`);
            }
            
            if (insertadas === usuarias.length) {
              console.log(`\n   ✅ ${this.usuariasCreadas} usuarias creadas exitosamente\n`);
              resolve();
            }
          }
        );
      });
    });
  }

  // ===== GENERAR VISITAS =====
  
  async generarVisitas() {
    console.log("📝 GENERANDO VISITAS...\n");
    
    return new Promise((resolve) => {
      // Obtener todas las usuarias
      this.db.all("SELECT id, comunidad_id FROM usuarias", (err, usuarias) => {
        if (err || !usuarias) {
          console.log("   ⚠️ Error cargando usuarias");
          resolve();
          return;
        }
        
        console.log(`   🎯 Generando visitas para ${usuarias.length} usuarias...\n`);
        
        const visitas = [];
        
        // Generar visitas para cada usuaria
        usuarias.forEach((usuaria) => {
          const numVisitas = this.randomInt(
            this.config.visitas.minPorUsuaria,
            this.config.visitas.maxPorUsuaria
          );
          
          for (let i = 0; i < numVisitas; i++) {
            const metodoId = this.random(this.metodosIds);
            const fechaVisita = this.generateFechaVisita();
            const estado = Math.random() > 0.3 ? "validado" : "registrado";
            
            // Registrado por: Asistente o Auxiliar
            const registradoPor = this.randomInt(12, 156);
            
            // Validado por: Encargado SR (si está validado)
            const validadoPor = estado === "validado" ? this.randomInt(2, 11) : null;
            
            visitas.push({
              usuaria_id: usuaria.id,
              metodo_id: metodoId,
              fecha_visita: fechaVisita,
              estado: estado,
              registrado_por: registradoPor,
              validado_por: validadoPor,
              fecha_hora_validacion: validadoPor ? new Date().toISOString() : null
            });
          }
        });
        
        console.log(`   📊 Total de visitas: ${visitas.length}\n`);
        console.log("   ⏳ Insertando visitas (esto tomará un momento)...\n");
        
        let insertadas = 0;
        
        visitas.forEach((visita) => {
          this.db.run(
            `INSERT INTO visitas (
              usuaria_id, metodo_id, fecha_visita, estado,
              registrado_por, validado_por, fecha_hora_validacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              visita.usuaria_id, visita.metodo_id, visita.fecha_visita,
              visita.estado, visita.registrado_por, visita.validado_por,
              visita.fecha_hora_validacion
            ],
            (err) => {
              if (!err) this.visitasCreadas++;
              
              insertadas++;
              if (insertadas % 1000 === 0) {
                console.log(`   📊 ${insertadas}/${visitas.length} (${((insertadas/visitas.length)*100).toFixed(1)}%)`);
              }
              
              if (insertadas === visitas.length) {
                console.log(`\n   ✅ ${this.visitasCreadas} visitas creadas exitosamente\n`);
                resolve();
              }
            }
          );
        });
      });
    });
  }

  // ===== ASIGNAR USUARIOS A COMUNIDADES =====
  
  async asignarUsuariosAComunidades() {
    console.log("🗺️  ASIGNANDO PERMISOS COMUNIDAD-USUARIO...\n");
    
    return new Promise((resolve) => {
      // Obtener auxiliares
      this.db.all("SELECT id FROM usuarios WHERE rol_id = 4", (err, auxiliares) => {
        if (err || !auxiliares) {
          console.log("   ⚠️ No se encontraron auxiliares");
          resolve();
          return;
        }
        
        let asignaciones = 0;
        const totalAsignaciones = auxiliares.length * 3; // 3 comunidades por auxiliar
        
        auxiliares.forEach((auxiliar, index) => {
          // Cada auxiliar tiene 2-3 comunidades asignadas
          const numComunidades = this.randomInt(2, 3);
          
          for (let i = 0; i < numComunidades; i++) {
            const comunidadIndex = (index * 3 + i) % this.comunidadesData.length;
            const comunidad = this.comunidadesData[comunidadIndex];
            
            this.db.run(
              `INSERT OR IGNORE INTO permisos_comunidad 
               (usuario_id, comunidad_id, puede_ver, puede_registrar, puede_editar, activo)
               VALUES (?, ?, 1, 1, 1, 1)`,
              [auxiliar.id, comunidad.id],
              (err) => {
                if (!err) asignaciones++;
              }
            );
          }
        });
        
        setTimeout(() => {
          console.log(`   ✅ ${asignaciones} asignaciones creadas\n`);
          resolve();
        }, 1500);
      });
    });
  }

  // ===== MOSTRAR ESTADÍSTICAS =====
  
  async mostrarEstadisticas() {
    console.log("📊 ESTADÍSTICAS FINALES\n");
    console.log("=".repeat(60) + "\n");
    
    return new Promise((resolve) => {
      // Contar por rol
      this.db.all(
        `SELECT r.nombre, COUNT(*) as total 
         FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id 
         GROUP BY r.nombre`,
        (err, roles) => {
          console.log("👥 USUARIOS DEL SISTEMA:");
          if (roles) {
            roles.forEach(r => {
              console.log(`   • ${r.nombre}: ${r.total}`);
            });
          }
          console.log(`   • TOTAL: ${this.usuariosCreados}\n`);
          
          // Contar usuarias
          this.db.get("SELECT COUNT(*) as total FROM usuarias", (err, row) => {
            console.log("👩 USUARIAS:");
            console.log(`   • Total registradas: ${row?.total || 0}`);
            console.log(`   • Distribuidas en: ${this.comunidadesData.length} comunidades`);
            console.log(`   • Promedio por comunidad: ${Math.round((row?.total || 0) / this.comunidadesData.length)}\n`);
            
            // Contar visitas
            this.db.all(
              `SELECT estado, COUNT(*) as total FROM visitas GROUP BY estado`,
              (err, estados) => {
                console.log("📝 VISITAS:");
                console.log(`   • Total: ${this.visitasCreadas}`);
                if (estados) {
                  estados.forEach(e => {
                    const pct = ((e.total / this.visitasCreadas) * 100).toFixed(1);
                    console.log(`   • ${e.estado}: ${e.total} (${pct}%)`);
                  });
                }
                console.log("");
                
                // Distribución por método
                this.db.all(
                  `SELECT m.nombre_corto, COUNT(*) as total 
                   FROM visitas v 
                   JOIN metodos_planificacion m ON v.metodo_id = m.id 
                   GROUP BY m.nombre_corto 
                   ORDER BY total DESC 
                   LIMIT 5`,
                  (err, metodos) => {
                    console.log("💊 TOP 5 MÉTODOS MÁS UTILIZADOS:");
                    if (metodos) {
                      metodos.forEach((m, idx) => {
                        console.log(`   ${idx + 1}. ${m.nombre_corto}: ${m.total} visitas`);
                      });
                    }
                    console.log("\n" + "=".repeat(60) + "\n");
                    
                    console.log("🔑 CREDENCIALES DE ACCESO:");
                    console.log("   • Coordinador: coordinador.municipal@mspas.gob.gt / 123456");
                    console.log("   • Encargados: encargado.sr01-10@mspas.gob.gt / 123456");
                    console.log("   • Asistentes: asistente.tec01-45@mspas.gob.gt / 123456");
                    console.log("   • Auxiliares: auxiliar.enf001-100@mspas.gob.gt / 123456\n");
                    
                    resolve();
                  }
                );
              }
            );
          });
        }
      );
    });
  }

  // ===== CERRAR CONEXIÓN =====
  
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("❌ Error cerrando BD:", err);
        } else {
          console.log("✅ Conexión cerrada\n");
        }
      });
    }
  }
}

// ===== EJECUCIÓN =====

if (require.main === module) {
  const seeder = new MassiveDataSeeder();
  
  console.log("\n⚠️  ADVERTENCIA: Este proceso eliminará todos los datos existentes");
  console.log("   de usuarios, usuarias y visitas.\n");
  
  seeder
    .init()
    .then(() => {
      console.log("🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!\n");
      console.log("📋 PRÓXIMOS PASOS:");
      console.log("   1. Verificar los datos en la base de datos");
      console.log("   2. Probar el sistema con diferentes roles");
      console.log("   3. Validar dashboards y reportes");
      console.log("   4. Revisar la distribución de datos por comunidad\n");
      
      seeder.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ ERROR FATAL:", error);
      seeder.close();
      process.exit(1);
    });
}

module.exports = MassiveDataSeeder;