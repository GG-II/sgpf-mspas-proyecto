# 🔌 Documentación de API - SGPF MSPAS

<div align="center">

![REST API](https://img.shields.io/badge/API-REST-blue.svg)
![Express](https://img.shields.io/badge/Express-4.18-green.svg)
![Auth](https://img.shields.io/badge/Auth-JWT-orange.svg)

**API RESTful del Sistema de Gestión de Planificación Familiar**

</div>

---

## 📋 Índice

- [Introducción](#introducción)
- [Autenticación](#autenticación)
- [Endpoints de Autenticación](#endpoints-de-autenticación)
- [Endpoints de Usuarias](#endpoints-de-usuarias)
- [Endpoints de Visitas](#endpoints-de-visitas)
- [Endpoints de Validación](#endpoints-de-validación)
- [Endpoints de Dashboard](#endpoints-de-dashboard)
- [Endpoints de Reportes](#endpoints-de-reportes)
- [Endpoints de Planificación](#endpoints-de-planificación)
- [Endpoints de Administración](#endpoints-de-administración)
- [Endpoints de Perfil](#endpoints-de-perfil)
- [Endpoints de Backup](#endpoints-de-backup)
- [Códigos de Estado](#códigos-de-estado)
- [Manejo de Errores](#manejo-de-errores)

---

## Introducción

### URL Base

```
Desarrollo: http://localhost:5000/api
Producción: https://tu-dominio.cloud/api
```

### Formato de Respuesta

Todas las respuestas siguen este formato:

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { }
}
```

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer {token}
```

---

## Autenticación

### Sistema JWT

El sistema utiliza JSON Web Tokens (JWT) para autenticación.

**Flujo de autenticación:**

1. Usuario envía credenciales a `/auth/login`
2. Backend valida y retorna token JWT
3. Cliente incluye token en header `Authorization` en cada request
4. Token expira en 24 horas

**Estructura del Token:**

```javascript
{
  "id": 1,
  "email": "usuario@mspas.gob.gt",
  "rol": "auxiliar_enfermeria",
  "nivel": 1,
  "territorio_id": 1,
  "permisos": {
    "registrar": true,
    "validar": false,
    "aprobar": false,
    "reportes": false,
    "admin": false
  }
}
```

---

## Endpoints de Autenticación

### 1. Login

Autenticar usuario y obtener token.

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "aux01@mspas.gob.gt",
  "password": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": 4,
    "codigo": "AUX001",
    "email": "aux01@mspas.gob.gt",
    "nombres": "Ana Patricia",
    "apellidos": "López Morales",
    "rol": "auxiliar_enfermeria",
    "rol_nombre": "Auxiliar de Enfermería",
    "cargo": "Auxiliar de Enfermería",
    "territorio": "Territorio 1",
    "territorio_id": 1,
    "distrito": "Centro de Salud - Huehuetenango",
    "permisos": {
      "registrar": true,
      "validar": false,
      "aprobar": false,
      "reportes": false,
      "admin": false
    },
    "comunidades": [
      {
        "id": 1,
        "nombre": "Minerva",
        "codigo_comunidad": "T1-001"
      }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `400` - Campos faltantes
- `401` - Credenciales incorrectas
- `500` - Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aux01@mspas.gob.gt","password":"123456"}'
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'aux01@mspas.gob.gt',
    password: '123456'
  })
});

const data = await response.json();
console.log(data.token); // Guardar este token
```

---

### 2. Verificar Token

Verificar si un token es válido.

**Endpoint:** `GET /auth/verify`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Token válido",
  "user": {
    "id": 4,
    "email": "aux01@mspas.gob.gt",
    "rol": "auxiliar_enfermeria",
    "permisos": { }
  }
}
```

---

### 3. Renovar Token

Obtener un nuevo token antes de que expire.

**Endpoint:** `POST /auth/renew`

**Headers:**
```http
Authorization: Bearer {token_actual}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Logout

Cerrar sesión (invalida token en cliente).

**Endpoint:** `POST /auth/logout`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

## Endpoints de Usuarias

### 1. Buscar Usuaria por DPI

Buscar si una usuaria ya existe en el sistema.

**Endpoint:** `GET /usuarias/buscar/:dpi`

**Parámetros:**
- `dpi` (string, 13 dígitos) - DPI de la usuaria

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta - Usuaria encontrada (200):**
```json
{
  "success": true,
  "exists": true,
  "data": {
    "usuaria": {
      "id": 15,
      "dpi": "2801199501234",
      "nombres": "María",
      "apellidos": "González",
      "fecha_nacimiento": "1995-06-15",
      "telefono": "47891234",
      "tipo_usuaria": "activa",
      "fecha_primera_visita": "2024-01-10",
      "fecha_ultima_visita": "2025-10-15",
      "total_visitas": 8,
      "activa": 1,
      "comunidad_id": 1,
      "comunidad_nombre": "Minerva",
      "codigo_comunidad": "T1-001",
      "territorio_id": 1,
      "territorio_nombre": "Territorio 1",
      "creada_por": "Ana Patricia López Morales"
    },
    "historial_visitas": [
      {
        "id": 45,
        "fecha_visita": "2025-10-15",
        "metodo": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "observaciones": null,
        "estado": "validado",
        "registrado_por": "Ana Patricia López Morales"
      }
    ]
  }
}
```

**Respuesta - Usuaria NO encontrada (200):**
```json
{
  "success": true,
  "exists": false,
  "message": "Usuaria no encontrada. Puede registrarla como nueva."
}
```

**Ejemplo:**
```bash
curl -X GET http://localhost:5000/api/usuarias/buscar/2801199501234 \
  -H "Authorization: Bearer {token}"
```

---

### 2. Registrar Nueva Usuaria

Crear una nueva usuaria en el sistema.

**Endpoint:** `POST /usuarias`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "dpi": "2801199501234",
  "nombres": "María Luisa",
  "apellidos": "González Pérez",
  "comunidad_id": 1,
  "fecha_nacimiento": "1995-06-15",
  "telefono": "47891234"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Usuaria registrada exitosamente",
  "data": {
    "id": 25,
    "dpi": "2801199501234",
    "nombres": "María Luisa",
    "apellidos": "González Pérez",
    "tipo_usuaria": "nueva",
    "comunidad_id": 1,
    "comunidad_nombre": "Minerva",
    "total_visitas": 0,
    "fecha_primera_visita": "2025-10-21",
    "activa": 1
  }
}
```

**Errores:**
- `400` - Campos faltantes o DPI inválido
- `403` - Sin permisos para registrar en esa comunidad
- `409` - DPI ya existe

---

### 3. Listar Usuarias

Obtener lista de usuarias con filtros.

**Endpoint:** `GET /usuarias`

**Query Parameters:**
- `limit` (int, default: 20) - Cantidad de resultados
- `offset` (int, default: 0) - Paginación
- `comunidad_id` (int, opcional) - Filtrar por comunidad
- `tipo_usuaria` (string, opcional) - 'nueva', 'reconsulta', 'activa'
- `buscar` (string, opcional) - Buscar por nombre, apellido o DPI

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "usuarias": [
      {
        "id": 15,
        "dpi": "2801199501234",
        "nombres": "María",
        "apellidos": "González",
        "tipo_usuaria": "activa",
        "fecha_primera_visita": "2024-01-10",
        "fecha_ultima_visita": "2025-10-15",
        "total_visitas": 8,
        "comunidad_id": 1,
        "comunidad": "Minerva",
        "codigo_comunidad": "T1-001",
        "territorio_id": 1,
        "territorio": "Territorio 1"
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0,
    "comunidades_accesibles": 3
  }
}
```

**Ejemplo con filtros:**
```bash
curl -X GET "http://localhost:5000/api/usuarias?comunidad_id=1&tipo_usuaria=activa&limit=10" \
  -H "Authorization: Bearer {token}"
```

---

### 4. Obtener Usuaria Específica

Obtener detalles completos de una usuaria.

**Endpoint:** `GET /usuarias/:id`

**Parámetros:**
- `id` (int) - ID de la usuaria

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "usuaria": {
      "id": 15,
      "dpi": "2801199501234",
      "nombres": "María",
      "apellidos": "González",
      "fecha_nacimiento": "1995-06-15",
      "telefono": "47891234",
      "tipo_usuaria": "activa",
      "fecha_primera_visita": "2024-01-10",
      "fecha_ultima_visita": "2025-10-15",
      "total_visitas": 8,
      "activa": 1,
      "observaciones": null,
      "comunidad_id": 1,
      "comunidad_nombre": "Minerva",
      "codigo_comunidad": "T1-001",
      "territorio_id": 1,
      "territorio_nombre": "Territorio 1",
      "creada_por": "Ana Patricia López Morales",
      "created_at": "2024-01-10T14:30:00.000Z"
    },
    "historial_visitas": [
      {
        "id": 45,
        "fecha_visita": "2025-10-15",
        "observaciones": null,
        "estado": "validado",
        "metodo": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "categoria": "hormonal",
        "registrado_por": "Ana Patricia López Morales",
        "fecha_hora_registro": "2025-10-15T10:25:00.000Z"
      }
    ]
  }
}
```

---

## Endpoints de Visitas

### 1. Registrar Nueva Visita

Registrar una visita de planificación familiar.

**Endpoint:** `POST /visitas`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "usuaria_id": 15,
  "metodo_id": 3,
  "fecha_visita": "2025-10-21",
  "observaciones": "Paciente tolera bien el método"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Visita registrada exitosamente",
  "data": {
    "id": 127,
    "usuaria_id": 15,
    "metodo_id": 3,
    "fecha_visita": "2025-10-21",
    "tipo_usuaria_actualizado": "activa"
  }
}
```

**Errores:**
- `400` - Campos faltantes
- `403` - Sin permisos para registrar en esa comunidad
- `404` - Usuaria no encontrada

---

### 2. Listar Visitas

Obtener lista de visitas con filtros.

**Endpoint:** `GET /visitas`

**Query Parameters:**
- `limit` (int, default: 20)
- `offset` (int, default: 0)
- `comunidad_id` (int, opcional)
- `estado` (string, opcional) - 'registrado', 'validado', 'rechazado'
- `fecha_desde` (date, opcional) - Formato: YYYY-MM-DD
- `fecha_hasta` (date, opcional)

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "visitas": [
      {
        "id": 127,
        "fecha_visita": "2025-10-21",
        "observaciones": "Paciente tolera bien el método",
        "estado": "registrado",
        "fecha_hora_registro": "2025-10-21T14:30:00.000Z",
        "usuaria_nombre": "María González",
        "usuaria_dpi": "2801199501234",
        "tipo_usuaria": "activa",
        "metodo": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "categoria": "hormonal",
        "comunidad": "Minerva",
        "codigo_comunidad": "T1-001",
        "territorio": "Territorio 1",
        "registrado_por": "Ana Patricia López Morales"
      }
    ],
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3. Obtener Visita Específica

**Endpoint:** `GET /visitas/:id`

**Parámetros:**
- `id` (int) - ID de la visita

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": 127,
    "usuaria_id": 15,
    "metodo_id": 3,
    "fecha_visita": "2025-10-21",
    "observaciones": "Paciente tolera bien el método",
    "estado": "registrado",
    "registrado_por": 4,
    "fecha_hora_registro": "2025-10-21T14:30:00.000Z",
    "validado_por": null,
    "fecha_hora_validacion": null,
    "observaciones_validacion": null,
    "usuaria_dpi": "2801199501234",
    "usuaria_nombre": "María González",
    "tipo_usuaria": "activa",
    "metodo": "Inyección Trimestral",
    "metodo_corto": "Iny. Trimestral",
    "categoria": "hormonal",
    "comunidad": "Minerva",
    "codigo_comunidad": "T1-001",
    "territorio": "Territorio 1",
    "registrado_por_nombre": "Ana Patricia López Morales",
    "validado_por_nombre": null
  }
}
```

---

### 4. Obtener Visitas de una Usuaria

**Endpoint:** `GET /visitas/usuaria/:usuaria_id`

**Parámetros:**
- `usuaria_id` (int) - ID de la usuaria

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "usuaria_id": 15,
    "visitas": [
      {
        "id": 127,
        "fecha_visita": "2025-10-21",
        "observaciones": "Paciente tolera bien el método",
        "estado": "validado",
        "metodo": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "categoria": "hormonal",
        "registrado_por": "Ana Patricia López Morales",
        "fecha_hora_registro": "2025-10-21T14:30:00.000Z"
      }
    ],
    "total": 8
  }
}
```

---

### 5. Actualizar Visita

Actualizar observaciones de una visita (solo si está en estado 'registrado').

**Endpoint:** `PUT /visitas/:id`

**Parámetros:**
- `id` (int) - ID de la visita

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "observaciones": "Paciente refiere leve dolor de cabeza"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Visita actualizada exitosamente",
  "data": {
    "id": 127,
    "observaciones": "Paciente refiere leve dolor de cabeza"
  }
}
```

**Errores:**
- `400` - No se puede editar (ya fue validada)
- `403` - Solo puedes editar tus propias visitas
- `404` - Visita no encontrada

---

### 6. Validar Visita

Cambiar estado de visita a 'validado' (solo para asistentes/encargados).

**Endpoint:** `PATCH /visitas/:id/validar`

**Parámetros:**
- `id` (int) - ID de la visita

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "observaciones_validacion": "Registro correcto"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Visita validada exitosamente",
  "data": {
    "id": 127,
    "estado": "validado"
  }
}
```

---

### 7. Estadísticas de Visitas

Obtener estadísticas generales de visitas.

**Endpoint:** `GET /visitas/stats/general`

**Query Parameters:**
- `year` (int, default: año actual)
- `mes` (int, opcional, 1-12)

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "year": 2025,
      "mes": 10
    },
    "resumen": {
      "total_visitas": 345,
      "total_usuarias_atendidas": 156,
      "comunidades_con_actividad": 12,
      "visitas_pendientes": 23,
      "visitas_validadas": 322
    },
    "por_metodo": [
      {
        "metodo": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "total_visitas": 156
      },
      {
        "metodo": "Píldora Anticonceptiva",
        "metodo_corto": "Píldora",
        "total_visitas": 78
      }
    ]
  }
}
```

---

## Endpoints de Validación

### 1. Obtener Visitas Pendientes

Obtener lista de visitas que requieren validación.

**Endpoint:** `GET /validacion-visitas/pendientes`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "registros_pendientes": [
      {
        "id": 127,
        "metodo": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "comunidad": "Minerva",
        "codigo_comunidad": "T1-001",
        "territorio": "Territorio 1",
        "registrado_por": "Ana Patricia López Morales",
        "cargo_registrador": "Auxiliar de Enfermería",
        "cantidad_administrada": 1,
        "fecha_hora_registro": "2025-10-21T14:30:00.000Z",
        "usuaria_nombre": "María González",
        "tipo_usuaria": "activa",
        "estado": "registrado"
      }
    ],
    "resumen": {
      "total_pendientes": 23,
      "comunidades_unicas": 8,
      "territorios_unicos": 3
    }
  }
}
```

---

### 2. Validar/Aprobar Registro

Validar una visita pendiente.

**Endpoint:** `PUT /validacion-visitas/registro/:id`

**Parámetros:**
- `id` (int) - ID de la visita

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "accion": "aprobar",
  "observaciones_validacion": "Registro correcto, datos verificados"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Registro validado exitosamente",
  "data": {
    "id": 127,
    "estado": "validado"
  }
}
```

---

### 3. Eliminar Visita

Eliminar una visita (solo validadores y admins).

**Endpoint:** `DELETE /validacion-visitas/registro/:id`

**Parámetros:**
- `id` (int) - ID de la visita

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Visita eliminada permanentemente"
}
```

---

## Endpoints de Dashboard

### 1. Dashboard Auxiliar - Stats Mes Actual

Obtener estadísticas del mes actual para auxiliares.

**Endpoint:** `GET /dashboard-auxiliar/stats/mes-actual`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "year": 2025,
      "mes": 10,
      "primer_dia": "2025-10-01",
      "ultimo_dia": "2025-10-31",
      "descripcion": "Octubre 2025"
    },
    "usuarias_nuevas": 12,
    "usuarias_reconsulta": 8,
    "usuarias_activas": 45,
    "total_usuarias_unicas": 65,
    "total_visitas": 78,
    "visitas_pendientes": 5,
    "visitas_validadas": 73
  }
}
```

---

### 2. Últimas Visitas del Auxiliar

**Endpoint:** `GET /dashboard-auxiliar/ultimas-visitas`

**Query Parameters:**
- `limit` (int, default: 5) - Cantidad de visitas a mostrar

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "visitas": [
      {
        "id": 127,
        "fecha_visita": "2025-10-21",
        "observaciones": null,
        "estado": "validado",
        "fecha_hora_registro": "2025-10-21T14:30:00.000Z",
        "usuaria_id": 15,
        "usuaria_nombres": "María",
        "usuaria_apellidos": "González",
        "tipo_usuaria": "activa",
        "metodo_nombre": "Inyección Trimestral",
        "metodo_corto": "Iny. Trimestral",
        "comunidad_nombre": "Minerva"
      }
    ],
    "total": 5
  }
}
```

---

### 3. Comunidades Asignadas

Obtener todas las comunidades asignadas al auxiliar.

**Endpoint:** `GET /dashboard-auxiliar/mis-comunidades`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "comunidades": [
      {
        "id": 1,
        "nombre": "Minerva",
        "codigo_comunidad": "T1-001",
        "poblacion_mef": 1600,
        "poblacion_total": 6720,
        "distancia_km": 5.2,
        "acceso_vehicular": 1,
        "territorio_nombre": "Territorio 1",
        "territorio_codigo": "T1"
      }
    ],
    "total": 3
  }
}
```

---

### 4. Estadísticas Generales

Obtener estadísticas generales del año.

**Endpoint:** `GET /dashboard/estadisticas/:year`

**Parámetros:**
- `year` (int) - Año de consulta

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "año": 2025,
    "total_usuarias": 1847,
    "meta_anual": 2100,
    "porcentaje_cumplimiento": 87.95,
    "total_registros": 2456,
    "registros_pendientes": 34,
    "por_estado": {
      "pendiente": 34,
      "validado": 2145,
      "aprobado": 277
    },
    "por_mes": [
      {
        "mes": 1,
        "usuarias": 145,
        "meta": 175,
        "comunidades": 35
      }
    ],
    "comunidades_activas": 38,
    "ultima_actualizacion": "2025-10-21T20:15:00.000Z"
  }
}
```

---

## Endpoints de Reportes

### 1. Proyección General

Obtener proyección general de todos los métodos por territorio.

**Endpoint:** `GET /reportes/proyeccion-general/:year`

**Parámetros:**
- `year` (int) - Año de consulta

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "año": 2025,
  "data": [
    {
      "territorio_id": 1,
      "territorio": "Territorio 1",
      "codigo_territorio": "T1",
      "mef_total": 6960,
      "proyeccion_anual_total": 2366,
      "metodos": {
        "Inyección Mensual": 237,
        "Inyección Bimensual": 237,
        "Inyección Trimestral": 1065,
        "Píldora Anticonceptiva": 284,
        "DIU": 47,
        "Implante Hormonal Subdérmico": 189
      }
    }
  ],
  "generado_por": "admin@mspas.gob.gt",
  "fecha_generacion": "2025-10-21T20:15:00.000Z"
}
```

---

### 2. Proyección por Método

Obtener desglose mensual de un método específico por territorio.

**Endpoint:** `GET /reportes/proyeccion-metodo/:year/:metodoId`

**Parámetros:**
- `year` (int) - Año
- `metodoId` (int) - ID del método

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "año": 2025,
  "metodo": {
    "id": 3,
    "nombre": "Inyección Trimestral",
    "nombre_corto": "Iny. Trimestral",
    "categoria": "hormonal"
  },
  "data": [
    {
      "territorio_id": 1,
      "territorio": "Territorio 1",
      "codigo": "T1",
      "mef_total": 6960,
      "proyeccion_anual": 1065,
      "proyectado_mensual": [89, 89, 89, 89, 89, 89, 89, 89, 89, 89, 89, 86],
      "ejecutado_mensual": [95, 87, 92, 85, 0, 0, 0, 0, 0, 0, 0, 0],
      "total_proyectado": 1065,
      "total_ejecutado": 359,
      "porcentaje_alcanzado": 33.7
    }
  ],
  "generado_por": "admin@mspas.gob.gt",
  "fecha_generacion": "2025-10-21T20:15:00.000Z"
}
```

---

### 3. Proyección por Territorio

Obtener desglose de todos los métodos para un territorio específico.

**Endpoint:** `GET /reportes/proyeccion-territorio/:year/:territorioId`

**Parámetros:**
- `year` (int) - Año
- `territorioId` (int) - ID del territorio

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "año": 2025,
  "territorio": {
    "id": 1,
    "nombre": "Territorio 1",
    "codigo": "T1"
  },
  "data": [
    {
      "metodo_id": 3,
      "metodo_nombre": "Inyección Trimestral",
      "nombre_corto": "Iny. Trimestral",
      "categoria": "hormonal",
      "mef_total": 6960,
      "proyeccion_anual": 1065,
      "proyectado_mensual": [89, 89, 89, 89, 89, 89, 89, 89, 89, 89, 89, 86],
      "ejecutado_mensual": [95, 87, 92, 85, 0, 0, 0, 0, 0, 0, 0, 0],
      "total_proyectado": 1065,
      "total_ejecutado": 359,
      "porcentaje_alcanzado": 33.7
    }
  ],
  "generado_por": "admin@mspas.gob.gt",
  "fecha_generacion": "2025-10-21T20:15:00.000Z"
}
```

---

### 4. Listado de Usuarias

Obtener listado completo de usuarias activas.

**Endpoint:** `GET /reportes/usuarias/listado`

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "dpi": "2801199501234",
      "nombres": "María",
      "apellidos": "González",
      "tipo_usuaria": "activa",
      "fecha_nacimiento": "1995-06-15",
      "telefono": "47891234",
      "activa": 1,
      "comunidad": "Minerva",
      "territorio": "Territorio 1",
      "fecha_primera_visita": "2024-01-10",
      "fecha_ultima_visita": "2025-10-21",
      "total_visitas": 9,
      "total_registros": 9
    }
  ],
  "total": 456,
  "generado_por": "admin@mspas.gob.gt",
  "fecha_generacion": "2025-10-21T20:15:00.000Z"
}
```

---

### 5. Ficha Individual de Usuaria

Obtener ficha completa con historial de una usuaria.

**Endpoint:** `GET /reportes/usuaria/:id`

**Parámetros:**
- `id` (int) - ID de la usuaria

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "usuaria": {
      "id": 15,
      "dpi": "2801199501234",
      "nombres": "María",
      "apellidos": "González",
      "fecha_nacimiento": "1995-06-15",
      "telefono": "47891234",
      "tipo_usuaria": "activa",
      "fecha_primera_visita": "2024-01-10",
      "fecha_ultima_visita": "2025-10-21",
      "total_visitas": 9,
      "activa": 1,
      "comunidad": "Minerva",
      "codigo_comunidad": "T1-001",
      "territorio": "Territorio 1",
      "codigo_territorio": "T1",
      "registrado_por_nombre": "Ana Patricia",
      "registrado_por_apellido": "López Morales"
    },
    "historial_visitas": [
      {
        "id": 127,
        "fecha_visita": "2025-10-21",
        "observaciones": null,
        "estado": "validado",
        "metodo": "Inyección Trimestral",
        "categoria": "hormonal",
        "registrado_por_nombre": "Ana Patricia",
        "registrado_por_apellido": "López Morales",
        "validado_por_nombre": "Rosa María",
        "validado_por_apellido": "Hernández Cruz",
        "fecha_hora_validacion": "2025-10-21T16:45:00.000Z"
      }
    ],
    "metodos_utilizados": [
      {
        "metodo": "Inyección Trimestral",
        "categoria": "hormonal",
        "veces_usado": 8,
        "ultima_vez": "2025-10-21"
      },
      {
        "metodo": "Píldora Anticonceptiva",
        "categoria": "hormonal",
        "veces_usado": 1,
        "ultima_vez": "2024-02-15"
      }
    ],
    "resumen": {
      "total_visitas": 9,
      "metodos_diferentes": 2,
      "primera_visita": "2024-01-10",
      "ultima_visita": "2025-10-21"
    }
  },
  "generado_por": "admin@mspas.gob.gt",
  "fecha_generacion": "2025-10-21T20:15:00.000Z"
}
```

---

### 6. Consultas Rápidas (KPIs)

Obtener KPIs y porcentajes de cumplimiento.

**Endpoint:** `GET /reportes/consultas-rapidas/:year`

**Parámetros:**
- `year` (int) - Año

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "año": 2025,
  "data": {
    "cumplimiento_general": {
      "proyeccion": 10500,
      "ejecutado": 3847,
      "porcentaje": 36.6
    },
    "por_territorio": [
      {
        "id": 1,
        "territorio": "Territorio 1",
        "proyeccion": 2366,
        "ejecutado": 856,
        "porcentaje": 36.2
      }
    ],
    "por_metodo": [
      {
        "id": 3,
        "metodo": "Inyección Trimestral",
        "nombre_corto": "Iny. Trimestral",
        "categoria": "hormonal",
        "proyeccion": 4725,
        "ejecutado": 1734,
        "porcentaje": 36.7
      }
    ]
  },
  "generado_por": "admin@mspas.gob.gt",
  "fecha_generacion": "2025-10-21T20:15:00.000Z"
}
```

---

### 7. Lista de Métodos (Helper)

Obtener lista de métodos disponibles.

**Endpoint:** `GET /reportes/metodos`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Inyección Mensual",
      "nombre_corto": "Iny. Mensual",
      "categoria": "hormonal"
    },
    {
      "id": 3,
      "nombre": "Inyección Trimestral",
      "nombre_corto": "Iny. Trimestral",
      "categoria": "hormonal"
    }
  ]
}
```

---

### 8. Lista de Territorios (Helper)

Obtener lista de territorios disponibles.

**Endpoint:** `GET /reportes/territorios`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Territorio 1",
      "codigo": "T1"
    },
    {
      "id": 2,
      "nombre": "Territorio 2",
      "codigo": "T2"
    }
  ]
}
```

---

## Endpoints de Planificación

### 1. Obtener Años Disponibles

Listar años con configuración de metas.

**Endpoint:** `GET /planificacion/anios`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [2025, 2024, 2023],
  "anio_actual": 2025
}
```

---

### 2. Obtener Porcentajes Globales

Obtener configuración de porcentajes por método para un año.

**Endpoint:** `GET /planificacion/porcentajes/:anio`

**Parámetros:**
- `anio` (int) - Año

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 23,
      "año": 2025,
      "metodo_id": 3,
      "metodo_nombre": "Inyección Trimestral",
      "codigo_metodo": "INY_TRI",
      "categoria": "hormonal",
      "porcentaje_meta": 45.0,
      "observaciones": null,
      "fecha_aprobacion": "2025-01-01",
      "activo": 1
    }
  ],
  "suma_total": 100.0,
  "suma_valida": true
}
```

---

### 3. Actualizar Porcentajes

Actualizar porcentajes de metas anuales.

**Endpoint:** `PUT /planificacion/porcentajes/:anio`

**Parámetros:**
- `anio` (int) - Año

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "porcentajes": [
    {
      "metodo_id": 1,
      "porcentaje_meta": 10.0
    },
    {
      "metodo_id": 3,
      "porcentaje_meta": 45.0
    }
  ]
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Porcentajes actualizados exitosamente",
  "porcentajes_actualizados": 11,
  "proyecciones_recalculadas": 45,
  "advertencia": "Las distribuciones mensuales pueden requerir ajustes"
}
```

**Errores:**
- `400` - Suma de porcentajes no es 100%
- `403` - Sin permisos
- `500` - Error del servidor

---

### 4. Avance por Territorio

Obtener avance de cumplimiento de metas por territorio.

**Endpoint:** `GET /planificacion/avance/:territorio_id/:anio`

**Parámetros:**
- `territorio_id` (int) - ID del territorio
- `anio` (int) - Año

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "territorio": {
    "id": 1,
    "nombre": "Territorio 1",
    "codigo": "T1"
  },
  "anio": 2025,
  "comunidades": [
    {
      "comunidad_id": 1,
      "comunidad_nombre": "Minerva",
      "codigo_comunidad": "T1-001",
      "mef": 1600,
      "meta_anual": 490,
      "ejecutado": 178,
      "porcentaje_alcanzado": 36.3,
      "estado": "danger"
    }
  ]
}
```

---

### 5. Detalle de Comunidad

Obtener metas detalladas por método de una comunidad.

**Endpoint:** `GET /planificacion/comunidad/:id/:anio`

**Parámetros:**
- `id` (int) - ID de la comunidad
- `anio` (int) - Año

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "metodo_id": 3,
      "metodo_nombre": "Inyección Trimestral",
      "metodo_corto": "Iny. Trimestral",
      "categoria": "hormonal",
      "porcentaje_global": 45.0,
      "meta_id": 156,
      "meta_anual": 220,
      "meses": [18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19],
      "suma_meses": 220,
      "distribucion_valida": true,
      "ejecutado": 82,
      "porcentaje_alcanzado": 37.3,
      "estado": "danger"
    }
  ],
  "proyeccion": {
    "total": 490,
    "distribuida": 490,
    "sin_distribuir": 0,
    "es_manual": false
  }
}
```

---

### 6. Guardar Distribución Mensual

Guardar o actualizar la distribución mensual de una meta.

**Endpoint:** `PUT /planificacion/distribucion/:meta_id`

**Parámetros:**
- `meta_id` (int) - ID de la meta método comunidad

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "meses": [18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19]
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Distribución mensual guardada exitosamente",
  "meses": [18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19],
  "suma_total": 220
}
```

**Errores:**
- `400` - Suma mensual no coincide con meta anual
- `403` - Sin permisos
- `404` - Meta no encontrada

---

### 7. Inicializar Año

Crear configuración de metas para un nuevo año.

**Endpoint:** `POST /planificacion/inicializar/:anio`

**Parámetros:**
- `anio` (int) - Año a inicializar

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body (opcional):**
```json
{
  "copiar_desde": 2024
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Año 2025 creado copiando desde 2024",
  "metas_copiadas": 11,
  "proyecciones_creadas": 45
}
```

---

## Endpoints de Administración

### 1. Listar Usuarios

Obtener lista de todos los usuarios del sistema.

**Endpoint:** `GET /admin/usuarios`

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "codigo_empleado": "AUX001",
      "dpi": "1801199101010",
      "nombres": "Ana Patricia",
      "apellidos": "López Morales",
      "email": "aux01@mspas.gob.gt",
      "telefono": "78910123",
      "cargo": "Auxiliar de Enfermería",
      "fecha_ingreso": "2025-01-01",
      "activo": 1,
      "bloqueado": 0,
      "codigo_rol": "auxiliar_enfermeria",
      "rol_nombre": "Auxiliar de Enfermería",
      "territorio_nombre": "Territorio 1",
      "distrito_nombre": "Centro de Salud - Huehuetenango"
    }
  ]
}
```

---

### 2. Crear Usuario

Crear un nuevo usuario del sistema.

**Endpoint:** `POST /admin/usuarios`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "codigo_empleado": "AUX005",
  "dpi": "1801199505050",
  "nombres": "Laura",
  "apellidos": "Martínez",
  "email": "laura.martinez@mspas.gob.gt",
  "telefono": "78915678",
  "password": "temporal123",
  "rol_codigo": "auxiliar_enfermeria",
  "cargo": "Auxiliar de Enfermería",
  "territorio_id": 2,
  "distrito_id": 1
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 12,
    "nombres": "Laura",
    "apellidos": "Martínez",
    "email": "laura.martinez@mspas.gob.gt",
    "rol": "auxiliar_enfermeria"
  }
}
```

**Errores:**
- `400` - Campos faltantes o email/DPI duplicado
- `403` - Sin permisos

---

### 3. Obtener Roles

Lista de roles disponibles en el sistema.

**Endpoint:** `GET /admin/roles`

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "codigo_rol": "coordinador_municipal",
      "nombre": "Coordinador Municipal",
      "descripcion": "Personal ejecutivo - vista estratégica",
      "nivel_jerarquico": 4,
      "puede_registrar": 0,
      "puede_validar": 0,
      "puede_aprobar": 1,
      "puede_generar_reportes": 1,
      "puede_administrar": 1
    },
    {
      "codigo_rol": "auxiliar_enfermeria",
      "nombre": "Auxiliar de Enfermería",
      "descripcion": "Personal de campo - registro directo",
      "nivel_jerarquico": 1,
      "puede_registrar": 1,
      "puede_validar": 0,
      "puede_aprobar": 0,
      "puede_generar_reportes": 0,
      "puede_administrar": 0
    }
  ]
}
```

---

### 4. Obtener Territorios

Lista de territorios disponibles.

**Endpoint:** `GET /admin/territorios`

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Territorio 1",
      "codigo": "T1",
      "descripcion": "Territorio 1",
      "distrito_nombre": "Centro de Salud - Huehuetenango"
    }
  ]
}
```

---

### 5. Listar Comunidades

Obtener todas las comunidades del sistema.

**Endpoint:** `GET /admin/comunidades`

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Minerva",
      "codigo_comunidad": "T1-001",
      "poblacion_total": 6720,
      "poblacion_mef": 1600,
      "distancia_km": 5.2,
      "acceso_vehicular": 1,
      "activa": 1,
      "territorio_nombre": "Territorio 1",
      "territorio_codigo": "T1",
      "distrito_nombre": "Centro de Salud - Huehuetenango"
    }
  ]
}
```

---

### 6. Actualizar Usuario

Modificar datos de un usuario existente.

**Endpoint:** `PUT /admin/usuarios/:id`

**Parámetros:**
- `id` (int) - ID del usuario

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "nombres": "Ana Patricia",
  "apellidos": "López Morales",
  "telefono": "78910123",
  "cargo": "Auxiliar de Enfermería Senior",
  "activo": 1,
  "bloqueado": 0
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 4,
    "nombres": "Ana Patricia",
    "apellidos": "López Morales",
    "activo": 1,
    "bloqueado": 0
  }
}
```

---

### 7. Cambiar Estado de Usuario

Activar o desactivar un usuario.

**Endpoint:** `PUT /admin/usuarios/:id/estado`

**Parámetros:**
- `id` (int) - ID del usuario

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "activo": false
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Usuario desactivado exitosamente",
  "data": {
    "id": 4,
    "activo": false,
    "modificado_por": "admin@mspas.gob.gt"
  }
}
```

---

### 8. Restablecer Contraseña

Resetear la contraseña de un usuario.

**Endpoint:** `PUT /admin/usuarios/:id/reset-password`

**Parámetros:**
- `id` (int) - ID del usuario

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "nueva_password": "temporal2025"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente",
  "data": {
    "id": 4,
    "usuario": "Ana Patricia López Morales",
    "email": "aux01@mspas.gob.gt",
    "debe_cambiar_password": true,
    "modificado_por": "admin@mspas.gob.gt"
  }
}
```

---

### 9. Asignar Comunidades a Usuario

Asignar comunidades específicas a un auxiliar.

**Endpoint:** `POST /admin/usuarios/:id/comunidades`

**Parámetros:**
- `id` (int) - ID del usuario

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "comunidades_ids": [1, 2, 3]
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "3 comunidades asignadas exitosamente",
  "data": {
    "usuario_id": 4,
    "usuario_nombre": "Ana Patricia López Morales",
    "comunidades_asignadas": 3
  }
}
```

---

### 10. Ver Comunidades de Usuario

Obtener comunidades asignadas a un usuario.

**Endpoint:** `GET /admin/usuarios/:id/comunidades`

**Parámetros:**
- `id` (int) - ID del usuario

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores y encargados

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "usuario_id": 4,
    "comunidades_asignadas": [
      {
        "id": 1,
        "nombre": "Minerva",
        "codigo_comunidad": "T1-001",
        "poblacion_mef": 1600,
        "territorio": "Territorio 1",
        "puede_registrar": 1,
        "activo": 1
      }
    ],
    "total_comunidades": 3
  }
}
```

---

### 11. Asignar Territorios a Usuario

Asignar múltiples territorios a un asistente técnico.

**Endpoint:** `POST /admin/usuarios/:id/territorios`

**Parámetros:**
- `id` (int) - ID del usuario

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores y encargados

**Body:**
```json
{
  "territorios_ids": [1, 2, 3]
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "3 territorio(s) asignado(s) exitosamente",
  "data": {
    "usuario_id": 3,
    "usuario_nombre": "Lic. Ana Patricia Ramírez López",
    "territorios_asignados": 3
  }
}
```

---

## Endpoints de Perfil

### 1. Ver Mi Perfil

Obtener información del usuario autenticado.

**Endpoint:** `GET /perfil`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "codigo_empleado": "AUX001",
    "dpi": "1801199101010",
    "nombres": "Ana Patricia",
    "apellidos": "López Morales",
    "email": "aux01@mspas.gob.gt",
    "telefono": "78910123",
    "cargo": "Auxiliar de Enfermería",
    "fecha_ingreso": "2025-01-01",
    "ultimo_acceso": "2025-10-21T14:30:00.000Z",
    "codigo_rol": "auxiliar_enfermeria",
    "rol_nombre": "Auxiliar de Enfermería",
    "rol_descripcion": "Personal de campo - registro directo",
    "territorio_nombre": "Territorio 1",
    "territorio_codigo": "T1",
    "distrito_nombre": "Centro de Salud - Huehuetenango",
    "permisos": {
      "registrar": true,
      "validar": false,
      "aprobar": false,
      "reportes": false,
      "admin": false
    },
    "comunidades_asignadas": [
      {
        "id": 1,
        "nombre": "Minerva",
        "codigo_comunidad": "T1-001",
        "poblacion_mef": 1600
      }
    ]
  }
}
```

---

### 2. Actualizar Mi Perfil

Actualizar información personal del usuario.

**Endpoint:** `PUT /perfil`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nombres": "Ana Patricia",
  "apellidos": "López Morales",
  "telefono": "78910999"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "nombres": "Ana Patricia",
    "apellidos": "López Morales",
    "telefono": "78910999"
  }
}
```

---

### 3. Cambiar Mi Contraseña

Cambiar la contraseña del usuario autenticado.

**Endpoint:** `PUT /perfil/password`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "password_actual": "123456",
  "password_nueva": "nueva_segura_2025",
  "confirmar_password": "nueva_segura_2025"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Errores:**
- `400` - Contraseña actual incorrecta o nueva contraseña no coincide
- `401` - Token inválido

---

### 4. Mis Estadísticas Personales

Obtener estadísticas de registros propios.

**Endpoint:** `GET /perfil/estadisticas`

**Query Parameters:**
- `year` (int, opcional, default: año actual)

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "año": 2025,
    "resumen": {
      "total_registros": 234,
      "total_usuarias": 456,
      "comunidades_registradas": 3,
      "meses_activos": 10,
      "primer_registro": "2025-01-15T10:30:00.000Z",
      "ultimo_registro": "2025-10-21T14:30:00.000Z"
    },
    "por_estado": {
      "pendientes": 5,
      "validados": 215,
      "aprobados": 14
    },
    "actividad_mensual": [
      {
        "mes": 1,
        "registros": 25,
        "usuarias": 48
      },
      {
        "mes": 2,
        "registros": 23,
        "usuarias": 42
      }
    ],
    "usuario": "aux01@mspas.gob.gt"
  }
}
```

---

## Endpoints de Backup

### 1. Crear Backup

Crear un backup de la base de datos.

**Endpoint:** `POST /backup/create`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Permisos:** Solo coordinadores

**Body (opcional):**
```json
{
  "compress": true
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Backup creado exitosamente",
  "filename": "sgpf_backup_20251021_143052.db",
  "size": "0.20 MB",
  "compressed": false,
  "timestamp": "2025-10-21T14:30:52.000Z"
}
```

---

### 2. Listar Backups

Obtener lista de backups disponibles.

**Endpoint:** `GET /backup/list`

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores

**Respuesta (200):**
```json
{
  "success": true,
  "backups": [
    {
      "filename": "sgpf_backup_20251021_143052.db",
      "size": "0.20 MB",
      "created": "2025-10-21T14:30:52.000Z",
      "compressed": false
    },
    {
      "filename": "sgpf_backup_20251020_020000.db.gz",
      "size": "0.08 MB",
      "created": "2025-10-20T02:00:00.000Z",
      "compressed": true
    }
  ],
  "count": 2
}
```

---

### 3. Descargar Backup

Descargar un archivo de backup.

**Endpoint:** `GET /backup/download/:filename`

**Parámetros:**
- `filename` (string) - Nombre del archivo de backup

**Headers:**
```http
Authorization: Bearer {token}
```

**Permisos:** Solo coordinadores

**Respuesta:**
- Descarga directa del archivo

**Ejemplo:**
```bash
curl -X GET http://localhost:5000/api/backup/download/sgpf_backup_20251021_143052.db \
  -H "Authorization: Bearer {token}" \
  --output backup.db
```

---

## Endpoints de Comunidades

### Listar Comunidades

Obtener lista simplificada de comunidades (sin filtros de alcance).

**Endpoint:** `GET /comunidades`

**Headers:**
```http
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Minerva",
      "codigo_comunidad": "T1-001",
      "poblacion_total": 6720,
      "poblacion_mef": 1600,
      "distancia_km": 5.2,
      "acceso_vehicular": 1,
      "territorio_id": 1,
      "territorio_nombre": "Territorio 1",
      "territorio_codigo": "T1",
      "distrito_nombre": "Centro de Salud - Huehuetenango"
    }
  ],
  "debug": {
    "total": 45,
    "message": "Versión debug - sin filtros de alcance"
  }
}
```

---

## Códigos de Estado

### Códigos Exitosos (2xx)

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Solicitud exitosa |
| `201` | Created | Recurso creado exitosamente |

### Códigos de Error del Cliente (4xx)

| Código | Significado | Descripción |
|--------|-------------|-------------|
| `400` | Bad Request | Parámetros inválidos o faltantes |
| `401` | Unauthorized | Token de autenticación faltante o inválido |
| `403` | Forbidden | Usuario sin permisos para realizar la acción |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: DPI duplicado) |

### Códigos de Error del Servidor (5xx)

| Código | Significado | Descripción |
|--------|-------------|-------------|
| `500` | Internal Server Error | Error interno del servidor |
| `503` | Service Unavailable | Servicio temporalmente no disponible |

---

## Manejo de Errores

### Formato de Respuesta de Error

Todas las respuestas de error siguen este formato:

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (opcional)"
}
```

### Ejemplos de Errores Comunes

#### Error 401 - No autorizado

```json
{
  "success": false,
  "message": "Token de acceso requerido"
}
```

#### Error 403 - Sin permisos

```json
{
  "success": false,
  "message": "No tienes permisos de validar",
  "permiso_requerido": "validar",
  "permisos_usuario": {
    "registrar": true,
    "validar": false,
    "aprobar": false,
    "reportes": false,
    "admin": false
  }
}
```

#### Error 400 - Datos inválidos

```json
{
  "success": false,
  "message": "DPI inválido. Debe contener 13 dígitos"
}
```

#### Error 404 - No encontrado

```json
{
  "success": false,
  "message": "Usuaria no encontrada"
}
```

#### Error 500 - Error del servidor

```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Database connection lost"
}
```

---

## Ejemplos de Uso Completo

### Flujo Completo: Registrar una Visita

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'aux01@mspas.gob.gt',
    password: '123456'
  })
});

const { token } = await loginResponse.json();

// 2. Buscar si la usuaria existe
const dpi = '2801199501234';
const searchResponse = await fetch(`http://localhost:5000/api/usuarias/buscar/${dpi}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const searchData = await searchResponse.json();
let usuariaId;

if (searchData.exists) {
  // 3a. Usuaria existe, usar su ID
  usuariaId = searchData.data.usuaria.id;
} else {
  // 3b. Crear nueva usuaria
  const createResponse = await fetch('http://localhost:5000/api/usuarias', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      dpi: '2801199501234',
      nombres: 'María Luisa',
      apellidos: 'González Pérez',
      comunidad_id: 1,
      fecha_nacimiento: '1995-06-15',
      telefono: '47891234'
    })
  });
  
  const createData = await createResponse.json();
  usuariaId = createData.data.id;
}

// 4. Registrar visita
const visitaResponse = await fetch('http://localhost:5000/api/visitas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    usuaria_id: usuariaId,
    metodo_id: 3, // Inyección Trimestral
    fecha_visita: '2025-10-21',
    observaciones: 'Paciente tolera bien el método'
  })
});

const visitaData = await visitaResponse.json();
console.log('Visita registrada:', visitaData);
```

---

### Flujo Completo: Validar Visitas Pendientes

```javascript
// 1. Login como asistente
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'asist01@mspas.gob.gt',
    password: '123456'
  })
});

const { token } = await loginResponse.json();

// 2. Obtener visitas pendientes
const pendientesResponse = await fetch('http://localhost:5000/api/validacion-visitas/pendientes', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const pendientesData = await pendientesResponse.json();
const visitasPendientes = pendientesData.data.registros_pendientes;

console.log(`Hay ${visitasPendientes.length} visitas pendientes de validación`);

// 3. Validar cada visita
for (const visita of visitasPendientes) {
  const validarResponse = await fetch(`http://localhost:5000/api/validacion-visitas/registro/${visita.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      accion: 'aprobar',
      observaciones_validacion: 'Registro verificado y aprobado'
    })
  });
  
  const resultado = await validarResponse.json();
  console.log(`Visita ${visita.id}: ${resultado.message}`);
}
```

---

### Flujo Completo: Generar Reporte Ejecutivo

```javascript
// 1. Login como coordinador
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@mspas.gob.gt',
    password: '123456'
  })
});

const { token } = await loginResponse.json();

// 2. Obtener consultas rápidas (KPIs)
const kpisResponse = await fetch('http://localhost:5000/api/reportes/consultas-rapidas/2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const kpisData = await kpisResponse.json();
console.log('Cumplimiento general:', kpisData.data.cumplimiento_general);

// 3. Obtener proyección general
const proyeccionResponse = await fetch('http://localhost:5000/api/reportes/proyeccion-general/2025', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const proyeccionData = await proyeccionResponse.json();
console.log('Proyección por territorios:', proyeccionData.data);

// 4. Obtener listado de usuarias
const usuariasResponse = await fetch('http://localhost:5000/api/reportes/usuarias/listado', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const usuariasData = await usuariasResponse.json();
console.log(`Total de usuarias activas: ${usuariasData.total}`);

// 5. Generar reporte de un método específico
const metodoId = 3; // Inyección Trimestral
const metodoResponse = await fetch(`http://localhost:5000/api/reportes/proyeccion-metodo/2025/${metodoId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const metodoData = await metodoResponse.json();
console.log('Reporte de Inyección Trimestral:', metodoData);
```

---

## Rate Limiting

El servidor implementa rate limiting para prevenir abuso:

- **Límite general:** 100 requests por 15 minutos por IP
- **Endpoints de login:** 5 intentos por 15 minutos por IP
- **Endpoints de backup:** 10 requests por hora

**Headers de respuesta:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634832000
```

**Respuesta cuando se excede el límite (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Versionamiento de API

**Versión actual:** `v1` (implícita en `/api/*`)

En futuras versiones:
- `/api/v1/*` - Versión 1 (actual)
- `/api/v2/*` - Versión 2 (futura)

La versión actual se mantiene sin prefijo de versión para compatibilidad.

---

## CORS

El servidor permite peticiones desde:
- **Desarrollo:** `http://localhost:3000`
- **Producción:** El dominio configurado en `CORS_ORIGIN`

**Headers CORS permitidos:**
```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Paginación

Los endpoints que retornan listas usan paginación estándar:

**Query Parameters:**
- `limit` (int, default: 20, max: 100) - Cantidad de resultados
- `offset` (int, default: 0) - Desplazamiento

**Ejemplo:**
```
GET /api/usuarias?limit=10&offset=20
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "usuarias": [...],
    "total": 456,
    "limit": 10,
    "offset": 20
  }
}
```

**Cálculo de páginas:**
```javascript
const totalPages = Math.ceil(total / limit);
const currentPage = Math.floor(offset / limit) + 1;
```

---

## Filtros y Búsqueda

### Operadores de Filtro

| Parámetro | Tipo | Ejemplo |
|-----------|------|---------|
| `comunidad_id` | int | `?comunidad_id=1` |
| `estado` | string | `?estado=validado` |
| `tipo_usuaria` | string | `?tipo_usuaria=activa` |
| `fecha_desde` | date | `?fecha_desde=2025-01-01` |
| `fecha_hasta` | date | `?fecha_hasta=2025-12-31` |
| `buscar` | string | `?buscar=maria` |

### Búsqueda de Texto

El parámetro `buscar` realiza búsqueda en múltiples campos:

**Ejemplo:**
```
GET /api/usuarias?buscar=maria
```

Busca en:
- Nombres
- Apellidos
- DPI

---

## Webhooks (Futuro)

**Nota:** Los webhooks están planificados para futuras versiones.

Permitirán notificaciones en tiempo real para:
- Nueva visita registrada
- Visita validada
- Meta alcanzada
- Usuario creado

---

## Seguridad

### Mejores Prácticas

1. **Nunca compartas tu token JWT**
2. **Renueva el token antes de que expire** (usar `/auth/renew`)
3. **Usa HTTPS en producción**
4. **No almacenes tokens en localStorage** (vulnerable a XSS)
5. **Implementa CSRF protection en producción**

### Headers de Seguridad

El servidor incluye headers de seguridad:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## Testing de la API

### Usando cURL

```bash
# Test de health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aux01@mspas.gob.gt","password":"123456"}'

# Obtener usuarias
curl -X GET http://localhost:5000/api/usuarias \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Usando Postman

1. Importar collection (disponible en `/docs/postman/`)
2. Configurar variable de entorno `base_url`
3. Ejecutar "Login" para obtener token
4. Token se guarda automáticamente en variables

### Usando JavaScript/Fetch

```javascript
const API_BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('authToken');

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return await response.json();
}

// Uso
const usuarias = await apiCall('/usuarias');
console.log(usuarias);
```

---

## Changelog de la API

### v1.0.0 (2025-01-01)
- ✅ Lanzamiento inicial
- ✅ Autenticación JWT
- ✅ CRUD de usuarias y visitas
- ✅ Sistema de validación
- ✅ Reportes ejecutivos
- ✅ Dashboard por roles
- ✅ Sistema de planificación
- ✅ Administración de usuarios
- ✅ Sistema de backups

---

## Soporte

### Reportar Bugs

Para reportar bugs en la API:

1. Verificar en la documentación
2. Reproducir el error
3. Enviar email a: **gdgl1105@gmail.com**

Incluir:
- Endpoint afectado
- Método HTTP
- Body de la petición
- Respuesta recibida
- Token (solo los primeros 10 caracteres)

### Solicitar Nuevos Endpoints

Enviar propuesta con:
- Funcionalidad deseada
- Caso de uso
- Ejemplo de request/response esperado

---

## Recursos Adicionales

### Documentación Relacionada

- [Guía de Instalación](INSTALACION.md)
- [Seguridad del Sistema](SEGURIDAD.md)
- [Base de Datos](BASE_DATOS.md)
- [Guía para Desarrolladores](GUIA_DESARROLLADORES.md)

### Herramientas Útiles

- **Postman Collection:** `/docs/postman/SGPF-MSPAS.postman_collection.json`
- **OpenAPI Spec:** `/docs/openapi/sgpf-api-spec.yaml` (futuro)
- **SDK JavaScript:** `/docs/sdk/sgpf-client.js` (futuro)

---

<div align="center">

**API REST - Sistema de Gestión de Planificación Familiar**

*Documentación completa de endpoints para integración y desarrollo*

---

**© 2025 - MSPAS Huehuetenango**

*Desarrollado por: Ing. Gerbert David García Loaiza*

</div>
