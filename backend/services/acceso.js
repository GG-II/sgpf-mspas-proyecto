// ===== SERVICIO DE ALCANCE Y PERMISOS =====
// Determina qué comunidades puede ver/acceder cada usuario según su rol

/**
 * Obtiene las comunidades accesibles para un usuario según su rol
 * @param {Object} usuario - Objeto con datos del usuario (id, rol, territorio_id)
 * @param {Object} db - Conexión a la base de datos
 * @returns {Promise<Array>} - Array de IDs de comunidades accesibles
 */
async function getComunidadesAccesibles(usuario, db) {
  return new Promise((resolve, reject) => {
    const rol = usuario.rol;

    // === COORDINADOR MUNICIPAL & ENCARGADO SR: TODO ===
    if (rol === 'coordinador_municipal' || rol === 'encargado_sr') {
      db.all('SELECT id FROM comunidades WHERE activa = 1', [], (err, comunidades) => {
        if (err) return reject(err);
        resolve(comunidades.map(c => c.id));
      });
      return;
    }

    // === ASISTENTE TÉCNICO: Comunidades de sus territorios asignados ===
    if (rol === 'asistente_tecnico') {
      // Prioridad 1: Buscar en user_territorios (múltiples)
      db.all(
        'SELECT territorio_id FROM user_territorios WHERE usuario_id = ? AND activo = 1',
        [usuario.id],
        (err, territorios) => {
          if (err) return reject(err);

          let territorioIds = territorios.map(t => t.territorio_id);

          // Fallback: Si no tiene en user_territorios, usar usuarios.territorio_id
          if (territorioIds.length === 0 && usuario.territorio_id) {
            territorioIds = [usuario.territorio_id];
          }

          if (territorioIds.length === 0) {
            // Sin territorios asignados
            resolve([]);
            return;
          }

          // Obtener comunidades de esos territorios
          const placeholders = territorioIds.map(() => '?').join(',');
          db.all(
            `SELECT id FROM comunidades 
             WHERE territorio_id IN (${placeholders}) AND activa = 1`,
            territorioIds,
            (err, comunidades) => {
              if (err) return reject(err);
              resolve(comunidades.map(c => c.id));
            }
          );
        }
      );
      return;
    }

    // === AUXILIAR DE ENFERMERÍA: Solo comunidades asignadas ===
    if (rol === 'auxiliar_enfermeria') {
      db.all(
        `SELECT comunidad_id FROM permisos_comunidad 
         WHERE usuario_id = ? AND activo = 1`,
        [usuario.id],
        (err, permisos) => {
          if (err) return reject(err);
          resolve(permisos.map(p => p.comunidad_id));
        }
      );
      return;
    }

    // Sin permisos (rol desconocido)
    resolve([]);
  });
}

/**
 * Valida si un usuario tiene acceso a una comunidad específica
 * @param {Object} usuario - Objeto con datos del usuario
 * @param {Number} comunidadId - ID de la comunidad a validar
 * @param {Object} db - Conexión a la base de datos
 * @returns {Promise<Boolean>}
 */
async function tieneAccesoComunidad(usuario, comunidadId, db) {
  try {
    const comunidades = await getComunidadesAccesibles(usuario, db);
    return comunidades.includes(parseInt(comunidadId));
  } catch (error) {
    console.error('❌ Error validando acceso:', error);
    return false;
  }
}

/**
 * Obtiene los territorios asignados a un usuario (para asistentes)
 * @param {Number} usuarioId - ID del usuario
 * @param {Object} db - Conexión a la base de datos
 * @returns {Promise<Array>} - Array de IDs de territorios
 */
async function getTerritoriosAsignados(usuarioId, db) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT territorio_id FROM user_territorios WHERE usuario_id = ? AND activo = 1',
      [usuarioId],
      (err, territorios) => {
        if (err) return reject(err);
        resolve(territorios.map(t => t.territorio_id));
      }
    );
  });
}

module.exports = {
  getComunidadesAccesibles,
  tieneAccesoComunidad,
  getTerritoriosAsignados
};