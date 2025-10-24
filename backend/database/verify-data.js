// ===== SCRIPT DE VERIFICACIÓN DE DATOS =====
// Verifica que los datos de prueba se hayan generado correctamente
// SGPF-MSPAS Huehuetenango

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class DataVerifier {
  constructor() {
    this.dbPath = path.join(__dirname, "sgpf_complete.db");
    this.db = null;
  }

  async init() {
    console.log("\n🔍 ===== VERIFICADOR DE DATOS SGPF =====\n");
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          console.error("❌ Error conectando a la BD:", err.message);
          reject(err);
          return;
        }
        
        console.log("✅ Conectado a la base de datos\n");
        
        try {
          await this.verifyUsuarios();
          await this.verifyUsuarias();
          await this.verifyVisitas();
          await this.verifyDistribution();
          await this.verifyIntegrity();
          
          console.log("\n✅ ¡VERIFICACIÓN COMPLETADA!\n");
          resolve();
        } catch (error) {
          console.error("❌ Error en verificación:", error);
          reject(error);
        }
      });
    });
  }

  // Verificar usuarios del sistema
  verifyUsuarios() {
    return new Promise((resolve) => {
      console.log("👥 VERIFICANDO USUARIOS DEL SISTEMA...\n");
      
      // Contar por rol
      this.db.all(
        `SELECT r.nombre as rol, COUNT(*) as total 
         FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id 
         GROUP BY r.nombre 
         ORDER BY r.nivel_jerarquico`,
        (err, rows) => {
          if (err) {
            console.error("   ❌ Error:", err.message);
            resolve();
            return;
          }
          
          console.log("   📊 Distribución por rol:");
          let totalUsuarios = 0;
          
          rows.forEach((row) => {
            console.log(`      • ${row.rol}: ${row.total}`);
            totalUsuarios += row.total;
          });
          
          console.log(`\n   ✅ Total usuarios: ${totalUsuarios}\n`);
          
          // Verificar estructura esperada
          const expected = {
            "Coordinador Municipal": 1,
            "Encargado SR": 10,
            "Asistente Técnico": 45,
            "Auxiliar de Enfermería": 100
          };
          
          let allCorrect = true;
          rows.forEach((row) => {
            if (expected[row.rol] && row.total !== expected[row.rol]) {
              console.log(`   ⚠️ ADVERTENCIA: Se esperaban ${expected[row.rol]} ${row.rol}, se encontraron ${row.total}`);
              allCorrect = false;
            }
          });
          
          if (allCorrect && totalUsuarios === 156) {
            console.log("   ✅ Distribución de usuarios correcta\n");
          }
          
          resolve();
        }
      );
    });
  }

  // Verificar usuarias
  verifyUsuarias() {
    return new Promise((resolve) => {
      console.log("👩 VERIFICANDO USUARIAS...\n");
      
      // Total de usuarias
      this.db.get("SELECT COUNT(*) as total FROM usuarias", (err, row) => {
        if (err) {
          console.error("   ❌ Error:", err.message);
          resolve();
          return;
        }
        
        const totalUsuarias = row.total;
        console.log(`   📊 Total usuarias: ${totalUsuarias}`);
        
        // Usuarias por tipo
        this.db.all(
          "SELECT tipo_usuaria, COUNT(*) as total FROM usuarias GROUP BY tipo_usuaria",
          (err2, rows) => {
            if (!err2 && rows) {
              console.log("\n   📋 Por tipo:");
              rows.forEach((r) => {
                const porcentaje = ((r.total / totalUsuarias) * 100).toFixed(1);
                console.log(`      • ${r.tipo_usuaria}: ${r.total} (${porcentaje}%)`);
              });
            }
            
            // Usuarias por comunidad (top 10)
            this.db.all(
              `SELECT c.nombre, COUNT(u.id) as total 
               FROM comunidades c 
               LEFT JOIN usuarias u ON c.id = u.comunidad_id 
               GROUP BY c.id 
               ORDER BY total DESC 
               LIMIT 10`,
              (err3, rows3) => {
                if (!err3 && rows3) {
                  console.log("\n   🏘️ Top 10 comunidades con más usuarias:");
                  rows3.forEach((r, i) => {
                    console.log(`      ${i + 1}. ${r.nombre}: ${r.total} usuarias`);
                  });
                }
                
                console.log("\n   ✅ Verificación de usuarias completada\n");
                resolve();
              }
            );
          }
        );
      });
    });
  }

  // Verificar visitas
  verifyVisitas() {
    return new Promise((resolve) => {
      console.log("📝 VERIFICANDO VISITAS...\n");
      
      // Total de visitas
      this.db.get("SELECT COUNT(*) as total FROM visitas", (err, row) => {
        if (err) {
          console.error("   ❌ Error:", err.message);
          resolve();
          return;
        }
        
        const totalVisitas = row.total;
        console.log(`   📊 Total visitas: ${totalVisitas}`);
        
        // Visitas por estado
        this.db.all(
          "SELECT estado, COUNT(*) as total FROM visitas GROUP BY estado",
          (err2, rows) => {
            if (!err2 && rows) {
              console.log("\n   📋 Por estado:");
              rows.forEach((r) => {
                const porcentaje = ((r.total / totalVisitas) * 100).toFixed(1);
                console.log(`      • ${r.estado}: ${r.total} (${porcentaje}%)`);
              });
            }
            
            // Visitas por método (top 5)
            this.db.all(
              `SELECT m.nombre, COUNT(v.id) as total 
               FROM visitas v 
               JOIN metodos_planificacion m ON v.metodo_id = m.id 
               GROUP BY m.id 
               ORDER BY total DESC 
               LIMIT 5`,
              (err3, rows3) => {
                if (!err3 && rows3) {
                  console.log("\n   💊 Top 5 métodos más usados:");
                  rows3.forEach((r, i) => {
                    console.log(`      ${i + 1}. ${r.nombre}: ${r.total} visitas`);
                  });
                }
                
                // Promedio de visitas por usuaria
                this.db.get(
                  `SELECT 
                     COUNT(DISTINCT usuaria_id) as usuarias_con_visitas,
                     COUNT(*) as total_visitas,
                     ROUND(CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT usuaria_id), 2) as promedio
                   FROM visitas`,
                  (err4, row4) => {
                    if (!err4 && row4) {
                      console.log("\n   📈 Estadísticas:");
                      console.log(`      • Usuarias con visitas: ${row4.usuarias_con_visitas}`);
                      console.log(`      • Promedio visitas/usuaria: ${row4.promedio}`);
                    }
                    
                    console.log("\n   ✅ Verificación de visitas completada\n");
                    resolve();
                  }
                );
              }
            );
          }
        );
      });
    });
  }

  // Verificar distribución temporal
  verifyDistribution() {
    return new Promise((resolve) => {
      console.log("📅 VERIFICANDO DISTRIBUCIÓN TEMPORAL...\n");
      
      // Visitas por mes
      this.db.all(
        `SELECT 
           strftime('%Y-%m', fecha_visita) as mes,
           COUNT(*) as total 
         FROM visitas 
         GROUP BY mes 
         ORDER BY mes`,
        (err, rows) => {
          if (err) {
            console.error("   ❌ Error:", err.message);
            resolve();
            return;
          }
          
          console.log("   📊 Visitas por mes:");
          rows.forEach((r) => {
            const barra = "█".repeat(Math.ceil(r.total / 50));
            console.log(`      ${r.mes}: ${barra} ${r.total}`);
          });
          
          console.log("\n   ✅ Distribución temporal verificada\n");
          resolve();
        }
      );
    });
  }

  // Verificar integridad de datos
  verifyIntegrity() {
    return new Promise((resolve) => {
      console.log("🔐 VERIFICANDO INTEGRIDAD DE DATOS...\n");
      
      const checks = [];
      
      // Check 1: Usuarias sin comunidad
      checks.push(
        new Promise((res) => {
          this.db.get(
            "SELECT COUNT(*) as total FROM usuarias WHERE comunidad_id IS NULL",
            (err, row) => {
              if (!err && row.total === 0) {
                console.log("   ✅ Todas las usuarias tienen comunidad asignada");
              } else {
                console.log(`   ⚠️ ${row?.total || 0} usuarias sin comunidad`);
              }
              res();
            }
          );
        })
      );
      
      // Check 2: Visitas huérfanas
      checks.push(
        new Promise((res) => {
          this.db.get(
            `SELECT COUNT(*) as total 
             FROM visitas v 
             LEFT JOIN usuarias u ON v.usuaria_id = u.id 
             WHERE u.id IS NULL`,
            (err, row) => {
              if (!err && row.total === 0) {
                console.log("   ✅ Todas las visitas tienen usuaria válida");
              } else {
                console.log(`   ⚠️ ${row?.total || 0} visitas huérfanas`);
              }
              res();
            }
          );
        })
      );
      
      // Check 3: Usuarios sin rol
      checks.push(
        new Promise((res) => {
          this.db.get(
            "SELECT COUNT(*) as total FROM usuarios WHERE rol_id IS NULL",
            (err, row) => {
              if (!err && row.total === 0) {
                console.log("   ✅ Todos los usuarios tienen rol asignado");
              } else {
                console.log(`   ⚠️ ${row?.total || 0} usuarios sin rol`);
              }
              res();
            }
          );
        })
      );
      
      // Check 4: DPIs duplicados
      checks.push(
        new Promise((res) => {
          this.db.get(
            `SELECT COUNT(*) as total 
             FROM (SELECT dpi FROM usuarias GROUP BY dpi HAVING COUNT(*) > 1)`,
            (err, row) => {
              if (!err && row.total === 0) {
                console.log("   ✅ No hay DPIs duplicados en usuarias");
              } else {
                console.log(`   ⚠️ ${row?.total || 0} DPIs duplicados`);
              }
              res();
            }
          );
        })
      );
      
      // Check 5: Emails duplicados
      checks.push(
        new Promise((res) => {
          this.db.get(
            `SELECT COUNT(*) as total 
             FROM (SELECT email FROM usuarios GROUP BY email HAVING COUNT(*) > 1)`,
            (err, row) => {
              if (!err && row.total === 0) {
                console.log("   ✅ No hay emails duplicados en usuarios");
              } else {
                console.log(`   ⚠️ ${row?.total || 0} emails duplicados`);
              }
              res();
            }
          );
        })
      );
      
      Promise.all(checks).then(() => {
        console.log("\n   ✅ Verificación de integridad completada\n");
        resolve();
      });
    });
  }

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

// Ejecución
if (require.main === module) {
  const verifier = new DataVerifier();
  
  verifier
    .init()
    .then(() => {
      console.log("═══════════════════════════════════════");
      console.log("✅ VERIFICACIÓN EXITOSA");
      console.log("═══════════════════════════════════════");
      console.log("\n📋 La base de datos está lista para usar");
      console.log("🚀 Puedes iniciar el servidor backend\n");
      
      verifier.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error en verificación:", error);
      verifier.close();
      process.exit(1);
    });
}

module.exports = DataVerifier;
