// ===== MIDDLEWARE DE AUTENTICACIÓN =====
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sgpf_mspas_secret_key_desarrollo_2025';

// ===== VERIFICAR TOKEN JWT =====
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken
};