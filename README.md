# 📚 Documentación Profesional para el Repositorio

Voy a crear una estructura de documentación completa y profesional para tu proyecto.

---

## 📄 Archivo 1: `README.md` (Principal)

```markdown
# 🏥 SGPF MSPAS - Sistema de Gestión de Planificación Familiar

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.2-blue.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

**Sistema de Gestión de Planificación Familiar**  
**Ministerio de Salud Pública y Asistencia Social**  
**Centro de Salud El Calvario, Huehuetenango, Guatemala**

</div>

---

## 📋 Índice de Documentación

- [📖 Acerca del Proyecto](#-acerca-del-proyecto)
- [✨ Características Principales](#-características-principales)
- [🔒 Sistema de Seguridad](docs/SEGURIDAD.md)
- [🚀 Instalación y Configuración](docs/INSTALACION.md)
- [📘 Manual de Usuario](docs/MANUAL_USUARIO.md)
- [🔧 Guía para Desarrolladores](docs/GUIA_DESARROLLADORES.md)
- [🏗️ Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [🗄️ Base de Datos](docs/BASE_DATOS.md)
- [🌐 API Reference](docs/API.md)
- [⚠️ Información Importante](#️-información-importante)
- [👨‍💻 Autor](#-autor)
- [📞 Contacto y Soporte](#-contacto-y-soporte)

---

## 📖 Acerca del Proyecto

El **Sistema de Gestión de Planificación Familiar (SGPF)** es una aplicación web desarrollada para el Ministerio de Salud Pública y Asistencia Social de Guatemala, específicamente para el Centro de Salud de El Calvario, Huehuetenango.

### 🎓 Contexto Académico

Este proyecto fue desarrollado como **Trabajo de Tesis de Graduación** para la **Universidad Mariano Gálvez de Guatemala**, por el Ingeniero en Sistemas **Gerbert David García Loaiza**.

**Objetivo:** Digitalizar y optimizar el proceso de registro, seguimiento y reporte de servicios de planificación familiar en el área de salud de Huehuetenango.

### 📅 Información del Proyecto

- **Fecha de Inicio:** Enero 2025
- **Versión Actual:** 2.0.2
- **Estado:** En Producción
- **Institución Beneficiaria:** Centro de Salud El Calvario, Huehuetenango
- **Universidad:** Universidad Mariano Gálvez de Guatemala
- **Carrera:** Ingeniería en Sistemas de Información y Ciencias de la Computación

---

## ✨ Características Principales

### 📊 Gestión de Datos
- ✅ **Registro de Usuarias Individuales**
  - Datos personales completos
  - Información médica relevante
  - Gestión de métodos anticonceptivos
  - Historial de visitas y seguimiento

- ✅ **Sistema de Visitas**
  - Registro de visitas individuales
  - Seguimiento de citas programadas
  - Control de dosis y reabastecimiento
  - Alertas de próximas visitas

- ✅ **Planificación y Metas**
  - Configuración de metas anuales por método
  - Cálculo automático de proyecciones
  - Distribución por comunidades
  - Seguimiento mensual y trimestral

### 👥 Gestión por Roles
- 👨‍⚕️ **Auxiliar de Enfermería**
  - Registro de visitas individuales
  - Consulta de usuarias asignadas
  - Dashboard personalizado

- 👩‍💼 **Asistente Técnico**
  - Validación de visitas
  - Supervisión de auxiliares
  - Reportes territoriales

- 🏥 **Encargado de Servicio de Reproducción**
  - Gestión de usuarios del sistema
  - Configuración de metas
  - Aprobación de registros
  - Reportes completos

- 🎯 **Coordinador Municipal**
  - Visión general del departamento
  - Reportes ejecutivos
  - Análisis comparativos
  - Administración del sistema

### 📈 Reportes y Estadísticas
- Reportes mensuales, trimestrales y anuales
- Exportación a Excel y PDF
- Gráficas interactivas
- Comparativos inter-territoriales
- Dashboard ejecutivo en tiempo real

### 🔒 Seguridad Empresarial
- Autenticación JWT con tokens
- Timeout de sesión por inactividad
- Renovación automática de tokens
- Detección de DevTools
- Logging de eventos de seguridad
- Sincronización entre pestañas
- [Ver documentación completa de seguridad →](docs/SEGURIDAD.md)

---

## 🛠️ Stack Tecnológico

### Frontend
- **HTML5, CSS3, JavaScript ES6+**
- **Tailwind CSS** - Framework de estilos
- **Chart.js** - Gráficas y visualizaciones
- **jsPDF & ExcelJS** - Exportación de reportes

### Backend
- **Node.js** v18+
- **Express.js** - Framework web
- **SQLite3** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas

### Infraestructura
- **Hosting:** Hostinger Cloud
- **Dominio:** gerbert.hopitalbarillas.cloud
- **SSL:** Let's Encrypt
- **Backup:** Automático diario

---

## 🚀 Inicio Rápido

### Prerrequisitos
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Instalación
```bash
# Clonar repositorio
git clone [URL_DEL_REPOSITORIO]
cd sgpf-mspas

# Instalar dependencias del backend
cd backend
npm install

# Configurar base de datos
npm run setup-db

# Iniciar servidor de desarrollo
npm run dev
```

### Frontend
```bash
# En otra terminal, desde la raíz del proyecto
cd frontend
# Servir con cualquier servidor HTTP
npx http-server -p 3000 -c-1
```

La aplicación estará disponible en `http://localhost:3000`

**Usuarios de Prueba:**
- Auxiliar: `aux01@mspas.gob.gt` / `123456`
- Asistente: `asist01@mspas.gob.gt` / `123456`
- Encargado: `encargado@mspas.gob.gt` / `123456`
- Coordinador: `admin@mspas.gob.gt` / `123456`

---

## ⚠️ INFORMACIÓN IMPORTANTE

### 🔴 MIGRACIÓN DE HOSTING OBLIGATORIA

**FECHA LÍMITE: AGOSTO 2027**

El servicio de hosting actual en Hostinger está contratado hasta **Septiembre 2027**. Es **CRÍTICO** realizar la migración a un nuevo proveedor de hosting **antes de Agosto 2027** para evitar interrupciones del servicio.

#### Acciones Requeridas:

1. **Julio 2027:** Seleccionar nuevo proveedor de hosting
2. **Agosto 2027:** Realizar migración completa del sistema
3. **Antes de Septiembre 2027:** Validar funcionamiento en nuevo servidor

#### Información del Hosting Actual:
- **Proveedor:** Hostinger
- **Plan:** Cloud Hosting
- **Dominio:** gerbert.hopitalbarillas.cloud
- **Vencimiento:** Septiembre 2027
- **⚠️ NO RENOVAR - MIGRAR**

#### Checklist de Migración:
- [ ] Backup completo de base de datos
- [ ] Backup de todos los archivos del sistema
- [ ] Configurar nuevo servidor
- [ ] Transferir dominio o configurar DNS
- [ ] Instalar certificado SSL
- [ ] Migrar base de datos
- [ ] Probar todas las funcionalidades
- [ ] Actualizar documentación con nueva configuración

**Contactar al desarrollador si se necesita asistencia con la migración.**

---

## 📊 Estado del Proyecto

### Versión 2.0.2 (Actual)

**Características Implementadas:**
- ✅ Sistema de registro individual V2.0 (3 pasos)
- ✅ Dashboard por roles
- ✅ Planificación y metas anuales
- ✅ Reportes mensuales/trimestrales/anuales
- ✅ Sistema de seguridad empresarial completo
- ✅ Validación de visitas
- ✅ Gestión de usuarios y permisos
- ✅ Alcance territorial por usuario
- ✅ Exportación de reportes (Excel/PDF)
- ✅ Sincronización multi-pestaña
- ✅ Optimización de performance

**Progreso General:** 98% ✅

---

## 🗺️ Roadmap Futuro

### Versión 2.1 (Planificada)
- [ ] App móvil (Android/iOS)
- [ ] Modo offline con sincronización
- [ ] Notificaciones push
- [ ] Integración con sistemas nacionales de salud

### Versión 3.0 (Conceptual)
- [ ] Inteligencia artificial para predicciones
- [ ] Dashboard de análisis predictivo
- [ ] Sistema de geolocalización
- [ ] API pública para integraciones

---

## 👨‍💻 Autor

<div align="center">

### Ingeniero Gerbert David García Loaiza

**Ingeniero en Sistemas de Información y Ciencias de la Computación**  
Universidad Mariano Gálvez de Guatemala

[![Email](https://img.shields.io/badge/Email-gdgl1105%40gmail.com-red.svg)](mailto:gdgl1105@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue.svg)](#)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black.svg)](#)

</div>

---

## 📞 Contacto y Soporte

### Soporte Técnico
- **Email:** gdgl1105@gmail.com
- **Horario:** Lunes a Viernes, 8:00 AM - 5:00 PM (GMT-6)

### Institución
- **Centro de Salud El Calvario**
- **Huehuetenango, Guatemala**
- **Ministerio de Salud Pública y Asistencia Social**

### Universidad
- **Universidad Mariano Gálvez de Guatemala**
- **Facultad de Ingeniería en Sistemas**
- **Campus Huehuetenango**

---

## 📄 Licencia

Este proyecto es propiedad del **Ministerio de Salud Pública y Asistencia Social de Guatemala** y fue desarrollado como trabajo de tesis para la **Universidad Mariano Gálvez de Guatemala**.

**Todos los derechos reservados © 2025**

El uso, copia, modificación y distribución de este software está restringido y requiere autorización expresa de las instituciones mencionadas.

---

## 🙏 Agradecimientos

- **Ministerio de Salud Pública y Asistencia Social** - Por la confianza y apoyo
- **Centro de Salud El Calvario** - Por facilitar el desarrollo e implementación
- **Universidad Mariano Gálvez de Guatemala** - Por la formación académica
- **Personal de Salud de Huehuetenango** - Por su colaboración y retroalimentación

---

<div align="center">

**Desarrollado con ❤️ para mejorar la salud reproductiva en Guatemala**

*Sistema de Gestión de Planificación Familiar - MSPAS*

</div>

