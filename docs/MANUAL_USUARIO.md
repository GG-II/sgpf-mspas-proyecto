Perfecto, voy a crear el manual de usuario completo. Tengo todo lo que necesito de los archivos anteriores. Voy a crear un manual visual, paso a paso, para cada tipo de usuario.

<invoke name="artifacts">
<parameter name="type">application/vnd.ant.code</parameter>
<parameter name="language">markdown</parameter>
<parameter name="title">MANUAL_USUARIO.md - Manual Completo</parameter>
<parameter name="artifacts_id">manual_usuario</parameter>
<parameter name="content"># 📖 Manual de Usuario - SGPF MSPAS

<div align="center">

![Manual](https://img.shields.io/badge/Manual-Usuario-blue.svg)
![Versión](https://img.shields.io/badge/Versión-1.0-green.svg)
![Idioma](https://img.shields.io/badge/Idioma-Español-red.svg)

**Sistema de Gestión de Planificación Familiar**  
**Ministerio de Salud Pública y Asistencia Social**  
**Huehuetenango, Guatemala**

</div>

---

## 📋 Tabla de Contenido

### 1. [Introducción](#1-introducción)
### 2. [Acceso al Sistema](#2-acceso-al-sistema)
### 3. [Manual por Roles](#3-manual-por-roles)
- [3.1 Auxiliar de Enfermería](#31-auxiliar-de-enfermería)
- [3.2 Asistente Técnico](#32-asistente-técnico)
- [3.3 Encargado de Salud Reproductiva](#33-encargado-de-salud-reproductiva)
- [3.4 Coordinador Municipal](#34-coordinador-municipal)
### 4. [Funciones Comunes](#4-funciones-comunes)
### 5. [Preguntas Frecuentes](#5-preguntas-frecuentes)
### 6. [Solución de Problemas](#6-solución-de-problemas)
### 7. [Glosario](#7-glosario)
### 8. [Contacto y Soporte](#8-contacto-y-soporte)

---

## 1. Introducción

### ¿Qué es el SGPF?

El **Sistema de Gestión de Planificación Familiar (SGPF)** es una plataforma web que permite:

✅ **Registrar** visitas de planificación familiar de usuarias  
✅ **Gestionar** información de pacientes y métodos anticonceptivos  
✅ **Validar** registros realizados por el personal de campo  
✅ **Generar reportes** ejecutivos y estadísticas  
✅ **Planificar** metas mensuales y anuales  
✅ **Monitorear** cumplimiento de objetivos por territorio

---

### Usuarios del Sistema

El sistema está diseñado para **4 tipos de usuarios**, cada uno con funciones específicas:

| Rol | Función Principal | Acceso |
|-----|-------------------|--------|
| **Auxiliar de Enfermería** | Registrar visitas de usuarias en comunidades | 🟢 Registrar |
| **Asistente Técnico** | Validar registros de territorios asignados | 🟡 Validar |
| **Encargado SR** | Aprobar datos y generar reportes ejecutivos | 🔵 Aprobar y Reportes |
| **Coordinador Municipal** | Gestión completa del sistema y planificación | 🔴 Administración total |

---

### Requisitos del Sistema

**Para usar el sistema necesitas:**

#### 💻 Equipo
- Computadora, tablet o celular
- Conexión a internet (recomendado: 2 Mbps o superior)
- Navegador web actualizado:
  - ✅ Google Chrome (recomendado)
  - ✅ Mozilla Firefox
  - ✅ Microsoft Edge
  - ✅ Safari

#### 🔐 Credenciales
- Email institucional
- Contraseña asignada por el administrador
- (En primer acceso: cambio obligatorio de contraseña)

#### 📱 Recomendaciones
- Pantalla mínima de 7 pulgadas para mejor experiencia
- Memoria RAM: mínimo 2 GB
- No usar modo incógnito (no guardará sesión)

---

## 2. Acceso al Sistema

### 2.1 Ingresar por Primera Vez

**Paso 1: Abrir el navegador**

Escribe en la barra de direcciones:
```
http://localhost:3000
```
*(En producción será una URL como: https://sgpf.mspas.gob.gt)*

**Paso 2: Pantalla de Inicio de Sesión**

Verás una pantalla como esta:

```
┌─────────────────────────────────────┐
│                                     │
│        🏥 SGPF - MSPAS              │
│   Sistema de Gestión de             │
│   Planificación Familiar            │
│                                     │
│   ┌─────────────────────┐           │
│   │ Email               │           │
│   └─────────────────────┘           │
│                                     │
│   ┌─────────────────────┐           │
│   │ Contraseña          │           │
│   └─────────────────────┘           │
│                                     │
│   [ Iniciar Sesión ]                │
│                                     │
│   ¿Olvidaste tu contraseña?         │
│                                     │
└─────────────────────────────────────┘
```

**Paso 3: Ingresar Credenciales**

- **Email:** Escribe tu correo institucional
  - Ejemplo: `ana.lopez@mspas.gob.gt`
  
- **Contraseña:** Escribe la contraseña proporcionada
  - Si es tu primer acceso, usa la contraseña temporal

**Paso 4: Click en "Iniciar Sesión"**

---

### 2.2 Cambiar Contraseña (Primer Acceso)

Si es tu **primer ingreso**, el sistema te pedirá cambiar tu contraseña:

```
┌─────────────────────────────────────┐
│  Cambio de Contraseña Obligatorio   │
│                                     │
│  Por seguridad, debes cambiar tu    │
│  contraseña temporal.               │
│                                     │
│  Contraseña Actual:                 │
│  ┌─────────────────────┐            │
│  │                     │            │
│  └─────────────────────┘            │
│                                     │
│  Nueva Contraseña:                  │
│  ┌─────────────────────┐            │
│  │                     │            │
│  └─────────────────────┘            │
│                                     │
│  Confirmar Contraseña:              │
│  ┌─────────────────────┐            │
│  │                     │            │
│  └─────────────────────┘            │
│                                     │
│  [ Cambiar Contraseña ]             │
│                                     │
└─────────────────────────────────────┘
```

**Requisitos de la contraseña:**
- ✅ Mínimo 6 caracteres
- ✅ No puede ser igual a la anterior
- ✅ Debe coincidir en ambos campos

**Consejos de seguridad:**
- 🔒 Usa una combinación de letras y números
- 🔒 No compartas tu contraseña
- 🔒 Cámbiala periódicamente (cada 3 meses)
- 🔒 No uses información personal obvia

---

### 2.3 Página Principal

Después de iniciar sesión, verás el **Dashboard** correspondiente a tu rol:

```
┌──────────────────────────────────────────────────┐
│  🏥 SGPF - MSPAS                    👤 Ana López │
│  ──────────────────────────────────────────────  │
│                                                  │
│  🏠 Dashboard  |  📋 Registros  |  📊 Reportes  │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  Bienvenida, Ana Patricia López Morales │    │
│  │  Auxiliar de Enfermería                 │    │
│  │  Territorio 1                           │    │
│  │                                         │    │
│  │  📊 Tu Resumen de Octubre 2025          │    │
│  │                                         │    │
│  │  Usuarias Nuevas:         12            │    │
│  │  Usuarias en Reconsulta:   8            │    │
│  │  Usuarias Activas:        45            │    │
│  │  Total de Visitas:        78            │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Elementos de la interfaz:**

1. **Barra Superior:**
   - Logo del sistema
   - Nombre del usuario actual
   - Menú de navegación
   - Botón de cerrar sesión

2. **Panel Central:**
   - Dashboard con resúmenes
   - Estadísticas del mes
   - Accesos rápidos

3. **Menú Lateral (según rol):**
   - Opciones disponibles para tu rol
   - Accesos directos a funciones

---

### 2.4 Cerrar Sesión

Para salir del sistema de forma segura:

1. Click en tu **nombre** (esquina superior derecha)
2. Selecciona **"Cerrar Sesión"**
3. Confirma la acción

```
┌──────────────────────┐
│  👤 Ana López    ▼   │
├──────────────────────┤
│  👤 Mi Perfil        │
│  🔑 Cambiar Password │
│  📊 Mis Estadísticas │
│  🚪 Cerrar Sesión    │
└──────────────────────┘
```

**⚠️ IMPORTANTE:**
- Siempre cierra sesión cuando termines
- Especialmente si usas computadoras compartidas
- Esto protege la información de las usuarias

---

## 3. Manual por Roles

---

## 3.1 Auxiliar de Enfermería

**Rol:** Personal de campo que registra visitas de planificación familiar

**Permisos:**
- ✅ Registrar visitas de usuarias
- ✅ Buscar usuarias existentes
- ✅ Crear nuevas usuarias
- ✅ Ver historial de sus propias visitas
- ✅ Ver su propio dashboard
- ❌ No puede validar ni aprobar
- ❌ No puede generar reportes ejecutivos

---

### 3.1.1 Dashboard del Auxiliar

Al ingresar al sistema verás tu **Dashboard Personal:**

**Panel de Estadísticas del Mes**

```
┌────────────────────────────────────────┐
│  📊 Tu Resumen de Octubre 2025         │
│                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │    12    │  │    8     │  │  45  │ │
│  │ Nuevas   │  │Reconsulta│  │Activas│ │
│  └──────────┘  └──────────┘  └──────┘ │
│                                        │
│  Total de Visitas Registradas: 78     │
│  Visitas Pendientes Validar:   5      │
│  Visitas Validadas:           73      │
│                                        │
└────────────────────────────────────────┘
```

**Panel de Comunidades Asignadas**

```
┌────────────────────────────────────────┐
│  🏘️ Mis Comunidades (3)                │
│                                        │
│  📍 Minerva (T1-001)                   │
│     MEF: 1,600 | Distancia: 5.2 km    │
│                                        │
│  📍 San Pedro Soloma (T1-002)          │
│     MEF: 2,100 | Distancia: 8.5 km    │
│                                        │
│  📍 Santa Ana Huista (T1-003)          │
│     MEF: 3,260 | Distancia: 12.0 km   │
│                                        │
└────────────────────────────────────────┘
```

**Últimas Visitas Registradas**

```
┌────────────────────────────────────────┐
│  📋 Últimas 5 Visitas                  │
│                                        │
│  21/10/2025 - María González           │
│  Iny. Trimestral | ✅ Validado         │
│                                        │
│  20/10/2025 - Carmen Pérez             │
│  Píldora | ⏳ Pendiente                │
│                                        │
│  19/10/2025 - Rosa López               │
│  DIU | ✅ Validado                     │
│                                        │
└────────────────────────────────────────┘
```

---

### 3.1.2 Registrar una Nueva Visita

**Proceso completo paso a paso:**

#### Paso 1: Ir a "Registrar Visita"

Click en el menú:
```
📋 Registros → ➕ Registrar Visita
```

#### Paso 2: Buscar Usuaria por DPI

```
┌────────────────────────────────────────┐
│  🔍 Buscar Usuaria                     │
│                                        │
│  DPI (13 dígitos):                     │
│  ┌─────────────────────────────┐      │
│  │ 2801199501234______________  │      │
│  └─────────────────────────────┘      │
│                                        │
│  [ Buscar Usuaria ]                   │
│                                        │
└────────────────────────────────────────┘
```

**Escribe el DPI de la usuaria y presiona "Buscar"**

---

#### Caso A: Usuaria Encontrada

Si la usuaria **ya existe** en el sistema:

```
┌────────────────────────────────────────┐
│  ✅ Usuaria Encontrada                 │
│                                        │
│  Nombre: María Luisa González Pérez    │
│  DPI: 2801199501234                    │
│  Comunidad: Minerva (T1-001)           │
│  Tipo: Usuaria Activa                  │
│                                        │
│  📊 Historial (8 visitas anteriores)   │
│  Última visita: 15/09/2025             │
│  Último método: Inyección Trimestral   │
│                                        │
│  [ Registrar Nueva Visita ]            │
│                                        │
└────────────────────────────────────────┘
```

**Click en "Registrar Nueva Visita"** → ir al Paso 3

---

#### Caso B: Usuaria NO Encontrada

Si la usuaria **no existe** en el sistema:

```
┌────────────────────────────────────────┐
│  ℹ️ Usuaria No Encontrada              │
│                                        │
│  El DPI 2801199501234 no está          │
│  registrado en el sistema.             │
│                                        │
│  [ Registrar Nueva Usuaria ]           │
│                                        │
└────────────────────────────────────────┘
```

**Click en "Registrar Nueva Usuaria"**

**Llenar Formulario de Registro:**

```
┌────────────────────────────────────────┐
│  ➕ Registrar Nueva Usuaria            │
│                                        │
│  DPI: 2801199501234 (bloqueado)       │
│                                        │
│  Nombres: *                            │
│  ┌─────────────────────────────┐      │
│  │ María Luisa_________________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Apellidos: *                          │
│  ┌─────────────────────────────┐      │
│  │ González Pérez______________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Fecha de Nacimiento:                  │
│  ┌─────────────────────────────┐      │
│  │ 15/06/1995 📅               │      │
│  └─────────────────────────────┘      │
│                                        │
│  Teléfono:                             │
│  ┌─────────────────────────────┐      │
│  │ 47891234____________________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Comunidad: *                          │
│  ┌─────────────────────────────┐      │
│  │ Minerva (T1-001)        ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  * Campos obligatorios                │
│                                        │
│  [ Cancelar ]  [ Guardar Usuaria ]    │
│                                        │
└────────────────────────────────────────┘
```

**Instrucciones:**
1. Nombres y Apellidos: Escribir tal como aparecen en el DPI
2. Fecha de Nacimiento: Usar el selector de fecha
3. Teléfono: Opcional, 8 dígitos
4. Comunidad: Seleccionar de tu lista asignada

**Click en "Guardar Usuaria"**

Verás confirmación:
```
✅ Usuaria registrada exitosamente
   Ahora puedes registrar su visita
```

---

#### Paso 3: Registrar la Visita

```
┌────────────────────────────────────────┐
│  📝 Registrar Visita                   │
│                                        │
│  Usuaria: María Luisa González Pérez   │
│  DPI: 2801199501234                    │
│  Comunidad: Minerva                    │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  Fecha de Visita: *                    │
│  ┌─────────────────────────────┐      │
│  │ 21/10/2025 📅               │      │
│  └─────────────────────────────┘      │
│                                        │
│  Método Administrado: *                │
│  ┌─────────────────────────────┐      │
│  │ Inyección Trimestral    ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Observaciones:                        │
│  ┌─────────────────────────────┐      │
│  │ Paciente tolera bien el     │      │
│  │ método, sin efectos adversos│      │
│  │                             │      │
│  └─────────────────────────────┘      │
│                                        │
│  * Campos obligatorios                │
│                                        │
│  [ Cancelar ]  [ Guardar Visita ]     │
│                                        │
└────────────────────────────────────────┘
```

**Métodos Disponibles:**
- Inyección Mensual
- Inyección Bimensual
- Inyección Trimestral ⭐ (más común)
- Píldora Anticonceptiva
- DIU (Dispositivo Intrauterino)
- Implante Hormonal Subdérmico
- Condón Masculino
- Condón Femenino
- Ritmo/Calendario
- Retiro
- Emergencia

**Click en "Guardar Visita"**

---

#### Paso 4: Confirmación

```
┌────────────────────────────────────────┐
│  ✅ VISITA REGISTRADA EXITOSAMENTE     │
│                                        │
│  Visita ID: #127                       │
│  Usuaria: María González               │
│  Método: Inyección Trimestral          │
│  Fecha: 21/10/2025                     │
│  Estado: ⏳ Pendiente de Validación    │
│                                        │
│  [ Registrar Otra Visita ]             │
│  [ Ver Mis Registros ]                 │
│  [ Volver al Dashboard ]               │
│                                        │
└────────────────────────────────────────┘
```

**¿Qué pasa después?**
1. Tu visita queda **guardada** en el sistema
2. Estado inicial: **"Pendiente de Validación"**
3. El Asistente Técnico la **validará** más tarde
4. Recibirás notificación cuando sea validada

---

### 3.1.3 Ver Mis Registros

Para ver todas tus visitas registradas:

```
📋 Registros → 📊 Mis Registros
```

**Vista de Lista:**

```
┌─────────────────────────────────────────────────┐
│  📊 Mis Registros de Visitas                    │
│                                                 │
│  Filtros:                                       │
│  Estado: [Todos ▼]  Comunidad: [Todas ▼]       │
│  Mes: [Octubre ▼]   Buscar: [_______] 🔍       │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📋 21/10/2025 | María González                │
│     Iny. Trimestral | Minerva                   │
│     ✅ Validado por: Rosa Hernández             │
│     [Ver Detalle]                               │
│                                                 │
│  📋 20/10/2025 | Carmen Pérez                   │
│     Píldora | Minerva                           │
│     ⏳ Pendiente de Validación                  │
│     [Ver Detalle] [Editar]                      │
│                                                 │
│  📋 19/10/2025 | Rosa López                     │
│     DIU | San Pedro Soloma                      │
│     ✅ Validado por: Rosa Hernández             │
│     [Ver Detalle]                               │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Mostrando 3 de 78 registros                    │
│  [◀ Anterior]  [1] [2] [3] ... [26]  [Siguiente ▶]│
│                                                 │
└─────────────────────────────────────────────────┘
```

**Acciones Disponibles:**
- 👁️ **Ver Detalle:** Ver información completa
- ✏️ **Editar:** Solo si está "Pendiente" (aún no validado)
- 🔍 **Buscar:** Por nombre, DPI o comunidad

---

### 3.1.4 Editar una Visita Pendiente

Solo puedes editar visitas que **aún no han sido validadas**.

**Click en "Editar" en una visita pendiente:**

```
┌────────────────────────────────────────┐
│  ✏️ Editar Visita #125                 │
│                                        │
│  Usuaria: Carmen Pérez                 │
│  DPI: 2801199401234                    │
│  Estado: ⏳ Pendiente                  │
│                                        │
│  Fecha de Visita:                      │
│  ┌─────────────────────────────┐      │
│  │ 20/10/2025 📅               │      │
│  └─────────────────────────────┘      │
│                                        │
│  Método:                               │
│  ┌─────────────────────────────┐      │
│  │ Píldora Anticonceptiva  ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Observaciones:                        │
│  ┌─────────────────────────────┐      │
│  │ Primera vez que usa píldora │      │
│  │ Se le explicó la toma diaria│      │
│  └─────────────────────────────┘      │
│                                        │
│  [ Cancelar ]  [ Guardar Cambios ]    │
│                                        │
└────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:**
- Solo puedes cambiar las **observaciones**
- NO puedes cambiar: usuaria, fecha ni método
- Una vez **validada**, ya no se puede editar

---

### 3.1.5 Ver Historial de una Usuaria

**Desde "Ver Detalle" de cualquier visita:**

```
┌─────────────────────────────────────────────────┐
│  👤 Ficha de Usuaria                            │
│                                                 │
│  Nombre: María Luisa González Pérez             │
│  DPI: 2801199501234                             │
│  Fecha Nac: 15/06/1995 (30 años)               │
│  Teléfono: 47891234                             │
│  Comunidad: Minerva (T1-001)                    │
│  Tipo: Usuaria Activa (8 visitas)              │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📊 HISTORIAL DE VISITAS (8 registros)          │
│                                                 │
│  1️⃣ 21/10/2025 - Inyección Trimestral           │
│     Por: Ana López | ✅ Validado                │
│     Obs: Paciente tolera bien el método         │
│                                                 │
│  2️⃣ 15/07/2025 - Inyección Trimestral           │
│     Por: Ana López | ✅ Validado                │
│     Obs: Sin novedades                          │
│                                                 │
│  3️⃣ 10/04/2025 - Inyección Trimestral           │
│     Por: Ana López | ✅ Validado                │
│     Obs: Control normal                         │
│                                                 │
│  [ Ver Historial Completo ]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Información útil:**
- Ver **todos los métodos** que ha usado
- Ver **fechas** de cada visita
- Saber cuándo es su **próxima visita** (según método)
- Detectar usuarias con **visitas atrasadas**

---

### 3.1.6 Consejos para Auxiliares

**✅ Buenas Prácticas:**

1. **Verifica el DPI antes de registrar**
   - Busca siempre primero si la usuaria existe
   - Evita duplicados

2. **Completa toda la información**
   - Fecha correcta de visita
   - Método exacto administrado
   - Observaciones relevantes

3. **Registra el mismo día**
   - No acumules registros
   - Registra inmediatamente después de cada visita

4. **Revisa tus pendientes**
   - Verifica si hay visitas sin validar
   - Corrige errores antes de la validación

5. **Coordina con tu asistente**
   - Si tienes dudas, pregunta antes de registrar
   - Informa de casos especiales

**❌ Errores Comunes a Evitar:**

- ❌ Registrar DPI incorrecto
- ❌ Seleccionar comunidad equivocada
- ❌ Poner fecha futura
- ❌ No llenar observaciones importantes
- ❌ Registrar después de muchos días

---

## 3.2 Asistente Técnico

**Rol:** Supervisa y valida registros de territorios asignados

**Permisos:**
- ✅ Ver todos los registros de sus territorios
- ✅ Validar visitas pendientes
- ✅ Rechazar visitas con errores
- ✅ Ver estadísticas de territorios
- ✅ Generar reportes básicos
- ❌ No puede aprobar metas finales
- ❌ No puede administrar usuarios

---

### 3.2.1 Dashboard del Asistente

```
┌──────────────────────────────────────────────────┐
│  📊 Dashboard - Asistente Técnico                │
│  Territorios: T1, T2, T3                         │
│                                                  │
│  ⚠️ ALERTAS                                      │
│  ┌────────────────────────────────────────┐     │
│  │ 🔴 23 visitas pendientes de validar    │     │
│  │ 🟡 5 registros con más de 3 días       │     │
│  │ 🟢 89% de cumplimiento mensual          │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  📈 RESUMEN DEL MES (Octubre 2025)               │
│  ┌────────────────────────────────────────┐     │
│  │ Total Registros:        234             │     │
│  │ Validados Hoy:           18             │     │
│  │ Rechazados:               2             │     │
│  │ Auxiliares Activos:      12             │     │
│  │ Comunidades Activas:     38             │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  🎯 METAS DEL MES                                │
│  ┌────────────────────────────────────────┐     │
│  │ Meta Mensual:      175 usuarias         │     │
│  │ Ejecutado:         156 usuarias (89%)   │     │
│  │ Faltan:             19 usuarias          │     │
│  │ Días restantes:     10 días              │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [ ⚡ Ir a Validación ]  [ 📊 Ver Reportes ]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.2.2 Validar Visitas Pendientes

**Ir a Validación:**
```
✅ Validación → 📋 Visitas Pendientes
```

**Vista de Validación:**

```
┌──────────────────────────────────────────────────┐
│  ✅ Validación de Visitas                        │
│                                                  │
│  Filtros:                                        │
│  Territorio: [Todos ▼]  Comunidad: [Todas ▼]    │
│  Auxiliar: [Todos ▼]    Fecha: [Hoy ▼]          │
│                                                  │
│  📊 23 visitas pendientes de validación          │
│                                                  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  1️⃣ VISITA #127                                  │
│  ┌────────────────────────────────────────┐     │
│  │ Fecha: 21/10/2025  Hora: 14:30        │     │
│  │ Usuaria: María González (2801199501234)│     │
│  │ Comunidad: Minerva (T1-001)            │     │
│  │ Método: Inyección Trimestral           │     │
│  │ Tipo: Usuaria Activa                   │     │
│  │                                        │     │
│  │ Registrado por: Ana Patricia López     │     │
│  │ Cargo: Auxiliar de Enfermería          │     │
│  │                                        │     │
│  │ Observaciones:                         │     │
│  │ "Paciente tolera bien el método,       │     │
│  │  sin efectos adversos reportados"       │     │
│  │                                        │     │
│  │ [ ✅ Validar ]  [ ❌ Rechazar ]        │     │
│  │ [ 👁️ Ver Historial Usuaria ]           │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  2️⃣ VISITA #126                                  │
│  ┌────────────────────────────────────────┐     │
│  │ Fecha: 21/10/2025  Hora: 11:15        │     │
│  │ Usuaria: Carmen Pérez (2801199301111)  │     │
│  │ Comunidad: San Pedro Soloma (T1-002)   │     │
│  │ Método: Píldora Anticonceptiva         │     │
│  │ Tipo: Usuaria Nueva ⭐                 │     │
│  │                                        │     │
│  │ Registrado por: Ana Patricia López     │     │
│  │                                        │     │
│  │ Observaciones:                         │     │
│  │ "Primera vez que usa píldora, se       │     │
│  │  le explicó la toma diaria"            │     │
│  │                                        │     │
│  │ [ ✅ Validar ]  [ ❌ Rechazar ]        │     │
│  │ [ 👁️ Ver Historial Usuaria ]           │     │
│  └────────────────────────────────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.2.3 Proceso de Validación

#### Opción 1: ✅ VALIDAR (Registro Correcto)

**Click en "✅ Validar":**

```
┌────────────────────────────────────────┐
│  ✅ Confirmar Validación               │
│                                        │
│  ¿Validar la visita #127?              │
│                                        │
│  Usuaria: María González               │
│  Método: Inyección Trimestral          │
│  Fecha: 21/10/2025                     │
│                                        │
│  Observaciones de Validación:          │
│  (Opcional)                            │
│  ┌─────────────────────────────┐      │
│  │ Registro correcto, datos    │      │
│  │ verificados                 │      │
│  └─────────────────────────────┘      │
│                                        │
│  [ Cancelar ]  [ ✅ Confirmar ]        │
│                                        │
└────────────────────────────────────────┘
```

**Resultado:**
```
✅ Visita validada exitosamente
   La visita ahora está aprobada
```

---

#### Opción 2: ❌ RECHAZAR (Registro con Error)

**Click en "❌ Rechazar":**

```
┌────────────────────────────────────────┐
│  ❌ Rechazar Visita                    │
│                                        │
│  ⚠️ Esta acción eliminará              │
│  permanentemente el registro           │
│                                        │
│  Visita #127                           │
│  Usuaria: María González               │
│                                        │
│  Motivo del Rechazo: *                 │
│  ┌─────────────────────────────┐      │
│  │ DPI incorrecto, no          │      │
│  │ coincide con documento      │      │
│  └─────────────────────────────┘      │
│                                        │
│  💡 El auxiliar será notificado        │
│  para que corrija el error             │
│                                        │
│  [ Cancelar ]  [ ❌ Rechazar ]         │
│                                        │
└────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:**
- Rechazar **elimina** el registro permanentemente
- Siempre explica el **motivo** del rechazo
- El auxiliar recibirá una **notificación**
- El auxiliar deberá registrar nuevamente

**Motivos comunes de rechazo:**
- ❌ DPI incorrecto o no coincide
- ❌ Fecha incorrecta o imposible
- ❌ Método no corresponde al servicio
- ❌ Comunidad equivocada
- ❌ Usuaria duplicada

---

### 3.2.4 Ver Historial Completo de Usuaria

**Click en "👁️ Ver Historial Usuaria":**

```
┌─────────────────────────────────────────────────┐
│  👤 FICHA COMPLETA DE USUARIA                   │
│                                                 │
│  DATOS PERSONALES                               │
│  ─────────────────────────────────────────────  │
│  Nombre: María Luisa González Pérez             │
│  DPI: 2801199501234                             │
│  Fecha Nacimiento: 15/06/1995 (30 años)        │
│  Teléfono: 47891234                             │
│  Comunidad: Minerva (T1-001)                    │
│  Territorio: Territorio 1                       │
│  Tipo: Usuaria Activa                           │
│  Primera Visita: 10/01/2024                     │
│  Última Visita: 21/10/2025                      │
│  Total Visitas: 9                               │
│                                                 │
│  HISTORIAL DE VISITAS                           │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📅 21/10/2025 - Inyección Trimestral           │
│     Por: Ana Patricia López                     │
│     Estado: ⏳ Pendiente de Validación          │
│     Obs: Paciente tolera bien el método         │
│                                                 │
│  📅 15/07/2025 - Inyección Trimestral           │
│     Por: Ana Patricia López                     │
│     Estado: ✅ Validado (Rosa Hernández)        │
│     Obs: Sin novedades                          │
│                                                 │
│  📅 10/04/2025 - Inyección Trimestral           │
│     Por: Ana Patricia López                     │
│     Estado: ✅ Validado (Rosa Hernández)        │
│     Obs: Control normal                         │
│                                                 │
│  📅 08/01/2025 - Inyección Trimestral           │
│     Por: Ana Patricia López                     │
│     Estado: ✅ Validado (Rosa Hernández)        │
│                                                 │
│  [Ver Historial Completo (9 visitas)]          │
│                                                 │
│  MÉTODOS MÁS USADOS                             │
│  ─────────────────────────────────────────────  │
│  💉 Inyección Trimestral: 8 veces (89%)         │
│  💊 Píldora Anticonceptiva: 1 vez (11%)         │
│                                                 │
│  [ Cerrar ]                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Utilidad del historial:**
- ✅ Verificar **continuidad** del método
- ✅ Detectar **cambios** de método
- ✅ Ver **frecuencia** de visitas
- ✅ Identificar usuarias con **visitas irregulares**

---

### 3.2.5 Reportes del Asistente

**Ir a Reportes:**
```
📊 Reportes → 📈 Mis Territorios
```

**Vista de Reportes:**

```
┌──────────────────────────────────────────────────┐
│  📊 REPORTES DE MIS TERRITORIOS                  │
│                                                  │
│  Año: [2025 ▼]  Mes: [Octubre ▼]                │
│                                                  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  📈 RESUMEN GENERAL                              │
│  ┌────────────────────────────────────────┐     │
│  │ Total Visitas:          234            │     │
│  │ Usuarias Nuevas:         45            │     │
│  │ Usuarias Reconsulta:     67            │     │
│  │ Usuarias Activas:       122            │     │
│  │ Meta del Mes:           175            │     │
│  │ Cumplimiento:           89.1%          │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  🗺️ POR TERRITORIO                               │
│  ┌────────────────────────────────────────┐     │
│  │ Territorio 1                           │     │
│  │ Comunidades: 15 | Auxiliares: 4        │     │
│  │ Meta: 60 | Ejecutado: 56 (93%)         │     │
│  │ [Ver Detalle]                          │     │
│  │                                        │     │
│  │ Territorio 2                           │     │
│  │ Comunidades: 12 | Auxiliares: 3        │     │
│  │ Meta: 55 | Ejecutado: 48 (87%)         │     │
│  │ [Ver Detalle]                          │     │
│  │                                        │     │
│  │ Territorio 3                           │     │
│  │ Comunidades: 11 | Auxiliares: 3        │     │
│  │ Meta: 60 | Ejecutado: 52 (87%)         │     │
│  │ [Ver Detalle]                          │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  💉 POR MÉTODO                                   │
│  ┌────────────────────────────────────────┐     │
│  │ Inyección Trimestral:    105 (45%)     │     │
│  │ Píldora Anticonceptiva:   47 (20%)     │     │
│  │ Inyección Mensual:        35 (15%)     │     │
│  │ DIU:                      28 (12%)     │     │
│  │ Implante:                 19 (8%)      │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [ 📥 Descargar Excel ]  [ 🖨️ Imprimir ]       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.2.6 Consejos para Asistentes

**✅ Buenas Prácticas:**

1. **Valida diariamente**
   - No acumules visitas pendientes
   - Meta: validar dentro de 24 horas

2. **Revisa cuidadosamente**
   - Verifica DPI correcto
   - Confirma comunidad asignada
   - Revisa coherencia de fechas

3. **Comunica con auxiliares**
   - Si rechazas, explica claramente el error
   - Envía feedback constructivo
   - Coordina reuniones de seguimiento

4. **Monitorea cumplimiento**
   - Revisa metas diariamente
   - Identifica auxiliares con bajo rendimiento
   - Apoya donde hay retrasos

5. **Genera reportes periódicos**
   - Semanal para tu seguimiento
   - Mensual para reuniones de equipo

**❌ Errores a Evitar:**

- ❌ Validar sin revisar el historial
- ❌ Acumular muchas validaciones pendientes
- ❌ Rechazar sin explicar el motivo
- ❌ No dar seguimiento a auxiliares
- ❌ No comunicar problemas detectados

---

## 3.3 Encargado de Salud Reproductiva

**Rol:** Líder técnico del programa de planificación familiar

**Permisos:**
- ✅ Ver todos los datos del distrito
- ✅ Aprobar validaciones finales
- ✅ Generar todos los reportes ejecutivos
- ✅ Configurar metas y proyecciones
- ✅ Supervisar asistentes técnicos
- ✅ Exportar datos para análisis
- ❌ No administra usuarios (solo coordinador)

---

### 3.3.1 Dashboard del Encargado

```
┌──────────────────────────────────────────────────┐
│  🎯 DASHBOARD EJECUTIVO - ENCARGADO SR           │
│  Distrito: Centro de Salud - Huehuetenango       │
│                                                  │
│  📊 INDICADORES CLAVE (Octubre 2025)             │
│  ┌────────────────────────────────────────┐     │
│  │                                        │     │
│  │  META MENSUAL              CUMPLIMIENTO│     │
│  │  ─────────                 ───────────│     │
│  │  175 usuarias               156 (89%)  │     │
│  │                                        │     │
│  │  ████████████████░░  89.1%             │     │
│  │                                        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  🏆 TOP 3 TERRITORIOS                            │
│  ┌────────────────────────────────────────┐     │
│  │  🥇 T1: 93% (56/60)                    │     │
│  │  🥈 T2: 87% (48/55)                    │     │
│  │  🥉 T3: 87% (52/60)                    │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ⚠️ ALERTAS Y ACCIONES                          │
│  ┌────────────────────────────────────────┐     │
│  │  🔴 23 visitas pendientes de validar   │     │
│  │  🟡 T5 con bajo cumplimiento (65%)     │     │
│  │  🟡 3 auxiliares inactivos esta semana │     │
│  │  🟢 Meta anual en 87% (proyecto 95%)   │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  📈 TENDENCIA DEL AÑO                            │
│  ┌────────────────────────────────────────┐     │
│  │  200│         ╱╲    ╱──╲               │     │
│  │  150│      ╱──    ╱      ╲──╲          │     │
│  │  100│   ╱──                   ╲        │     │
│  │   50│╱──                                │     │
│  │    0└──────────────────────────────────│     │
│  │     E F M A M J J A S O N D            │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [📊 Reportes Ejecutivos] [🎯 Planificación]    │
│  [✅ Aprobar Validaciones] [👥 Supervisar]       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.3.2 Reportes Ejecutivos

**Acceso:**
```
📊 Reportes → 📈 Reportes Ejecutivos
```

**Panel de Reportes:**

```
┌──────────────────────────────────────────────────┐
│  📊 CENTRO DE REPORTES EJECUTIVOS                │
│                                                  │
│  Selecciona el tipo de reporte:                  │
│                                                  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  1. 📈 PROYECCIÓN GENERAL                        │
│     Todos los métodos por territorio             │
│     [Generar Reporte]                            │
│                                                  │
│  2. 💉 PROYECCIÓN POR MÉTODO                     │
│     Desglose mensual de un método específico     │
│     Método: [Inyección Trimestral ▼]            │
│     [Generar Reporte]                            │
│                                                  │
│  3. 🗺️ PROYECCIÓN POR TERRITORIO                 │
│     Todos los métodos de un territorio           │
│     Territorio: [Territorio 1 ▼]                 │
│     [Generar Reporte]                            │
│                                                  │
│  4. 👥 LISTADO DE USUARIAS                       │
│     Censo completo de usuarias activas           │
│     [Generar Reporte]                            │
│                                                  │
│  5. 📋 FICHA INDIVIDUAL                          │
│     Historial completo de una usuaria            │
│     Buscar por DPI: [____________]               │
│     [Generar Reporte]                            │
│                                                  │
│  6. ⚡ CONSULTAS RÁPIDAS (KPIs)                  │
│     Cumplimiento y porcentajes                   │
│     [Generar Reporte]                            │
│                                                  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Año: [2025 ▼]  Formato: [Excel ▼] [PDF ▼]      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.3.3 Ejemplo: Reporte de Proyección General

**Después de generar:**

```
┌──────────────────────────────────────────────────┐
│  📊 PROYECCIÓN GENERAL 2025                      │
│  Generado: 21/10/2025 15:30                      │
│  Por: Lic. María García (Encargado SR)           │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  RESUMEN EJECUTIVO                               │
│  ────────────────────────────────────────────    │
│  MEF Total del Distrito:      30,960             │
│  Proyección Anual Total:      10,500             │
│  Ejecutado a la Fecha:         3,847 (37%)       │
│  Meses Transcurridos:             10/12          │
│  Proyección Esperada:          8,750 (83%)       │
│  Estado: 🟡 BAJO LO ESPERADO                     │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  POR TERRITORIO                                  │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ TERRITORIO 1                           │     │
│  │ ──────────────────────────────────────│     │
│  │ MEF: 6,960                             │     │
│  │ Proyección Anual: 2,366                │     │
│  │                                        │     │
│  │ Por Método:                            │     │
│  │ • Iny. Mensual:        237 (10%)       │     │
│  │ • Iny. Bimensual:      237 (10%)       │     │
│  │ • Iny. Trimestral:   1,065 (45%) ⭐    │     │
│  │ • Píldora:             284 (12%)       │     │
│  │ • DIU:                  47 (2%)        │     │
│  │ • Implante:            189 (8%)        │     │
│  │ • Condón M:            142 (6%)        │     │
│  │ • Otros:               165 (7%)        │     │
│  │                                        │     │
│  │ Ejecutado: 856 (36%)                   │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [Continúa con T2, T3, T4, T5...]                │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  ANÁLISIS Y RECOMENDACIONES                      │
│  ────────────────────────────────────────────    │
│  • El cumplimiento general está 8 puntos         │
│    porcentuales bajo lo esperado para octubre    │
│                                                  │
│  • Territorio 5 requiere intervención urgente    │
│    (solo 65% de cumplimiento)                    │
│                                                  │
│  • Inyección Trimestral sigue siendo el método   │
│    preferido (45% del total)                     │
│                                                  │
│  • Se recomienda reforzar captación en           │
│    últimos dos meses para alcanzar meta anual    │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  [ 📥 Descargar Excel ]  [ 🖨️ Imprimir PDF ]    │
│  [ 📧 Enviar por Email ]  [ 🔄 Actualizar ]     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.3.4 Planificación y Metas

**Acceso:**
```
🎯 Planificación → ⚙️ Configurar Metas
```

**Panel de Planificación:**

```
┌──────────────────────────────────────────────────┐
│  🎯 PLANIFICACIÓN DE METAS                       │
│                                                  │
│  Año: [2025 ▼]   [+ Crear Nuevo Año]            │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  1. PORCENTAJES GLOBALES POR MÉTODO              │
│  ────────────────────────────────────────────    │
│  Distribución de metas entre métodos (suma=100%) │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ Método                    %    [Editar]│     │
│  ├────────────────────────────────────────┤     │
│  │ Iny. Mensual           10.0%    [✏️]   │     │
│  │ Iny. Bimensual         10.0%    [✏️]   │     │
│  │ Iny. Trimestral        45.0%    [✏️] ⭐│     │
│  │ Píldora                12.0%    [✏️]   │     │
│  │ DIU                     2.0%    [✏️]   │     │
│  │ Implante                8.0%    [✏️]   │     │
│  │ Condón M                6.0%    [✏️]   │     │
│  │ Condón F                1.0%    [✏️]   │     │
│  │ Ritmo                   5.5%    [✏️]   │     │
│  │ Retiro                  0.25%   [✏️]   │     │
│  │ Emergencia              0.25%   [✏️]   │     │
│  │ ────────────────────────────────────   │     │
│  │ TOTAL:               100.00% ✅        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [ 💾 Guardar Cambios ]  [ ↩️ Restaurar ]       │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  2. AVANCE POR TERRITORIO                        │
│  ────────────────────────────────────────────    │
│  Cumplimiento de metas por territorio            │
│                                                  │
│  [Ver Detalle por Territorio ▼]                  │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  3. DISTRIBUCIÓN MENSUAL                         │
│  ────────────────────────────────────────────    │
│  Ajustar metas mensuales por comunidad           │
│                                                  │
│  [Configurar Metas Mensuales ▶]                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.3.5 Editar Porcentajes de Método

**Click en ✏️ de un método:**

```
┌────────────────────────────────────────┐
│  ✏️ Editar Porcentaje                  │
│  Inyección Trimestral                  │
│                                        │
│  Porcentaje Actual: 45.0%              │
│                                        │
│  Nuevo Porcentaje:                     │
│  ┌─────────────────────────────┐      │
│  │ 47.0_____________________% │      │
│  └─────────────────────────────┘      │
│                                        │
│  ⚠️ Al cambiar este porcentaje:        │
│  • Se recalcularán automáticamente    │
│    las proyecciones de todas las      │
│    comunidades                         │
│  • Las distribuciones mensuales       │
│    deberán ajustarse manualmente      │
│                                        │
│  [ Cancelar ]  [ Guardar ]             │
│                                        │
└────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:**
- La suma de todos los porcentajes **debe ser 100%**
- Los cambios afectan **todas las proyecciones**
- Coordina cambios con el Coordinador Municipal

---

### 3.3.6 Supervisión de Personal

**Acceso:**
```
👥 Personal → 📊 Supervisión
```

```
┌──────────────────────────────────────────────────┐
│  👥 SUPERVISIÓN DE PERSONAL                      │
│                                                  │
│  Período: [Octubre 2025 ▼]                       │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  ASISTENTES TÉCNICOS (3)                         │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Lic. Rosa Hernández                │     │
│  │    Territorios: T1, T2, T3             │     │
│  │    ──────────────────────────────────  │     │
│  │    Visitas Validadas:    156           │     │
│  │    Visitas Rechazadas:     2 (1.3%)    │     │
│  │    Tiempo Promedio:      1.2 días      │     │
│  │    Rendimiento:          🟢 Excelente  │     │
│  │    [Ver Detalle]                       │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  AUXILIARES DE ENFERMERÍA (12)                   │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Ana Patricia López                  │     │
│  │    Comunidades: 3                      │     │
│  │    ──────────────────────────────────  │     │
│  │    Visitas Registradas:   78           │     │
│  │    Visitas Validadas:     73 (94%)     │     │
│  │    Visitas Rechazadas:     5 (6%)      │     │
│  │    Última actividad:       Hoy 14:30     │     │
│  │    Rendimiento:          🟢 Muy Bueno  │     │
│  │    [Ver Detalle]                       │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Carlos Méndez                       │     │
│  │    Comunidades: 2                      │     │
│  │    ──────────────────────────────────  │     │
│  │    Visitas Registradas:   45           │     │
│  │    Visitas Validadas:     43 (96%)     │     │
│  │    Visitas Rechazadas:     2 (4%)      │     │
│  │    Última actividad:       Ayer 16:45  │     │
│  │    Rendimiento:          🟢 Muy Bueno  │     │
│  │    [Ver Detalle]                       │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 ⚠️ Juan Rodríguez                   │     │
│  │    Comunidades: 2                      │     │
│  │    ──────────────────────────────────  │     │
│  │    Visitas Registradas:   12           │     │
│  │    Visitas Validadas:      9 (75%)     │     │
│  │    Visitas Rechazadas:     3 (25%) ⚠️  │     │
│  │    Última actividad:       Hace 5 días │     │
│  │    Rendimiento:          🟡 Requiere   │     │
│  │                             Atención   │     │
│  │    [Ver Detalle] [📧 Contactar]        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [ 📥 Exportar Reporte ]  [ 📊 Ver Gráficas ]   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Indicadores de rendimiento:**
- 🟢 **Excelente:** >90% validados, activo diariamente
- 🟡 **Requiere Atención:** 70-90% validados, o inactivo >3 días
- 🔴 **Crítico:** <70% validados, o inactivo >7 días

---

### 3.3.7 Consejos para Encargados

**✅ Buenas Prácticas:**

1. **Monitoreo Diario**
   - Revisa el dashboard cada mañana
   - Identifica alertas tempranas
   - Actúa sobre problemas inmediatamente

2. **Análisis Semanal**
   - Genera reporte de cumplimiento
   - Identifica tendencias
   - Comunica resultados al equipo

3. **Reuniones de Seguimiento**
   - Semanales con asistentes técnicos
   - Mensuales con todo el equipo
   - Trimestrales de evaluación

4. **Toma de Decisiones Basada en Datos**
   - Usa reportes para justificar acciones
   - Identifica territorios/comunidades prioritarias
   - Reasigna recursos según necesidad

5. **Comunicación Efectiva**
   - Reconoce logros públicamente
   - Da retroalimentación constructiva
   - Mantén canales abiertos con el equipo

**❌ Errores a Evitar:**

- ❌ Revisar datos solo al final del mes
- ❌ No actuar sobre alertas tempranas
- ❌ Cambiar metas sin comunicar
- ❌ No dar seguimiento a personal con bajo rendimiento
- ❌ Generar reportes sin análisis ni acción

---

## 3.4 Coordinador Municipal

**Rol:** Máxima autoridad del sistema, administrador completo

**Permisos:**
- ✅ **TODOS** los permisos del Encargado SR
- ✅ Administrar usuarios (crear, editar, desactivar)
- ✅ Asignar territorios y comunidades
- ✅ Configurar sistema completo
- ✅ Crear backups de seguridad
- ✅ Acceso a todas las funciones administrativas

---

### 3.4.1 Dashboard del Coordinador

```
┌──────────────────────────────────────────────────┐
│  👑 DASHBOARD COORDINADOR MUNICIPAL              │
│  Distrito: Centro de Salud - Huehuetenango       │
│  Sistema: SGPF MSPAS v1.0                        │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  📊 INDICADORES ESTRATÉGICOS                     │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  10,500  │ │  3,847   │ │   37%    │        │
│  │Meta Anual│ │Ejecutado │ │Cumplim.  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │    45    │ │    19    │ │    5     │        │
│  │Comunid.  │ │Usuarios  │ │Territ.   │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  ⚠️ ALERTAS EJECUTIVAS                          │
│  ┌────────────────────────────────────────┐     │
│  │ 🔴 URGENTE                             │     │
│  │ • Territorio 5: Solo 65% cumplimiento  │     │
│  │ • 23 visitas sin validar (>72 hrs)     │     │
│  │                                        │     │
│  │ 🟡 ATENCIÓN                            │     │
│  │ • 3 auxiliares inactivos esta semana   │     │
│  │ • Meta mensual en riesgo (faltan 19)   │     │
│  │                                        │     │
│  │ 🟢 POSITIVO                            │     │
│  │ • Territorio 1 liderando con 93%       │     │
│  │ • Tendencia anual proyecta 95%         │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  🎯 ACCESOS RÁPIDOS                              │
│                                                  │
│  [👥 Usuarios]  [🎯 Planificación]               │
│  [📊 Reportes]  [💾 Backups]                     │
│  [⚙️ Sistema]   [👁️ Auditoría]                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.4.2 Administración de Usuarios

**Acceso:**
```
👥 Administración → 👤 Gestión de Usuarios
```

**Panel de Usuarios:**

```
┌──────────────────────────────────────────────────┐
│  👥 GESTIÓN DE USUARIOS                          │
│                                                  │
│  [➕ Crear Nuevo Usuario]    🔍 Buscar: [____]   │
│                                                  │
│  Filtros:                                        │
│  Rol: [Todos ▼]  Estado: [Activos ▼]            │
│                                                  │
│  ══════════════════════════════════════════════  │
│                                                  │
│  COORDINADOR MUNICIPAL (1)                       │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Dr. Juan Carlos Morales             │     │
│  │    admin@mspas.gob.gt                  │     │
│  │    Estado: 🟢 Activo                   │     │
│  │    Último acceso: Hoy 08:30            │     │
│  │    [✏️ Editar] [🔑 Reset Pass]         │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ENCARGADO SR (1)                                │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Lic. María García                   │     │
│  │    maria.garcia@mspas.gob.gt           │     │
│  │    Estado: 🟢 Activo                   │     │
│  │    Último acceso: Hoy 14:15            │     │
│  │    [✏️ Editar] [🔑 Reset Pass]         │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ASISTENTES TÉCNICOS (3)                         │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Lic. Rosa Hernández                 │     │
│  │    rosa.hernandez@mspas.gob.gt         │     │
│  │    Territorios: T1, T2, T3             │     │
│  │    Estado: 🟢 Activo                   │     │
│  │    Último acceso: Hoy 16:20            │     │
│  │    [✏️ Editar] [🗺️ Territorios]        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  AUXILIARES DE ENFERMERÍA (12)                   │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 Ana Patricia López                  │     │
│  │    aux01@mspas.gob.gt                  │     │
│  │    Comunidades: 3                      │     │
│  │    Estado: 🟢 Activo                   │     │
│  │    Último acceso: Hoy 14:30            │     │
│  │    [✏️ Editar] [🏘️ Comunidades]        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │ 👤 ⚠️ Juan Rodríguez                   │     │
│  │    juan.rodriguez@mspas.gob.gt         │     │
│  │    Comunidades: 2                      │     │
│  │    Estado: 🔴 Inactivo (5 días)        │     │
│  │    Último acceso: 16/10/2025           │     │
│  │    [✏️ Editar] [🏘️ Comunidades]        │     │
│  │    [📧 Enviar Recordatorio]            │     │
│  └────────────────────────────────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 3.4.3 Crear Nuevo Usuario

**Click en "➕ Crear Nuevo Usuario":**

```
┌────────────────────────────────────────┐
│  ➕ CREAR NUEVO USUARIO                │
│                                        │
│  INFORMACIÓN BÁSICA                    │
│  ──────────────────────────────────    │
│                                        │
│  Código Empleado:                      │
│  ┌─────────────────────────────┐      │
│  │ AUX006______________________│      │
│  └─────────────────────────────┘      │
│                                        │
│  DPI:                                  │
│  ┌─────────────────────────────┐      │
│  │ 1801199606060_______________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Nombres: *                            │
│  ┌─────────────────────────────┐      │
│  │ Laura María_________________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Apellidos: *                          │
│  ┌─────────────────────────────┐      │
│  │ Martínez Gómez______________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Email: *                              │
│  ┌─────────────────────────────┐      │
│  │ laura.martinez@mspas.gob.gt │      │
│  └─────────────────────────────┘      │
│                                        │
│  Teléfono:                             │
│  ┌─────────────────────────────┐      │
│  │ 78915678____________________│      │
│  └─────────────────────────────┘      │
│                                        │
│  Cargo:                                │
│  ┌─────────────────────────────┐      │
│  │ Auxiliar de Enfermería______│      │
│  └─────────────────────────────┘      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ROL Y PERMISOS                        │
│  ──────────────────────────────────    │
│                                        │
│  Rol: *                                │
│  ┌─────────────────────────────┐      │
│  │ Auxiliar de Enfermería  ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Permisos automáticos:                 │
│  ✅ Registrar visitas                  │
│  ❌ Validar registros                  │
│  ❌ Aprobar datos                      │
│  ❌ Generar reportes                   │
│  ❌ Administrar sistema                │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ASIGNACIÓN                            │
│  ──────────────────────────────────    │
│                                        │
│  Distrito:                             │
│  ┌─────────────────────────────┐      │
│  │ CS Huehuetenango        ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Territorio:                           │
│  ┌─────────────────────────────┐      │
│  │ Territorio 2            ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Comunidades:                          │
│  ☐ Todas del territorio                │
│  ☐ Seleccionar específicas:            │
│    ☐ San Pedro Soloma                  │
│    ☐ Santa Eulalia                     │
│    ☑ San Juan Ixcoy                    │
│    ☑ Soloma                            │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  CONTRASEÑA TEMPORAL                   │
│  ──────────────────────────────────    │
│                                        │
│  Contraseña: *                         │
│  ┌─────────────────────────────┐      │
│  │ temporal2025________________│      │
│  └─────────────────────────────┘      │
│                                        │
│  ⚠️ El usuario deberá cambiar su       │
│  contraseña en el primer acceso        │
│                                        │
│  * Campos obligatorios                │
│                                        │
│  [ Cancelar ]  [ Crear Usuario ]      │
│                                        │
└────────────────────────────────────────┘
```

**Después de crear:**

```
✅ Usuario creado exitosamente

Datos del nuevo usuario:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: Laura María Martínez Gómez
Email: laura.martinez@mspas.gob.gt
Rol: Auxiliar de Enfermería
Comunidades asignadas: 2
Contraseña temporal: temporal2025

⚠️ IMPORTANTE:
• Comunica la contraseña al usuario
• Debe cambiarla en el primer acceso
• Envía email de bienvenida

[📧 Enviar Credenciales]  [ Cerrar ]
```

---

### 3.4.4 Asignar Comunidades a un Auxiliar

**Click en "🏘️ Comunidades" de un auxiliar:**

```
┌────────────────────────────────────────┐
│  🏘️ ASIGNAR COMUNIDADES               │
│  Usuario: Ana Patricia López           │
│  Territorio: Territorio 1              │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  COMUNIDADES DEL TERRITORIO 1 (15)     │
│                                        │
│  [ ☐ Seleccionar Todas ]               │
│                                        │
│  ☑ Minerva (T1-001)                    │
│    MEF: 1,600 | 5.2 km                 │
│                                        │
│  ☑ San Pedro Soloma (T1-002)           │
│    MEF: 2,100 | 8.5 km                 │
│                                        │
│  ☑ Santa Ana Huista (T1-003)           │
│    MEF: 3,260 | 12.0 km                │
│                                        │
│  ☐ Concepción Huista (T1-004)          │
│    MEF: 1,890 | 15.2 km                │
│                                        │
│  ☐ Nentón (T1-005)                     │
│    MEF: 2,450 | 18.0 km                │
│                                        │
│  ... (10 más)                          │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  Comunidades seleccionadas: 3          │
│  MEF Total asignado: 6,960             │
│                                        │
│  [ Cancelar ]  [ Guardar Asignación ]  │
│                                        │
└────────────────────────────────────────┘
```

**Criterios de asignación:**
- ✅ Proximidad geográfica
- ✅ Accesibilidad (vías de comunicación)
- ✅ Carga de trabajo balanceada
- ✅ Experiencia del auxiliar

---

### 3.4.5 Gestión de Backups

**Acceso:**
```
⚙️ Sistema → 💾 Backups
```

```
┌────────────────────────────────────────┐
│  💾 GESTIÓN DE BACKUPS                 │
│                                        │
│  [ ➕ Crear Backup Ahora ]             │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  BACKUPS AUTOMÁTICOS                   │
│  ┌─────────────────────────────┐      │
│  │ Frecuencia: Diario           │      │
│  │ Hora: 02:00 AM               │      │
│  │ Retención: 30 días           │      │
│  │ Estado: ✅ Activo            │      │
│  │ [⚙️ Configurar]              │      │
│  └─────────────────────────────┘      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  BACKUPS DISPONIBLES (5)               │
│                                        │
│  📦 sgpf_backup_20251021_020000.db     │
│     Tamaño: 0.20 MB                    │
│     Fecha: 21/10/2025 02:00 AM         │
│     [📥 Descargar] [🗑️ Eliminar]       │
│                                        │
│  📦 sgpf_backup_20251020_020000.db     │
│     Tamaño: 0.19 MB                    │
│     Fecha: 20/10/2025 02:00 AM         │
│     [📥 Descargar] [🗑️ Eliminar]       │
│                                        │
│  📦 sgpf_backup_20251019_020000.db     │
│     Tamaño: 0.19 MB                    │
│     Fecha: 19/10/2025 02:00 AM         │
│     [📥 Descargar] [🗑️ Eliminar]       │
│                                        │
│  [Ver Todos los Backups (30)]          │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  💡 RECOMENDACIONES                    │
│  • Descarga backup mensual             │
│  • Guarda en ubicación segura          │
│  • Prueba restauración cada 3 meses    │
│                                        │
└────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:**
- Los backups son **críticos** para seguridad de datos
- Descarga y guarda **al menos 1 backup mensual**
- Almacena en **ubicación diferente** al servidor
- **Prueba** la restauración periódicamente

---

### 3.4.6 Auditoría del Sistema

**Acceso:**
```
⚙️ Sistema → 👁️ Auditoría
```

```
┌────────────────────────────────────────────────┐
│  👁️ AUDITORÍA DEL SISTEMA                     │
│                                                │
│  Período: [Últimos 7 días ▼]                   │
│                                                │
│  ════════════════════════════════════════════  │
│                                                │
│  ACTIVIDAD RECIENTE                            │
│                                                │
│  🔐 21/10/2025 14:30                           │
│     Ana Patricia López                         │
│     ✅ Login exitoso desde 192.168.1.45        │
│                                                │
│  📝 21/10/2025 14:32                           │
│     Ana Patricia López                         │
│     ✅ Registró visita #127 (María González)   │
│                                                │
│  ✅ 21/10/2025 16:20                           │
│     Rosa Hernández                             │
│     ✅ Validó visita #127                      │
│                                                │
│  👤 21/10/2025 09:15                           │
│     Dr. Juan Carlos Morales                    │
│     ✅ Creó usuario: Laura Martínez            │
│                                                │
│  🗑️ 20/10/2025 15:45                           │
│     Rosa Hernández                             │
│     ❌ Rechazó visita #124 (DPI incorrecto)    │
│                                                │
│  🔑 20/10/2025 10:20                           │
│     Carlos Méndez                              │
│     ✅ Cambió su contraseña                    │
│                                                │
│  ⚠️ 19/10/2025 08:30                           │
│     Sistema                                    │
│     ⚠️ Backup automático completado            │
│                                                │
│  🔴 18/10/2025 16:45                           │
│     Juan Rodríguez                             │
│     ❌ Intento de login fallido (3x)           │
│                                                │
│  ════════════════════════════════════════════  │
│                                                │
│  ESTADÍSTICAS DE SEGURIDAD                     │
│  ┌────────────────────────────────────┐       │
│  │ Logins exitosos:        234        │       │
│  │ Logins fallidos:          5        │       │
│  │ Visitas creadas:        156        │       │
│  │ Visitas validadas:      142        │       │
│  │ Visitas rechazadas:       8        │       │
│  │ Usuarios creados:         2        │       │
│  │ Cambios de contraseña:    7        │       │
│  └────────────────────────────────────┘       │
│                                                │
│  [ 📥 Exportar Log ]  [ 🔍 Buscar Avanzado ]   │
│                                                │
└────────────────────────────────────────────────┘
```

**Eventos auditados:**
- ✅ Logins y logouts
- ✅ Creación/modificación/eliminación de registros
- ✅ Validaciones y rechazos
- ✅ Cambios de configuración
- ✅ Creación/modificación de usuarios
- ✅ Backups y restauraciones
- ❌ Intentos fallidos de acceso
- ⚠️ Eventos de seguridad

---

### 3.4.7 Configuración del Sistema

**Acceso:**
```
⚙️ Sistema → ⚙️ Configuración General
```

```
┌────────────────────────────────────────┐
│  ⚙️ CONFIGURACIÓN DEL SISTEMA          │
│                                        │
│  INFORMACIÓN GENERAL                   │
│  ──────────────────────────────────    │
│                                        │
│  Nombre del Sistema:                   │
│  ┌─────────────────────────────┐      │
│  │ SGPF - MSPAS Huehuetenango  │      │
│  └─────────────────────────────┘      │
│                                        │
│  Distrito:                             │
│  ┌─────────────────────────────┐      │
│  │ CS Huehuetenango        ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  SEGURIDAD                             │
│  ──────────────────────────────────    │
│                                        │
│  Tiempo de sesión:                     │
│  ┌─────────────────────────────┐      │
│  │ 24 horas                ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Complejidad de contraseña:            │
│  ┌─────────────────────────────┐      │
│  │ Media (6+ caracteres)   ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Intentos de login permitidos:         │
│  ┌─────────────────────────────┐      │
│  │ 5 intentos              ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  BACKUPS                               │
│  ──────────────────────────────────    │
│                                        │
│  Frecuencia:                           │
│  ┌─────────────────────────────┐      │
│  │ Diario                  ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Hora:                                 │
│  ┌─────────────────────────────┐      │
│  │ 02:00 AM                ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  Retención (días):                     │
│  ┌─────────────────────────────┐      │
│  │ 30 días                 ▼   │      │
│  └─────────────────────────────┘      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  NOTIFICACIONES                        │
│  ──────────────────────────────────    │
│                                        │
│  ☑ Notificar validaciones              │
│  ☑ Notificar rechazos                  │
│  ☑ Alertas de seguridad                │
│  ☑ Recordatorios de metas              │
│  ☐ Notificaciones por email            │
│                                        │
│  [ Cancelar ]  [ Guardar Cambios ]     │
│                                        │
└────────────────────────────────────────┘
```

---

### 3.4.8 Consejos para Coordinadores

**✅ Buenas Prácticas de Administración:**

1. **Gestión de Usuarios**
   - Revisa usuarios activos mensualmente
   - Desactiva cuentas inactivas >30 días
   - Realiza auditorías de permisos trimestralmente

2. **Seguridad de Datos**
   - Descarga backup semanal
   - Guarda copia en ubicación externa
   - Verifica integridad de backups
   - Prueba restauración cada 3 meses

3. **Monitoreo del Sistema**
   - Revisa logs de auditoría semanalmente
   - Identifica patrones anómalos
   - Actúa inmediatamente sobre alertas de seguridad

4. **Planificación Estratégica**
   - Revisa cumplimiento de metas mensualmente
   - Ajusta porcentajes según resultados
   - Planifica con 6 meses de anticipación

5. **Comunicación Institucional**
   - Reporta a autoridades superiores mensualmente
   - Comparte logros con el equipo
   - Documenta decisiones importantes

**❌ Errores Críticos a Evitar:**

- ❌ No hacer backups regulares
- ❌ Compartir credenciales administrativas
- ❌ Ignorar alertas de seguridad
- ❌ Cambiar configuraciones sin documentar
- ❌ No capacitar al personal nuevo
- ❌ Tomar decisiones sin análisis de datos

---

## 4. Funciones Comunes

### 4.1 Cambiar Mi Contraseña

**Todos los roles pueden cambiar su contraseña:**

```
👤 Mi Perfil → 🔑 Cambiar Contraseña
```

```
┌────────────────────────────────────────┐
│  🔑 CAMBIAR CONTRASEÑA                 │
│                                        │
│  Contraseña Actual: *                  │
│  ┌─────────────────────────────┐      │
│  │ ••••••••                    │      │
│  └─────────────────────────────┘      │
│                                        │
│  Nueva Contraseña: *                   │
│  ┌─────────────────────────────┐      │
│  │ ••••••••••••                │      │
│  └─────────────────────────────┘      │
│  Fortaleza: 🟢 Fuerte                  │
│                                        │
│  Confirmar Nueva Contraseña: *         │
│  ┌─────────────────────────────┐      │
│  │ ••••••••••••                │      │
│  └─────────────────────────────┘      │
│  ✅ Las contraseñas coinciden          │
│                                        │
│  Requisitos:                           │
│  ✅ Mínimo 6 caracteres                │
│  ✅ No puede ser igual a la anterior   │
│  💡 Recomendado: Letras + Números      │
│                                        │
│  [ Cancelar ]  [ Cambiar Contraseña ]  │
│                                        │
└────────────────────────────────────────┘
```

---

### 4.2 Ver Mi Perfil

**Todos los usuarios pueden ver su información:**

```
👤 Mi Perfil → 👁️ Ver Perfil
```

```
┌────────────────────────────────────────┐
│  👤 MI PERFIL                          │
│                                        │
│  INFORMACIÓN PERSONAL                  │
│  ──────────────────────────────────    │
│  Código: AUX001                        │
│  DPI: 1801199101010                    │
│  Nombres: Ana Patricia                 │
│  Apellidos: López Morales              │
│  Email: aux01@mspas.gob.gt             │
│  Teléfono: 78910123                    │
│  Cargo: Auxiliar de Enfermería         │
│                                        │
│  [ ✏️ Editar Información ]             │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ROL Y PERMISOS                        │
│  ──────────────────────────────────    │
│  Rol: Auxiliar de Enfermería           │
│  Nivel: 1                              │
│                                        │
│  Permisos:                             │
│  ✅ Registrar visitas                  │
│  ❌ Validar registros                  │
│  ❌ Aprobar datos                      │
│  ❌ Generar reportes                   │
│  ❌ Administrar sistema                │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ASIGNACIÓN                            │
│  ──────────────────────────────────    │
│  Distrito: CS Huehuetenango            │
│  Territorio: Territorio 1              │
│  Comunidades Asignadas: 3              │
│                                        │
│  • Minerva (T1-001)                    │
│  • San Pedro Soloma (T1-002)           │
│  • Santa Ana Huista (T1-003)           │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ACTIVIDAD                             │
│  ──────────────────────────────────    │
│  Fecha de ingreso: 01/01/2025          │
│  Último acceso: Hoy 14:30              │
│  Total de registros: 234               │
│                                        │
└────────────────────────────────────────┘
```

---

### 4.3 Buscar en el Sistema

**Barra de búsqueda global (parte superior):**

```
┌────────────────────────────────────────┐
│  🔍 Buscar en SGPF...                  │
└────────────────────────────────────────┘
```

**Puedes buscar:**
- 👤 Usuarias por nombre, apellido o DPI
- 📋 Visitas por número de registro
- 🏘️ Comunidades por nombre o código
- 👥 Usuarios del sistema (si eres admin)

**Ejemplo de resultados:**

```
┌────────────────────────────────────────┐
│  🔍 Resultados para "maria"            │
│                                        │
│  USUARIAS (3)                          │
│  ──────────────────────────────────    │
│  👤 María Luisa González Pérez         │
│     DPI: 2801199501234                 │
│     Comunidad: Minerva                 │
│     [Ver Ficha]                        │
│                                        │
│  👤 María Carmen Pérez López           │
│     DPI: 2801199401111                 │
│     Comunidad: San Pedro Soloma        │
│     [Ver Ficha]                        │
│                                        │
│  USUARIOS (1) - Solo si eres admin     │
│  ──────────────────────────────────    │
│  👥 Lic. María García                  │
│     Encargado SR                       │
│     [Ver Perfil]                       │
│                                        │
└────────────────────────────────────────┘
```

---

## 5. Preguntas Frecuentes

### 5.1 Preguntas Generales

**❓ ¿Puedo usar el sistema desde mi celular?**

✅ Sí, el sistema es **responsive** y se adapta a pantallas pequeñas. Sin embargo, para mejor experiencia se recomienda usar tablet o computadora.

---

**❓ ¿Qué pasa si olvido mi contraseña?**

🔑 Contacta a tu **Asistente Técnico** o al **Coordinador Municipal** para que restablezca tu contraseña. Por seguridad, solo ellos pueden hacerlo.

---

**❓ ¿Puedo acceder desde mi casa?**

🏠 Depende de la configuración del sistema. Si está instalado en servidor local, solo desde la red del Centro de Salud. Si está en la nube, desde cualquier lugar con internet.

---

**❓ ¿El sistema guarda automáticamente?**

💾 Sí, cuando presionas "Guardar" en cualquier formulario, los datos se guardan inmediatamente en el servidor.

---

### 5.2 Preguntas sobre Registros

**❓ ¿Puedo registrar una visita de días anteriores?**

📅 Sí, pero **no es recomendable**. Registra siempre el mismo día de la visita. Si tienes atraso, coordina con tu Asistente Técnico.

---

**❓ ¿Qué hago si escribí mal el DPI?**

🔄 Si aún no está validada, puedes **editar** el registro. Si ya fue validada, contacta a tu Asistente Técnico para que la rechace y puedas registrarla correctamente.

---

**❓ ¿Puedo eliminar una visita que registré?**

🗑️ No puedes eliminar directamente. Solo los administradores pueden eliminar. Si cometiste un error, edita el registro o pide que lo rechacen.

---

**❓ ¿Cuánto tiempo tengo para registrar una visita?**

⏰ Lo ideal es registrar **el mismo día**. Máximo dentro de **24 horas**. Después de 3 días, el Asistente Técnico recibirá una alerta.

---

### 5.3 Preguntas sobre Usuarias

**❓ ¿Qué hago si una usuaria no tiene DPI?**

📝 Todas las usuarias **deben tener DPI** para ser registradas. Si no lo tiene, regístrala temporalmente con un identificador y actualiza cuando obtenga su DPI.

---

**❓ ¿Cómo sé si una usuaria es "Nueva", "Reconsulta" o "Activa"?**

📊 El sistema lo calcula **automáticamente**:
- **Nueva:** Primera visita
- **Reconsulta:** 2+ visitas en el primer año
- **Activa:** Visitas regulares después del primer año

---

**❓ ¿Puedo cambiar los datos personales de una usuaria?**

✏️ Solo el **Coordinador Municipal** puede editar datos personales. Si detectas un error, repórtalo.

---

### 5.4 Preguntas sobre Validación

**❓ ¿Cuánto tiempo tarda en validarse una visita?**

⏱️ Depende del Asistente Técnico. Lo normal es dentro de **24-48 horas**. Puedes ver el estado en "Mis Registros".

---

**❓ ¿Qué pasa si rechazan mi visita?**

❌ Recibirás una **notificación** con el motivo. Debes registrar nuevamente la visita con los datos correctos.

---

**❓ ¿Puedo apelar un rechazo?**

💬 Sí, comunícate con tu Asistente Técnico para aclarar la situación. Si el rechazo fue por error, pueden validar la nueva entrada.

---

## 6. Solución de Problemas

### 6.1 Problemas de Acceso

**🔴 PROBLEMA: "Token inválido o expirado"**

**Causa:** Tu sesión expiró (después de 24 horas)

**Solución:**
1. Cierra el navegador
2. Abre nuevamente el sistema
3. Inicia sesión con tus credenciales

---

**🔴 PROBLEMA: "Credenciales incorrectas"**

**Causa:** Email o contraseña incorrectos

**Solución:**
1. Verifica que estás escribiendo correctamente
2. Asegúrate de que MAYÚSCULAS esté desactivado
3. Si olvidaste tu contraseña, contacta al administrador

---

**🔴 PROBLEMA: "Usuario bloqueado"**

**Causa:** Demasiados intentos fallidos de login

**Solución:**
1. Espera 15 minutos
2. Si persiste, contacta al Coordinador Municipal
3. Él desbloqueará tu cuenta

---

### 6.2 Problemas de Registro

**🔴 PROBLEMA: "El DPI ya está registrado"**

**Causa:** Ya existe una usuaria con ese DPI

**Solución:**
1. Usa "Buscar Usuaria" primero
2. Si la encuentras, registra la visita en su ficha existente
3. Si no la encuentras, contacta al administrador (puede ser usuario inactivo)

---

**🔴 PROBLEMA: "No tienes permisos para registrar en esta comunidad"**

**Causa:** La comunidad no está en tu lista asignada

**Solución:**
1. Verifica en "Mis Comunidades"
2. Si debería estar asignada, contacta a tu Asistente Técnico
3. Él puede solicitar que te asignen esa comunidad

---

**🔴 PROBLEMA: "Error guardando el registro"**

**Causa:** Problemas de conexión o servidor

**Solución:**
1. Verifica tu conexión a internet
2. Recarga la página (F5)
3. Intenta nuevamente
4. Si persiste, contacta soporte técnico

---

### 6.3 Problemas de Rendimiento

**🔴 PROBLEMA: "El sistema está lento"**

**Solución:**
1. Cierra pestañas innecesarias del navegador
2. Borra caché y cookies del navegador
3. Reinicia el navegador
4. Si persiste, reporta al Coordinador

---

**🔴 PROBLEMA: "No se cargan las listas"**

**Solución:**
1. Verifica conexión a internet
2. Recarga la página (F5)
3. Intenta desde otro navegador
4. Reporta si el problema continúa

---

### 6.4 ¿Cuándo Contactar Soporte?

**Contacta inmediatamente si:**
- ❌ No puedes iniciar sesión después de varios intentos
- ❌ El sistema muestra errores constantes
- ❌ Perdiste registros importantes
- ❌ Sospechas de acceso no autorizado a tu cuenta
- ❌ El sistema está completamente caído

**Información a proporcionar:**
- Tu nombre y rol
- Email de acceso
- Descripción detallada del problema
- Capturas de pantalla del error
- Hora aproximada cuando ocurrió

---

## 7. Glosario

**Términos importantes del sistema:**

| Término | Significado |
|---------|-------------|
| **DPI** | Documento Personal de Identificación (13 dígitos) |
| **MEF** | Mujer en Edad Fértil (15-49 años) |
| **SR** | Salud Reproductiva |
| **CS** | Centro de Salud |
| **Dashboard** | Pantalla principal con resumen de información |
| **Validar** | Revisar y aprobar un registro |
| **Rechazar** | Devolver un registro por errores |
| **Token** | Código de seguridad temporal para tu sesión |
| **Backup** | Copia de seguridad de la base de datos |
| **Rol** | Tipo de usuario con permisos específicos |
| **Método** | Método anticonceptivo administrado |
| **Proyección** | Meta estimada de usuarias a atender |
| **Cumplimiento** | Porcentaje de meta alcanzada |
| **Usuaria Nueva** | Primera visita de planificación familiar |
| **Usuaria Reconsulta** | 2+ visitas en el primer año |
| **Usuaria Activa** | Visitas regulares continuas |

---

## 8. Contacto y Soporte

### 📞 Información de Contacto

**Soporte Técnico:**
- 📧 Email: **gdgl1105@gmail.com**
- 📱 WhatsApp: **(Número a definir)**
- ⏰ Horario: Lunes a Viernes, 8:00 AM - 5:00 PM

**Coordinador Municipal:**
- 📧 Email: **admin@mspas.gob.gt**
- ☎️ Teléfono: **(Número del CS)**

**Centro de Salud:**
- 📍 Dirección: Huehuetenango, Guatemala
- ☎️ Teléfono Principal: **(Número principal)**

---

### 💡 Recursos Adicionales

**Documentación:**
- 📄 [Guía de Instalación](INSTALACION.md)
- 📄 [Documentación de API](API.md)
- 📄 [Manual Técnico](GUIA_DESARROLLADORES.md)
- 📄 [Seguridad del Sistema](SEGURIDAD.md)

**Capacitaciones:**
- 🎓 Capacitación inicial: 4 horas
- 🎓 Refuerzo mensual: 1 hora
- 🎓 Material de apoyo: Videos tutoriales (próximamente)

---

### 📝 Feedback y Sugerencias

**¿Tienes ideas para mejorar el sistema?**

Envía tus sugerencias a: **gdgl1105@gmail.com**

Incluye:
- Tu nombre y rol
- Descripción de la mejora
- Cómo beneficiaría al sistema
- Prioridad sugerida (baja/media/alta)

---

<div align="center">

**Manual de Usuario - SGPF MSPAS**

*Versión 1.0 - Octubre 2025*

---

**📖 Última actualización: 21/10/2025**

**👨‍💻 Desarrollado por: Ing. Gerbert David García Loaiza**

**🏥 Ministerio de Salud Pública y Asistencia Social**

**📍 Huehuetenango, Guatemala**

---

*Este manual es un documento vivo que se actualiza continuamente.*  
*Si encuentras errores o información desactualizada, repórtalos.*

</div>
