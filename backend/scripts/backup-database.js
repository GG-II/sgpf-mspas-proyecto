// ===== SCRIPT DE BACKUP DE BASE DE DATOS =====
// Sistema de Gestión de Planificación Familiar - MSPAS

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== CONFIGURACIÓN =====
const CONFIG = {
    // Ruta de la base de datos
    DB_PATH: path.join(__dirname, '../database/sgpf_complete.db'),
    
    // Carpeta donde se guardarán los backups
    BACKUP_DIR: path.join(__dirname, '../backups'),
    
    // Cuántos días mantener backups
    RETENTION_DAYS: 30,
    
    // Tamaño máximo de carpeta de backups (en MB)
    MAX_BACKUP_SIZE_MB: 1000
};

// ===== FUNCIONES =====

/**
 * Crear carpeta de backups si no existe
 */
function ensureBackupDirectory() {
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
        fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
        console.log('✅ Carpeta de backups creada:', CONFIG.BACKUP_DIR);
    }
}

/**
 * Generar nombre de archivo de backup
 */
function generateBackupFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `sgpf_backup_${year}${month}${day}_${hours}${minutes}${seconds}.db`;
}

/**
 * Verificar que la base de datos existe
 */
function checkDatabaseExists() {
    if (!fs.existsSync(CONFIG.DB_PATH)) {
        console.error('❌ ERROR: Base de datos no encontrada en:', CONFIG.DB_PATH);
        process.exit(1);
    }
}

/**
 * Obtener tamaño de archivo en MB
 */
function getFileSizeMB(filePath) {
    const stats = fs.statSync(filePath);
    return (stats.size / (1024 * 1024)).toFixed(2);
}

/**
 * Realizar el backup
 */
function performBackup() {
    try {
        const backupFilename = generateBackupFilename();
        const backupPath = path.join(CONFIG.BACKUP_DIR, backupFilename);
        
        console.log('📦 Iniciando backup...');
        console.log('   Origen:', CONFIG.DB_PATH);
        console.log('   Destino:', backupPath);
        
        // Copiar archivo de base de datos
        fs.copyFileSync(CONFIG.DB_PATH, backupPath);
        
        const sizeMB = getFileSizeMB(backupPath);
        console.log(`✅ Backup completado: ${backupFilename} (${sizeMB} MB)`);
        
        return { success: true, filename: backupFilename, size: sizeMB };
        
    } catch (error) {
        console.error('❌ Error durante el backup:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Comprimir backup (opcional)
 */
function compressBackup(backupFilename) {
    try {
        const backupPath = path.join(CONFIG.BACKUP_DIR, backupFilename);
        const gzipPath = `${backupPath}.gz`;
        
        console.log('🗜️  Comprimiendo backup...');
        
        // Usar gzip si está disponible (Linux/Mac)
        if (process.platform !== 'win32') {
            execSync(`gzip -k "${backupPath}"`);
            
            const originalSize = getFileSizeMB(backupPath);
            const compressedSize = getFileSizeMB(gzipPath);
            const reduction = ((1 - compressedSize/originalSize) * 100).toFixed(1);
            
            console.log(`✅ Compresión completada: ${compressedSize} MB (reducción: ${reduction}%)`);
            
            // Eliminar archivo sin comprimir
            fs.unlinkSync(backupPath);
            console.log('   Archivo original eliminado');
            
            return gzipPath;
        } else {
            console.log('⚠️  Compresión no disponible en Windows, guardando sin comprimir');
            return backupPath;
        }
        
    } catch (error) {
        console.warn('⚠️  Error comprimiendo (se mantendrá sin comprimir):', error.message);
        return path.join(CONFIG.BACKUP_DIR, backupFilename);
    }
}

/**
 * Limpiar backups antiguos
 */
function cleanOldBackups() {
    try {
        console.log('🧹 Limpiando backups antiguos...');
        
        const files = fs.readdirSync(CONFIG.BACKUP_DIR);
        const now = Date.now();
        const retentionMs = CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000;
        
        let deletedCount = 0;
        let freedSpaceMB = 0;
        
        files.forEach(file => {
            const filePath = path.join(CONFIG.BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;
            
            if (age > retentionMs) {
                const sizeMB = parseFloat(getFileSizeMB(filePath));
                fs.unlinkSync(filePath);
                deletedCount++;
                freedSpaceMB += sizeMB;
                console.log(`   🗑️  Eliminado: ${file} (${sizeMB} MB)`);
            }
        });
        
        if (deletedCount > 0) {
            console.log(`✅ Limpieza completada: ${deletedCount} archivo(s) eliminados, ${freedSpaceMB.toFixed(2)} MB liberados`);
        } else {
            console.log('✅ No hay backups antiguos para eliminar');
        }
        
    } catch (error) {
        console.error('⚠️  Error durante limpieza:', error.message);
    }
}

/**
 * Verificar tamaño total de backups
 */
function checkBackupSize() {
    try {
        const files = fs.readdirSync(CONFIG.BACKUP_DIR);
        let totalSizeMB = 0;
        
        files.forEach(file => {
            const filePath = path.join(CONFIG.BACKUP_DIR, file);
            totalSizeMB += parseFloat(getFileSizeMB(filePath));
        });
        
        console.log(`📊 Tamaño total de backups: ${totalSizeMB.toFixed(2)} MB`);
        
        if (totalSizeMB > CONFIG.MAX_BACKUP_SIZE_MB) {
            console.warn(`⚠️  ADVERTENCIA: Tamaño de backups (${totalSizeMB.toFixed(2)} MB) excede el límite configurado (${CONFIG.MAX_BACKUP_SIZE_MB} MB)`);
            console.warn('   Considera reducir RETENTION_DAYS o limpiar backups manualmente');
        }
        
        return totalSizeMB;
        
    } catch (error) {
        console.error('⚠️  Error verificando tamaño:', error.message);
        return 0;
    }
}

/**
 * Listar todos los backups
 */
function listBackups() {
    try {
        console.log('\n📋 Backups disponibles:');
        console.log('─'.repeat(80));
        
        const files = fs.readdirSync(CONFIG.BACKUP_DIR)
            .filter(f => f.startsWith('sgpf_backup_'))
            .sort()
            .reverse();
        
        if (files.length === 0) {
            console.log('   (No hay backups)');
            return;
        }
        
        files.forEach((file, index) => {
            const filePath = path.join(CONFIG.BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            const sizeMB = getFileSizeMB(filePath);
            const date = new Date(stats.mtime).toLocaleString('es-GT');
            
            console.log(`${index + 1}. ${file}`);
            console.log(`   Tamaño: ${sizeMB} MB | Fecha: ${date}`);
        });
        
        console.log('─'.repeat(80));
        console.log(`Total: ${files.length} backup(s)\n`);
        
    } catch (error) {
        console.error('❌ Error listando backups:', error.message);
    }
}

// ===== EJECUCIÓN PRINCIPAL =====

async function main() {
    console.log('\n🗄️  ===== BACKUP DE BASE DE DATOS SGPF =====\n');
    
    const startTime = Date.now();
    
    // 1. Verificaciones
    checkDatabaseExists();
    ensureBackupDirectory();
    
    // 2. Realizar backup
    const result = performBackup();
    
    if (!result.success) {
        console.error('\n❌ Backup FALLÓ\n');
        process.exit(1);
    }
    
    // 3. Comprimir (opcional)
    const compress = process.argv.includes('--compress') || process.argv.includes('-c');
    if (compress) {
        compressBackup(result.filename);
    }
    
    // 4. Limpiar backups antiguos
    const skipCleanup = process.argv.includes('--no-cleanup');
    if (!skipCleanup) {
        cleanOldBackups();
    }
    
    // 5. Verificar tamaño total
    checkBackupSize();
    
    // 6. Listar backups si se solicita
    if (process.argv.includes('--list') || process.argv.includes('-l')) {
        listBackups();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Proceso completado en ${duration} segundos\n`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

// Exportar para usar desde otros módulos
module.exports = {
    performBackup,
    compressBackup,
    cleanOldBackups,
    listBackups,
    CONFIG
};