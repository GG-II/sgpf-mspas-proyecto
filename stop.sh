#!/bin/bash
# ===== SCRIPT DE DETENCIÓN - SGPF =====
# Script para detener el proyecto completo

echo "🛑 Deteniendo SGPF - Sistema de Gestión de Planificación Familiar"
echo "================================================================="
echo ""

# Detener y eliminar procesos
pm2 delete sgpf-backend 2>/dev/null
pm2 delete sgpf-frontend 2>/dev/null

echo "✅ Proyecto detenido correctamente"
echo ""
echo "📊 Procesos restantes:"
pm2 list

echo ""
echo "Para iniciar nuevamente: ./start.sh"
echo "================================================================="
