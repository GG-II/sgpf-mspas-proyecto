#!/bin/bash
# ===== SCRIPT DE DESARROLLO CON AUTO-RECARGA - SGPF =====
# Script para desarrollo que reinicia automáticamente al detectar cambios

echo "🔥 Iniciando SGPF en modo DESARROLLO con auto-recarga"
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
pm2 delete sgpf-backend-dev 2>/dev/null
pm2 delete sgpf-frontend-dev 2>/dev/null

# Iniciar backend con watch mode (se reinicia automáticamente al cambiar código)
echo "✨ Iniciando backend con auto-recarga..."
pm2 start backend/server.js \
  --name sgpf-backend-dev \
  --watch backend/ \
  --ignore-watch="node_modules backend/database/*.db backend/logs" \
  --interpreter node

# Iniciar frontend
echo "✨ Iniciando frontend..."
pm2 start http-server \
  --name sgpf-frontend-dev \
  -- ./frontend -p 3000 --cors -c-1 -a 0.0.0.0

# Mostrar estado
echo ""
echo "✅ Proyecto iniciado en modo DESARROLLO con auto-recarga"
echo ""
echo "📊 Estado de los procesos:"
pm2 list

echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/api/health"
echo ""
echo "🔥 AUTO-RECARGA ACTIVADA:"
echo "   El backend se reiniciará automáticamente al guardar cambios"
echo "   El frontend NO necesita reinicio (recarga el navegador)"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 logs              # Ver logs en tiempo real"
echo "   pm2 logs sgpf-backend-dev  # Solo logs del backend"
echo "   ./stop-dev.sh         # Detener modo desarrollo"
echo ""
echo "================================================================="
