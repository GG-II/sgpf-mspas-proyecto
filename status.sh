#!/bin/bash
# ===== SCRIPT DE ESTADO - SGPF =====
# Script para ver el estado del proyecto

echo "📊 Estado de SGPF - Sistema de Gestión de Planificación Familiar"
echo "================================================================="
echo ""

# Mostrar estado de los procesos
pm2 list

echo ""
echo "💾 Uso de memoria y CPU:"
pm2 monit
