# 🎮 SISTEMA DE CONTROL DEL PROYECTO SGPF

## 🎯 ¿Qué es esto?

Un conjunto de scripts que te permiten **controlar todo tu proyecto con un solo comando**.

Ya NO necesitas:
- ❌ Abrir una terminal para el backend
- ❌ Abrir otra terminal para el frontend  
- ❌ Recordar comandos largos
- ❌ Preocuparte si algo se cierra

Ahora solo usas:
- ✅ `./start.sh` para iniciar TODO
- ✅ `./stop.sh` para detener TODO
- ✅ `./restart.sh` para reiniciar TODO
- ✅ `./logs.sh` para ver qué está pasando
- ✅ `./status.sh` para ver el estado

---

## 📦 ARCHIVOS INCLUIDOS

### 1. **ecosystem.config.js** ⭐ PRINCIPAL
Archivo de configuración de PM2 que define cómo correr backend y frontend.

**NO necesitas modificarlo** a menos que cambies puertos.

---

### 2. **start.sh** - Iniciar proyecto
```bash
./start.sh
```
**Qué hace:**
- ✅ Verifica que PM2 esté instalado
- ✅ Verifica que http-server esté instalado
- ✅ Inicia el backend (Node.js)
- ✅ Inicia el frontend (http-server)
- ✅ Muestra las URLs para acceder

**Cuándo usar:** Cada vez que quieras trabajar en el proyecto.

---

### 3. **stop.sh** - Detener proyecto
```bash
./stop.sh
```
**Qué hace:**
- ✅ Detiene el backend
- ✅ Detiene el frontend
- ✅ Libera los puertos

**Cuándo usar:** Cuando termines de trabajar o necesites liberar recursos.

---

### 4. **restart.sh** - Reiniciar proyecto
```bash
./restart.sh
```
**Qué hace:**
- ✅ Reinicia el backend
- ✅ Reinicia el frontend
- ✅ NO necesitas detener primero

**Cuándo usar:** Después de hacer cambios en el código.

---

### 5. **logs.sh** - Ver logs
```bash
./logs.sh
```
**Qué hace:**
- ✅ Muestra logs del backend
- ✅ Muestra logs del frontend
- ✅ En tiempo real
- ✅ Presiona Ctrl+C para salir

**Cuándo usar:** Para ver qué está pasando o buscar errores.

---

### 6. **status.sh** - Ver estado
```bash
./status.sh
```
**Qué hace:**
- ✅ Muestra si backend y frontend están corriendo
- ✅ Muestra uso de CPU y memoria
- ✅ Muestra tiempo que llevan corriendo

**Cuándo usar:** Para verificar que todo esté funcionando.

---

### 7. **start-production.sh** - Iniciar en producción
```bash
./start-production.sh
```
**Qué hace:**
- ✅ Inicia SOLO el backend (Nginx sirve el frontend)
- ✅ Configura para reinicio automático
- ✅ Usa variables de producción

**Cuándo usar:** SOLO en el servidor de Hostinger, NO en tu computadora.

---

## 🚀 INSTALACIÓN

### Paso 1: Instalar PM2 (solo primera vez)
```bash
npm install -g pm2
npm install -g http-server
```

### Paso 2: Copiar archivos a tu proyecto
Coloca todos estos archivos en la **raíz de tu proyecto** (donde están las carpetas `backend` y `frontend`).

```
tu-proyecto/
├── backend/
├── frontend/
├── ecosystem.config.js    ← Aquí
├── start.sh               ← Aquí
├── stop.sh                ← Aquí
├── restart.sh             ← Aquí
├── logs.sh                ← Aquí
├── status.sh              ← Aquí
└── start-production.sh    ← Aquí
```

### Paso 3: Dar permisos de ejecución
```bash
chmod +x start.sh
chmod +x stop.sh
chmod +x restart.sh
chmod +x logs.sh
chmod +x status.sh
chmod +x start-production.sh
```

---

## 💻 USO DIARIO (EN TU COMPUTADORA)

### Iniciar el proyecto
```bash
./start.sh
```
Abre tu navegador en `http://localhost:3000`

### Trabajar en el código
- Haces cambios en tu código
- Guardas los archivos
- Ejecutas: `./restart.sh`
- Recargas el navegador

### Ver si hay errores
```bash
./logs.sh
```
Presiona Ctrl+C para salir

### Ver estado
```bash
./status.sh
```

### Detener todo
```bash
./stop.sh
```

---

## 🌐 USO EN PRODUCCIÓN (HOSTINGER)

### Primera vez (subir archivos)
```bash
# En tu computadora, comprimir proyecto
tar -czf sgpf.tar.gz --exclude=node_modules backend/ frontend/ *.sh ecosystem.config.js

# Subir al servidor
scp sgpf.tar.gz root@72.60.164.38:/var/www/

# Conectar al servidor
ssh root@72.60.164.38

# Descomprimir
cd /var/www
mkdir gerbert-sgpf
tar -xzf sgpf.tar.gz -C gerbert-sgpf/
cd gerbert-sgpf

# Dar permisos
chmod +x *.sh

# Iniciar en producción
./start-production.sh
```

### Actualizar código
```bash
# En el servidor
cd /var/www/gerbert-sgpf
git pull  # o subir nuevos archivos
./restart.sh
```

---

## 📝 COMANDOS DE PM2 DIRECTOS

Si prefieres usar PM2 directamente (sin scripts):

```bash
# Ver todos los procesos
pm2 list

# Ver logs
pm2 logs

# Reiniciar solo backend
pm2 restart sgpf-backend

# Reiniciar solo frontend
pm2 restart sgpf-frontend

# Detener todo
pm2 stop all

# Eliminar todo
pm2 delete all

# Monitor en tiempo real
pm2 monit
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "Permission denied" al ejecutar scripts
```bash
chmod +x *.sh
```

### "PM2 not found"
```bash
npm install -g pm2
```

### "http-server not found"
```bash
npm install -g http-server
```

### Backend no inicia
```bash
# Ver logs
pm2 logs sgpf-backend

# Verificar .env
cat backend/.env

# Verificar puerto
sudo netstat -tlnp | grep 5000
```

### Frontend no inicia
```bash
# Ver logs
pm2 logs sgpf-frontend

# Verificar puerto
sudo netstat -tlnp | grep 3000
```

### "Port already in use"
```bash
# Ver qué está usando el puerto
sudo netstat -tlnp | grep PUERTO

# Detener todo con PM2
pm2 delete all

# Reintentar
./start.sh
```

---

## ✅ VENTAJAS DE ESTE SISTEMA

### Antes:
```bash
# Terminal 1
cd backend
node server.js

# Terminal 2
cd frontend
http-server -p 3000 --cors -c-1 -a 0.0.0.0

# Si cierras una terminal, se detiene
# Si reinicias la computadora, hay que volver a hacerlo
```

### Ahora:
```bash
# Una sola terminal
./start.sh

# Puedes cerrar la terminal, sigue corriendo
# Si reinicias (en producción), se inicia solo
# Ver todo con: pm2 list
```

---

## 🎓 PARA TU PROYECTO DE GRADUACIÓN

Esto demuestra:
- ✅ Buenas prácticas de DevOps
- ✅ Automatización de procesos
- ✅ Gestión profesional de aplicaciones
- ✅ Facilita mantenimiento
- ✅ Reduce errores humanos

**Puedes incluir estos scripts en tu documentación.**

---

## 📚 DOCUMENTACIÓN PM2

Si quieres aprender más:
- https://pm2.keymetrics.io/docs/usage/quick-start/
- https://pm2.keymetrics.io/docs/usage/application-declaration/

---

## 🆘 AYUDA RÁPIDA

**Problema:** No funciona nada
```bash
pm2 delete all
./start.sh
```

**Problema:** Solo backend no funciona
```bash
pm2 logs sgpf-backend
# Ver el error y buscar solución
```

**Problema:** Solo frontend no funciona
```bash
pm2 logs sgpf-frontend
# Ver el error
```

**Problema:** Quiero empezar de cero
```bash
pm2 delete all
pm2 kill
./start.sh
```

---

**¡Disfruta tu sistema de control unificado! 🚀**

Ya no necesitas abrir múltiples terminales ni recordar comandos complicados.
