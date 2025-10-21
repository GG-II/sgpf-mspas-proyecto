// ===== SCRIPT PARA CORREGIR NOMBRE DEL TERRITORIO 9 =====
// Guardar como: backend/fix-territorio9.js
// Ejecutar: node backend/fix-territorio9.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "sgpf_complete.db");
const db = new sqlite3.Database(dbPath);

console.log("🔧 Corrigiendo nombre del Territorio 9...\n");

db.serialize(() => {
  // PASO 1: Mostrar el nombre actual
  console.log("📊 PASO 1: Verificando nombre actual...\n");
  
  db.get(
    `SELECT id, nombre, codigo, descripcion 
     FROM territorios 
     WHERE codigo = 'T9'`,
    (err, row) => {
      if (err) {
        console.error("❌ Error:", err);
        db.close();
        return;
      }

      if (!row) {
        console.log("⚠️ No se encontró el Territorio 9");
        db.close();
        return;
      }

      console.log("Nombre actual:");
      console.table([row]);

      // PASO 2: Corregir el nombre
      console.log("\n🔧 PASO 2: Actualizando nombre...\n");

      db.run(
        `UPDATE territorios 
         SET nombre = 'Territorio 9',
             descripcion = 'Territorio 9'
         WHERE codigo = 'T9'`,
        function(err) {
          if (err) {
            console.error("❌ Error actualizando:", err);
            db.close();
            return;
          }

          console.log(`✅ ${this.changes} registro(s) actualizado(s)\n`);

          // PASO 3: Verificar el cambio
          verificarCambio();
        }
      );
    }
  );
});

function verificarCambio() {
  console.log("🔍 PASO 3: Verificando cambio...\n");

  db.get(
    `SELECT id, nombre, codigo, descripcion 
     FROM territorios 
     WHERE codigo = 'T9'`,
    (err, row) => {
      if (err) {
        console.error("❌ Error:", err);
        db.close();
        return;
      }

      console.log("Nombre actualizado:");
      console.table([row]);

      // Mostrar resumen de todos los territorios
      mostrarResumen();
    }
  );
}

function mostrarResumen() {
  console.log("\n📈 TODOS LOS TERRITORIOS:\n");

  db.all(
    `SELECT 
      t.codigo,
      t.nombre,
      COUNT(c.id) as comunidades,
      SUM(c.poblacion_mef) as total_mef
    FROM territorios t
    LEFT JOIN comunidades c ON t.id = c.territorio_id
    GROUP BY t.id, t.codigo, t.nombre
    ORDER BY t.codigo`,
    (err, rows) => {
      if (err) {
        console.error("❌ Error:", err);
      } else {
        console.table(rows);
        console.log("\n✅ Corrección completada!");
        console.log("💡 Recarga el frontend para ver los cambios\n");
      }

      db.close((err) => {
        if (err) console.error("Error cerrando BD:", err);
        process.exit(0);
      });
    }
  );
}