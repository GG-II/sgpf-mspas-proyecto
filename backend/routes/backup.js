// ===== RUTAS DE BACKUP =====
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { performBackup, compressBackup, listBackups } = require('../scripts/backup-database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ===== CREAR BACKUP =====
router.post('/create', authenticateToken, async (req, res) => {
    try {
        // Solo coordinadores pueden hacer backups
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar backups'
            });
        }

        console.log(`📦 Backup solicitado por: ${req.user.email}`);

        const result = performBackup();

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Error creando backup',
                error: result.error
            });
        }

        // Comprimir si se solicita
        const compress = req.body.compress || false;
        let finalPath = result.filename;

        if (compress) {
            finalPath = compressBackup(result.filename);
        }

        res.json({
            success: true,
            message: 'Backup creado exitosamente',
            filename: path.basename(finalPath),
            size: result.size,
            compressed: compress,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en endpoint de backup:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ===== LISTAR BACKUPS =====
router.get('/list', authenticateToken, (req, res) => {
    try {
        // Solo coordinadores
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver backups'
            });
        }

        const backupDir = path.join(__dirname, '../backups');

        if (!fs.existsSync(backupDir)) {
            return res.json({
                success: true,
                backups: [],
                message: 'No hay backups disponibles'
            });
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('sgpf_backup_'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                    created: stats.mtime,
                    compressed: file.endsWith('.gz')
                };
            })
            .sort((a, b) => b.created - a.created);

        res.json({
            success: true,
            backups: files,
            count: files.length
        });

    } catch (error) {
        console.error('❌ Error listando backups:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo lista de backups',
            error: error.message
        });
    }
});

// ===== DESCARGAR BACKUP =====
router.get('/download/:filename', authenticateToken, (req, res) => {
    try {
        // Solo coordinadores
        if (req.user.rol !== 'coordinador_municipal') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para descargar backups'
            });
        }

        const filename = req.params.filename;
        
        // Validar nombre de archivo (seguridad)
        if (!filename.startsWith('sgpf_backup_')) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de archivo inválido'
            });
        }

        const filePath = path.join(__dirname, '../backups', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup no encontrado'
            });
        }

        console.log(`📥 Descarga de backup solicitada por: ${req.user.email}`);
        console.log(`   Archivo: ${filename}`);

        res.download(filePath, filename);

    } catch (error) {
        console.error('❌ Error descargando backup:', error);
        res.status(500).json({
            success: false,
            message: 'Error descargando backup',
            error: error.message
        });
    }
});

module.exports = router;