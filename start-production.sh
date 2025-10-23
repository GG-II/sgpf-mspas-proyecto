#!/bin/bash
# ===== SCRIPT DE INICIO PRODUCCIÓN - SGPF =====
# Script para iniciar el proyecto en modo PRODUCCIÓN (Hostinger)

echo "🚀 Iniciando SGPF en modo PRODUCCIÓN"
echo "================================================================="
echo ""

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado"
    echo "   Instalando PM2 globalmente..."
    sudo npm install -g pm2
fi

# Crear carpeta de logs si no existe
mkdir -p logs

# Detener procesos anteriores si existen
echo "🛑 Deteniendo procesos anteriores..."
pm2 delete sgpf-backend 2>/dev/null
pm2 delete sgpf-frontend 2>/dev/null

# Instalar dependencias del backend si es necesario
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd backend
    npm install --production
    cd ..
fi

# Iniciar SOLO el backend en producción (Nginx sirve el frontend)
echo "✨ Iniciando backend en modo PRODUCCIÓN..."
pm2 start ecosystem.config.js --only sgpf-backend --env production

# Configurar para que inicie automáticamente al reiniciar el servidor
pm2 startup
pm2 save

# Mostrar estado
echo ""
echo "✅ Backend iniciado correctamente en producción"
echo ""
echo "📊 Estado de los procesos:"
pm2 list

echo ""
echo "🌐 URL de producción:"
echo "   https://gerbert.hopitalbarillas.cloud/"
echo "   https://gerbert.hopitalbarillas.cloud/api/health"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 logs              # Ver logs en tiempo real"
echo "   pm2 status            # Ver estado"
echo "   pm2 monit             # Monitor en tiempo real"
echo "   pm2 restart sgpf-backend  # Reiniciar backend"
echo "   pm2 stop sgpf-backend     # Detener backend"
echo ""
echo "================================================================="
