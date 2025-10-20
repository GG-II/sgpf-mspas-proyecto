const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sgpf_complete.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Inicializando Planificación 2025...\n');

db.serialize(() => {
    
    // ==========================================
    // PASO 1: Crear proyecciones para todas las comunidades activas
    // ==========================================
    console.log('📊 PASO 1: Creando proyecciones para comunidades activas...');
    
    const crearProyeccionesQuery = `
        INSERT OR IGNORE INTO proyecciones_comunidad (
            comunidad_id,
            año,
            poblacion_mef,
            porcentaje_proyeccion,
            ajuste_fijo,
            activo,
            es_manual,
            configurado_por,
            unidades_sin_distribuir
        )
        SELECT 
            id as comunidad_id,
            2025 as año,
            poblacion_mef,
            0.35 as porcentaje_proyeccion,
            70 as ajuste_fijo,
            1 as activo,
            0 as es_manual,
            1 as configurado_por,
            0 as unidades_sin_distribuir
        FROM comunidades
        WHERE activa = 1
    `;
    
    db.run(crearProyeccionesQuery, function(err) {
        if (err) {
            console.error('❌ Error creando proyecciones:', err.message);
            return;
        }
        console.log(`✅ Proyecciones creadas/actualizadas: ${this.changes} registros\n`);
        
        // ==========================================
        // PASO 2: Crear metas por método
        // ==========================================
        console.log('🎯 PASO 2: Creando metas por método...');
        
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
        
        db.run(crearMetasQuery, function(err) {
            if (err) {
                console.error('❌ Error creando metas por método:', err.message);
                return;
            }
            console.log(`✅ Metas por método creadas: ${this.changes} registros\n`);
            
            // ==========================================
            // PASO 3: Calcular sobrantes
            // ==========================================
            console.log('🧮 PASO 3: Calculando sobrantes...');
            
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
            
            db.run(calcularSobrantesQuery, function(err) {
                if (err) {
                    console.error('❌ Error calculando sobrantes:', err.message);
                    return;
                }
                console.log(`✅ Sobrantes calculados: ${this.changes} registros actualizados\n`);
                
                // ==========================================
                // VERIFICACIÓN
                // ==========================================
                console.log('🔍 VERIFICACIÓN DE RESULTADOS:\n');
                
                // Contar proyecciones
                db.get(`SELECT COUNT(*) as total FROM proyecciones_comunidad WHERE año = 2025`, (err, row) => {
                    if (err) {
                        console.error('Error:', err.message);
                        return;
                    }
                    console.log(`📊 Total proyecciones 2025: ${row.total}`);
                });
                
                // Contar metas
                db.get(`SELECT COUNT(*) as total FROM metas_metodo_comunidad WHERE año = 2025`, (err, row) => {
                    if (err) {
                        console.error('Error:', err.message);
                        return;
                    }
                    console.log(`🎯 Total metas por método: ${row.total}`);
                });
                
                // Ejemplo de 5 comunidades
                console.log('\n📋 EJEMPLO DE 5 COMUNIDADES:\n');
                
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
                
                db.all(ejemploQuery, (err, rows) => {
                    if (err) {
                        console.error('Error:', err.message);
                        return;
                    }
                    
                    console.table(rows);
                    
                    console.log('\n✅ ¡INICIALIZACIÓN COMPLETADA!\n');
                    console.log('📝 Ahora puedes:');
                    console.log('   1. Recargar el frontend');
                    console.log('   2. Hacer clic en "Ver Detalle" de cualquier comunidad');
                    console.log('   3. Deberías ver las metas calculadas automáticamente\n');
                    
                    db.close();
                });
            });
        });
    });
});