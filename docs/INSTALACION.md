# 🚀 Guía de Instalación - SGPF MSPAS

<div align="center">

![Node](https://img.shields.io/badge/Node.js->=16.0.0-green.svg)
![npm](https://img.shields.io/badge/npm->=8.0.0-red.svg)
![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)

**Sistema de Gestión de Planificación Familiar**  
**Ministerio de Salud Pública y Asistencia Social**

</div>

---

## 📋 Índice

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalación Rápida](#instalación-rápida)
- [Instalación Detallada](#instalación-detallada)
  - [1. Clonar el Repositorio](#1-clonar-el-repositorio)
  - [2. Configurar el Backend](#2-configurar-el-backend)
  - [3. Configurar el Frontend](#3-configurar-el-frontend)
  - [4. Iniciar la Aplicación](#4-iniciar-la-aplicación)
- [Configuración de Producción](#configuración-de-producción)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [Solución de Problemas](#solución-de-problemas)
- [Verificación de Instalación](#verificación-de-instalación)

---

## Requisitos del Sistema

### Software Requerido

| Software | Versión Mínima | Recomendada | Notas |
|----------|---------------|-------------|-------|
| **Node.js** | 16.0.0 | 18.0.0 o superior | [Descargar](https://nodejs.org/) |
| **npm** | 8.0.0 | 9.0.0 o superior | Incluido con Node.js |
| **Git** | 2.0.0 | Última | [Descargar](https://git-scm.com/) |

### Navegadores Compatibles

| Navegador | Versión Mínima |
|-----------|---------------|
| **Google Chrome** | 90+ |
| **Mozilla Firefox** | 88+ |
| **Microsoft Edge** | 90+ |
| **Safari** | 14+ |

### Especificaciones del Servidor

#### Desarrollo
- **RAM:** 2 GB mínimo
- **CPU:** 2 cores
- **Disco:** 500 MB libres
- **Sistema Operativo:** Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

#### Producción
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **CPU:** 4 cores mínimo
- **Disco:** 5 GB libres (para logs y backups)
- **Sistema Operativo:** Ubuntu Server 20.04 LTS o superior

---

## Instalación Rápida

```bash
# 1. Clonar repositorio
git clone [URL_DEL_REPOSITORIO] sgpf-mspas
cd sgpf-mspas

# 2. Instalar backend
cd backend
npm install
npm run setup-db

# 3. Iniciar backend (en una terminal)
npm run dev

# 4. Iniciar frontend (en otra terminal)
cd ../frontend
npx http-server -p 3000 -c-1

# 5. Abrir navegador
# http://localhost:3000
```

**Usuario de prueba:** `aux01@mspas.gob.gt` / `123456`

---

## Instalación Detallada

### 1. Clonar el Repositorio

#### Opción A: Con Git (Recomendado)

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO] sgpf-mspas

# Entrar al directorio
cd sgpf-mspas

# Verificar contenido
ls -la
```

Deberías ver esta estructura:
```
sgpf-mspas/
├── backend/
├── frontend/
├── docs/
├── README.md
└── .gitignore
```

#### Opción B: Descarga Manual

1. Descargar el archivo ZIP del repositorio
2. Extraer en la ubicación deseada
3. Renombrar carpeta a `sgpf-mspas`

---

### 2. Configurar el Backend

#### 2.1. Instalar Dependencias

```bash
# Entrar a la carpeta backend
cd backend

# Instalar todas las dependencias
npm install
```

Esto instalará:
```json
{
  "express": "^4.18.2",         // Framework web
  "cors": "^2.8.5",             // Manejo de CORS
  "dotenv": "^16.3.1",          // Variables de entorno
  "bcryptjs": "^2.4.3",         // Encriptación de passwords
  "jsonwebtoken": "^9.0.2",     // Autenticación JWT
  "sqlite3": "^5.1.6",          // Base de datos
  "helmet": "^7.0.0",           // Headers de seguridad
  "express-rate-limit": "^6.10.0" // Rate limiting
}
```

**Tiempo estimado:** 2-3 minutos

#### 2.2. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```bash
# Crear archivo .env
touch .env

# O en Windows
type nul > .env
```

Editar `.env` con el siguiente contenido:

```env
# ===== CONFIGURACIÓN DEL SERVIDOR =====
NODE_ENV=development
PORT=5000

# ===== SEGURIDAD =====
# IMPORTANTE: Cambiar esta clave en producción
JWT_SECRET=sgpf_mspas_secret_key_desarrollo_2025

# Para producción, generar clave segura:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ===== BASE DE DATOS =====
DB_PATH=./database/sgpf_complete.db

# ===== CORS =====
# En desarrollo
CORS_ORIGIN=http://localhost:3000

# En producción, cambiar a:
# CORS_ORIGIN=https://tu-dominio.com
```

**⚠️ IMPORTANTE para Producción:**

Generar una clave JWT segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiar el resultado y usarlo como `JWT_SECRET` en producción.

#### 2.3. Configurar Base de Datos

```bash
# Ejecutar script de configuración
npm run setup-db
```

Este comando:
1. ✅ Crea el archivo `database/sgpf_complete.db`
2. ✅ Crea todas las tablas necesarias
3. ✅ Inserta datos iniciales:
   - Roles (Auxiliar, Asistente, Encargado, Coordinador)
   - Métodos de planificación familiar
   - Distritos de salud
   - Territorios
   - Comunidades
   - Usuarios de prueba
   - Población MEF por comunidad
4. ✅ Configura índices para optimización

**Salida esperada:**
```
🗄️  Configurando Base de Datos SGPF...
✅ Tablas creadas correctamente
✅ Datos iniciales insertados
✅ 4 usuarios de prueba creados
✅ 23 comunidades configuradas
✅ Base de datos lista para usar
⏱️  Proceso completado en 2.5 segundos
```

**Si necesitas reiniciar la BD:**
```bash
# ⚠️ ESTO BORRARÁ TODOS LOS DATOS
npm run reset-db
```

#### 2.4. Verificar Instalación del Backend

```bash
# Iniciar servidor en modo desarrollo
npm run dev
```

**Salida esperada:**
```
🚀 ===== SERVIDOR SGPF-MSPAS (MODULAR) =====
📡 Servidor corriendo en: http://localhost:5000
🔧 Modo: development
📊 API Health Check: http://localhost:5000/api/health
🗄️  Base de datos: Conectada
🗝️  Arquitectura: Modular (6 módulos de rutas)

📝 Usuarios disponibles:
   👑 admin@mspas.gob.gt / 123456 (Coordinador)
   👩‍⚕️ encargado@mspas.gob.gt / 123456 (Encargado SR)
   👨‍💼 asist01@mspas.gob.gt / 123456 (Asistente Norte)
   👩‍🔬 aux01@mspas.gob.gt / 123456 (Auxiliar Norte)

✅ Backend modular listo para producción
```

**Probar API:**
```bash
# En otra terminal
curl http://localhost:5000/api/health
```

Debe retornar:
```json
{
  "status": "OK",
  "message": "Servidor SGPF-MSPAS funcionando correctamente",
  "timestamp": "2025-10-21T08:00:00.000Z",
  "version": "1.0.0",
  "database": "Conectada",
  "arquitectura": "Modular"
}
```

---

### 3. Configurar el Frontend

#### 3.1. Verificar Estructura

```bash
# Desde la raíz del proyecto
cd frontend

# Ver contenido
ls -la
```

Estructura esperada:
```
frontend/
├── index.html
├── login.html
├── js/
│   ├── config.js
│   ├── shared.js
│   ├── security.js
│   ├── auth.js
│   ├── app.js
│   └── ...
├── css/
│   ├── base.css
│   └── ...
├── templates/
│   ├── dashboard/
│   ├── registro/
│   └── ...
└── assets/
    └── images/
```

#### 3.2. Configurar Dominio (Solo Producción)

**En desarrollo NO es necesario cambiar nada.**

Para producción, editar `frontend/js/config.js`:

```javascript
// Línea ~16
PRODUCTION_SUBDOMAIN: 'tu-dominio-real.cloud',  // ← Cambiar aquí
```

#### 3.3. Servir el Frontend

**Opción A: http-server (Recomendado para desarrollo)**

```bash
# Instalar http-server globalmente (una sola vez)
npm install -g http-server

# Iniciar servidor
http-server -p 3000 -c-1 --cors
```

Parámetros:
- `-p 3000` - Puerto 3000
- `-c-1` - Deshabilitar caché (útil en desarrollo)
- `--cors` - Habilitar CORS

**Opción B: Python (Si tienes Python instalado)**

```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

**Opción C: Live Server (VS Code)**

1. Instalar extensión "Live Server"
2. Click derecho en `index.html`
3. "Open with Live Server"

**Opción D: Nginx/Apache (Producción)**

Ver [Configuración de Producción](#configuración-de-producción)

---

### 4. Iniciar la Aplicación

#### 4.1. Abrir Dos Terminales

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
http-server -p 3000 -c-1
```

#### 4.2. Abrir en Navegador

```
http://localhost:3000
```

O alternativamente:
```
http://127.0.0.1:3000
```

#### 4.3. Iniciar Sesión

**Página de login aparecerá automáticamente.**

Usuarios de prueba disponibles:

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| **Coordinador** | admin@mspas.gob.gt | 123456 | Todos |
| **Encargado SR** | encargado@mspas.gob.gt | 123456 | Gestión completa |
| **Asistente** | asist01@mspas.gob.gt | 123456 | Validación + Reportes |
| **Auxiliar** | aux01@mspas.gob.gt | 123456 | Registro de visitas |

---

## Configuración de Producción

### 1. Variables de Entorno

Editar `backend/.env`:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=[CLAVE_SEGURA_GENERADA]
CORS_ORIGIN=https://tu-dominio-real.cloud
```

### 2. Configurar Dominio Frontend

Editar `frontend/js/config.js`:

```javascript
PRODUCTION_SUBDOMAIN: 'tu-dominio-real.cloud',
```

El sistema detectará automáticamente que está en producción y ajustará:
- ✅ Timeout de sesión: 15 minutos (vs 60 en desarrollo)
- ✅ Detección de DevTools: Habilitada
- ✅ Logs: Enviados al servidor (vs localStorage en desarrollo)

### 3. Instalar PM2 (Gestor de Procesos)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar backend con PM2
cd backend
pm2 start server.js --name sgpf-backend

# Configurar inicio automático
pm2 startup
pm2 save

# Ver logs
pm2 logs sgpf-backend

# Reiniciar
pm2 restart sgpf-backend

# Detener
pm2 stop sgpf-backend
```

### 4. Configurar Nginx

Crear archivo `/etc/nginx/sites-available/sgpf`:

```nginx
server {
    listen 80;
    server_name tu-dominio-real.cloud;

    # Redireccionar HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio-real.cloud;

    # Certificado SSL
    ssl_certificate /etc/letsencrypt/live/tu-dominio-real.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio-real.cloud/privkey.pem;

    # Frontend
    location / {
        root /var/www/sgpf/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/sgpf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio-real.cloud

# Renovación automática (ya configurada)
sudo certbot renew --dry-run
```

### 6. Configurar Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 7. Backups Automáticos

Crear script `/root/backup-sgpf.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/sgpf"
DB_PATH="/var/www/sgpf/backend/database/sgpf_complete.db"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
cp $DB_PATH $BACKUP_DIR/sgpf_$DATE.db

# Comprimir
gzip $BACKUP_DIR/sgpf_$DATE.db

# Eliminar backups de más de 30 días
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: sgpf_$DATE.db.gz"
```

Dar permisos y agregar a cron:
```bash
chmod +x /root/backup-sgpf.sh

# Editar crontab
crontab -e

# Agregar (backup diario a las 2 AM)
0 2 * * * /root/backup-sgpf.sh >> /var/log/backup-sgpf.log 2>&1
```

---

## Usuarios de Prueba

El sistema viene con 4 usuarios pre-configurados para testing:

### 1. Coordinador Municipal (Admin)

```
Email: admin@mspas.gob.gt
Password: 123456
```

**Permisos:**
- ✅ Administración completa del sistema
- ✅ Gestión de usuarios
- ✅ Configuración de metas
- ✅ Reportes ejecutivos de todo el departamento
- ✅ Dashboard con visión general

### 2. Encargado de Servicio de Reproducción

```
Email: encargado@mspas.gob.gt
Password: 123456
Territorio: San Rafael Independencia
```

**Permisos:**
- ✅ Gestión de usuarios del territorio
- ✅ Configuración de metas territoriales
- ✅ Aprobación de registros
- ✅ Reportes del territorio
- ✅ Validación de visitas

### 3. Asistente Técnico

```
Email: asist01@mspas.gob.gt
Password: 123456
Territorio: Área Norte
```

**Permisos:**
- ✅ Validación de visitas de auxiliares
- ✅ Registro de visitas (backup)
- ✅ Reportes territoriales
- ✅ Supervisión de auxiliares

### 4. Auxiliar de Enfermería

```
Email: aux01@mspas.gob.gt
Password: 123456
Comunidades: San Antonio Huista, San José, Santa Rosa
```

**Permisos:**
- ✅ Registro de visitas individuales
- ✅ Consulta de usuarias asignadas
- ✅ Dashboard con sus métricas
- ✅ Ver sus propias estadísticas

**⚠️ IMPORTANTE:** Cambiar estos passwords antes de producción:

```bash
# Conectar a la BD
sqlite3 backend/database/sgpf_complete.db

# Generar hash de nuevo password
# Usar herramienta online bcrypt o:
node -e "console.log(require('bcryptjs').hashSync('NUEVO_PASSWORD', 10))"

# Actualizar en BD
UPDATE usuarios SET password_hash = '[HASH_GENERADO]' WHERE email = 'admin@mspas.gob.gt';
```

---

## Solución de Problemas

### Problema: Error al instalar dependencias

**Error:**
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Solución:**
```bash
# Limpiar caché de npm
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

### Problema: Error "Cannot find module 'express'"

**Error:**
```
Error: Cannot find module 'express'
```

**Solución:**
```bash
# Verificar que estás en la carpeta correcta
pwd  # Debe estar en backend/

# Reinstalar dependencias
npm install
```

---

### Problema: Base de datos no se crea

**Error:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solución:**
```bash
# Crear carpeta database si no existe
mkdir -p database

# Dar permisos
chmod 755 database

# Ejecutar setup nuevamente
npm run setup-db
```

---

### Problema: Puerto 5000 ya en uso

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solución:**

**Opción A: Cambiar puerto**
```bash
# Editar .env
PORT=5001

# O usar variable de entorno
PORT=5001 npm run dev
```

**Opción B: Liberar puerto (Linux/Mac)**
```bash
# Encontrar proceso
lsof -i :5000

# Matar proceso
kill -9 [PID]
```

**Opción C: Liberar puerto (Windows)**
```cmd
# Encontrar proceso
netstat -ano | findstr :5000

# Matar proceso
taskkill /PID [PID] /F
```

---

### Problema: CORS error en navegador

**Error:**
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solución:**

1. Verificar que el backend esté corriendo
2. Verificar `CORS_ORIGIN` en `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```
3. Reiniciar backend

---

### Problema: Login no funciona

**Síntomas:**
- Botón de login no responde
- Error "Credenciales incorrectas" con usuario correcto

**Solución:**

1. **Verificar backend:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Verificar base de datos:**
   ```bash
   sqlite3 backend/database/sgpf_complete.db "SELECT COUNT(*) FROM usuarios;"
   # Debe retornar: 4
   ```

3. **Ver logs del backend:**
   - Buscar errores en la terminal donde corre `npm run dev`

4. **Resetear BD si es necesario:**
   ```bash
   npm run reset-db
   ```

---

### Problema: Frontend muestra página en blanco

**Solución:**

1. **Abrir DevTools (F12) y ver errores en consola**

2. **Verificar que config.js carga:**
   ```javascript
   // En consola del navegador
   SGPFConfig
   // Debe mostrar el objeto de configuración
   ```

3. **Verificar que los scripts cargan:**
   - Ver pestaña "Network" en DevTools
   - Buscar archivos .js en rojo (error 404)

4. **Verificar ruta:**
   - Debe ser `http://localhost:3000` (no /index.html al final)

---

### Problema: SecurityManager no inicializa

**Error en consola:**
```
⚠️ SecurityManager no disponible
```

**Solución:**

1. **Verificar que security.js está cargado:**
   ```javascript
   // En consola
   window.SecurityManager
   // Debe existir
   ```

2. **Verificar orden de scripts en index.html:**
   ```html
   <script src="js/config.js"></script>
   <script src="js/shared.js"></script>
   <script src="js/security.js"></script>  <!-- Debe estar aquí -->
   ```

3. **Ver errores de JavaScript en consola**

---

## Verificación de Instalación

### Checklist Completo

Ejecuta estos pasos para verificar que todo funciona:

#### ✅ Backend

```bash
# 1. Health check
curl http://localhost:5000/api/health
# Esperado: {"status":"OK", ...}

# 2. Verificar BD
sqlite3 backend/database/sgpf_complete.db "SELECT COUNT(*) FROM usuarios;"
# Esperado: 4

# 3. Test de login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aux01@mspas.gob.gt","password":"123456"}'
# Esperado: {"success":true, "token":"...", "user":{...}}
```

#### ✅ Frontend

1. **Abrir:** `http://localhost:3000`
2. **Ver página de login** con logo de MSPAS
3. **Hacer login** con `aux01@mspas.gob.gt` / `123456`
4. **Ver dashboard** del auxiliar con métricas
5. **Abrir DevTools (F12)** y buscar:
   ```
   ✅ SGPF Configuration
   ✅ SecurityManager inicializado
   ✅ Dashboard auxiliar cargado
   ```

#### ✅ Sistema de Seguridad

```javascript
// En consola del navegador
SGPFConfig.getSecurityConfig()
// Debe mostrar configuración completa

SecurityManager.state.isInitialized
// Debe retornar: true

await SGPF.renewToken()
// Debe mostrar: "✅ Token renovado exitosamente"
```

#### ✅ Funcionalidades Principales

**Auxiliar:**
- [ ] Ver dashboard con métricas del mes
- [ ] Ver lista de últimas visitas
- [ ] Ver comunidades asignadas
- [ ] Acceder a "Registrar Visita"

**Asistente:**
- [ ] Ver dashboard con supervisión
- [ ] Ver visitas pendientes de validación
- [ ] Poder validar/rechazar visitas
- [ ] Generar reportes

**Encargado:**
- [ ] Ver dashboard ejecutivo
- [ ] Gestionar usuarios
- [ ] Configurar metas anuales
- [ ] Ver reportes completos

**Coordinador:**
- [ ] Dashboard con visión departamental
- [ ] Ver comparativos entre territorios
- [ ] Acceder a todas las funcionalidades
- [ ] Exportar reportes

---

## Comandos Útiles

### Desarrollo

```bash
# Backend
npm run dev          # Iniciar con nodemon (auto-reload)
npm start           # Iniciar sin auto-reload
npm run setup-db    # Configurar/resetear BD con datos
npm run reset-db    # Borrar y recrear BD (⚠️ elimina datos)

# Frontend
http-server -p 3000 -c-1        # Servir sin caché
http-server -p 3000 -c-1 --cors # Con CORS habilitado

# Base de datos
sqlite3 backend/database/sgpf_complete.db    # Abrir BD
.tables                                       # Ver tablas
.schema usuarios                             # Ver estructura
SELECT * FROM usuarios;                      # Consultar
.quit                                        # Salir
```

### Producción

```bash
# PM2
pm2 start server.js --name sgpf          # Iniciar
pm2 restart sgpf                         # Reiniciar
pm2 stop sgpf                            # Detener
pm2 logs sgpf                            # Ver logs
pm2 monit                                # Monitoreo en tiempo real
pm2 list                                 # Listar procesos

# Nginx
sudo nginx -t                            # Probar configuración
sudo systemctl reload nginx              # Recargar configuración
sudo systemctl status nginx              # Ver estado
tail -f /var/log/nginx/error.log         # Ver errores

# SSL
sudo certbot renew                       # Renovar certificados
sudo certbot certificates                # Ver certificados

# Backups
/root/backup-sgpf.sh                     # Ejecutar backup manual
ls -lh /backups/sgpf/                    # Ver backups
```

---

## Próximos Pasos

Después de instalar exitosamente:

1. 📖 **Leer:** [Manual de Usuario](MANUAL_USUARIO.md)
2. 🔒 **Configurar:** [Sistema de Seguridad](SEGURIDAD.md)
3. 🏗️ **Entender:** [Arquitectura del Sistema](ARQUITECTURA.md)
4. 🔧 **Desarrollar:** [Guía para Desarrolladores](GUIA_DESARROLLADORES.md)

---

## Soporte

### Problemas Técnicos

**Ingeniero Gerbert David García Loaiza**  
📧 Email: gdgl1105@gmail.com

### Institución

**Centro de Salud El Calvario**  
Huehuetenango, Guatemala  
Ministerio de Salud Pública y Asistencia Social

---

<div align="center">

**Sistema de Gestión de Planificación Familiar - MSPAS**

*Desarrollado con ❤️ para mejorar la salud reproductiva en Guatemala*

---

**© 2025 - Todos los derechos reservados**

</div>
```
