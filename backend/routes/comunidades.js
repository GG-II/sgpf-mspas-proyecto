// backend/routes/comunidades.js - VERSIÓN DEBUG
const express = require('express');
const router = express.Router();

// ===== GET /comunidades - VERSIÓN SIMPLIFICADA PARA DEBUG =====
router.get('/', (req, res) => {
  try {
    console.log('🏘️ [DEBUG] Endpoint /comunidades llamado');
    
    const db = req.app.locals.db;
    
    if (!db) {
      console.error('❌ [DEBUG] Base de datos no disponible');
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Query simple sin filtros por ahora
    const query = `
      SELECT 
        c.id, c.nombre, c.codigo_comunidad, c.poblacion_total, c.poblacion_mef,
        c.distancia_km, c.acceso_vehicular,
        t.id as territorio_id, t.nombre as territorio_nombre, t.codigo as territorio_codigo,
        d.nombre as distrito_nombre
      FROM comunidades c
      JOIN territorios t ON c.territorio_id = t.id
      JOIN distritos_salud d ON t.distrito_id = d.id
      WHERE c.activa = 1
      ORDER BY t.nombre, c.nombre
    `;

    console.log('📊 [DEBUG] Ejecutando query...');

    db.all(query, [], (err, comunidades) => {
      if (err) {
        console.error('❌ [DEBUG] Error en query:', err);
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo comunidades',
          error: err.message
        });
      }

      console.log(`✅ [DEBUG] ${comunidades.length} comunidades encontradas`);

      res.json({
        success: true,
        data: comunidades || [],
        debug: {
          total: comunidades.length,
          message: 'Versión debug - sin filtros de alcance'
        }
      });
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error en endpoint comunidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;