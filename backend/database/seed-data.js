// ===== GENERADOR DE DATOS DE PRUEBA MASIVOS =====
// Sistema SGPF-MSPAS Huehuetenango
// Genera: Usuarias + Visitas + Usuarios del Sistema
// Datos realistas y distribuidos correctamente

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

class DataSeeder {
  constructor() {
    this.dbPath = path.join(__dirname, "sgpf_complete.db");
    this.db = null;
    
    // Arrays de datos guatemaltecos realistas
    this.nombresF = [
      "María", "Ana", "Rosa", "Carmen", "Juana", "Lucia", "Elena", "Isabel",
      "Francisca", "Petrona", "Candelaria", "Dominga", "Josefa", "Teresa",
      "Magdalena", "Catarina", "Margarita", "Angela", "Claudia", "Sandra",
      "Patricia", "Monica", "Silvia", "Gloria", "Victoria", "Beatriz",
      "Elvira", "Manuela", "Concepcion", "Dolores", "Esperanza", "Fe",
      "Guadalupe", "Hortensia", "Ines", "Julia", "Lidia", "Mercedes",
      "Norma", "Ofelia", "Paula", "Raquel", "Sofia", "Tomasa", "Ursula",
      "Veronica", "Yolanda", "Zenaida", "Adela", "Blanca", "Celina"
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
      "Soto", "Velásquez", "Carrillo", "Montoya", "Fuentes", "León"
    ];
    
    this.comunidadesIds = []; // Se llenará desde la BD
    this.territoriosIds = []; // Se llenará desde la BD
    this.metodosIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // IDs de métodos
  }

  // ===== GENERADORES DE DATOS ALEATORIOS =====
  
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  generateDPI() {
    // DPI guatemalteco: 13 dígitos
    let dpi = "";
    for (let i = 0; i < 13; i++) {
      dpi += Math.floor(Math.random() * 10);
    }
    return dpi;
  }
  
  generatePhone() {
    // Celular guatemalteco: 8 dígitos empezando con 3, 4, 5
    const prefijos = ["3", "4", "5"];
    let phone = this.getRandomElement(prefijos);
    for (let i = 0; i < 7; i++) {
      phone += Math.floor(Math.random() * 10);
    }
    return phone;
  }
  
  generateEmail(nombres, apellidos, numero) {
    const nombre = nombres.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const apellido = apellidos.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `${nombre}.${apellido}${numero}@mspas.gob.gt`;
  }
  
  generateFechaNacimiento() {
    // Mujeres en edad fértil: 15-49 años
    const añoActual = 2025;
    const edad = this.getRandomInt(15, 49);
    const añoNacimiento = añoActual - edad;
    const mes = String(this.getRandomInt(1, 12)).padStart(2, "0");
    const dia = String(this.getRandomInt(1, 28)).padStart(2, "0");
    return `${añoNacimiento}-${mes}-${dia}`;
  }
  
  generateFechaVisita(año = 2025) {
    // Distribuir visitas a lo largo del año
    const mes = String(this.getRandomInt(1, 10)).padStart(2, "0"); // Hasta octubre 2025
    const dia = String(this.getRandomInt(1, 28)).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  }

  // ===== INICIALIZACIÓN =====
  
  async init() {
    console.log("\n🌱 ===== GENERADOR DE DATOS DE PRUEBA MASIVOS =====\n");
    console.log("📋 Sistema: SGPF-MSPAS Huehuetenango V2.0");
    console.log("🎯 Objetivo: Generar datos realistas para testing\n");
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          console.error("❌ Error conectando a la BD:", err.message);
          reject(err);
          return;
        }
        
        console.log("✅ Conectado a la base de datos\n");
        
        try {
          await this.loadExistingData();
          await this.seedUsuarios();
          await this.seedUsuarias();
          await this.seedVisitas();
          await this.assignUsuariosToTerritorios();
          await this.generateStatistics();
          
          console.log("\n✅ ¡GENERACIÓN DE DATOS COMPLETADA EXITOSAMENTE!\n");
          resolve();
        } catch (error) {
          console.error("❌ Error en el proceso:", error);
          reject(error);
        }
      });
    });
  }

  // ===== CARGAR DATOS EXISTENTES =====
  
  loadExistingData() {
    return new Promise((resolve) => {
      console.log("📂 Cargando datos existentes de la BD...\n");
      
      // Cargar comunidades
      this.db.all("SELECT id, nombre, territorio_id FROM comunidades WHERE activa = 1", (err, rows) => {
        if (!err && rows) {
          this.comunidadesIds = rows;
          console.log(`   ✓ ${rows.length} comunidades cargadas`);
        }
        
        // Cargar territorios
        this.db.all("SELECT id, nombre FROM territorios WHERE activo = 1", (err2, rows2) => {
          if (!err2 && rows2) {
            this.territoriosIds = rows2;
            console.log(`   ✓ ${rows2.length} territorios cargados`);
          }
          
          console.log("");
          resolve();
        });
      });
    });
  }

  // ===== GENERAR USUARIOS DEL SISTEMA =====
  
  async seedUsuarios() {
    console.log("👥 GENERANDO USUARIOS DEL SISTEMA...\n");
    
    const usuarios = [];
    
    // 1 COORDINADOR MUNICIPAL
    usuarios.push({
      codigo_empleado: "COORD-001",
      dpi: this.generateDPI(),
      nombres: "Carlos Eduardo",
      apellidos: "Pérez González",
      email: "coordinador@mspas.gob.gt",
      telefono: this.generatePhone(),
      password: "123456",
      rol_id: 1, // Coordinador
      territorio_id: null,
      distrito_id: 1,
      cargo: "Coordinador Municipal de Planificación Familiar"
    });
    
    // 10 ENCARGADOS SR (1 por cada ~4-5 comunidades)
    for (let i = 1; i <= 10; i++) {
      usuarios.push({
        codigo_empleado: `ENC-${String(i).padStart(3, "0")}`,
        dpi: this.generateDPI(),
        nombres: this.getRandomElement(["Juan", "Pedro", "Luis", "Jorge", "Miguel", "Roberto", "Francisco", "Antonio", "José", "Manuel"]),
        apellidos: `${this.getRandomElement(this.apellidos)} ${this.getRandomElement(this.apellidos)}`,
        email: `encargado${String(i).padStart(2, "0")}@mspas.gob.gt`,
        telefono: this.generatePhone(),
        password: "123456",
        rol_id: 2, // Encargado SR
        territorio_id: this.territoriosIds[i % this.territoriosIds.length]?.id,
        distrito_id: 1,
        cargo: "Encargado de Servicio Rural"
      });
    }
    
    // 45 ASISTENTES TÉCNICOS (1 por comunidad)
    for (let i = 1; i <= 45; i++) {
      const comunidad = this.comunidadesIds[i - 1];
      usuarios.push({
        codigo_empleado: `ASIST-${String(i).padStart(3, "0")}`,
        dpi: this.generateDPI(),
        nombres: this.getRandomElement(["Ana", "María", "Rosa", "Carmen", "Elena", "Isabel", "Patricia", "Sandra", "Gloria", "Lucia"]),
        apellidos: `${this.getRandomElement(this.apellidos)} ${this.getRandomElement(this.apellidos)}`,
        email: `asist${String(i).padStart(2, "0")}@mspas.gob.gt`,
        telefono: this.generatePhone(),
        password: "123456",
        rol_id: 3, // Asistente
        territorio_id: comunidad?.territorio_id,
        distrito_id: 1,
        cargo: "Asistente Técnico de Salud"
      });
    }
    
    // 100 AUXILIARES DE ENFERMERÍA (distribuidos en comunidades)
    for (let i = 1; i <= 100; i++) {
      const comunidad = this.comunidadesIds[i % this.comunidadesIds.length];
      usuarios.push({
        codigo_empleado: `AUX-${String(i).padStart(3, "0")}`,
        dpi: this.generateDPI(),
        nombres: this.getRandomElement(this.nombresF),
        apellidos: `${this.getRandomElement(this.apellidos)} ${this.getRandomElement(this.apellidos)}`,
        email: `aux${String(i).padStart(3, "0")}@mspas.gob.gt`,
        telefono: this.generatePhone(),
        password: "123456",
        rol_id: 4, // Auxiliar
        territorio_id: comunidad?.territorio_id,
        distrito_id: 1,
        cargo: "Auxiliar de Enfermería"
      });
    }
    
    // Insertar todos los usuarios
    console.log("   📝 Insertando usuarios en la base de datos...");
    const passwordHash = await bcrypt.hash("123456", 10);
    
    return new Promise((resolve) => {
      let inserted = 0;
      
      usuarios.forEach((usuario) => {
        this.db.run(
          `INSERT OR IGNORE INTO usuarios (
            codigo_empleado, dpi, nombres, apellidos, email, telefono,
            password_hash, rol_id, territorio_id, distrito_id, cargo,
            fecha_ingreso, activo, debe_cambiar_password
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            usuario.codigo_empleado,
            usuario.dpi,
            usuario.nombres,
            usuario.apellidos,
            usuario.email,
            usuario.telefono,
            passwordHash,
            usuario.rol_id,
            usuario.territorio_id,
            usuario.distrito_id,
            usuario.cargo,
            "2025-01-01",
            1,
            0
          ],
          (err) => {
            if (err && !err.message.includes("UNIQUE constraint")) {
              console.error("      ⚠️ Error insertando usuario:", err.message);
            }
            
            inserted++;
            
            if (inserted === usuarios.length) {
              console.log(`   ✅ ${usuarios.length} usuarios creados\n`);
              console.log("   📊 Distribución:");
              console.log("      • 1 Coordinador Municipal");
              console.log("      • 10 Encargados SR");
              console.log("      • 45 Asistentes Técnicos");
              console.log("      • 100 Auxiliares de Enfermería\n");
              resolve();
            }
          }
        );
      });
    });
  }

  // ===== GENERAR USUARIAS =====
  
  async seedUsuarias() {
    console.log("👩 GENERANDO USUARIAS DEL SISTEMA...\n");
    
    const totalUsuarias = 2000; // Generar 2000 usuarias
    const usuarias = [];
    
    console.log(`   🎯 Objetivo: ${totalUsuarias} usuarias\n`);
    console.log("   📝 Generando datos realistas...");
    
    for (let i = 1; i <= totalUsuarias; i++) {
      const comunidad = this.getRandomElement(this.comunidadesIds);
      const nombres = this.getRandomElement(this.nombresF);
      const apellidos = `${this.getRandomElement(this.apellidos)} ${this.getRandomElement(this.apellidos)}`;
      const tiposUsuaria = ["nueva", "reconsulta", "activa"];
      
      usuarias.push({
        dpi: this.generateDPI(),
        nombres: nombres,
        apellidos: apellidos,
        comunidad_id: comunidad.id,
        fecha_nacimiento: this.generateFechaNacimiento(),
        telefono: Math.random() > 0.3 ? this.generatePhone() : null, // 70% tiene teléfono
        tipo_usuaria: this.getRandomElement(tiposUsuaria),
        fecha_primera_visita: this.generateFechaVisita(2025),
        activa: 1,
        creada_por: 1 // Usuario admin
      });
    }
    
    // Insertar usuarias
    return new Promise((resolve) => {
      let inserted = 0;
      
      usuarias.forEach((usuaria) => {
        this.db.run(
          `INSERT OR IGNORE INTO usuarias (
            dpi, nombres, apellidos, comunidad_id, fecha_nacimiento,
            telefono, tipo_usuaria, fecha_primera_visita, fecha_ultima_visita,
            total_visitas, activa, creada_por
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            usuaria.dpi,
            usuaria.nombres,
            usuaria.apellidos,
            usuaria.comunidad_id,
            usuaria.fecha_nacimiento,
            usuaria.telefono,
            usuaria.tipo_usuaria,
            usuaria.fecha_primera_visita,
            usuaria.fecha_primera_visita,
            1,
            usuaria.activa,
            usuaria.creada_por
          ],
          (err) => {
            if (err && !err.message.includes("UNIQUE constraint")) {
              console.error("      ⚠️ Error insertando usuaria:", err.message);
            }
            
            inserted++;
            
            if (inserted === usuarias.length) {
              console.log(`   ✅ ${usuarias.length} usuarias creadas\n`);
              resolve();
            }
          }
        );
      });
    });
  }

  // ===== GENERAR VISITAS =====
  
  async seedVisitas() {
    console.log("📝 GENERANDO VISITAS...\n");
    
    return new Promise((resolve) => {
      // Primero obtener todas las usuarias
      this.db.all("SELECT id, comunidad_id FROM usuarias", (err, usuarias) => {
        if (err || !usuarias || usuarias.length === 0) {
          console.error("   ❌ No se pudieron cargar usuarias");
          resolve();
          return;
        }
        
        console.log(`   👥 ${usuarias.length} usuarias encontradas`);
        console.log("   📊 Generando visitas (1-5 por usuaria)...\n");
        
        const visitas = [];
        
        // Generar visitas para cada usuaria
        usuarias.forEach((usuaria) => {
          // Cada usuaria tiene entre 1 y 5 visitas
          const numVisitas = this.getRandomInt(1, 5);
          
          for (let i = 0; i < numVisitas; i++) {
            const metodoId = this.getRandomElement(this.metodosIds);
            const fechaVisita = this.generateFechaVisita(2025);
            const estados = ["registrado", "validado"];
            const estado = this.getRandomElement(estados);
            
            visitas.push({
              usuaria_id: usuaria.id,
              metodo_id: metodoId,
              fecha_visita: fechaVisita,
              estado: estado,
              registrado_por: this.getRandomInt(1, 156), // Cualquier usuario
              validado_por: estado === "validado" ? this.getRandomInt(1, 56) : null
            });
          }
        });
        
        console.log(`   🎯 Total de visitas a crear: ${visitas.length}\n`);
        console.log("   ⏳ Insertando en la base de datos...");
        
        // Insertar visitas en lotes
        let inserted = 0;
        
        visitas.forEach((visita) => {
          this.db.run(
            `INSERT INTO visitas (
              usuaria_id, metodo_id, fecha_visita, estado,
              registrado_por, validado_por, fecha_hora_validacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              visita.usuaria_id,
              visita.metodo_id,
              visita.fecha_visita,
              visita.estado,
              visita.registrado_por,
              visita.validado_por,
              visita.validado_por ? new Date().toISOString() : null
            ],
            (err) => {
              if (err) {
                console.error("      ⚠️ Error insertando visita:", err.message);
              }
              
              inserted++;
              
              // Mostrar progreso cada 500 inserciones
              if (inserted % 500 === 0) {
                console.log(`      ⏳ ${inserted}/${visitas.length} visitas insertadas...`);
              }
              
              if (inserted === visitas.length) {
                console.log(`\n   ✅ ${visitas.length} visitas creadas exitosamente\n`);
                resolve();
              }
            }
          );
        });
      });
    });
  }

  // ===== ASIGNAR USUARIOS A TERRITORIOS =====
  
  async assignUsuariosToTerritorios() {
    console.log("🗺️ ASIGNANDO USUARIOS A COMUNIDADES...\n");
    
    return new Promise((resolve) => {
      // Obtener auxiliares para asignar a comunidades específicas
      this.db.all(
        "SELECT id FROM usuarios WHERE rol_id = 4 ORDER BY id",
        (err, auxiliares) => {
          if (err || !auxiliares) {
            console.log("   ⚠️ No se pudieron cargar auxiliares");
            resolve();
            return;
          }
          
          let assigned = 0;
          
          // Asignar cada auxiliar a 2-3 comunidades
          auxiliares.forEach((auxiliar, index) => {
            const numComunidades = this.getRandomInt(2, 3);
            
            for (let i = 0; i < numComunidades; i++) {
              const comunidad = this.comunidadesIds[(index * 3 + i) % this.comunidadesIds.length];
              
              this.db.run(
                `INSERT OR IGNORE INTO permisos_comunidad (usuario_id, comunidad_id)
                 VALUES (?, ?)`,
                [auxiliar.id, comunidad.id],
                (err) => {
                  if (!err) assigned++;
                }
              );
            }
          });
          
          setTimeout(() => {
            console.log(`   ✅ ${assigned} asignaciones comunidad-usuario creadas\n`);
            resolve();
          }, 1000);
        }
      );
    });
  }

  // ===== GENERAR ESTADÍSTICAS =====
  
  async generateStatistics() {
    console.log("📊 GENERANDO ESTADÍSTICAS FINALES...\n");
    
    return new Promise((resolve) => {
      // Contar usuarias
      this.db.get("SELECT COUNT(*) as total FROM usuarias", (err, row1) => {
        const totalUsuarias = row1?.total || 0;
        
        // Contar visitas
        this.db.get("SELECT COUNT(*) as total FROM visitas", (err, row2) => {
          const totalVisitas = row2?.total || 0;
          
          // Contar usuarios
          this.db.get("SELECT COUNT(*) as total FROM usuarios", (err, row3) => {
            const totalUsuarios = row3?.total || 0;
            
            // Visitas por estado
            this.db.all(
              "SELECT estado, COUNT(*) as total FROM visitas GROUP BY estado",
              (err, estados) => {
                console.log("   ═══════════════════════════════════════");
                console.log("   📊 RESUMEN DE DATOS GENERADOS");
                console.log("   ═══════════════════════════════════════\n");
                
                console.log("   👥 USUARIOS DEL SISTEMA:");
                console.log(`      • Total: ${totalUsuarios}`);
                console.log("      • 1 Coordinador Municipal");
                console.log("      • 10 Encargados SR");
                console.log("      • 45 Asistentes Técnicos");
                console.log("      • 100 Auxiliares de Enfermería\n");
                
                console.log("   👩 USUARIAS:");
                console.log(`      • Total: ${totalUsuarias} usuarias registradas`);
                console.log(`      • En ${this.comunidadesIds.length} comunidades`);
                console.log(`      • Promedio: ${Math.round(totalUsuarias / this.comunidadesIds.length)} usuarias/comunidad\n`);
                
                console.log("   📝 VISITAS:");
                console.log(`      • Total: ${totalVisitas} visitas registradas`);
                console.log(`      • Promedio: ${(totalVisitas / totalUsuarias).toFixed(1)} visitas/usuaria`);
                
                if (estados && estados.length > 0) {
                  console.log("\n      Distribución por estado:");
                  estados.forEach((e) => {
                    const porcentaje = ((e.total / totalVisitas) * 100).toFixed(1);
                    console.log(`      • ${e.estado}: ${e.total} (${porcentaje}%)`);
                  });
                }
                
                console.log("\n   ═══════════════════════════════════════\n");
                
                resolve();
              }
            );
          });
        });
      });
    });
  }

  // ===== CERRAR CONEXIÓN =====
  
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("❌ Error cerrando BD:", err);
        } else {
          console.log("✅ Conexión a BD cerrada\n");
        }
      });
    }
  }
}

// ===== EJECUCIÓN =====

if (require.main === module) {
  const seeder = new DataSeeder();
  
  seeder
    .init()
    .then(() => {
      console.log("🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!");
      console.log("\n📋 PRÓXIMOS PASOS:");
      console.log("   1. Verificar datos en la base de datos");
      console.log("   2. Probar el sistema con diferentes usuarios");
      console.log("   3. Validar dashboards y reportes\n");
      console.log("🔑 CREDENCIALES DE ACCESO:");
      console.log("   • Coordinador: coordinador@mspas.gob.gt / 123456");
      console.log("   • Encargados: encargado01-10@mspas.gob.gt / 123456");
      console.log("   • Asistentes: asist01-45@mspas.gob.gt / 123456");
      console.log("   • Auxiliares: aux001-100@mspas.gob.gt / 123456\n");
      
      seeder.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error fatal:", error);
      seeder.close();
      process.exit(1);
    });
}

module.exports = DataSeeder;
