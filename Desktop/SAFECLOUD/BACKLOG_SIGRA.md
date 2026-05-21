# Backlog Inicial - Project SAFECloud + SIGRA
## Historias de Usuario y Tareas

**Fecha:** Mayo 21, 2026  
**Versión:** 1.0  
**Formato:** Agile Backlog  

---

## 1. Epic-001: Autenticación y Seguridad

### Story 1.1: Login seguro con JWT
**ID:** SAFE-101  
**Estimación:** 8 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 1  

**Como** usuario  
**Quiero** iniciar sesión de forma segura  
**Para que** solo yo pueda acceder a mis documentos  

**Criterios de Aceptación:**
- ✓ Login con email y contraseña
- ✓ Contraseña hasheada con bcrypt
- ✓ JWT token con 15 min de vida útil
- ✓ Refresh token con 7 días de vida útil
- ✓ Rate limiting: máx 5 intentos fallidos
- ✓ Bloqueo de IP por 15 min después de 5 intentos
- ✓ Logging de todos los intentos

**Tareas Técnicas:**
- [ ] Setup Django REST Framework
- [ ] Crear modelo User personalizado
- [ ] Implementar JWT authentication
- [ ] Crear endpoint POST /api/auth/login/
- [ ] Implementar rate limiting con django-ratelimit
- [ ] Tests: 5+ casos (success, invalid pwd, locked, etc)
- [ ] Documentación de API

**Dependencias:** Ninguna  
**Bloqueadores:** Ninguno

---

### Story 1.2: Autenticación de dos factores (2FA)
**ID:** SAFE-102  
**Estimación:** 13 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 2  

**Como** administrador  
**Quiero** exigir 2FA para proteger cuentas  
**Para que** no baste con saber la contraseña para acceder  

**Criterios de Aceptación:**
- ✓ Setup 2FA con TOTP (Google Authenticator, Microsoft Authenticator)
- ✓ Usuario puede habilitar/deshabilitar 2FA
- ✓ Backup codes para recuperación
- ✓ Validación de código TOTP
- ✓ SMS como opción alternativa (Twilio)
- ✓ Email de confirmación cuando se habilita 2FA

**Tareas Técnicas:**
- [ ] Instalar django-otp
- [ ] Crear modelo para secrets TOTP
- [ ] Implementar generación de QR codes
- [ ] Crear endpoint POST /api/auth/2fa/setup/
- [ ] Crear endpoint POST /api/auth/2fa/verify/
- [ ] Integración con Twilio para SMS
- [ ] Tests: setup, verify, backup codes
- [ ] Frontend: Setup 2FA page

**Dependencias:** SAFE-101  
**Estimación Total Sprint 2:** 21 pts

---

### Story 1.3: Control de sesiones
**ID:** SAFE-103  
**Estimación:** 5 pts  
**Prioridad:** ALTA  
**Sprint:** 2  

**Como** usuario  
**Quiero** ver mis sesiones activas  
**Para que** pueda cerrar sesiones remotas si desconfío  

**Criterios de Aceptación:**
- ✓ Mostrar lista de sesiones activas (IP, dispositivo, fecha)
- ✓ Cerrar sesión remota
- ✓ Cerrar todas las sesiones excepto actual
- ✓ Cierre automático por inactividad (30 min)
- ✓ Notificación de login nuevo desde IP/dispositivo desconocido

**Tareas Técnicas:**
- [ ] Crear modelo Session
- [ ] Implementar tracking de sesiones
- [ ] Endpoint GET /api/auth/sessions/
- [ ] Endpoint DELETE /api/auth/sessions/{id}/
- [ ] Celery task para limpiar sesiones expiradas
- [ ] Tests

---

## 2. Epic-002: Gestión Documental

### Story 2.1: Carga de documentos
**ID:** SAFE-201  
**Estimación:** 8 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 1  

**Como** usuario  
**Quiero** subir documentos a un proyecto  
**Para que** mi equipo pueda acceder a ellos  

**Criterios de Aceptación:**
- ✓ Drag & drop de archivos
- ✓ Validación de tipo (whitelist: PDF, DOCX, XLSX, PPTX, TXT, CSV)
- ✓ Validación de tamaño (máx 50 MB)
- ✓ Cálculo de hash SHA-256
- ✓ Almacenamiento en S3/MinIO (encriptado)
- ✓ Metadatos automáticos (tamaño, fecha, usuario)
- ✓ Clasificación de criticidad (1-4)
- ✓ Barra de progreso

**Tareas Técnicas:**
- [ ] Crear modelo Document
- [ ] Configurar S3/MinIO
- [ ] Implementar upload con chunking
- [ ] Crear endpoint POST /api/documents/upload/
- [ ] Validación de archivos
- [ ] Cálculo de hash
- [ ] Tests: valid file, invalid type, too large, etc
- [ ] Frontend: Upload component

**Dependencias:** SAFE-101  
**Bloqueadores:** Base de datos debe existir

---

### Story 2.2: Descarga de documentos
**ID:** SAFE-202  
**Estimación:** 5 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 1  

**Como** usuario  
**Quiero** descargar documentos que me compartieron  
**Para que** pueda trabajar con ellos offline  

**Criterios de Aceptación:**
- ✓ Descargar archivo desde S3
- ✓ Verificar permiso antes de descargar
- ✓ Generar evento de auditoría
- ✓ Disparar análisis SIGRA
- ✓ Bloquear descarga si riesgo es crítico
- ✓ Nombre correcto del archivo

**Tareas Técnicas:**
- [ ] Crear endpoint GET /api/documents/{id}/download/
- [ ] Verificación de permisos
- [ ] Logging de descarga
- [ ] Integración SIGRA (trigger event)
- [ ] Tests
- [ ] Frontend: Download button

**Dependencias:** SAFE-201, SAFE-104 (Permisos)

---

### Story 2.3: Control de versiones
**ID:** SAFE-203  
**Estimación:** 8 pts  
**Prioridad:** ALTA  
**Sprint:** 3  

**Como** usuario  
**Quiero** ver el historial de versiones del documento  
**Para que** pueda volver a una versión anterior si es necesario  

**Criterios de Aceptación:**
- ✓ Al editar documento se crea nueva versión
- ✓ Ver lista de versiones con fecha y autor
- ✓ Ver diferencias entre versiones
- ✓ Descargar versión anterior
- ✓ Revertir a versión anterior
- ✓ Comentar sobre cambios en versión

**Tareas Técnicas:**
- [ ] Crear modelo DocumentVersion
- [ ] Implementar versionamiento automático
- [ ] Endpoint GET /api/documents/{id}/versions/
- [ ] Endpoint GET /api/documents/{id}/versions/{version}/
- [ ] Diff generator (para texto)
- [ ] Tests
- [ ] Frontend: Version history component

**Dependencias:** SAFE-202

---

### Story 2.4: Búsqueda de documentos
**ID:** SAFE-204  
**Estimación:** 5 pts  
**Prioridad:** MEDIA  
**Sprint:** 3  

**Como** usuario  
**Quiero** buscar documentos por nombre  
**Para que** encuentre rápidamente lo que necesito  

**Criterios de Aceptación:**
- ✓ Búsqueda por nombre (fulltext)
- ✓ Filtro por proyecto
- ✓ Filtro por criticidad
- ✓ Filtro por fecha
- ✓ Ordenar por nombre, fecha, tamaño
- ✓ Resultados en menos de 2 segundos

**Tareas Técnicas:**
- [ ] Crear índices en BD
- [ ] Implementar full-text search (PostgreSQL)
- [ ] Endpoint GET /api/documents/?search=...&project=...
- [ ] Caching de búsquedas frecuentes
- [ ] Tests
- [ ] Frontend: Search component

**Dependencias:** SAFE-201

---

## 3. Epic-003: Control de Acceso

### Story 3.1: Permisos de documentos
**ID:** SAFE-301  
**Estimación:** 8 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 2  

**Como** propietario de documento  
**Quiero** controlar quién puede ver mi documento  
**Para que** solo personas autorizadas accedan  

**Criterios de Aceptación:**
- ✓ Asignar permiso de lectura a usuario/grupo
- ✓ Asignar permiso de edición
- ✓ Asignar permiso de eliminación
- ✓ Permisos a nivel de usuario individual
- ✓ Permisos a nivel de grupo (futura)
- ✓ Revocar permisos
- ✓ Ver historial de cambios de permisos
- ✓ Notificar usuario cuando se comparte documento

**Tareas Técnicas:**
- [ ] Crear modelo DocumentPermission
- [ ] Crear modelo GroupPermission (future)
- [ ] Endpoint POST /api/documents/{id}/permissions/
- [ ] Endpoint DELETE /api/documents/{id}/permissions/{perm_id}/
- [ ] Verificación de permisos en middleware
- [ ] Logging de cambios de permisos
- [ ] Tests
- [ ] Frontend: Share dialog

**Dependencias:** SAFE-201, SAFE-101

---

### Story 3.2: Roles y permisos del sistema
**ID:** SAFE-302  
**Estimación:** 13 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 1  

**Como** administrador  
**Quiero** definir roles con permisos granulares  
**Para que** cada usuario tenga exactamente el acceso que necesita  

**Criterios de Aceptación:**
- ✓ Crear roles (Superadmin, Admin, Jefatura, Jefe Proyecto, Supervisor, Usuario, Auditor)
- ✓ Asignar permisos a roles
- ✓ Asignar múltiples roles a usuario
- ✓ Validación de permisos en cada acción
- ✓ Denegar acciones sin permiso
- ✓ Logging de denials

**Tareas Técnicas:**
- [ ] Crear modelo Role
- [ ] Crear modelo Permission
- [ ] Crear modelo RolePermission
- [ ] Implementar permission checking en views/serializers
- [ ] Tests: 10+ casos diferentes
- [ ] Documentación de roles

**Dependencias:** Ninguna  
**Sprint:** 1

---

## 4. Epic-004: SIGRA - Motor de Análisis de Riesgos

### Story 4.1: Registro de eventos
**ID:** SAFE-401  
**Estimación:** 8 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 2  

**Como** administrador  
**Quiero** registrar todas las acciones en el sistema  
**Para que** tenga un historial completo para auditoría  

**Criterios de Aceptación:**
- ✓ Registrar: login, logout, document view, download, edit, delete
- ✓ Registrar: permission changes
- ✓ Registrar: user activation/deactivation
- ✓ Capturar: usuario, timestamp, IP, dispositivo, acción, recurso
- ✓ Logs inalterables (append-only)
- ✓ Indexación para búsqueda rápida
- ✓ Retención de 5 años mínimo

**Tareas Técnicas:**
- [ ] Crear modelo AuditLog
- [ ] Crear signals para registro automático
- [ ] Middleware para capturar IP y user-agent
- [ ] Crear índices en BD
- [ ] Tests
- [ ] Documentación de eventos

**Dependencias:** Modelos base (User, Document, etc)  
**Sprint:** 2

---

### Story 4.2: Motor de cálculo de riesgo
**ID:** SAFE-402  
**Estimación:** 21 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 3-4  

**Como** administrador de seguridad  
**Quiero** que el sistema califique automáticamente el riesgo de cada acción  
**Para que** pueda responder rápidamente a amenazas  

**Criterios de Aceptación:**
- ✓ Calcular puntaje 0-100+ basado en evento
- ✓ Aplicar 15+ reglas de riesgo
- ✓ Considerar variables: hora, IP, dispositivo, rol, documento, historial
- ✓ Detectar anomalías (desviación del comportamiento normal)
- ✓ Tiempo de cálculo < 500ms
- ✓ Score reproducible (mismo evento = mismo score)

**Tareas Técnicas:**
- [ ] Crear clase RiskScorer
- [ ] Implementar 15+ reglas de cálculo
- [ ] Crear modelo SIGRAEvent
- [ ] Guardar evento con score en BD
- [ ] Celery task para procesamiento async
- [ ] Tests: 20+ casos (reglas, modificadores, etc)
- [ ] Documentación de reglas
- [ ] Benchmarking de performance

**Dependencias:** SAFE-401, SAFE-104 (Usuarios), SAFE-201 (Documentos)  
**Effort:** 3 weeks

---

### Story 4.3: Generación de alertas
**ID:** SAFE-403  
**Estimación:** 8 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 4  

**Como** administrador  
**Quiero** recibir alertas cuando hay riesgo  
**Para que** pueda responder antes de que pase algo malo  

**Criterios de Aceptación:**
- ✓ Crear alerta si score 31-60 (MEDIUM)
- ✓ Crear alerta si score 61-80 (HIGH)
- ✓ Crear alerta si score 81+ (CRITICAL)
- ✓ Almacenar evidencia del evento
- ✓ Marcar alerta como open/investigating/resolved
- ✓ Auditar quién resolvió y cuándo

**Tareas Técnicas:**
- [ ] Crear modelo SIGRAAlert
- [ ] Implementar lógica de generación en RiskScorer
- [ ] Celery task para notificaciones
- [ ] Tests
- [ ] Frontend: Alert display

**Dependencias:** SAFE-402

---

### Story 4.4: Bloqueo preventivo
**ID:** SAFE-404  
**Estimación:** 5 pts  
**Prioridad:** ALTA  
**Sprint:** 4  

**Como** administrador de seguridad  
**Quiero** bloquear acciones cuando el riesgo es crítico  
**Para que** evite filtraciones de datos  

**Criterios de Aceptación:**
- ✓ Si score >= 81 → Bloquear descarga de documento
- ✓ Devolver 403 Forbidden con motivo
- ✓ Notificar usuario del bloqueo
- ✓ Notificar administrador
- ✓ Crear incident ticket automáticamente
- ✓ Permitir desbloqueo manual por admin

**Tareas Técnicas:**
- [ ] Implementar check de score en download view
- [ ] Bloquear si score >= 81
- [ ] Endpoint para desbloquear (admin only)
- [ ] Notificación al usuario
- [ ] Tests

**Dependencias:** SAFE-404

---

## 5. Epic-005: Notificaciones y Alertas

### Story 5.1: Notificaciones por email
**ID:** SAFE-501  
**Estimación:** 5 pts  
**Prioridad:** ALTA  
**Sprint:** 3  

**Como** administrador  
**Quiero** recibir notificaciones por email  
**Para que** sepa de inmediato de alertas críticas  

**Criterios de Aceptación:**
- ✓ Enviar email en alertas HIGH y CRITICAL
- ✓ Email contiene detalles del evento
- ✓ Email tiene link a dashboard
- ✓ Configurable (no enviar en ciertos horarios)
- ✓ Template HTML profesional

**Tareas Técnicas:**
- [ ] Configurar Django email backend (SendGrid/AWS SES)
- [ ] Crear templates de email (HTML)
- [ ] Celery task para envío async
- [ ] Logging de emails enviados
- [ ] Tests

**Dependencias:** SAFE-403

---

### Story 5.2: Notificaciones por SMS
**ID:** SAFE-502  
**Estimación:** 3 pts  
**Prioridad:** MEDIA  
**Sprint:** 4  

**Como** administrador de seguridad  
**Quiero** recibir SMS en alertas críticas  
**Para que** responda al instante sin importar dónde esté  

**Criterios de Aceptación:**
- ✓ Enviar SMS solo en alertas CRITICAL (score >= 81)
- ✓ SMS contiene: Alerta crítica + usuario + documento
- ✓ SMS tiene link corto a dashboard
- ✓ Máximo 1 SMS cada 5 min (evitar spam)

**Tareas Técnicas:**
- [ ] Integración con Twilio
- [ ] Celery task para SMS
- [ ] Rate limiting
- [ ] Tests

**Dependencias:** SAFE-403

---

## 6. Epic-006: Dashboards y Reportes

### Story 6.1: Dashboard ejecutivo
**ID:** SAFE-601  
**Estimación:** 13 pts  
**Prioridad:** ALTA  
**Sprint:** 5  

**Como** administrador  
**Quiero** ver un overview de seguridad en el dashboard  
**Para que** entienda el estado actual del sistema  

**Criterios de Aceptación:**
- ✓ Mostrar alertas activas por nivel
- ✓ Usuarios con mayor riesgo (top 10)
- ✓ Documentos críticos más accedidos
- ✓ Eventos anómalos últimos 30 días
- ✓ Tendencia de alertas (gráfico)
- ✓ Último login de usuarios
- ✓ Actualización en tiempo real (WebSocket)

**Tareas Técnicas:**
- [ ] Crear endpoints para dashboard data
- [ ] Implementar caching (datos se cachean 5 min)
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Gráficos con Recharts
- [ ] Tests
- [ ] Frontend: Dashboard page

**Dependencias:** SAFE-403, SAFE-402

---

### Story 6.2: Reportes de auditoría exportables
**ID:** SAFE-602  
**Estimación:** 8 pts  
**Prioridad:** ALTA  
**Sprint:** 5  

**Como** auditor  
**Quiero** exportar reportes de auditoría en PDF/Excel  
**Para que** pueda compartir con reguladores  

**Criterios de Aceptación:**
- ✓ Filtrar por período, usuario, acción
- ✓ Exportar a PDF con gráficos
- ✓ Exportar a Excel con detalles
- ✓ Incluir firma digital (hash)
- ✓ Generación en < 30 segundos
- ✓ Nombre y metadata completa

**Tareas Técnicas:**
- [ ] Librería reportlab o weasyprint para PDF
- [ ] Librería openpyxl para Excel
- [ ] Celery task para generación async
- [ ] Almacenar en S3
- [ ] Tests
- [ ] Frontend: Report builder

**Dependencias:** SAFE-401, SAFE-601

---

## 7. Epic-007: Gestión de Usuarios

### Story 7.1: Creación y gestión de usuarios
**ID:** SAFE-701  
**Estimación:** 8 pts  
**Prioridad:** CRÍTICA  
**Sprint:** 1  

**Como** administrador  
**Quiero** crear usuarios y asignarles roles  
**Para que** mi equipo pueda acceder al sistema  

**Criterios de Aceptación:**
- ✓ Crear usuario (email, nombre, rol)
- ✓ Enviar email de invitación
- ✓ Usuario setup de contraseña
- ✓ Editar usuario (nombre, rol, permisos)
- ✓ Desactivar usuario (soft delete)
- ✓ Ver lista de todos los usuarios
- ✓ Historial de acciones del usuario

**Tareas Técnicas:**
- [ ] Crear endpoint POST /api/users/
- [ ] Crear endpoint GET /api/users/
- [ ] Crear endpoint PATCH /api/users/{id}/
- [ ] Crear endpoint DELETE /api/users/{id}/
- [ ] Celery task para envío de invitación
- [ ] Tests
- [ ] Frontend: User management page

**Dependencias:** SAFE-101

---

## 8. Epic-008: Infraestructura y DevOps

### Story 8.1: Setup de Docker y Docker Compose
**ID:** SAFE-801  
**Estimación:** 5 pts  
**Prioridad:** ALTA  
**Sprint:** 1  

**Como** desarrollador  
**Quiero** tener Docker Compose para desarrollo  
**Para que** todos tengamos el mismo entorno  

**Criterios de Aceptación:**
- ✓ docker-compose.yml con backend, frontend, db, redis, celery
- ✓ Todos los servicios se inician con docker-compose up
- ✓ Base de datos se inicializa automáticamente
- ✓ Documentación de setup

**Tareas Técnicas:**
- [ ] Crear Dockerfile para backend
- [ ] Crear Dockerfile para frontend
- [ ] Crear docker-compose.yml
- [ ] Crear .env.example
- [ ] Scripts de inicialización
- [ ] Documentación en README

---

### Story 8.2: CI/CD con GitHub Actions
**ID:** SAFE-802  
**Estimación:** 8 pts  
**Prioridad:** ALTA  
**Sprint:** 2  

**Como** desarrollador  
**Quiero** ejecutar tests automáticamente en cada commit  
**Para que** no merge code que no funciona  

**Criterios de Aceptación:**
- ✓ Ejecutar tests en cada push
- ✓ Verificar cobertura (mín 80%)
- ✓ Linting (flake8, black, eslint)
- ✓ Build Docker image
- ✓ Notificar si falla

**Tareas Técnicas:**
- [ ] Crear workflows en .github/workflows/
- [ ] Backend tests workflow
- [ ] Frontend tests workflow
- [ ] Docker build workflow
- [ ] Documentación

---

## 9. Resumen de Capacidad

### Estimaciones por Sprint

| Sprint | Duración | Capacidad | Stories | Puntos | Burn |
|--------|----------|-----------|---------|--------|------|
| 1 | 1-2 jun | 40 pts | SAFE-101, 201, 302 | 29 pts | ✓ |
| 2 | 3-16 jun | 40 pts | SAFE-102, 103, 301, 401 | 39 pts | ✓ |
| 3 | 17-30 jun | 40 pts | SAFE-203, 204, 402, 501 | 42 pts | ≈ |
| 4 | 1-14 jul | 40 pts | SAFE-403, 404, 502, 701 | 39 pts | ✓ |
| 5 | 15-28 jul | 40 pts | SAFE-601, 602, 801 | 26 pts | ✓ |
| 6 | 29-11 ago | 40 pts | SAFE-802, Testing, Docs | 40 pts | ✓ |

**Total:** ~12 semanas, ~215 puntos de historia

---

## 10. Dependencias Críticas

```
SAFE-101 (Login)
    └─ SAFE-102 (2FA)
    └─ SAFE-301 (Permisos doc)
    └─ SAFE-401 (Audit)
    
SAFE-201 (Upload)
    └─ SAFE-203 (Versioning)
    └─ SAFE-204 (Search)

SAFE-202 (Download)
    └─ SAFE-402 (Scoring)
    └─ SAFE-403 (Alerts)
    └─ SAFE-404 (Blocking)

SAFE-302 (Roles)
    └─ SAFE-301 (Doc Perms)

SAFE-401 (Audit)
    └─ SAFE-402 (Scoring)

SAFE-402 (Scoring)
    └─ SAFE-403 (Alerts)
    └─ SAFE-404 (Blocking)

SAFE-403 (Alerts)
    └─ SAFE-501 (Email Notif)
    └─ SAFE-502 (SMS Notif)

SAFE-601 (Dashboard)
    └─ SAFE-602 (Reports)
```

---

## 11. Métricas de Éxito

| Métrica | Target | Cómo medir |
|---------|--------|-----------|
| Test Coverage | 80%+ | pytest coverage report |
| API Response Time | < 3s | Benchmark con Locust |
| SIGRA Scoring Time | < 500ms | Logs y monitoring |
| Uptime | 99.5%+ | Monitoring (Sentry/Prometheus) |
| Code Quality | Grade A | SonarQube |
| Security | 0 vulnerabilities | OWASP scanning |
| Documentación | 100% | Docstrings + API docs |

---

**Fin de Backlog Inicial**
