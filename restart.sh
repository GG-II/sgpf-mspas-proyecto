#!/bin/bash
# ===== SCRIPT DE REINICIO - SGPF =====
# Script para reiniciar el proyecto completo

echo "🔄 Reiniciando SGPF - Sistema de Gestión de Planificación Familiar"
echo "================================================================="
echo ""

# Reiniciar ambos procesos
pm2 restart sgpf-backend
pm2 restart sgpf-frontend

echo ""
echo "✅ Proyecto reiniciado correctamente"
echo ""
echo "📊 Estado de los procesos:"
pm2 list

echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📝 Ver logs: pm2 logs"
echo "================================================================="
