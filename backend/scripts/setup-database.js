#!/usr/bin/env node
// ===== SCRIPT PARA CONFIGURAR BASE DE DATOS COMPLETA =====
// Ejecutar con: npm run setup-db

const path = require('path');
const DatabaseSetup = require('../database/setup-complete');

console.log('🚀 ===== CONFIGURACIÓN INICIAL SGPF-MSPAS =====');
console.log('📊 Configurando base de datos completa...');
console.log('⏱️  Este proceso puede tomar unos minutos...\n');

// Crear instancia de configuración de BD
const dbSetup = new DatabaseSetup();

// Manejar cierre del proceso
process.on('SIGINT', () => {
    console.log('\n⚠️  Proceso interrumpido por el usuario');
    console.log('🔄 Cerrando conexiones...');
    
    if (dbSetup) {
        dbSetup.close();
    }
    
    console.log('✅ Proceso terminado correctamente');
    process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    
    if (dbSetup) {
        dbSetup.close();
    }
    
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada:', reason);
    
    if (dbSetup) {
        dbSetup.close();
    }
    
    process.exit(1);
});

// Mensaje de finalización después de 30 segundos
setTimeout(() => {
    console.log('\n🎉 ===== CONFIGURACIÓN COMPLETADA =====');
    console.log('📋 La base de datos ya está lista para usar');
    console.log('🔐 Puedes iniciar sesión con cualquiera de estos usuarios:');
    console.log('');
    console.log('👑 COORDINADOR MUNICIPAL:');
    console.log('   📧 admin@mspas.gob.gt');
    console.log('   🔑 123456');
    console.log('');
    console.log('👩‍⚕️ ENCARGADO SALUD REPRODUCTIVA:');
    console.log('   📧 encargado@mspas.gob.gt');
    console.log('   🔑 123456');
    console.log('');
    console.log('👨‍💼 ASISTENTE TÉCNICO:');
    console.log('   📧 asist01@mspas.gob.gt (Territorio Norte)');
    console.log('   📧 asist02@mspas.gob.gt (Territorio Sur)');
    console.log('   🔑 123456');
    console.log('');
    console.log('👩‍🔬 AUXILIAR DE ENFERMERÍA:');
    console.log('   📧 aux01@mspas.gob.gt (Territorio Norte)');
    console.log('   📧 aux04@mspas.gob.gt (Territorio Sur)');
    console.log('   🔑 123456');
    console.log('');
    console.log('🚀 Ahora puedes ejecutar: npm run dev');
    console.log('📱 Y abrir: http://gerbert.hopitalbarillas.cloud/api/health');
    console.log('');
    
    // Cerrar conexión después del mensaje
    setTimeout(() => {
        if (dbSetup) {
            dbSetup.close();
        }
        process.exit(0);
    }, 2000);
}, 30000);