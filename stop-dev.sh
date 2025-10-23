#!/bin/bash
# ===== SCRIPT DETENER DESARROLLO - SGPF =====
# Script para detener el modo desarrollo

echo "🛑 Deteniendo SGPF modo desarrollo"
echo "================================================================="
echo ""

# Detener y eliminar procesos de desarrollo
pm2 delete sgpf-backend-dev 2>/dev/null
pm2 delete sgpf-frontend-dev 2>/dev/null

echo "✅ Modo desarrollo detenido"
echo ""
echo "📊 Procesos restantes:"
pm2 list

echo ""
echo "Para iniciar nuevamente: ./start-dev.sh"
echo "================================================================="
