#!/bin/bash
# ===== SCRIPT PARA VER LOGS - SGPF =====
# Script para ver logs en tiempo real del proyecto

echo "📝 Logs de SGPF - Sistema de Gestión de Planificación Familiar"
echo "================================================================="
echo ""
echo "Presiona Ctrl+C para salir"
echo ""

# Mostrar logs de ambos procesos en tiempo real
pm2 logs
