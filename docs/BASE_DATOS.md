# 🗄️ Documentación de Base de Datos - SGPF MSPAS

<div align="center">

![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)
![Version](https://img.shields.io/badge/version-2.0-green.svg)
![Tables](https://img.shields.io/badge/tables-18-orange.svg)

**Sistema de Gestión de Planificación Familiar**  
**Base de Datos Relacional SQLite**

</div>

---

## 📋 Índice

- [Visión General](#visión-general)
- [Diagrama de Entidad-Relación](#diagrama-de-entidad-relación)
- [Estructura de Tablas](#estructura-de-tablas)
  - [Geografía y Organización](#geografía-y-organización)
  - [Sistema de Usuarios](#sistema-de-usuarios)
  - [Usuarias y Visitas](#usuarias-y-visitas)
  - [Planificación y Metas](#planificación-y-metas)
- [Índices y Optimizaciones](#índices-y-optimizaciones)
- [Queries Comunes](#queries-comunes)
- [Migraciones y Versionamiento](#migraciones-y-versionamiento)
- [Backup y Restauración](#backup-y-restauración)

---

## Visión General

### Características de la Base de Datos

| Característica | Valor |
|----------------|-------|
| **Motor** | SQLite 3 |
| **Archivo** | `backend/database/sgpf_complete.db` |
| **Tablas** | 18 tablas principales |
| **Versión** | 2.0 (Sistema Individual) |
| **Tamaño Inicial** | ~200 KB |
| **Codificación** | UTF-8 |

### Arquitectura

```
📦 sgpf_complete.db
├── 📍 Geografía (5 tablas)
│   ├── departamentos
│   ├── municipios
│   ├── distritos_salud
│   ├── territorios (9)
│   └── comunidades (45)
│
├── 👥 Sistema de Usuarios (5 tablas)
│   ├── roles
│   ├── usuarios
│   ├── permisos_comunidad
│   ├── user_territorios
│   └── puestos_salud
│
├── 🏥 Usuarias y Visitas (2 tablas)
│   ├── usuarias (núcleo del sistema)
│   └── visitas (registros individuales)
│
├── 📊 Planificación (5 tablas)
│   ├── metodos_planificacion
│   ├── configuracion_metas_anuales
│   ├── proyecciones_comunidad
│   ├── metas_metodo_comunidad
│   └── planificacion_mensual
│
└── 📜 Histórico (1 tabla)
    └── registros_historicos
```

### Cambios Principales V2.0

**De Sistema Agregado a Sistema Individual:**

| V1.0 (Agregado) | V2.0 (Individual) |
|-----------------|-------------------|
| ❌ `registros_mensuales` | ✅ `usuarias` + `visitas` |
| Cantidad total por método | Registro de cada usuaria |
| Sin identificación personal | Con DPI y datos completos |
| Agregación mensual | Visitas individuales |

---

## Diagrama de Entidad-Relación

### Diagrama Simplificado

```
┌─────────────────┐
│  departamentos  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   municipios    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ distritos_salud │
└────────┬────────┘
         │
         ↓
┌─────────────────┐       ┌──────────────┐
│   territorios   │──────→│ puestos_salud│
└────────┬────────┘       └──────────────┘
         │
         ↓
┌─────────────────┐       ┌──────────────┐
│   comunidades   │←──────│   usuarios   │
└────────┬────────┘       └──────┬───────┘
         │                       │
         │                       ↓
         │              ┌──────────────────┐
         │              │ permisos_comunidad│
         │              └──────────────────┘
         ↓
┌─────────────────┐
│    usuarias     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐       ┌──────────────────────┐
│     visitas     │←──────│ metodos_planificacion│
└─────────────────┘       └──────────────────────┘
```

---

## Estructura de Tablas

### Geografía y Organización

#### 1. `departamentos`

Contiene los departamentos de Guatemala (actualmente solo Huehuetenango).

```sql
CREATE TABLE departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo_ine TEXT UNIQUE,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Datos iniciales:**
| id | nombre | codigo_ine |
|----|--------|------------|
| 1 | Huehuetenango | 13 |

---

#### 2. `municipios`

Municipios dentro de los departamentos.

```sql
CREATE TABLE municipios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo_ine TEXT UNIQUE,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);
```

**Datos iniciales:**
| id | nombre | codigo_ine | departamento_id |
|----|--------|------------|-----------------|
| 1 | Huehuetenango | 1301 | 1 |

---

#### 3. `distritos_salud`

Distritos de salud dentro de los municipios.

```sql
CREATE TABLE distritos_salud (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    municipio_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    direccion TEXT,
    telefono TEXT,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (municipio_id) REFERENCES municipios(id)
);
```

**Datos iniciales:**
| id | nombre | codigo | municipio_id |
|----|--------|--------|--------------|
| 1 | Centro de Salud - Huehuetenango | HUE-DS-01 | 1 |

---

#### 4. `territorios`

**9 territorios** que dividen el distrito de salud para mejor gestión.

```sql
CREATE TABLE territorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    distrito_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distrito_id) REFERENCES distritos_salud(id)
);
```

**Datos iniciales:**
| id | nombre | codigo |
|----|--------|--------|
| 1 | Territorio 1 | T1 |
| 2 | Territorio 2 | T2 |
| 3 | Territorio 3 | T3 |
| 4 | Territorio 4 | T4 |
| 5 | Territorio 5 | T5 |
| 6 | Territorio 6 | T6 |
| 7 | Territorio 7 | T7 |
| 8 | Territorio 8 | T8 |
| 9 | Territorio 9 - Quiché | T9 |

---

#### 5. `puestos_salud`

Establecimientos de salud dentro de los territorios.

```sql
CREATE TABLE puestos_salud (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    territorio_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN (
        'centro_salud', 
        'puesto_salud', 
        'centro_comunitario', 
        'sede_sector', 
        'sede_territorio'
    )) NOT NULL,
    codigo TEXT UNIQUE,
    direccion TEXT,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (territorio_id) REFERENCES territorios(id)
);
```

**Tipos de puestos:**
- `centro_salud` - Centro de Salud principal
- `puesto_salud` - Puesto de Salud comunitario
- `centro_comunitario` - Centro comunitario
- `sede_sector` - Sede de sector
- `sede_territorio` - Sede territorial

---

#### 6. `comunidades`

**45 comunidades** distribuidas en los 9 territorios.

```sql
CREATE TABLE comunidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    territorio_id INTEGER NOT NULL,
    puesto_salud_id INTEGER,
    nombre TEXT NOT NULL,
    codigo_comunidad TEXT UNIQUE,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    poblacion_total INTEGER DEFAULT 0,
    poblacion_mef INTEGER DEFAULT 0,        -- Mujeres en Edad Fértil
    acceso_vehicular BOOLEAN DEFAULT 1,
    distancia_km DECIMAL(6, 2),
    activa BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (territorio_id) REFERENCES territorios(id),
    FOREIGN KEY (puesto_salud_id) REFERENCES puestos_salud(id)
);
```

**Campos importantes:**
- `poblacion_mef` - **Crítico:** Base para cálculo de metas
- `codigo_comunidad` - Formato: `T1-001`, `T2-003`, etc.
- `latitud/longitud` - Para futuras implementaciones de mapas

**Ejemplos de comunidades:**

| territorio_id | nombre | codigo | poblacion_mef |
|---------------|--------|--------|---------------|
| 1 | Minerva | T1-001 | 1600 |
| 1 | Lo de Hernández | T1-002 | 1410 |
| 1 | El Eucalipto | T1-003 | 1700 |
| 2 | Carrizal I | T2-001 | 1050 |
| 3 | La Laguna Chinaca | T3-001 | 220 |
| ... | ... | ... | ... |

**Total:** 45 comunidades con población MEF conocida.

---

### Sistema de Usuarios

#### 7. `roles`

Define los 4 roles del sistema con sus permisos.

```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_rol TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    nivel_jerarquico INTEGER NOT NULL,      -- 1=Auxiliar, 4=Coordinador
    puede_registrar BOOLEAN DEFAULT 0,
    puede_validar BOOLEAN DEFAULT 0,
    puede_aprobar BOOLEAN DEFAULT 0,
    puede_generar_reportes BOOLEAN DEFAULT 0,
    puede_administrar BOOLEAN DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Roles del sistema:**

| codigo_rol | nombre | nivel | registrar | validar | aprobar | reportes | admin |
|------------|--------|-------|-----------|---------|---------|----------|-------|
| `auxiliar_enfermeria` | Auxiliar de Enfermería | 1 | ✅ | ❌ | ❌ | ❌ | ❌ |
| `asistente_tecnico` | Asistente Técnico | 2 | ✅ | ✅ | ❌ | ✅ | ❌ |
| `encargado_sr` | Encargado SR | 3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `coordinador_municipal` | Coordinador Municipal | 4 | ❌ | ❌ | ✅ | ✅ | ✅ |

---

#### 8. `usuarios`

Personal del sistema de salud con acceso a la plataforma.

```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_empleado TEXT UNIQUE,
    dpi TEXT UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    password_hash TEXT NOT NULL,            -- Bcrypt hash
    rol_id INTEGER NOT NULL,
    territorio_id INTEGER,                  -- Territorio principal
    distrito_id INTEGER,
    cargo TEXT,
    fecha_ingreso DATE,
    ultimo_acceso DATETIME,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado BOOLEAN DEFAULT 0,
    debe_cambiar_password BOOLEAN DEFAULT 1,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (territorio_id) REFERENCES territorios(id),
    FOREIGN KEY (distrito_id) REFERENCES distritos_salud(id)
);
```

**Usuarios de prueba:**

| codigo | email | rol | territorio |
|--------|-------|-----|------------|
| COORD001 | admin@mspas.gob.gt | Coordinador | NULL (todos) |
| ENC001 | encargado@mspas.gob.gt | Encargado SR | NULL (todos) |
| ASIST001 | asist01@mspas.gob.gt | Asistente | Territorio 1 |
| AUX001 | aux01@mspas.gob.gt | Auxiliar | Territorio 1 |

**Contraseña:** `123456` (todas hasheadas con bcrypt)

---

#### 9. `permisos_comunidad`

Asignación específica de comunidades a auxiliares.

```sql
CREATE TABLE permisos_comunidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    comunidad_id INTEGER NOT NULL,
    puede_ver BOOLEAN DEFAULT 1,
    puede_registrar BOOLEAN DEFAULT 0,
    puede_editar BOOLEAN DEFAULT 0,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (comunidad_id) REFERENCES comunidades(id),
    UNIQUE(usuario_id, comunidad_id)
);
```

**Uso:** Un auxiliar de enfermería solo puede registrar en las comunidades que le fueron asignadas explícitamente.

---

#### 10. `user_territorios`

Permite asignar múltiples territorios a un usuario (útil para asistentes).

```sql
CREATE TABLE user_territorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    territorio_id INTEGER NOT NULL,
    asignado_por INTEGER,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (territorio_id) REFERENCES territorios(id),
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
    UNIQUE(usuario_id, territorio_id)
);
```

**Ejemplo:** Un asistente puede supervisar Territorio 1 y Territorio 2.

---

### Usuarias y Visitas (⭐ NÚCLEO DEL SISTEMA V2.0)

#### 11. `usuarias`

**Tabla central del sistema individual.** Cada mujer que recibe planificación familiar.

```sql
CREATE TABLE usuarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dpi TEXT UNIQUE NOT NULL,               -- Documento único
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    comunidad_id INTEGER NOT NULL,
    fecha_nacimiento DATE,
    telefono TEXT,
    tipo_usuaria TEXT CHECK(tipo_usuaria IN (
        'nueva',        -- Primera vez
        'reconsulta',   -- Ya estuvo antes
        'activa'        -- Usa método regularmente
    )) DEFAULT 'nueva',
    fecha_primera_visita DATE NOT NULL,
    fecha_ultima_visita DATE,
    total_visitas INTEGER DEFAULT 1,
    activa BOOLEAN DEFAULT 1,
    observaciones TEXT,
    creada_por INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comunidad_id) REFERENCES comunidades(id),
    FOREIGN KEY (creada_por) REFERENCES usuarios(id)
);
```

**Tipos de usuaria:**
- `nueva` - Primera vez que recibe planificación familiar
- `reconsulta` - Ya recibió antes pero dejó de venir
- `activa` - Usa método anticonceptivo regularmente

**Flujo:**
```
Nueva → (recibe método) → Activa → (deja de venir) → Reconsulta
```

---

#### 12. `visitas`

**Registros individuales de cada visita.** Reemplaza el sistema agregado mensual.

```sql
CREATE TABLE visitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuaria_id INTEGER NOT NULL,
    metodo_id INTEGER NOT NULL,
    fecha_visita DATE NOT NULL,
    observaciones TEXT,
    estado TEXT DEFAULT 'registrado' CHECK(estado IN (
        'registrado',   -- Registrado por auxiliar
        'validado',     -- Aprobado por asistente
        'rechazado'     -- Rechazado por asistente
    )),
    registrado_por INTEGER NOT NULL,
    fecha_hora_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    validado_por INTEGER,
    fecha_hora_validacion DATETIME,
    observaciones_validacion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuaria_id) REFERENCES usuarias(id),
    FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion(id),
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
    FOREIGN KEY (validado_por) REFERENCES usuarios(id)
);
```

**Workflow de visita:**
```
1. Auxiliar registra visita → estado: 'registrado'
2. Asistente revisa → valida o rechaza
3. Si valida → estado: 'validado'
4. Si rechaza → estado: 'rechazado' + observaciones
```

---

### Planificación y Metas

#### 13. `metodos_planificacion`

**11 métodos anticonceptivos** disponibles.

```sql
CREATE TABLE metodos_planificacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_metodo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    nombre_corto TEXT,
    categoria TEXT NOT NULL,                -- hormonal, dispositivo, barrera, natural, definitivo
    tipo_administracion TEXT,               -- mensual, trimestral, permanente
    unidad_medida TEXT DEFAULT 'unidades',
    dias_efectividad INTEGER,
    requiere_seguimiento BOOLEAN DEFAULT 0,
    orden_visualizacion INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Métodos disponibles:**

| id | codigo | nombre | categoria | tipo |
|----|--------|--------|-----------|------|
| 1 | INY_MEN | Inyección Mensual | hormonal | mensual |
| 2 | INY_BIM | Inyección Bimensual | hormonal | bimensual |
| 3 | INY_TRI | Inyección Trimestral | hormonal | trimestral |
| 4 | PILDORA | Píldora Anticonceptiva | hormonal | mensual |
| 5 | DIU | Dispositivo Intrauterino | dispositivo | permanente |
| 6 | IMPLANTE | Implante Hormonal | dispositivo | permanente |
| 7 | CONDON_M | Condón Masculino | barrera | mensual |
| 8 | COLLAR | Collar del Ciclo | natural | permanente |
| 9 | MELA | MELA (Lactancia) | natural | mensual |
| 10 | AQV_FEM | AQV Femenina | definitivo | permanente |
| 11 | AQV_MAS | AQV Masculina | definitivo | permanente |

---

#### 14. `configuracion_metas_anuales`

Porcentajes objetivo para cada método a nivel departamental.

```sql
CREATE TABLE configuracion_metas_anuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    año INTEGER NOT NULL,
    metodo_id INTEGER NOT NULL,
    porcentaje_meta DECIMAL(5,2) NOT NULL,  -- % del total
    observaciones TEXT,
    fecha_aprobacion DATE,
    aprobado_por INTEGER,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id),
    UNIQUE(año, metodo_id)
);
```

**Metas 2025 (ejemplo):**

| metodo_id | nombre | porcentaje_meta |
|-----------|--------|-----------------|
| 3 | Inyección Trimestral | 45.0% |
| 4 | Píldora | 12.0% |
| 1 | Inyección Mensual | 10.0% |
| 2 | Inyección Bimensual | 10.0% |
| 6 | Implante | 8.0% |
| 7 | Condón | 6.0% |
| 9 | MELA | 5.5% |
| 5 | DIU | 2.0% |
| ... | ... | ... |

**Total:** 100%

---

#### 15. `proyecciones_comunidad`

Cálculo automático de usuarias esperadas por comunidad.

```sql
CREATE TABLE proyecciones_comunidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comunidad_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    poblacion_mef INTEGER NOT NULL,
    porcentaje_proyeccion REAL DEFAULT 0.35,    -- 35% de MEF
    ajuste_fijo INTEGER DEFAULT 70,
    proyeccion_anual INTEGER AS (
        CAST((poblacion_mef * porcentaje_proyeccion) - ajuste_fijo AS INTEGER)
    ) STORED,                                    -- Columna calculada
    unidades_sin_distribuir INTEGER DEFAULT 0,  -- Sobrante después de distribuir
    es_manual BOOLEAN DEFAULT 0,
    observaciones TEXT,
    fecha_configuracion DATETIME DEFAULT CURRENT_TIMESTAMP,
    configurado_por INTEGER,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (comunidad_id) REFERENCES comunidades(id),
    FOREIGN KEY (configurado_por) REFERENCES usuarios(id),
    UNIQUE(comunidad_id, año)
);
```

**Fórmula de proyección:**
```
Proyección Anual = (MEF × 35%) - 70

Ejemplo:
- Comunidad con 1000 MEF
- (1000 × 0.35) - 70 = 350 - 70 = 280 usuarias esperadas al año
```

---

#### 16. `metas_metodo_comunidad`

Distribución de la proyección anual por método y comunidad.

```sql
CREATE TABLE metas_metodo_comunidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proyeccion_id INTEGER NOT NULL,
    metodo_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    porcentaje_metodo DECIMAL(5,2) NOT NULL,
    proyeccion_anual_metodo INTEGER NOT NULL,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (proyeccion_id) REFERENCES proyecciones_comunidad(id),
    FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion(id),
    UNIQUE(proyeccion_id, metodo_id, año)
);
```

**Ejemplo:**
```
Comunidad: Minerva (1600 MEF)
Proyección: (1600 × 0.35) - 70 = 490 usuarias

Distribución por método:
- Inyección Trimestral (45%): 490 × 0.45 = 220 usuarias
- Píldora (12%): 490 × 0.12 = 59 usuarias
- Inyección Mensual (10%): 490 × 0.10 = 49 usuarias
...
```

---

#### 17. `planificacion_mensual`

División de metas anuales en metas mensuales (opcional, para coordinación).

```sql
CREATE TABLE planificacion_mensual (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meta_metodo_comunidad_id INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK(mes >= 1 AND mes <= 12),
    meta_mensual INTEGER DEFAULT 0,
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (meta_metodo_comunidad_id) REFERENCES metas_metodo_comunidad(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    UNIQUE(meta_metodo_comunidad_id, mes)
);
```

**Ejemplo:**
```
Meta anual Inyección Trimestral en Minerva: 220
Meta mensual: 220 / 12 = ~18 usuarias/mes
```

---

### Histórico

#### 18. `registros_historicos`

Mantiene datos del sistema V1.0 (agregado) para referencia histórica.

```sql
CREATE TABLE registros_historicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comunidad_id INTEGER NOT NULL,
    metodo_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    cantidad_administrada INTEGER NOT NULL DEFAULT 0,
    fecha_registro DATE NOT NULL,
    observaciones TEXT,
    estado TEXT DEFAULT 'registrado',
    registrado_por INTEGER NOT NULL,
    migrado_desde_v1 BOOLEAN DEFAULT 1,
    fecha_migracion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comunidad_id) REFERENCES comunidades(id),
    FOREIGN KEY (metodo_id) REFERENCES metodos_planificacion(id),
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);
```

**Uso:** Preserva datos antiguos si se migra desde el sistema V1.0.

---

## Índices y Optimizaciones

### Índices Recomendados

```sql
-- Índices en usuarias
CREATE INDEX idx_usuarias_dpi ON usuarias(dpi);
CREATE INDEX idx_usuarias_comunidad ON usuarias(comunidad_id);
CREATE INDEX idx_usuarias_tipo ON usuarias(tipo_usuaria);
CREATE INDEX idx_usuarias_activa ON usuarias(activa);

-- Índices en visitas
CREATE INDEX idx_visitas_usuaria ON visitas(usuaria_id);
CREATE INDEX idx_visitas_metodo ON visitas(metodo_id);
CREATE INDEX idx_visitas_fecha ON visitas(fecha_visita);
CREATE INDEX idx_visitas_estado ON visitas(estado);
CREATE INDEX idx_visitas_registrado_por ON visitas(registrado_por);

-- Índices en comunidades
CREATE INDEX idx_comunidades_territorio ON comunidades(territorio_id);
CREATE INDEX idx_comunidades_activa ON comunidades(activa);

-- Índices en usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_usuarios_territorio ON usuarios(territorio_id);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Índices en proyecciones
CREATE INDEX idx_proyecciones_comunidad_año ON proyecciones_comunidad(comunidad_id, año);
CREATE INDEX idx_proyecciones_año ON proyecciones_comunidad(año);

-- Índices en metas
CREATE INDEX idx_metas_metodo_proyeccion ON metas_metodo_comunidad(proyeccion_id);
CREATE INDEX idx_metas_metodo_año ON metas_metodo_comunidad(año);
```

### Configuración de SQLite

```javascript
// En Node.js al conectar
db.run("PRAGMA journal_mode = WAL");        // Write-Ahead Logging
db.run("PRAGMA synchronous = NORMAL");      // Balance rendimiento/seguridad
db.run("PRAGMA foreign_keys = ON");         // Habilitar llaves foráneas
db.run("PRAGMA temp_store = MEMORY");       // Usar RAM para temporales
```

---

## Queries Comunes

### 1. Total de Usuarias por Comunidad

```sql
SELECT 
    c.nombre AS comunidad,
    COUNT(u.id) AS total_usuarias,
    SUM(CASE WHEN u.tipo_usuaria = 'nueva' THEN 1 ELSE 0 END) AS nuevas,
    SUM(CASE WHEN u.tipo_usuaria = 'reconsulta' THEN 1 ELSE 0 END) AS reconsulta,
    SUM(CASE WHEN u.tipo_usuaria = 'activa' THEN 1 ELSE 0 END) AS activas
FROM usuarias u
JOIN comunidades c ON u.comunidad_id = c.id
WHERE u.activa = 1
GROUP BY c.id
ORDER BY total_usuarias DESC;
```

---

### 2. Visitas del Mes Actual

```sql
SELECT 
    u.nombres || ' ' || u.apellidos AS usuaria,
    m.nombre_corto AS metodo,
    v.fecha_visita,
    v.estado,
    us.nombres || ' ' || us.apellidos AS registrado_por
FROM visitas v
JOIN usuarias u ON v.usuaria_id = u.id
JOIN metodos_planificacion m ON v.metodo_id = m.id
JOIN usuarios us ON v.registrado_por = us.id
WHERE strftime('%Y-%m', v.fecha_visita) = strftime('%Y-%m', 'now')
ORDER BY v.fecha_visita DESC;
```

---

### 3. Cumplimiento de Metas por Comunidad

```sql
SELECT 
    c.nombre AS comunidad,
    m.nombre_corto AS metodo,
    mmc.proyeccion_anual_metodo AS meta_anual,
    COUNT(v.id) AS registrado,
    CAST(COUNT(v.id) * 100.0 / mmc.proyeccion_anual_metodo AS DECIMAL(5,2)) AS porcentaje_cumplimiento
FROM metas_metodo_comunidad mmc
JOIN proyecciones_comunidad pc ON mmc.proyeccion_id = pc.id
JOIN comunidades c ON pc.comunidad_id = c.id
JOIN metodos_planificacion m ON mmc.metodo_id = m.id
LEFT JOIN visitas v ON v.metodo_id = mmc.metodo_id 
    AND v.fecha_visita BETWEEN '2025-01-01' AND '2025-12-31'
    AND v.estado = 'validado'
WHERE mmc.año = 2025
GROUP BY c.id, m.id
ORDER BY c.nombre, porcentaje_cumplimiento DESC;
```

---

### 4. Usuarias sin Visitas Recientes

```sql
SELECT 
    u.dpi,
    u.nombres || ' ' || u.apellidos AS nombre_completo,
    c.nombre AS comunidad,
    u.fecha_ultima_visita,
    julianday('now') - julianday(u.fecha_ultima_visita) AS dias_sin_visita
FROM usuarias u
JOIN comunidades c ON u.comunidad_id = c.id
WHERE u.activa = 1
    AND u.tipo_usuaria = 'activa'
    AND u.fecha_ultima_visita < date('now', '-90 days')
ORDER BY dias_sin_visita DESC;
```

---

### 5. Estadísticas por Auxiliar

```sql
SELECT 
    us.nombres || ' ' || us.apellidos AS auxiliar,
    COUNT(DISTINCT v.usuaria_id) AS usuarias_atendidas,
    COUNT(v.id) AS total_visitas,
    COUNT(CASE WHEN v.estado = 'validado' THEN 1 END) AS visitas_validadas,
    COUNT(CASE WHEN v.estado = 'rechazado' THEN 1 END) AS visitas_rechazadas
FROM usuarios us
JOIN visitas v ON v.registrado_por = us.id
WHERE us.rol_id = (SELECT id FROM roles WHERE codigo_rol = 'auxiliar_enfermeria')
    AND strftime('%Y-%m', v.fecha_visita) = strftime('%Y-%m', 'now')
GROUP BY us.id
ORDER BY total_visitas DESC;
```

---

## Migraciones y Versionamiento

### Historial de Versiones

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| **1.0** | 2024 | Sistema agregado mensual |
| **2.0** | 2025 | Sistema individual (usuarias + visitas) |

### Migración V1.0 → V2.0

**No se pierde información histórica:**

```sql
-- Los registros del V1.0 se preservan en registros_historicos
INSERT INTO registros_historicos (
    comunidad_id, metodo_id, año, mes, 
    cantidad_administrada, fecha_registro, 
    registrado_por, migrado_desde_v1
)
SELECT 
    comunidad_id, metodo_id, año, mes,
    cantidad_administrada, fecha_registro,
    registrado_por, 1
FROM registros_mensuales_old;  -- Tabla antigua
```

---

## Backup y Restauración

### Crear Backup

```bash
# Desde la carpeta backend
npm run backup

# Con compresión
npm run backup:compress
```

### Restaurar Backup

```bash
# Copiar backup al directorio database
cp backups/sgpf_backup_20251021_143052.db database/sgpf_complete.db

# Reiniciar servidor
npm run dev
```

### Ver Backups Disponibles

```bash
npm run backup:list
```

---

## Estadísticas de la Base de Datos

### Tamaños Estimados

| Componente | Registros Iniciales | Crecimiento Anual Estimado |
|------------|---------------------|----------------------------|
| **usuarias** | 0 | ~5,000 nuevas |
| **visitas** | 0 | ~60,000 visitas |
| **comunidades** | 45 | Estable |
| **usuarios** | 4 | +10-20 usuarios |
| **proyecciones** | 45 | +45/año |
| **metas_metodo** | 495 | +495/año |

**Proyección de tamaño:**
- Año 1: ~50 MB
- Año 3: ~150 MB
- Año 5: ~250 MB

---

## Consideraciones de Rendimiento

### Límites de SQLite

| Métrica | Límite |
|---------|--------|
| Tamaño máximo de BD | 281 TB |
| Registros por tabla | 2^64 |
| Columnas por tabla | 2,000 |
| Tamaño de fila | 1 GB |
| Conexiones simultáneas | ~100 (modo WAL) |

**Para este proyecto:** SQLite es más que suficiente para 10+ años de datos.

---

## Contacto

**Para consultas sobre la estructura de la base de datos:**

**Ingeniero Gerbert David García Loaiza**  
📧 Email: gdgl1105@gmail.com  
🎓 Universidad Mariano Gálvez de Guatemala

---

<div align="center">

**Sistema de Gestión de Planificación Familiar - MSPAS**

*Base de datos diseñada para escalabilidad y rendimiento*

---

**© 2025 - Todos los derechos reservados**

</div>
