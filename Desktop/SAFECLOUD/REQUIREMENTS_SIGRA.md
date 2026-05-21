# Documento de Requerimientos
## SAFECloud + SIGRA Security Intelligence Engine

**Fecha:** Mayo 21, 2026  
**Versión:** 1.0  
**Estado:** En revisión  
**Autor:** SAFECloud Development Team

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento formaliza los requerimientos funcionales y no funcionales para la integración del motor SIGRA (Security Intelligence Engine) en la plataforma SAFECloud. SIGRA funcionará como un módulo inteligente de monitoreo, análisis de comportamiento, prevención de filtraciones y evaluación de riesgos.

### 1.2 Definición del Producto

**SAFECloud** es una plataforma SaaS de gestión documental, auditoría y control de acceso con análisis inteligente de riesgos para prevenir filtración de datos.

**SIGRA** es el motor de inteligencia de seguridad que analiza en tiempo real eventos, comportamientos de usuarios y accesos a documentos críticos, generando alertas preventivas y bloqueando acciones de riesgo.

---

## 2. Objetivo General

Implementar una plataforma SaaS que permita gestionar documentos, usuarios, permisos, proyectos y evidencias, incorporando el motor SIGRA para evaluar riesgos de acceso, detectar comportamientos anómalos y generar alertas preventivas ante posibles filtraciones de información.

### 2.1 Objetivos Específicos

- **OBJ-01:** Gestionar empresas, usuarios, roles y permisos de forma centralizada y multi-tenant
- **OBJ-02:** Implementar control de acceso basado en roles (RBAC)
- **OBJ-03:** Permitir carga, versioning y clasificación de documentos por criticidad
- **OBJ-04:** Registrar todas las acciones del usuario para auditoría e investigación
- **OBJ-05:** Implementar motor SIGRA de análisis de riesgos en tiempo real
- **OBJ-06:** Generar alertas automáticas ante eventos sospechosos o accesos de riesgo
- **OBJ-07:** Bloquear preventivamente acciones cuando el riesgo sea crítico
- **OBJ-08:** Mantener trazabilidad completa para cumplimiento normativo
- **OBJ-09:** Proporcionar dashboards ejecutivos de seguridad

---

## 3. Alcance del Sistema

### 3.1 Módulos Principales

El sistema SAFECloud + SIGRA deberá contar con los siguientes módulos:

1. **Gestión de Usuarios y Roles** - Administración de acceso
2. **Autenticación y Sesiones** - Control de identidad y sesiones
3. **Gestión Documental** - Carga, almacenamiento y versioning
4. **Control de Acceso** - Permisos granulares por documento
5. **Gestión de Proyectos** - Organización y seguimiento
6. **Auditoría y Trazabilidad** - Registro inmutable de eventos
7. **Motor SIGRA** - Análisis de riesgos e inteligencia de seguridad
8. **Alertas y Notificaciones** - Sistema de alertas automáticas
9. **Dashboards y Reportes** - Visualización de datos

### 3.2 Alcance Funcional

El sistema permitirá:

- ✅ Gestionar empresas/clientes
- ✅ Administrar usuarios y roles diferenciados
- ✅ Cargar y clasificar documentos por criticidad
- ✅ Controlar accesos mediante permisos granulares
- ✅ Registrar todas las acciones del usuario
- ✅ Analizar eventos con SIGRA en tiempo real
- ✅ Generar alertas automáticas de riesgo
- ✅ Visualizar dashboards ejecutivos de seguridad
- ✅ Mantener trazabilidad para auditorías
- ✅ Bloquear acciones críticas según nivel de riesgo
- ✅ Exportar reportes en PDF y Excel

### 3.3 Alcance No Incluido (Fase 1)

- Análisis predictivo con Machine Learning
- Automatización de respuestas avanzadas
- Integración con SIEM externo
- Análisis de tráfico de red
- Integración con sistemas DLP comerciales

---

## 4. Módulos Principales

### 4.1 Módulo de Usuarios y Roles

#### Funcionalidades

- Crear, editar, activar y desactivar usuarios
- Asignar roles y permisos
- Asociar usuario con empresa y proyecto
- Definir permisos por perfil
- Gestionar grupos de usuarios
- Auditar cambios de roles

#### Roles Sugeridos

| Rol | Descripción | Permisos Clave |
|-----|-------------|---|
| Superadmin SAFECloud | Administrador general del sistema | Acceso total |
| Administrador Empresa | Gestor de su empresa | Usuarios, documentos, proyectos |
| Jefatura SGI/HSEC | Supervisión de seguridad | Auditoría, alertas, bloqueos |
| Jefe de Proyecto | Responsable del proyecto | Documentos, usuarios del proyecto |
| Supervisor | Supervisa equipos | Lectura de documentos, reportes |
| Usuario Lector | Acceso restringido | Lectura de documentos asignados |
| Auditor | Análisis de eventos | Lectura de logs y auditoría |
| Cliente Externo | Acceso limitado a documentos | Lectura de documentos públicos |

### 4.2 Módulo de Autenticación

#### Funcionalidades

- Inicio de sesión con correo y contraseña
- Recuperación de contraseña
- Cambio obligatorio de contraseña en primer acceso
- Autenticación de doble factor (2FA)
- Bloqueo de cuenta por intentos fallidos (5+ intentos)
- Cierre de sesión automático (inactividad 30 minutos)
- Registro de IP y dispositivo
- Historial de sesiones activas

#### Requerimientos de Seguridad

- Contraseñas cifradas con bcrypt/PBKDF2
- HTTPS obligatorio en todas las comunicaciones
- Tokens JWT con expiración
- Soporte para autenticadores TOTP (Google Authenticator, Microsoft Authenticator)
- Notificación de inicio de sesión nuevo desde IP desconocida

### 4.3 Módulo Documental

#### Funcionalidades

- Cargar documentos (PDF, DOCX, XLSX, PPTX, TXT, CSV)
- Descargar documentos
- Visualizar documentos (preview)
- Editar metadatos
- Controlar versiones (mantener historial)
- Clasificar documentos por nivel de criticidad
- Asignar permisos por documento
- Registrar historial de cambios
- Búsqueda y filtrado de documentos

#### Clasificación de Criticidad

| Nivel | Tipo | Ejemplos | Riesgo SIGRA |
|-------|------|----------|---|
| 1 | Público | Documentos públicos, marketing | Bajo |
| 2 | Interno | Procedimientos, políticas internas | Medio |
| 3 | Confidencial | Contratos, matrices legales, info de empleados | Alto |
| 4 | Crítico | RUT, credenciales, SSN, certificados SSL, evidencias críticas | Crítico |

### 4.4 Módulo de Proyectos

#### Funcionalidades

- Crear, editar y eliminar proyectos
- Asignar usuarios al proyecto
- Asociar documentos al proyecto
- Cargar evidencias (screenshots, reportes, registros)
- Visualizar avance del proyecto
- Filtrar por cliente, estado o responsable
- Establecer fechas hito
- Gestionar entregables

### 4.5 Módulo de Auditoría y Trazabilidad

#### Registro de Eventos

El sistema registrará automáticamente:

- ✅ Quién ingresó (usuario_id)
- ✅ Cuándo ingresó (timestamp UTC)
- ✅ Desde qué IP (ip_address)
- ✅ Desde qué dispositivo (device_type, user_agent)
- ✅ Qué documento abrió (documento_id, acción=view)
- ✅ Qué documento descargó (documento_id, acción=download, tamaño)
- ✅ Qué documento modificó (documento_id, acción=edit, cambios)
- ✅ Qué permisos cambió (cambios de roles o permisos)
- ✅ Qué alerta generó SIGRA (alerta_id, puntaje_riesgo)
- ✅ Qué acción tomó el sistema (bloqueo, notificación, etc.)

#### Características Técnicas

- Logs inalterables (append-only)
- Exportación de auditoría en PDF
- Filtrado por usuario, fecha, acción
- Búsqueda full-text de eventos
- Retención de logs: mínimo 5 años
- Encriptación de logs en almacenamiento

### 4.6 Módulo SIGRA - Motor de Análisis de Riesgos

#### Propósito

Monitorear en tiempo real los eventos dentro de SAFECloud y asignar un puntaje de riesgo que permita identificar comportamientos anómalos, accesos sospechosos y prevenir filtraciones de datos.

#### Eventos que Monitorea

SIGRA analizará y puntuará los siguientes eventos:

| Evento | Descripción | Puntaje Base |
|--------|-------------|---|
| Acceso fuera de horario | Usuario accede entre 20:00-06:00 | 15 |
| IP desconocida | IP no registrada previamente | 20 |
| Dispositivo nuevo | Dispositivo no reconocido | 20 |
| Múltiples intentos fallidos | Más de 5 intentos fallidos de login | 15 |
| Descarga masiva | Más de 10 documentos en 5 minutos | 25 |
| Acceso a doc. confidencial | Nivel 3 de criticidad | 20 |
| Acceso a doc. crítico | Nivel 4 de criticidad | 30 |
| Cambio de permisos | Usuario modifica permisos de otros | 25 |
| Eliminación de documento | Borrado de documentos | 30 |
| Usuario con historial | Usuario con alertas previas (últimos 30 días) | 10 |
| Acceso fuera de proyecto | Usuario accede a proyecto no asignado | 20 |
| Rol anómalo | Acción incompatible con el rol | 25 |
| Descarga de backup/export | Exportación masiva de datos | 35 |

#### Variables de Análisis

El motor SIGRA utilizará las siguientes variables:

| Variable | Fuente | Uso |
|----------|--------|-----|
| Hora de acceso | Evento de login | Detectar acceso fuera de horario |
| IP | Header de petición HTTP | Identificar ubicaciones o redes inusuales |
| Dispositivo | User-Agent HTTP | Detectar equipos no reconocidos |
| Rol del usuario | BD de usuarios | Evaluar si el usuario tiene permisos adecuados |
| Tipo de documento | Clasificación documental | Medir criticidad de la información |
| Acción | Auditoría (view, download, edit, delete) | Evaluar intención |
| Volumen | Cantidad de eventos en tiempo | Detectar descarga masiva |
| Historial | BD de alertas | Detectar patrón de alertas |
| Proyecto | Asignación de usuario | Detectar accesos fuera del alcance |
| Intentos fallidos | Registro de intentos | Posible ataque o credencial comprometida |
| Contexto temporal | Calendario laboral | Validar horario laboral |

#### Clasificación de Riesgo

| Puntaje | Nivel | Color | Acción | Timeframe |
|---------|-------|-------|--------|-----------|
| 0 - 30 | 🟢 Bajo | Verde | Registrar evento | Inmediato |
| 31 - 60 | 🟡 Medio | Amarillo | Generar alerta | Inmediato |
| 61 - 80 | 🔴 Alto | Rojo | Notificar administrador | Inmediato |
| 81+ | 🔺 Crítico | Rojo Oscuro | Bloquear acción + Escalar | Inmediato |

#### Comportamiento por Nivel

**Bajo (0-30):** Solo se registra en auditoría. No se notifica.

**Medio (31-60):** 
- Se genera alerta visible en dashboard
- Se notifica al administrador de empresa
- Se registra en auditoría

**Alto (61-80):**
- Se genera alerta prioritaria en dashboard
- Se notifica al administrador de empresa vía email
- Se notifica a Jefatura SGI/HSEC
- Se registra en auditoría
- Se puede bloquear acceso futuro (solo lectura)

**Crítico (81+):**
- Se bloquea inmediatamente la acción
- Se genera alerta crítica
- Se notifica al administrador de empresa y Jefatura SGI/HSEC vía email + SMS
- Se escalona a incident management
- Se registra en auditoría inmutable
- Se inicia workflow de investigación

---

## 5. Requerimientos Funcionales (RF)

### 5.1 Gestión de Usuarios

**RF-01:** El sistema debe permitir crear usuarios con email, nombre, apellido, rol y empresa.

**RF-02:** El sistema debe permitir editar datos de usuario (nombre, apellido, datos de contacto).

**RF-03:** El sistema debe permitir activar y desactivar usuarios sin eliminar datos históricos.

**RF-04:** El sistema debe permitir asignar múltiples roles a un usuario.

**RF-05:** El sistema debe permitir asociar usuario con empresa y proyecto(s).

**RF-06:** El sistema debe mostrar un historial de cambios en permisos del usuario.

### 5.2 Gestión de Roles y Permisos

**RF-07:** El sistema debe permitir crear roles personalizados con permisos específicos.

**RF-08:** El sistema debe asignar permisos basados en el rol del usuario.

**RF-09:** El sistema debe permitir permisos granulares a nivel de documento.

**RF-10:** El sistema debe auditar cambios de roles y permisos.

### 5.3 Autenticación

**RF-11:** El sistema debe autenticar usuarios con email y contraseña.

**RF-12:** El sistema debe soportar autenticación de doble factor (TOTP).

**RF-13:** El sistema debe notificar login desde IP o dispositivo nuevo.

**RF-14:** El sistema debe bloquear cuenta después de 5 intentos fallidos de login.

**RF-15:** El sistema debe permitir recuperación de contraseña vía email.

**RF-16:** El sistema debe expirar sesiones tras 30 minutos de inactividad.

### 5.4 Carga y Gestión Documental

**RF-17:** El sistema debe permitir cargar documentos asociados a empresa, proyecto y carpeta.

**RF-18:** El sistema debe validar tipo de archivo (whitelist: PDF, DOCX, XLSX, PPTX, TXT, CSV).

**RF-19:** El sistema debe permitir clasificar documentos en 4 niveles de criticidad.

**RF-20:** El sistema debe mantener automáticamente un historial de versiones.

**RF-21:** El sistema debe permitir descargar documentos (se genera evento de descarga).

**RF-22:** El sistema debe permitir visualizar vista previa de documentos.

**RF-23:** El sistema debe generar metadatos automáticos (fecha carga, usuario, tamaño, hash).

### 5.5 Control de Acceso

**RF-24:** El sistema debe permitir asignar permisos de lectura a documentos.

**RF-25:** El sistema debe permitir asignar permisos de escritura/edición a documentos.

**RF-26:** El sistema debe permitir asignar permisos de eliminar documentos.

**RF-27:** El sistema debe permitir permisos a nivel de usuario individual o grupo.

**RF-28:** El sistema debe denegar acceso si el usuario no tiene permisos.

### 5.6 Auditoría y Trazabilidad

**RF-29:** El sistema debe registrar automáticamente todos los eventos relevantes.

**RF-30:** El sistema debe registrar usuario, timestamp, IP, dispositivo, acción y documento.

**RF-31:** El sistema debe mantener logs inalterables (append-only).

**RF-32:** El sistema debe permitir auditar cambios de permisos.

**RF-33:** El sistema debe generar reportes de auditoría por usuario, documento o período.

**RF-34:** El sistema debe retener logs mínimo 5 años.

### 5.7 Motor SIGRA - Análisis de Riesgos

**RF-35:** SIGRA debe calcular puntaje de riesgo para cada evento relevante.

**RF-36:** SIGRA debe utilizar variables múltiples (hora, IP, dispositivo, rol, historial).

**RF-37:** SIGRA debe ajustar puntaje según historial previo del usuario.

**RF-38:** SIGRA debe considerar contexto temporal (horario laboral vs fuera de horario).

**RF-39:** SIGRA debe considerar contexto de proyecto (acceso dentro vs fuera de asignación).

**RF-40:** SIGRA debe evaluar criticidad del documento accedido.

### 5.8 Alertas y Notificaciones

**RF-41:** El sistema debe generar alerta cuando puntaje de riesgo es medio (31-60).

**RF-42:** El sistema debe generar alerta prioritaria cuando puntaje de riesgo es alto (61-80).

**RF-43:** El sistema debe generar alerta crítica cuando puntaje de riesgo es crítico (81+).

**RF-44:** El sistema debe notificar por email al administrador en alertas altas y críticas.

**RF-45:** El sistema debe notificar por SMS en alertas críticas.

**RF-46:** El sistema debe permitir configurar notificaciones por usuario y tipo de alerta.

### 5.9 Bloqueo Preventivo

**RF-47:** El sistema debe bloquear acción cuando el puntaje de riesgo es crítico (81+).

**RF-48:** El sistema debe bloquear descarga de documento si el usuario tiene alerta activa.

**RF-49:** El sistema debe bloquear cambio de permisos si el usuario tiene alerta crítica.

**RF-50:** El sistema debe permitir al administrador desbloquear acciones manualmente.

### 5.10 Dashboards y Reportes

**RF-51:** El sistema debe mostrar dashboard ejecutivo con alertas activas.

**RF-52:** El sistema debe mostrar usuarios con mayor puntaje de riesgo.

**RF-53:** El sistema debe mostrar documentos más accedidos.

**RF-54:** El sistema debe mostrar eventos anómalos de los últimos 30 días.

**RF-55:** El sistema debe permitir exportar reportes en PDF y Excel.

**RF-56:** El sistema debe permitir filtrar reportes por período, usuario, documento o proyecto.

**RF-57:** El sistema debe mostrar tendencias de alertas en el tiempo.

---

## 6. Requerimientos No Funcionales (RNF)

### 6.1 Seguridad

**RNF-01:** Todas las contraseñas deben cifrarse con bcrypt/PBKDF2 con salt único.

**RNF-02:** HTTPS obligatorio en todas las comunicaciones (TLS 1.2+).

**RNF-03:** Soporte obligatorio para autenticación de doble factor (TOTP).

**RNF-04:** Control de acceso granular mediante RBAC.

**RNF-05:** Logs inalterables (append-only) con hash criptográfico.

**RNF-06:** Respaldo automático diario de la base de datos.

**RNF-07:** Encriptación de datos en almacenamiento (AES-256 para documentos sensibles).

**RNF-08:** Auditoría de cambios de configuración de seguridad.

**RNF-09:** Validación de entrada en todos los formularios.

**RNF-10:** Protección contra inyección SQL, XSS y CSRF.

### 6.2 Rendimiento

**RNF-11:** Respuesta de sistema menor a 3 segundos en acciones normales.

**RNF-12:** Carga de lista de documentos menor a 2 segundos (1000+ documentos).

**RNF-13:** Cálculo de puntaje SIGRA menor a 500ms.

**RNF-14:** Exportación de reporte menor a 30 segundos.

**RNF-15:** Caché de datos frecuentes (usuarios, roles, permisos).

**RNF-16:** Indexación de base de datos para búsquedas rápidas.

### 6.3 Disponibilidad

**RNF-17:** Sistema disponible 24/7 con uptime mínimo de 99.5%.

**RNF-18:** Respaldo automático cada 6 horas.

**RNF-19:** Recuperación ante fallos menor a 15 minutos.

**RNF-20:** Plan de continuidad de negocio documentado.

### 6.4 Usabilidad

**RNF-21:** Interfaz intuitiva sin curva de aprendizaje pronunciada.

**RNF-22:** Panel ejecutivo con visualización clara de alertas.

**RNF-23:** Filtros y búsqueda rápida de documentos.

**RNF-24:** Alertas visuales claras con códigos de color (rojo, amarillo, verde).

**RNF-25:** Mensajes de error entendibles para usuarios no técnicos.

**RNF-26:** Accesibilidad WCAG 2.1 nivel AA.

### 6.5 Escalabilidad

**RNF-27:** Soporte para múltiples empresas/clientes (multi-tenant).

**RNF-28:** Soporte para miles de usuarios simultáneos.

**RNF-29:** Escalabilidad horizontal mediante contenedores Docker.

**RNF-30:** Base de datos escalable (PostgreSQL con replicación).

**RNF-31:** Motor SIGRA escalable para procesar miles de eventos/segundo.

### 6.6 Mantenibilidad

**RNF-32:** Código documentado con comentarios y docstrings.

**RNF-33:** Pruebas unitarias con cobertura mínima 80%.

**RNF-34:** Pruebas de integración para flujos críticos.

**RNF-35:** Documentación técnica y manual de usuario.

**RNF-36:** Logs de aplicación detallados para debugging.

---

## 7. Variables de SIGRA - Matriz de Análisis

| Variable | Tipo | Fuente | Peso | Descripción |
|----------|------|--------|------|------------|
| `access_hour` | Numérico (0-23) | Log de acceso | Alto | Hora del día del acceso |
| `access_day` | Categórico (Lun-Dom) | Log de acceso | Medio | Día de la semana |
| `is_within_business_hours` | Booleano | Configuración | Alto | ¿Dentro de horario laboral? |
| `source_ip` | String | Header HTTP | Alto | Dirección IP de origen |
| `is_ip_known` | Booleano | Historial | Alto | ¿IP conocida del usuario? |
| `device_id` | String | User-Agent/Cookie | Medio | ID único del dispositivo |
| `is_device_new` | Booleano | Historial | Medio | ¿Dispositivo nuevo? |
| `user_role` | Categórico | BD Usuarios | Alto | Rol del usuario |
| `document_criticality` | Numérico (1-4) | Clasificación Doc | Alto | Nivel de criticidad (1=Bajo, 4=Crítico) |
| `document_type` | Categórico | Extensión archivo | Medio | Tipo de documento |
| `action_type` | Categórico | Auditoría | Alto | Tipo de acción (view, download, edit, delete) |
| `action_count_5min` | Numérico | Auditoría | Medio | Cantidad de acciones en últimos 5 min |
| `download_count_1hour` | Numérico | Auditoría | Alto | Documentos descargados en última hora |
| `failed_login_attempts` | Numérico | Auth | Alto | Intentos fallidos de login (últimas 24h) |
| `user_alert_history_30d` | Numérico | Alertas SIGRA | Medio | Cantidad de alertas en últimos 30 días |
| `user_has_active_alert` | Booleano | Alertas SIGRA | Alto | ¿Usuario tiene alerta activa? |
| `is_project_assigned` | Booleano | BD Proyectos | Medio | ¿Usuario asignado al proyecto? |
| `has_document_permission` | Booleano | BD Permisos | Alto | ¿Usuario tiene permiso para documento? |
| `geographic_anomaly` | Booleano | IP Geolocation | Medio | ¿Ubicación geográfica anómala? |
| `peer_group_behavior` | Booleano | Análisis estadístico | Bajo | ¿Comportamiento diferente al grupo? |

---

## 8. Matriz de Riesgo - SIGRA Scoring

### 8.1 Tabla de Eventos y Puntuación

| ID | Evento | Puntaje Base | Modificadores | Máximo |
|----|----|---|---|---|
| E001 | Acceso fuera de horario | 15 | +5 si es 22:00-06:00 | 20 |
| E002 | IP desconocida | 20 | +10 si es país diferente | 30 |
| E003 | Dispositivo nuevo | 20 | +5 si es móvil desconocido | 25 |
| E004 | Intentos fallidos (5+) | 15 | +5 por cada intento adicional (max +20) | 35 |
| E005 | Descarga masiva (10+ docs en 5min) | 25 | +5 por cada 10 docs adicionales | 40 |
| E006 | Doc confidencial (Nivel 3) | 20 | +10 si descarga (vs solo lectura) | 30 |
| E007 | Doc crítico (Nivel 4) | 30 | +10 si edición o eliminación | 40 |
| E008 | Cambio de permisos | 25 | +10 si se otorgan permisos críticos | 35 |
| E009 | Eliminación de documento | 30 | +10 si es doc crítico | 40 |
| E010 | Usuario con historial | 10 | +5 por cada alerta en últimos 30d (max +30) | 40 |
| E011 | Acceso fuera de proyecto | 20 | +10 si es proyecto crítico | 30 |
| E012 | Acción incompatible con rol | 25 | +10 si intenta permisos admin | 35 |
| E013 | Exportación de backup/datos | 35 | +10 si incluye docs críticos | 45 |
| E014 | Acceso sucesivo a múltiples proyectos | 15 | +5 por proyecto adicional en 30min | 35 |
| E015 | Cambio de rol de usuario | 25 | +15 si es cambio crítico | 40 |

### 8.2 Modificadores Dinámicos

| Modificador | Rango | Valor |
|--|--|--|
| Usuario con buen historial (cero alertas en 90 días) | - | -5 puntos |
| Usuario nuevo (menos de 1 semana) | - | +10 puntos |
| Acceso desde IP corporativa conocida | - | -10 puntos |
| Acceso desde VPN corporativa | - | -15 puntos |
| Patrón semanal consistente | - | -5 puntos |
| Cambio anómalo de patrón | - | +20 puntos |

### 8.3 Escalas Temporales

| Escala | Ventana | Uso |
|--|--|--|
| Immediate | 1 segundo | Detección de fraude en tiempo real |
| Short-term | 5 minutos | Descarga masiva, intento de ataque |
| Medium-term | 1 hora | Cambios de comportamiento |
| Long-term | 30 días | Historial de alertas |
| Baseline | 90 días | Comportamiento normal del usuario |

---

## 9. Clasificación de Riesgos y Acciones

| Puntaje | Nivel | Severidad | Notificación | Bloqueo | Acción | SLA |
|---------|-------|-----------|---|---|-------|-----|
| 0 - 30 | 🟢 Bajo | Info | No | No | Registrar en auditoría | - |
| 31 - 60 | 🟡 Medio | Warning | Email a Admin | No | Alerta en dashboard + Email | 2 horas |
| 61 - 80 | 🔴 Alto | Alert | Email + SMS | Lectura limitada | Alerta prioritaria + Notificar Jefatura | 30 minutos |
| 81+ | 🔺 Crítico | Critical | Email + SMS + Call | SÍ | Bloquear acción + Investigación | 10 minutos |

### 9.1 Flujo de Respuesta por Nivel

#### Nivel Bajo (0-30)
```
Evento → Auditoría ✓
```

#### Nivel Medio (31-60)
```
Evento → Auditoría ✓
       → Alerta en Dashboard ✓
       → Email a Administrador ✓
```

#### Nivel Alto (61-80)
```
Evento → Auditoría ✓
       → Alerta Prioritaria en Dashboard ✓
       → Email + SMS a Administrador ✓
       → Email a Jefatura SGI/HSEC ✓
       → Verificación manual de acción ✓
```

#### Nivel Crítico (81+)
```
Evento → Auditoría ✓
       → BLOQUEAR ACCIÓN INMEDIATAMENTE ✓
       → Alerta Crítica en Dashboard ✓
       → Email + SMS a Administrador ✓
       → Email + SMS a Jefatura SGI/HSEC ✓
       → Iniciar Incident Management ✓
       → Investigación automática ✓
       → Notificación a usuario bloqueado ✓
```

---

## 10. Stack Tecnológico Recomendado

| Capa | Componente | Tecnología | Justificación |
|------|-----------|-----------|---|
| **Backend** | Framework | Django 4.2+ LTS | Maduro, seguridad integrada, ORM robusto |
| | API REST | Django REST Framework | Construcción rápida de APIs, validación integrada |
| | Caché | Redis | Performance de sesiones y datos frecuentes |
| | Task Queue | Celery | Procesamiento async de alertas y reportes |
| **Frontend** | Framework | React 18+ | UI moderna, performance |
| | Lenguaje | TypeScript | Type safety, mejor developer experience |
| | Estilos | Tailwind CSS | Desarrollo rápido de UI responsive |
| | Estado | Zustand | State management ligero |
| **Base de Datos** | Principal | PostgreSQL 14+ | Confiabilidad, JSONB, performance |
| | Search | Elasticsearch (opcional) | Búsqueda full-text de documentos |
| **Infraestructura** | Contenedores | Docker | Consistencia dev/prod |
| | Orquestación | Docker Compose (local) / Kubernetes (prod) | Escalabilidad |
| | CI/CD | GitHub Actions | Integración nativa con GitHub |
| **Almacenamiento** | Documentos | S3 compatible (MinIO) o Azure Blob | Escalabilidad, durabilidad |
| **Autenticación** | JWT | Django REST Framework JWT | Stateless, escalable |
| | 2FA | django-otp / TOTP | Seguridad extra |
| **Logging** | Aplicación | Python logging + ELK (opcional) | Debugging, auditoría |
| **Monitoreo** | APM | Sentry (opcional) | Detección de errores |

---

## 11. Tablas Principales de Base de Datos

### Diagrama Conceptual

```
Empresas (multi-tenant)
├── Usuarios
│   ├── Usuario_Roles
│   │   └── Roles
│   │       └── Rol_Permisos
│   │           └── Permisos
│   ├── Sesiones
│   └── Dispositivos
├── Proyectos
│   ├── Proyecto_Usuarios
│   └── Documentos
│       ├── Documento_Versiones
│       ├── Documento_Permisos
│       └── Documento_Accesos (Auditoría)
├── Eventos (Auditoría)
├── Alertas_SIGRA
├── IP_Conocidas
└── Clasificaciones_Documentales
```

### Tablas Esenciales

1. **empresas** - Clientes/empresas del sistema
2. **usuarios** - Usuarios del sistema
3. **roles** - Roles del sistema
4. **usuario_roles** - Relación usuario-rol
5. **permisos** - Permisos del sistema
6. **rol_permisos** - Relación rol-permiso
7. **proyectos** - Proyectos dentro de una empresa
8. **proyecto_usuarios** - Relación proyecto-usuario
9. **documentos** - Documentos cargados
10. **documento_versiones** - Historial de versiones
11. **documento_permisos** - Permisos a nivel de documento
12. **evento_auditoría** - Registro de todas las acciones
13. **alerta_sigra** - Alertas generadas por SIGRA
14. **sesiones** - Sesiones activas de usuarios
15. **dispositivos** - Dispositivos registrados de usuarios
16. **ip_conocidas** - IPs conocidas de usuarios
17. **clasificacion_documental** - Clasificación de documentos (1-4)

---

## 12. Entregables del Proyecto

### Fase 1: Análisis y Diseño
- [ ] Documento de Requerimientos (este documento)
- [ ] Especificaciones Técnicas
- [ ] Diagrama de Arquitectura C4
- [ ] Modelo Entidad-Relación (ER)
- [ ] Casos de Uso
- [ ] Historias de Usuario
- [ ] Prototipo Visual (Figma/wireframes)

### Fase 2: Desarrollo Backend
- [ ] API REST con Django REST Framework
- [ ] Autenticación JWT + 2FA
- [ ] Motor SIGRA de análisis de riesgos
- [ ] Sistema de alertas
- [ ] Sistema de auditoría
- [ ] Validaciones de seguridad
- [ ] Testes unitarios (80%+ cobertura)

### Fase 3: Desarrollo Frontend
- [ ] Interfaz de inicio de sesión
- [ ] Dashboard principal
- [ ] Módulo de gestión de usuarios
- [ ] Módulo de gestión documental
- [ ] Dashboard de alertas SIGRA
- [ ] Reportes y exportación
- [ ] Interfaz móvil responsiva

### Fase 4: Integración y Deployment
- [ ] Dockerización de servicios
- [ ] docker-compose para desarrollo
- [ ] Pipeline CI/CD (GitHub Actions)
- [ ] Deployment a producción
- [ ] Configuración de monitoreo
- [ ] Backup y recuperación

### Fase 5: Documentación y Capacitación
- [ ] Manual de Usuario
- [ ] Manual Técnico
- [ ] Guía de Administración
- [ ] Guía de Seguridad
- [ ] Video tutoriales
- [ ] Documentación de API

---

## 13. Definición Oficial del Producto

**SAFECloud** integrará el motor **SIGRA** como un componente de inteligencia de seguridad orientado a la prevención de filtración de datos, mediante el análisis de comportamiento de usuarios, clasificación de criticidad documental, evaluación de accesos y generación de alertas preventivas. Este módulo permitirá fortalecer la trazabilidad, el control documental, la auditoría y la respuesta temprana frente a eventos sospechosos.

---

## 14. Criterios de Aceptación

Un requerimiento se considera **completado** cuando:

1. ✅ Se implementó la funcionalidad descrita
2. ✅ Se completaron pruebas unitarias (mín. 80% cobertura)
3. ✅ Se completaron pruebas de integración
4. ✅ Se generó documentación técnica
5. ✅ Se realizó code review
6. ✅ Se pasó revisión de seguridad
7. ✅ Se pasó revisión de rendimiento
8. ✅ Se documentó en manual de usuario

---

## 15. Restricciones y Supuestos

### Restricciones Técnicas

- Django 4.2+ (LTS) como framework base
- PostgreSQL 14+ como base de datos principal
- HTTPS obligatorio en todas las comunicaciones
- Soporte mínimo para navegadores: Chrome 90+, Firefox 88+, Safari 14+

### Restricciones de Negocio

- SAFECloud debe ser multi-tenant desde el inicio
- SIGRA debe procesar eventos en menos de 500ms
- El sistema debe retener logs mínimo 5 años
- Cumplimiento con GDPR y CCPA

### Supuestos

- Los usuarios tendrán conexión a internet estable
- Las empresas proporcionarán calendarios laborales para SIGRA
- Se dispondrá de infraestructura para Docker y PostgreSQL
- El equipo técnico conoce Django y React

---

## 16. Matriz de Trazabilidad

Cada Requerimiento está trazado a:
- Objetivo general del proyecto
- Módulo específico
- Historias de usuario
- Casos de uso
- Pruebas
- Documentación

(Se completará durante la planificación detallada)

---

## 17. Cambios y Versionamiento

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | Mayo 21, 2026 | Versión inicial | SAFECloud Team |

---

## Aprobaciones Requeridas

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | - | [ ] | [ ] |
| Tech Lead | - | [ ] | [ ] |
| Security Officer | - | [ ] | [ ] |
| CTO | - | [ ] | [ ] |

---

**Documento confidencial - Distribución limitada**
