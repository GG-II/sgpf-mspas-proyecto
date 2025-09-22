// ===== MIDDLEWARE DE CONTROL DE PERMISOS =====

// ===== VERIFICAR PERMISO ESPECÍFICO =====
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        // Verificar si el usuario tiene el permiso específico
        if (!req.user.permisos || !req.user.permisos[permission]) {
            return res.status(403).json({
                success: false,
                message: `No tienes permisos de ${permission}`,
                permiso_requerido: permission,
                permisos_usuario: req.user.permisos
            });
        }

        next();
    };
};

// ===== VERIFICAR ROLES ESPECÍFICOS =====
const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        // Si rolesPermitidos es string, convertir a array
        const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso restringido. Roles permitidos: ${roles.join(', ')}`,
                tu_rol: req.user.rol
            });
        }

        next();
    };
};

// ===== VERIFICAR ACCESO A TERRITORIO (para asistentes técnicos) =====
const requireTerritoryAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Acceso no autorizado'
        });
    }

    // Solo aplicar restricción a asistentes técnicos
    if (req.user.rol === 'asistente_tecnico') {
        // El territorio se puede pasar como parámetro o query
        const territorioId = req.params.territorio_id || req.query.territorio_id;
        
        if (territorioId && req.user.territorio_id && parseInt(territorioId) !== req.user.territorio_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este territorio'
            });
        }
    }

    next();
};

// ===== VERIFICAR NIVEL JERÁRQUICO =====
const requireMinLevel = (nivelMinimo) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        if (!req.user.nivel || req.user.nivel < nivelMinimo) {
            return res.status(403).json({
                success: false,
                message: `Nivel jerárquico insuficiente. Se requiere nivel ${nivelMinimo} o superior`,
                tu_nivel: req.user.nivel
            });
        }

        next();
    };
};

module.exports = {
    requirePermission,
    requireRole,
    requireTerritoryAccess,
    requireMinLevel
};