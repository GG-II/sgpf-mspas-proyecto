# 👨‍💻 Guía para Desarrolladores - SGPF MSPAS

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)

**Guía Técnica para Desarrollo y Mantenimiento**  
**Sistema de Gestión de Planificación Familiar**

</div>

---

## 📋 Índice

- [Introducción](#introducción)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Configuración del Entorno](#configuración-del-entorno)
- [Estructura del Código](#estructura-del-código)
- [Convenciones de Código](#convenciones-de-código)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Testing y Debugging](#testing-y-debugging)
- [Agregar Nuevas Funcionalidades](#agregar-nuevas-funcionalidades)
- [Sistema de Seguridad](#sistema-de-seguridad)
- [Optimización y Performance](#optimización-y-performance)
- [Deployment](#deployment)
- [Troubleshooting Común](#troubleshooting-común)
- [Contribuir al Proyecto](#contribuir-al-proyecto)

---

## Introducción

### Propósito de esta Guía

Esta guía está diseñada para:
- ✅ **Nuevos desarrolladores** que se unan al proyecto
- ✅ **Mantenedores** que necesiten hacer cambios
- ✅ **Colaboradores** externos que quieran contribuir
- ✅ **Estudiantes** que quieran aprender de la arquitectura

### Requisitos Previos

Antes de empezar, deberías estar familiarizado con:

| Tecnología | Nivel Requerido | Recursos |
|------------|-----------------|----------|
| **JavaScript** | Intermedio | [MDN JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript) |
| **Node.js/Express** | Básico | [Express Docs](https://expressjs.com/) |
| **HTML/CSS** | Básico | [MDN Web Docs](https://developer.mozilla.org/) |
| **SQL** | Básico | [SQLite Tutorial](https://www.sqlitetutorial.net/) |
| **Git** | Básico | [Git Handbook](https://guides.github.com/) |

### Stack Tecnológico

```
Frontend:
├── HTML5, CSS3
├── JavaScript ES6+ (Vanilla, sin frameworks)
├── Tailwind CSS (CDN)
└── Chart.js, jsPDF, ExcelJS

Backend:
├── Node.js 18+
├── Express.js 4.18
├── SQLite3 5.1
├── JWT (jsonwebtoken)
├── Bcrypt (bcryptjs)
└── Helmet, CORS, Rate Limiting

Herramientas:
├── Nodemon (desarrollo)
├── Git (control de versiones)
└── VS Code (recomendado)
```

---

## Arquitectura del Proyecto

### Visión General

```
sgpf-mspas-proyecto/
│
├── backend/                    # Servidor Node.js
│   ├── server.js              # 🚀 Punto de entrada principal
│   ├── database/              # Base de datos SQLite
│   │   └── sgpf_complete.db
│   ├── routes/                # 🛣️ Rutas modulares de API
│   │   ├── auth.js           # Autenticación
│   │   ├── registros.js      # Registros (V1.0)
│   │   ├── usuarias.js       # Usuarias (V2.0)
│   │   ├── visitas.js        # Visitas individuales
│   │   ├── dashboard.js      # Estadísticas
│   │   ├── reportes.js       # Sistema de reportes
│   │   ├── admin.js          # Administración
│   │   ├── planificacion.js  # Metas y planificación
│   │   └── backup.js         # Sistema de backups
│   ├── middleware/            # Middlewares
│   │   ├── auth.js           # Verificación JWT
│   │   └── security.js       # Headers de seguridad
│   ├── services/              # Lógica de negocio
│   │   └── acceso.js         # Control de acceso territorial
│   ├── scripts/               # Scripts utilitarios
│   │   ├── setup-database.js # Configuración inicial
│   │   └── backup-database.js # Sistema de backups
│   ├── backups/               # Backups automáticos
│   ├── package.json
│   └── .env                   # Variables de entorno
│
├── frontend/                   # Cliente web
│   ├── index.html             # 🏠 Dashboard principal
│   ├── login.html             # 🔐 Página de login
│   ├── js/                    # JavaScript modular
│   │   ├── config.js         # ⚙️ Configuración centralizada
│   │   ├── shared.js         # Funciones comunes
│   │   ├── security.js       # Sistema de seguridad
│   │   ├── auth.js           # Autenticación frontend
│   │   ├── app.js            # Router principal
│   │   ├── component-loader.js # Carga dinámica
│   │   ├── registro-v2.js    # Sistema de registro
│   │   ├── reportes.js       # Generación de reportes
│   │   ├── planificacion.js  # Gestión de metas
│   │   └── dashboards/       # Dashboards por rol
│   │       ├── auxiliar.js
│   │       ├── asistente.js
│   │       ├── encargado.js
│   │       └── coordinador.js
│   ├── templates/             # Templates HTML
│   │   ├── dashboard/        # Dashboards por rol
│   │   ├── registro/         # Formularios de registro
│   │   ├── reportes/         # Vistas de reportes
│   │   └── admin/            # Administración
│   ├── css/                   # Estilos
│   │   ├── base.css
│   │   └── components.css
│   └── assets/                # Recursos estáticos
│       └── images/
│
├── docs/                       # 📚 Documentación
│   ├── SEGURIDAD.md
│   ├── INSTALACION.md
│   ├── BASE_DATOS.md
│   ├── GUIA_DESARROLLADORES.md  # 👈 Este archivo
│   ├── API.md
│   └── MANUAL_USUARIO.md
│
└── README.md                   # Documentación principal
```

### Principios de Diseño

#### 1. Modularidad

Cada componente del sistema es independiente y reutilizable:

```javascript
// ❌ MAL - Todo en un archivo
function dashboard() {
  // 1000 líneas de código...
}

// ✅ BIEN - Modular
import { DashboardAuxiliar } from './dashboards/auxiliar.js';
import { DashboardAsistente } from './dashboards/asistente.js';
```

#### 2. Separación Frontend/Backend

```
Frontend (Cliente)              Backend (Servidor)
─────────────────              ──────────────────
   ↓ HTTP Request                    ↓
   └─ GET /api/usuarios         ┌─ routes/usuarios.js
                                ├─ middleware/auth.js
                                ├─ services/usuarios.js
                                └─ database/
   ← JSON Response ─────────────┘
```

#### 3. Control de Acceso por Roles

```javascript
// Cada endpoint verifica permisos
router.get('/usuarios', authenticateToken, (req, res) => {
  // Solo coordinadores y encargados
  if (!['coordinador_municipal', 'encargado_sr'].includes(req.user.rol)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  // ...
});
```

---

## Configuración del Entorno

### 1. Clonar y Configurar

```bash
# Clonar repositorio
git clone [URL_REPO] sgpf-mspas
cd sgpf-mspas

# Backend
cd backend
npm install
cp .env.example .env  # Crear archivo de configuración
npm run setup-db      # Configurar base de datos

# Frontend (en otra terminal)
cd frontend
npx http-server -p 3000 -c-1
```

### 2. Variables de Entorno

Crear `backend/.env`:

```env
# Entorno
NODE_ENV=development

# Servidor
PORT=5000

# Seguridad
JWT_SECRET=tu_clave_secreta_aqui

# Base de datos
DB_PATH=./database/sgpf_complete.db

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Configuración de VS Code

**Extensiones recomendadas:**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",        // Formateo de código
    "dbaeumer.vscode-eslint",        // Linting
    "ritwickdey.liveserver",         // Servidor local
    "bradlc.vscode-tailwindcss",     // Tailwind IntelliSense
    "christian-kohler.path-intellisense"
  ]
}
```

**Settings.json:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "files.autoSave": "onFocusChange"
}
```

---

## Estructura del Código

### Backend - Arquitectura Modular

#### server.js - Punto de Entrada

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas modulares
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarias', require('./routes/usuarias'));
app.use('/api/visitas', require('./routes/visitas'));
// ...más rutas

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

#### Estructura de una Ruta

```javascript
// routes/usuarias.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/usuarias
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 1. Validar permisos
    if (req.user.rol !== 'auxiliar_enfermeria') {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    // 2. Obtener datos
    const db = req.app.locals.db;
    const usuarias = await getUsuarias(db, req.user.id);

    // 3. Retornar respuesta
    res.json({
      success: true,
      data: usuarias
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
```

### Frontend - Sistema Modular

#### config.js - Configuración Centralizada

```javascript
const SGPFConfig = {
  // Detección automática de ambiente
  getEnvironment() {
    return window.location.hostname === 'localhost' 
      ? 'development' 
      : 'production';
  },

  // URLs dinámicas
  getApiUrl() {
    return this.isDevelopment() 
      ? 'http://localhost:5000/api'
      : `https://${this.PRODUCTION_SUBDOMAIN}/api`;
  },

  // Configuración de seguridad
  SECURITY: {
    SESSION_TIMEOUT: {
      get timeout_minutes() {
        return SGPFConfig.isDevelopment() ? 60 : 15;
      }
    }
  }
};
```

#### shared.js - Funciones Comunes

```javascript
const SGPF = {
  // API call wrapper
  async apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(
      SGPFConfig.getEndpoint(endpoint),
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...(data && { body: JSON.stringify(data) })
      }
    );

    return await response.json();
  },

  // Toast notifications
  showToast(message, type = 'info') {
    // Implementación...
  },

  // Loading overlay
  showLoading(show = true) {
    // Implementación...
  }
};
```

#### component-loader.js - Carga Dinámica

```javascript
const ComponentLoader = {
  async navigateToView(viewName) {
    // 1. Determinar template según vista
    const templatePath = this.getTemplatePath(viewName);

    // 2. Cargar HTML
    const html = await this.loadTemplate(templatePath);

    // 3. Insertar en DOM
    document.getElementById('main-content').innerHTML = html;

    // 4. Inicializar JavaScript específico
    await this.initializeViewSystem(viewName);
  }
};
```

---

## Convenciones de Código

### JavaScript

#### Nomenclatura

```javascript
// Variables y funciones: camelCase
const userName = 'Juan';
function getUserData() { }

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:5000';
const MAX_RETRY_ATTEMPTS = 3;

// Clases: PascalCase
class UserManager { }

// Archivos: kebab-case
// dashboard-auxiliar.js
// registro-v2.js
```

#### Estructura de Funciones

```javascript
/**
 * Obtiene las usuarias de una comunidad específica
 * @param {number} comunidadId - ID de la comunidad
 * @param {string} tipoUsuaria - Tipo: 'nueva', 'reconsulta', 'activa'
 * @returns {Promise<Array>} Lista de usuarias
 */
async function getUsuariasPorComunidad(comunidadId, tipoUsuaria = null) {
  // 1. Validar parámetros
  if (!comunidadId) {
    throw new Error('comunidadId es requerido');
  }

  // 2. Construir query
  let query = 'SELECT * FROM usuarias WHERE comunidad_id = ?';
  const params = [comunidadId];

  if (tipoUsuaria) {
    query += ' AND tipo_usuaria = ?';
    params.push(tipoUsuaria);
  }

  // 3. Ejecutar y retornar
  return await db.all(query, params);
}
```

#### Manejo de Errores

```javascript
// ✅ BIEN - Manejo explícito
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  console.error('Error detallado:', error);
  showUserFriendlyMessage('No se pudieron cargar los datos');
  logErrorToServer(error); // Enviar a servidor
}

// ❌ MAL - Ignorar errores
try {
  await fetchData();
} catch (e) {
  // Silenciosamente ignorado
}
```

#### Async/Await vs Promises

```javascript
// ✅ Preferir async/await
async function loadDashboard() {
  const stats = await getStatistics();
  const charts = await buildCharts(stats);
  renderDashboard(charts);
}

// ❌ Evitar callback hell
function loadDashboard() {
  getStatistics().then(stats => {
    buildCharts(stats).then(charts => {
      renderDashboard(charts);
    });
  });
}
```

### SQL

#### Queries Preparados (Seguridad)

```javascript
// ✅ BIEN - Prepared statements
db.get(
  'SELECT * FROM usuarios WHERE email = ?',
  [userEmail],
  callback
);

// ❌ MAL - SQL Injection vulnerable
db.get(
  `SELECT * FROM usuarios WHERE email = '${userEmail}'`,
  callback
);
```

#### Nomenclatura de Tablas

```sql
-- Tablas: snake_case, plural
usuarios
metodos_planificacion
configuracion_metas_anuales

-- Columnas: snake_case
fecha_nacimiento
poblacion_mef
tipo_usuaria
```

### HTML/CSS

#### Clases CSS (Tailwind)

```html
<!-- ✅ BIEN - Clases descriptivas -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-gray-800 mb-4">
    Título
  </h2>
</div>

<!-- ❌ MAL - Estilos inline -->
<div style="background:white;padding:20px;">
  <h2 style="font-size:20px;font-weight:bold;">
    Título
  </h2>
</div>
```

#### Semántica HTML

```html
<!-- ✅ BIEN - Semántico -->
<nav class="navigation">
  <ul>
    <li><a href="#dashboard">Dashboard</a></li>
  </ul>
</nav>

<main class="content">
  <article>...</article>
</main>

<!-- ❌ MAL - No semántico -->
<div class="navigation">
  <div>
    <div><a href="#dashboard">Dashboard</a></div>
  </div>
</div>
```

---

## Flujo de Trabajo

### Desarrollo de Nueva Funcionalidad

#### 1. Crear Rama de Feature

```bash
git checkout -b feature/nueva-funcionalidad
```

#### 2. Desarrollo Iterativo

```bash
# Hacer cambios
# Probar localmente
npm run dev

# Commit frecuentes
git add .
git commit -m "feat: descripción del cambio"
```

#### 3. Testing

```bash
# Probar en navegador
# Verificar consola (sin errores)
# Probar con diferentes roles
# Probar edge cases
```

#### 4. Pull Request

```bash
git push origin feature/nueva-funcionalidad
# Crear PR en GitHub/GitLab
```

### Mensajes de Commit

Seguir convención [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: agregar filtro por fecha en reportes
fix: corregir cálculo de metas mensuales
docs: actualizar README con nuevas instrucciones
style: formatear código con prettier
refactor: reorganizar estructura de dashboards
test: agregar tests para módulo de usuarias
chore: actualizar dependencias
```

### Branching Strategy

```
main (producción)
  ├── develop (desarrollo)
  │   ├── feature/registro-masivo
  │   ├── feature/exportar-pdf
  │   └── fix/bug-metas
  └── hotfix/critical-bug
```

---

## Testing y Debugging

### Testing Manual

#### Checklist de Funcionalidad

```
□ Login con 4 tipos de usuarios
□ Navegación entre vistas
□ Registro de usuarias/visitas
□ Generación de reportes
□ Exportación Excel/PDF
□ Sistema de seguridad (timeout)
□ Responsive (móvil/tablet/desktop)
□ Validación de formularios
□ Manejo de errores
□ Rendimiento (carga < 3s)
```

#### Testing por Rol

**Auxiliar:**
```bash
1. Login como aux01@mspas.gob.gt
2. Ver dashboard con métricas
3. Registrar nueva visita
4. Ver lista de usuarias asignadas
5. Cerrar sesión
```

**Asistente:**
```bash
1. Login como asist01@mspas.gob.gt
2. Ver visitas pendientes de validación
3. Validar una visita
4. Rechazar una visita con observación
5. Generar reporte mensual
```

**Encargado:**
```bash
1. Login como encargado@mspas.gob.gt
2. Gestionar usuarios (crear/editar)
3. Configurar metas anuales
4. Aprobar registros
5. Ver dashboard completo
```

**Coordinador:**
```bash
1. Login como admin@mspas.gob.gt
2. Ver dashboard ejecutivo
3. Comparativo entre territorios
4. Exportar reportes
5. Acceder a todas las funcionalidades
```

### Debugging

#### Frontend

```javascript
// Console.log estratégico
console.log('🔍 Estado actual:', {
  user: SGPF.getCurrentUser(),
  view: SGPF.state.currentView,
  data: someData
});

// Debugger en puntos críticos
function processData(data) {
  debugger; // Pausa aquí en DevTools
  return data.map(item => transform(item));
}

// Network tab
// Ver todas las peticiones HTTP en DevTools > Network
```

#### Backend

```javascript
// Logging detallado
console.log(`📥 Request: ${req.method} ${req.path}`);
console.log('📦 Body:', req.body);
console.log('👤 User:', req.user);

// Nodemon para auto-reload
npm run dev

// Ver logs en tiempo real
tail -f logs/server.log
```

#### Base de Datos

```bash
# Abrir SQLite en CLI
sqlite3 backend/database/sgpf_complete.db

# Queries de debugging
.tables                              # Ver todas las tablas
.schema usuarias                     # Ver estructura
SELECT COUNT(*) FROM visitas;        # Contar registros
.quit                                # Salir
```

---

## Agregar Nuevas Funcionalidades

### Ejemplo: Agregar "Notificaciones"

#### Paso 1: Backend - Crear Tabla

```sql
-- En setup-database.js
CREATE TABLE notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT,
    leida BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

#### Paso 2: Backend - Crear Ruta

```javascript
// routes/notificaciones.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  
  db.all(
    'SELECT * FROM notificaciones WHERE usuario_id = ? AND leida = 0',
    [req.user.id],
    (err, notificaciones) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        success: true,
        data: notificaciones
      });
    }
  );
});

module.exports = router;
```

#### Paso 3: Backend - Registrar Ruta

```javascript
// server.js
const notificacionesRoutes = require('./routes/notificaciones');
app.use('/api/notificaciones', notificacionesRoutes);
```

#### Paso 4: Frontend - Crear Función

```javascript
// En shared.js o nuevo archivo notificaciones.js
async function getNotificaciones() {
  try {
    const response = await SGPF.apiCall('/notificaciones');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}
```

#### Paso 5: Frontend - UI Component

```javascript
// En app.js o dashboard
async function mostrarNotificaciones() {
  const notificaciones = await getNotificaciones();
  
  const badge = document.getElementById('notif-badge');
  if (notificaciones.length > 0) {
    badge.textContent = notificaciones.length;
    badge.classList.remove('hidden');
  }
}

// Llamar al cargar dashboard
document.addEventListener('DOMContentLoaded', () => {
  mostrarNotificaciones();
});
```

---

## Sistema de Seguridad

### Autenticación JWT

#### Flujo de Autenticación

```
1. Usuario envía credenciales
   ↓
2. Backend valida con bcrypt
   ↓
3. Backend genera JWT
   ↓
4. Frontend guarda token en localStorage
   ↓
5. Frontend envía token en cada request
   ↓
6. Backend valida token en cada endpoint
```

#### Generar Token

```javascript
// Backend
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    permisos: usuario.permisos
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

#### Verificar Token

```javascript
// middleware/auth.js
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    req.user = user;
    next();
  });
}
```

### Sistema de Timeout

Ver [SEGURIDAD.md](SEGURIDAD.md) para detalles completos.

**Componentes principales:**
- `frontend/js/security.js` - Módulo de seguridad
- `SecurityManager.init()` - Inicialización automática
- Eventos monitoreados: mousemove, click, keypress, scroll
- Modal de advertencia 60s antes del timeout

---

## Optimización y Performance

### Frontend

#### Lazy Loading de Scripts

```javascript
// Cargar scripts solo cuando se necesitan
async function loadDashboardScript(role) {
  if (!window[`Dashboard${role}`]) {
    const script = document.createElement('script');
    script.src = `js/dashboards/${role}.js`;
    await new Promise(resolve => {
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
}
```

#### Debouncing y Throttling

```javascript
// Throttle para eventos repetitivos
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Uso
window.addEventListener('scroll', throttle(() => {
  checkScrollPosition();
}, 200));
```

#### Cache de Datos

```javascript
// Cache simple en memoria
const cache = {
  data: null,
  timestamp: null,
  
  get(key, maxAge = 5 * 60 * 1000) {
    if (!this.data || Date.now() - this.timestamp > maxAge) {
      return null;
    }
    return this.data[key];
  },
  
  set(key, value) {
    if (!this.data) this.data = {};
    this.data[key] = value;
    this.timestamp = Date.now();
  }
};
```

### Backend

#### Índices en Base de Datos

```sql
-- Agregar índices para queries frecuentes
CREATE INDEX idx_visitas_usuaria ON visitas(usuaria_id);
CREATE INDEX idx_visitas_fecha ON visitas(fecha_visita);
CREATE INDEX idx_usuarias_comunidad ON usuarias(comunidad_id);
```

#### Query Optimization

```javascript
// ✅ BIEN - Query específico
db.get(
  'SELECT nombres, apellidos FROM usuarias WHERE id = ?',
  [id],
  callback
);

// ❌ MAL - SELECT *
db.get(
  'SELECT * FROM usuarias WHERE id = ?',
  [id],
  callback
);
```

#### Connection Pooling

```javascript
// Configurar SQLite para mejor rendimiento
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA synchronous = NORMAL");
db.run("PRAGMA cache_size = 10000");
```

---

## Deployment

### Checklist Pre-Deploy

```
Backend:
□ Actualizar JWT_SECRET en producción
□ Configurar CORS para dominio real
□ Habilitar HTTPS
□ Configurar PM2 para auto-restart
□ Configurar backups automáticos
□ Rate limiting estricto

Frontend:
□ Actualizar PRODUCTION_SUBDOMAIN en config.js
□ Minificar assets (opcional)
□ Verificar que todos los endpoints apunten correctamente
□ Probar en diferentes navegadores

General:
□ Backup de base de datos actual
□ Probar en staging primero
□ Documentar cambios en CHANGELOG
□ Notificar a usuarios de mantenimiento
```

### Deploy con PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
cd backend
pm2 start server.js --name sgpf-backend

# Ver logs
pm2 logs sgpf-backend

# Reiniciar
pm2 restart sgpf-backend

# Configurar inicio automático
pm2 startup
pm2 save
```

---

## Troubleshooting Común

### Error: "Cannot find module"

```bash
# Solución
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Database locked"

```javascript
// Solución: Habilitar WAL mode
db.run("PRAGMA journal_mode = WAL");
```

### Error: "CORS policy"

```javascript
// Verificar CORS en server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### Frontend muestra página en blanco

```bash
# 1. Abrir DevTools (F12)
# 2. Ver errores en Console
# 3. Verificar Network tab (archivos 404)
# 4. Verificar que backend esté corriendo
curl http://localhost:5000/api/health
```

---

## Contribuir al Proyecto

### Proceso de Contribución

1. **Fork** del repositorio
2. **Crear rama** de feature
3. **Hacer cambios** con commits descriptivos
4. **Testing** completo
5. **Pull Request** con descripción detallada

### Guía de PR

```markdown
## Descripción
Breve descripción del cambio

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Código sigue las convenciones del proyecto
- [ ] Comentarios agregados donde necesario
- [ ] Documentación actualizada
- [ ] Sin warnings en consola
- [ ] Testeado en desarrollo
- [ ] Testeado con diferentes roles
```

### Código de Conducta

- ✅ Respetar las convenciones de código
- ✅ Documentar cambios importantes
- ✅ Probar antes de hacer PR
- ✅ Ser constructivo en code reviews
- ❌ No hacer commits directos a main
- ❌ No subir credenciales o .env

---

## Recursos Adicionales

### Documentación Relacionada

- [README Principal](../README.md)
- [Seguridad del Sistema](SEGURIDAD.md)
- [Base de Datos](BASE_DATOS.md)
- [API Reference](API.md)
- [Manual de Instalación](INSTALACION.md)

### Enlaces Externos

- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comunidad

- **Issues:** [GitHub Issues]
- **Discussions:** [GitHub Discussions]
- **Email:** gdgl1105@gmail.com

---

## Glosario

| Término | Definición |
|---------|------------|
| **MEF** | Mujeres en Edad Fértil (15-49 años) |
| **SR** | Salud Reproductiva |
| **AQV** | Anticoncepción Quirúrgica Voluntaria |
| **MELA** | Método de Lactancia y Amenorrea |
| **JWT** | JSON Web Token |
| **CRUD** | Create, Read, Update, Delete |
| **API** | Application Programming Interface |
| **CORS** | Cross-Origin Resource Sharing |
| **CDN** | Content Delivery Network |

---

## Contacto

### Mantenedor Principal

**Ingeniero Gerbert David García Loaiza**  
Ingeniero en Sistemas de Información  
Universidad Mariano Gálvez de Guatemala

📧 **Email:** gdgl1105@gmail.com  
🏥 **Institución:** Centro de Salud El Calvario, Huehuetenango  
🎓 **Universidad:** Universidad Mariano Gálvez de Guatemala

### Para Reportar Bugs

1. Verificar que no sea un issue conocido
2. Crear issue en GitHub con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Versión del sistema

---

<div align="center">

**Guía para Desarrolladores - SGPF MSPAS**

*Construyendo tecnología para mejorar la salud reproductiva en Guatemala*

---

**© 2025 - Todos los derechos reservados**

</div>
