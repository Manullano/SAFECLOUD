# Casos de Uso
## SAFECloud + SIGRA

**Fecha:** Mayo 21, 2026  
**Versión:** 1.0

---

## 1. Actores del Sistema

### 1.1 Actores Primarios

| Actor | Descripción | Intereses |
|-------|-------------|-----------|
| **End User (Empleado)** | Usuario que accede a documentos | Facilidad de uso, acceso rápido |
| **Administrator (Empresa)** | Administrador de su empresa | Control, visibilidad, seguridad |
| **Jefatura SGI/HSEC** | Responsable de seguridad | Detección de riesgos, alertas |
| **Auditor** | Auditor externo/interno | Trazabilidad, reportes |
| **Superadmin SAFECloud** | Administrador de la plataforma | Mantenimiento, multi-tenancy |

### 1.2 Actores Secundarios

| Actor | Sistema |
|-------|--------|
| Email Service | Envío de notificaciones |
| SMS Service | Alertas críticas |
| S3/Blob Storage | Almacenamiento de documentos |
| Geolocation Service | Ubicación de IPs |

---

## 2. Casos de Uso Principales

### 2.1 UC-001: Autenticarse en SAFECloud

**Actor Primario:** End User  
**Precondición:** Usuario tiene cuenta activa  
**Resultado Esperado:** Usuario inicia sesión y obtiene acceso

**Flujo Principal:**

1. Usuario accede a login.safecloud.com
2. Ingresa email y contraseña
3. Sistema valida credenciales en base de datos
4. Si credenciales son inválidas → mostrar error (hasta 5 intentos)
5. Si 2FA está habilitado:
   - Sistema envía código TOTP
   - Usuario ingresa código
   - Sistema valida TOTP
6. Sistema genera JWT token
7. Sistema crea sesión activa
8. Sistema registra evento de login (IP, dispositivo, ubicación)
9. **SIGRA analiza evento de login:**
   - ¿Es nueva IP? +20 puntos
   - ¿Es nuevo dispositivo? +20 puntos
   - ¿Es fuera de horario? +15 puntos
   - Si score >= 31 → genera alerta MEDIUM
10. Sistema redirige a dashboard
11. Usuario ve panel principal

**Flujos Alternativos:**

- **A1:** Contraseña olvidada
  - Usuario click en "Forgot Password"
  - Sistema envía link de reset por email
  - Usuario click en link
  - Usuario ingresa nueva contraseña
  - Sistema actualiza contraseña (no vuelve a pedir login)

- **A2:** Demasiados intentos fallidos
  - Sistema bloquea cuenta por 15 minutos
  - Envía notificación de seguridad por email
  - Usuario puede desbloquear con reset de contraseña

---

### 2.2 UC-002: Cargar Documento

**Actor Primario:** End User  
**Precondición:** Usuario autenticado, tiene permiso de carga  
**Resultado Esperado:** Documento se carga y se clasifica

**Flujo Principal:**

1. Usuario navega a "Documents" → "Upload"
2. Usuario selecciona:
   - Archivo (drag & drop o click)
   - Proyecto
   - Carpeta (opcional)
   - Nivel de criticidad (1-4)
   - Descripción
3. Sistema valida:
   - Tipo de archivo (whitelist)
   - Tamaño máximo (50 MB)
   - Usuario tiene permiso en proyecto
4. Sistema calcula SHA-256 hash del archivo
5. Sistema sube archivo a S3/Blob (encrypted)
6. Sistema crea registro en base de datos
7. Sistema genera metadatos automáticamente:
   - uploaded_by
   - uploaded_at
   - file_size
   - file_type
   - hash
8. **SIGRA analiza evento:**
   - Documento es crítico (nivel 4)? +30 puntos
   - Usuario subió múltiples documentos (> 10 en 5 min)? +25 puntos
   - Si score >= 60 → genera alerta HIGH
9. Sistema muestra confirmación
10. Usuario puede asignar permisos inmediatamente

**Validaciones:**

- Tipos de archivo permitidos: PDF, DOCX, XLSX, PPTX, TXT, CSV
- Tamaño máximo: 50 MB
- Máximo 10 documentos por 5 minutos por usuario

---

### 2.3 UC-003: Descargar Documento

**Actor Primario:** End User  
**Precondición:** Usuario autenticado, tiene permiso de lectura  
**Resultado Esperado:** Documento descargado, evento registrado

**Flujo Principal:**

1. Usuario navega a "Documents"
2. Usuario busca o filtra documentos
3. Usuario click en documento
4. Sistema verifica permiso de lectura
   - Si no tiene permiso → denegar + log DENIED_ACCESS
5. Sistema muestra vista previa (si es posible)
6. Usuario click en "Download"
7. Sistema registra evento en AuditLog:
   - action: DOWNLOAD_DOC
   - document_id
   - ip_address
   - user_agent
   - device_id
8. **SIGRA analiza evento:**
   - Documento es crítico? +30 puntos
   - IP es desconocida? +20 puntos
   - Acceso fuera de horario? +15 puntos
   - Descarga masiva (> 10 docs en 5 min)? +25 puntos
   - Usuario tiene alertas previas (últimos 30 días)? +10 puntos
   - **SIGRA calcula puntaje total**
   - Si score >= 31 → crear alert MEDIUM
   - Si score >= 61 → crear alert HIGH + notificar admin
   - Si score >= 81 → crear alert CRITICAL + bloquear futuras descargas
9. Sistema retorna archivo al usuario (si score < CRITICAL)
10. Descarga inicia en navegador
11. Admin ve alerta en dashboard (si aplica)

**Manejo de Bloqueo Crítico:**

- Si score >= 81 → Sistema responde con 403 Forbidden
- Documento no se descarga
- SIGRAAlert creada
- Admin notificado por email + SMS
- Usuario recibe notificación de intento bloqueado
- Incident management se dispara

---

### 2.4 UC-004: Visualizar Alertas SIGRA

**Actor Primario:** Administrador / Jefatura SGI/HSEC  
**Precondición:** Usuario autenticado, tiene rol de admin o jefatura  
**Resultado Esperado:** Ver alertas y tomar acciones

**Flujo Principal:**

1. Usuario accede a dashboard
2. Sección "Alerts" muestra:
   - Contador de alertas por nivel (MEDIUM, HIGH, CRITICAL)
   - Tabla de alertas ordenadas por severidad y fecha
3. Usuario filtra por:
   - Nivel de severidad
   - Usuario
   - Tipo de alerta
   - Período de tiempo
4. Usuario click en alerta específica
5. Sistema muestra detalle:
   - Título y descripción
   - Evento que disparó
   - Usuario involucrado
   - Documento accedido
   - Hora y IP
   - Motivo del riesgo (evidencia)
   - Acciones sugeridas
6. Usuario puede:
   - **Investigar:** Ver historial completo del usuario
   - **Resolver:** Marcar como resolved + ingresar nota
   - **Bloquear:** Bloquear usuario o documentos
   - **Escalar:** Crear ticket de incidente
   - **Descartar:** Marcar como false positive
7. Sistema actualiza status de alerta
8. Sistema registra quién y cuándo resolvió
9. Dashboard se actualiza en tiempo real (WebSocket)

**Severidades:**

- 🟡 **MEDIUM (31-60):** Informativo, revisar periódicamente
- 🔴 **HIGH (61-80):** Requiere revisión dentro de 30 minutos
- 🔺 **CRITICAL (81+):** Bloquea acción, requiere respuesta inmediata

---

### 2.5 UC-005: Gestionar Usuarios y Roles

**Actor Primario:** Administrador (Empresa)  
**Precondición:** Usuario autenticado como admin  
**Resultado Esperado:** Usuario creado/actualizado/desactivado

**Flujo Principal:**

1. Admin accede a "Users Management"
2. Admin ve tabla de todos los usuarios
3. Admin puede:
   - **Crear usuario:** Ingresa email, nombre, rol
   - **Editar usuario:** Cambia nombre, rol, permisos
   - **Desactivar usuario:** No elimina datos, solo marca inactivo
   - **Ver historial:** Acciones realizadas por usuario
4. Al crear usuario:
   - Sistema envía email con link de setup
   - Usuario click en link
   - Usuario configura contraseña
   - Usuario habilita 2FA (opcional)
5. Al editar permisos:
   - Sistema registra cambio en AuditLog
   - **SIGRA detecta:** Cambio de permisos = +25 puntos
   - Si se otorgan permisos críticos → +10 puntos más
6. Sistema actualiza sesiones activas si es necesario
7. Confirmación visual del cambio

**Roles Disponibles:**

- Superadmin (acceso total)
- Admin empresa (gestión de su empresa)
- Jefatura SGI/HSEC (seguridad y auditoría)
- Jefe de Proyecto (gestión de proyecto)
- Supervisor (lectura y reportes)
- Usuario (lectura de documentos asignados)
- Auditor (solo lectura de logs)

---

### 2.6 UC-006: Generar Reporte de Auditoría

**Actor Primario:** Auditor / Admin  
**Precondición:** Usuario autenticado  
**Resultado Esperado:** Reporte exportado en PDF/Excel

**Flujo Principal:**

1. Usuario accede a "Reports" → "Audit Log"
2. Usuario define filtros:
   - Rango de fechas
   - Usuario específico (opcional)
   - Acción (LOGIN, DOWNLOAD, EDIT, DELETE, etc.)
   - Documento (opcional)
   - Estado (SUCCESS, FAILED, BLOCKED)
3. Sistema muestra preview de reporte
4. Usuario click en "Export"
5. Usuario elige formato:
   - PDF (con gráficos y resumen)
   - Excel (con detalles completos)
6. Sistema genera reporte:
   - Encabezado con empresa, período
   - Tabla de eventos
   - Gráficos de tendencias
   - Resumen ejecutivo
   - Firma digital (hash)
7. Sistema envía descarga
8. Reporte se abre en navegador

**Contenido del Reporte:**

- Total de eventos por acción
- Usuarios más activos
- Documentos más accedidos
- Eventos bloqueados / denegados
- Intentos fallidos de login
- Cambios de permisos
- Alertas SIGRA generadas
- Tendencias temporales

---

### 2.7 UC-007: Investigar Comportamiento Anómalo

**Actor Primario:** Jefatura SGI/HSEC  
**Precondición:** Alerta SIGRA generada  
**Resultado Esperado:** Comprensión de evento y acciones

**Flujo Principal:**

1. Admin ve alerta SIGRA en dashboard
2. Admin click en alerta
3. Sistema muestra "Evidence":
   - ¿Por qué se generó alerta?
   - Variables que contribuyeron al score
   - Historial reciente del usuario
4. Admin puede iniciar "Investigation":
   - Ver todos los eventos del usuario (últimos 30 días)
   - Ver documentos accedidos
   - Ver cambios de IP/dispositivo
   - Ver intentos fallidos de login
5. Sistema genera "Risk Timeline":
   - Gráfico de puntaje de riesgo en el tiempo
   - Comparación con el promedio de empresa
   - Comparación con el promedio del rol
6. Admin puede:
   - **Whitelist user:** Marcar como usuario confiable (reduce score futuro)
   - **Block user:** Bloquear usuario hasta que se aclare
   - **Reset baseline:** Olvidar historial previo
   - **Create task:** Asignar investigación manual
7. Sistema registra todas las acciones de investigación

---

### 2.8 UC-008: Configurar Alertas y Notificaciones

**Actor Primario:** Administrador  
**Precondición:** Usuario autenticado como admin  
**Resultado Esperado:** Sistema personalizado de alertas

**Flujo Principal:**

1. Admin accede a "Settings" → "Alerts Configuration"
2. Admin puede configurar:
   - **Umbral de riesgo:** Ajustar puntajes (cambio en reglas)
   - **Canales de notificación:** Email, SMS, WebSocket
   - **Destinatarios:** Quién recibe alertas por severidad
   - **Horarios:** No enviar alertas en ciertos horarios
   - **Escalation:** Quién se notifica si no hay respuesta
3. Admin ve "Rules":
   - Lista de todas las reglas de SIGRA
   - Puntaje asignado a cada regla
   - Opción para habilitar/deshabilitar regla
   - Opción para ajustar puntaje
4. Admin guarda cambios
5. Sistema aplica cambios inmediatamente
6. Nuevos eventos usan nuevas reglas

---

## 3. Casos de Uso Secundarios

### 3.1 UC-009: Control de Versiones de Documentos

**Actor:** End User / Admin  
**Descripción:** Mantener historial de versiones

**Flujo:**
1. Usuario edita documento
2. Sistema crea nueva versión automáticamente
3. Sistema mantiene versión anterior intacta
4. Usuario puede ver diferencias entre versiones
5. Usuario puede revertir a versión anterior

---

### 3.2 UC-010: Asignar Permisos a Documentos

**Actor:** Propietario documento / Admin  
**Descripción:** Control granular de acceso

**Flujo:**
1. Propietario abre documento
2. Click en "Share" → "Manage Permissions"
3. Añade usuarios y selecciona permiso:
   - Read (lectura)
   - Read + Comment (lectura + comentarios)
   - Edit (edición)
   - Delete (eliminación)
4. Sistema guarda permisos
5. Nuevo usuario recibe notificación
6. Evento registrado en auditoría

---

### 3.3 UC-011: Bloquear Usuario por Riesgo

**Actor:** Admin / Jefatura  
**Descripción:** Bloquear usuario cuando riesgo es crítico

**Flujo:**
1. SIGRA genera alerta CRÍTICA (score >= 81)
2. Sistema automáticamente:
   - Establece user.is_blocked = true
   - Bloquea nuevas descargas
   - Invalida sesiones activas
3. Admin notificado inmediatamente
4. Admin puede:
   - Investigar causa
   - Desbloquear usuario
   - Iniciar investigación formal
5. Usuario bloqueado intenta acceder:
   - Sistema devuelve 403 Forbidden
   - Muestra motivo del bloqueo
   - Proporciona contacto de admin

---

### 3.4 UC-012: Exportar Lista de Documentos Críticos

**Actor:** Admin  
**Descripción:** Identificar documentos de mayor riesgo

**Flujo:**
1. Admin accede a "Reports" → "Critical Documents"
2. Sistema filtra documentos con criticality_level = 4
3. Para cada documento muestra:
   - Nombre y descripción
   - Cantidad de accesos
   - Usuarios que accedieron
   - Último acceso
4. Admin puede exportar lista en Excel
5. Admin usa para audit/compliance

---

## 4. Flujos de Excepción

### 4.1 Acceso Denegado

```
Usuario intenta acceder a documento
  │
  ├─ Sistema verifica permiso
  │
  ├─ Si NO tiene permiso:
  │  ├─ Log event: DENIED_ACCESS
  │  ├─ IP address y dispositivo
  │  ├─ Reason: No permission
  │  ├─ SIGRA: +5 points (intento fallido)
  │  └─ Response: 403 Forbidden
  │
  └─ Si tiene permiso:
     └─ Proceder normalmente
```

### 4.2 Sesión Expirada

```
Usuario intenta usar token expirado
  │
  ├─ Backend valida JWT
  │
  ├─ Si expirado:
  │  ├─ Response: 401 Unauthorized
  │  ├─ Frontend redirects a login
  │  └─ Usuario debe re-autenticarse
  │
  └─ Si válido:
     └─ Proceder normalmente
```

---

## 5. Matriz de Actores vs Casos de Uso

| UC | End User | Admin | Jefatura | Auditor | Superadmin |
|----|----------|-------|----------|---------|-----------|
| UC-001: Login | ✓ | ✓ | ✓ | ✓ | ✓ |
| UC-002: Upload | ✓ | ✓ | - | - | - |
| UC-003: Download | ✓ | ✓ | ✓ | - | - |
| UC-004: View Alerts | - | ✓ | ✓ | - | ✓ |
| UC-005: Manage Users | - | ✓ | - | - | ✓ |
| UC-006: Audit Report | - | ✓ | ✓ | ✓ | ✓ |
| UC-007: Investigate | - | ✓ | ✓ | ✓ | ✓ |
| UC-008: Config Alerts | - | ✓ | - | - | ✓ |
| UC-009: Versioning | ✓ | ✓ | - | - | - |
| UC-010: Share Perms | ✓ | ✓ | - | - | - |
| UC-011: Block User | - | ✓ | ✓ | - | ✓ |
| UC-012: Critical Docs | - | ✓ | ✓ | ✓ | ✓ |

---

**Fin de Casos de Uso**
