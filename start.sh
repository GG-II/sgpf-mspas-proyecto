#!/bin/bash
# ===== SCRIPT DE INICIO - SGPF DESARROLLO =====
# Script para iniciar el proyecto completo en modo desarrollo

echo "🚀 Iniciando SGPF - Sistema de Gestión de Planificación Familiar"
echo "================================================================="
echo ""

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado"
    echo "   Instalando PM2 globalmente..."
    npm install -g pm2
fi

# Verificar si http-server está instalado
if ! command -v http-server &> /dev/null; then
    echo "❌ http-server no está instalado"
    echo "   Instalando http-server globalmente..."
    npm install -g http-server
fi

# Crear carpeta de logs si no existe
mkdir -p logs

# Detener procesos anteriores si existen
echo "🛑 Deteniendo procesos anteriores..."
pm2 delete sgpf-backend 2>/dev/null
pm2 delete sgpf-frontend 2>/dev/null

# Iniciar con PM2 usando el archivo de configuración
echo "✨ Iniciando proyecto en modo DESARROLLO..."
pm2 start ecosystem.config.js

# Mostrar estado
echo ""
echo "✅ Proyecto iniciado correctamente"
echo ""
echo "📊 Estado de los procesos:"
pm2 list

echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/api/health"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 logs              # Ver logs en tiempo real"
echo "   pm2 status            # Ver estado de procesos"
echo "   pm2 monit             # Monitor en tiempo real"
echo "   pm2 restart all       # Reiniciar todo"
echo "   pm2 stop all          # Detener todo"
echo "   ./stop.sh             # Detener todo (con script)"
echo ""
echo "Para detener el proyecto: ./stop.sh"
echo "================================================================="
