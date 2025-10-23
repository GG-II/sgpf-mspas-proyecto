// ===== CONFIGURACIÓN PM2 PARA SGPF =====
// Este archivo permite manejar backend y frontend juntos con PM2
// 
// INSTALACIÓN:
// npm install -g pm2
// npm install -g http-server
//
// USO:
// pm2 start ecosystem.config.js          # Iniciar todo
// pm2 stop ecosystem.config.js           # Detener todo
// pm2 restart ecosystem.config.js        # Reiniciar todo
// pm2 delete ecosystem.config.js         # Eliminar todo
// pm2 logs                               # Ver logs de ambos
// pm2 status                             # Ver estado

module.exports = {
  apps: [
    {
      // ===== BACKEND (Node.js + Express) =====
      name: 'sgpf-backend',
      script: './backend/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001  // ⬅️ Cambiar al puerto que Dany te asigne
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      // ===== FRONTEND (http-server) =====
      name: 'sgpf-frontend',
      script: 'http-server',
      args: './frontend -p 3000 --cors -c-1 -a 0.0.0.0',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};

// ===== NOTAS IMPORTANTES =====
//
// 1. Para DESARROLLO local:
//    pm2 start ecosystem.config.js
//
// 2. Para PRODUCCIÓN (Hostinger):
//    pm2 start ecosystem.config.js --env production
//
// 3. Comandos útiles:
//    pm2 list                    # Ver todos los procesos
//    pm2 logs sgpf-backend       # Ver logs del backend
//    pm2 logs sgpf-frontend      # Ver logs del frontend
//    pm2 logs                    # Ver logs de ambos
//    pm2 monit                   # Monitor en tiempo real
//    pm2 restart sgpf-backend    # Reiniciar solo backend
//    pm2 restart sgpf-frontend   # Reiniciar solo frontend
//    pm2 stop all                # Detener todos los procesos
//    pm2 delete all              # Eliminar todos los procesos
//
// 4. Para que se inicie automáticamente al reiniciar el servidor:
//    pm2 startup
//    pm2 save
//
// 5. Los logs se guardan en la carpeta ./logs/
//    (se crea automáticamente)
