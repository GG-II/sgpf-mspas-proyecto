# 🚀 INSTALACIÓN RÁPIDA - SISTEMA DE CONTROL SGPF

## ⏱️ Tiempo: 5 minutos

---

## 📋 PASO 1: Instalar PM2 y http-server

Abre una terminal y ejecuta:

```bash
npm install -g pm2
npm install -g http-server
```

**¿Qué es esto?**
- **PM2:** Programa que mantiene tu proyecto corriendo
- **http-server:** Servidor web simple para el frontend

---

## 📦 PASO 2: Copiar archivos a tu proyecto

1. Descarga todos los archivos que generé (los que tienen extensión `.sh` y el `ecosystem.config.js`)

2. Cópialos a la **raíz de tu proyecto** (donde están las carpetas `backend` y `frontend`):

```
tu-proyecto-sgpf/
├── backend/              ← Ya existe
├── frontend/             ← Ya existe
├── ecosystem.config.js   ← NUEVO (copiar aquí)
├── start.sh              ← NUEVO (copiar aquí)
├── stop.sh               ← NUEVO (copiar aquí)
├── restart.sh            ← NUEVO (copiar aquí)
├── logs.sh               ← NUEVO (copiar aquí)
├── status.sh             ← NUEVO (copiar aquí)
├── start-dev.sh          ← NUEVO (copiar aquí)
├── stop-dev.sh           ← NUEVO (copiar aquí)
└── start-production.sh   ← NUEVO (copiar aquí)
```

---

## ⚙️ PASO 3: Dar permisos a los scripts

En tu terminal, dentro de la carpeta del proyecto:

### En Linux/Mac:
```bash
chmod +x *.sh
```

### En Windows:
No necesitas hacer nada, los scripts funcionarán con Git Bash o WSL.

---

## ✅ PASO 4: ¡Listo! Probar

```bash
./start.sh
```

Deberías ver:
```
🚀 Iniciando SGPF...
✅ Proyecto iniciado correctamente

🌐 URLs de acceso:
   Frontend: http://localhost:3000
   Backend:  http://localhost:5000
```

Abre tu navegador en `http://localhost:3000`

---

## 🎮 COMANDOS PRINCIPALES

### Para trabajar normalmente:
```bash
./start.sh        # Iniciar todo
./stop.sh         # Detener todo
./restart.sh      # Reiniciar todo
./logs.sh         # Ver qué está pasando
./status.sh       # Ver estado
```

### Para desarrollo con auto-recarga:
```bash
./start-dev.sh    # Inicia y se reinicia solo al cambiar código
./stop-dev.sh     # Detener modo desarrollo
```

### Para producción (Hostinger):
```bash
./start-production.sh    # Solo en el servidor
```

---

## 💡 USO DIARIO

### Día típico de desarrollo:

1. **Empezar a trabajar:**
   ```bash
   ./start-dev.sh
   ```

2. **Trabajar en tu código:**
   - Editas archivos
   - Guardas
   - El backend se reinicia automáticamente
   - Recargas el navegador

3. **Ver si hay errores:**
   ```bash
   ./logs.sh
   ```
   Presiona Ctrl+C para salir

4. **Terminar:**
   ```bash
   ./stop-dev.sh
   ```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Permission denied"
```bash
chmod +x *.sh
```

### Error: "PM2 not found"
```bash
npm install -g pm2
```

### Error: "http-server not found"
```bash
npm install -g http-server
```

### No funciona nada
```bash
pm2 delete all
./start.sh
```

---

## 📊 DIFERENCIA ENTRE LOS MODOS

### start.sh (Normal)
- Inicia backend y frontend
- NO se reinicia automáticamente
- Perfecto para probar

### start-dev.sh (Desarrollo)
- Inicia backend y frontend
- Backend se reinicia automáticamente al cambiar código
- Perfecto para programar

### start-production.sh (Producción)
- Solo backend (Nginx sirve el frontend)
- Configurado para producción
- Solo usar en Hostinger

---

## ✅ VERIFICAR QUE TODO FUNCIONE

```bash
# 1. Iniciar
./start.sh

# 2. Verificar estado
pm2 list

# Debes ver:
# ┌─────────────────┬─────┬────────┐
# │ App name        │ id  │ status │
# ├─────────────────┼─────┼────────┤
# │ sgpf-backend    │ 0   │ online │
# │ sgpf-frontend   │ 1   │ online │
# └─────────────────┴─────┴────────┘

# 3. Abrir navegador
# http://localhost:3000

# 4. ¡Funciona! ✅
```

---

## 🎓 PARA HOSTINGER (PRODUCCIÓN)

Cuando subas al servidor:

```bash
# 1. Conectar por SSH
ssh root@72.60.164.38

# 2. Ir a tu proyecto
cd /var/www/gerbert-sgpf

# 3. Copiar los scripts
# (ya los subiste con el resto del proyecto)

# 4. Dar permisos
chmod +x *.sh

# 5. Iniciar en producción
./start-production.sh

# 6. Verificar
pm2 list
pm2 logs

# 7. Abrir en navegador
# https://gerbert.hopitalbarillas.cloud
```

---

## 📝 RESUMEN VISUAL

### ANTES (Sin scripts):
```
Terminal 1: cd backend && node server.js
Terminal 2: cd frontend && http-server -p 3000 --cors -c-1 -a 0.0.0.0
Si cierras una, se detiene todo 😢
```

### AHORA (Con scripts):
```
./start.sh
Todo funciona 🎉
Puedes cerrar la terminal
Sigue corriendo en segundo plano 🚀
```

---

## 🎯 SIGUIENTE PASO

Una vez que confirmes que funciona localmente con `./start.sh`:

1. Lee el `README_SCRIPTS.md` para entender todo
2. Sube los scripts al servidor junto con tu código
3. Usa `./start-production.sh` en el servidor

---

**¡Listo! Ahora tienes control total de tu proyecto con comandos simples. 🎉**

Si algo no funciona, revisa el `README_SCRIPTS.md` que tiene soluciones detalladas.
