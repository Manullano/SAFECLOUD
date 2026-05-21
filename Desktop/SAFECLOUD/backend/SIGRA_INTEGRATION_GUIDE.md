# SIGRA Integration Guide - SAFECLOUD

## 📋 Descripción General

Este documento describe cómo SIGRA (Security Intelligence Engine) está integrado en la plataforma SAFECLOUD.

## 🏗️ Estructura de Componentes

### 1. **Models** (`models.py` en apps/audit y apps/sigra)

#### Apps Audit
- `AuditLog`: Registro inmutable de todas las acciones del sistema
- `KnownIP`: IPs conocidas de cada usuario
- `KnownDevice`: Dispositivos conocidos de cada usuario

#### Apps SIGRA
- `SIGRAEvent`: Evento analizado con puntaje de riesgo
- `SIGRAAlert`: Alerta generada cuando el riesgo es significativo

### 2. **Motor de Scoring** (`scoring.py`)

**Clase: `RiskScorer`**

Calcula el puntaje de riesgo basado en:
- Hora del acceso (fuera de horario laboral)
- IP del usuario (desconocida, corporativa, VPN)
- Dispositivo (desconocido, confiable)
- Tipo de acción (lectura, descarga, edición, eliminación)
- Criticidad del documento
- Volumen de eventos (descargas masivas)
- Historial del usuario (alertas previas, buen comportamiento)
- Rol del usuario (acciones incompatibles)

**Algoritmo:**
```
risk_score = base_score + context_modifiers + anomaly_score + history_modifiers

Niveles de riesgo:
- LOW:      0-30 puntos
- MEDIUM:  31-60 puntos
- HIGH:    61-80 puntos
- CRITICAL: 81+ puntos
```

### 3. **Tasks Asincrónicas** (`tasks.py`)

**Flujo de procesamiento:**

```
1. AuditLog creado
   ↓
2. Señal dispara process_event_async (Celery task)
   ↓
3. RiskScorer calcula puntaje
   ↓
4. SIGRAEvent creado con resultado
   ↓
5. Si score >= 50: create_alert_async
   ↓
6. SIGRAAlert generada
   ↓
7. send_alert_notification (email, SMS, in-app)
   ↓
8. Si severidad CRITICAL: escalate_alert
```

**Tasks principales:**
- `process_event_async`: Procesa evento y calcula riesgo
- `create_alert_async`: Genera alerta si riesgo es significativo
- `send_alert_notification`: Envía notificaciones (email, SMS, in-app)
- `register_known_ip`: Registra IP conocida
- `register_known_device`: Registra dispositivo conocido
- `escalate_alert`: Escala alerta crítica a incidente
- `cleanup_old_events`: Limpia eventos antiguos

### 4. **API Endpoints** (`views.py` + `urls.py`)

**SIGRA Events:**
```
GET  /api/sigra/events/                  # Listar eventos
GET  /api/sigra/events/{id}/              # Detalle de evento
GET  /api/sigra/events/by_risk_level/     # Por nivel de riesgo
GET  /api/sigra/events/stats/             # Estadísticas
```

**SIGRA Alerts:**
```
GET  /api/sigra/alerts/                  # Listar alertas
GET  /api/sigra/alerts/{id}/              # Detalle de alerta
POST /api/sigra/alerts/{id}/resolve/      # Resolver alerta
GET  /api/sigra/alerts/open_alerts/       # Solo abiertas
GET  /api/sigra/alerts/by_severity/       # Por severidad
GET  /api/sigra/alerts/stats/             # Estadísticas
```

**Risk Score:**
```
GET  /api/sigra/risk-score/my_risk_profile/    # Mi perfil
GET  /api/sigra/risk-score/high_risk_users/    # Usuarios alto riesgo (admin)
```

**Anomalies:**
```
GET  /api/sigra/anomalies/list_anomalies/      # Anomalías detectadas
```

### 5. **Señales** (`signals.py`)

Cuando se crea un `AuditLog`, se dispara automáticamente:
```python
@receiver(post_save, sender=AuditLog)
def trigger_sigra_processing(sender, instance, created, **kwargs):
    if created:
        process_event_async.delay(instance.id)
```

## 🔧 Integración con Settings

Agregar a `settings.py`:

```python
# SIGRA Configuration
SIGRA_CONFIG = {
    'ENABLED': True,
    'RISK_THRESHOLD_ALERT': 50,      # Score para crear alerta
    'RISK_THRESHOLD_ESCALATE': 81,   # Score para escalar
    'CLEANUP_DAYS': 90,               # Limpiar eventos antiguos
    'ASYNC_PROCESSING': True,         # Usar Celery
}

# Logging SIGRA
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'sigra_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/sigra.log',
        },
    },
    'loggers': {
        'sigra': {
            'handlers': ['sigra_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## 📱 Integración con Auditoría

Para que SIGRA funcione, el sistema debe crear `AuditLog` cuando ocurren eventos importantes:

```python
from audit.models import AuditLog

# En views, middleware, o serializers:
AuditLog.objects.create(
    company=user.company,
    user=user,
    action='DOWNLOAD_DOC',
    document=document,
    ip_address=get_client_ip(request),
    user_agent=request.META.get('HTTP_USER_AGENT'),
    device_id=request.META.get('HTTP_X_DEVICE_ID'),
    status='SUCCESS',
    metadata={
        'file_size': document.file.size,
        'download_time': 2.3,  # segundos
    }
)
```

## 🚀 Instalación

### 1. Agregar app a settings.py
```python
INSTALLED_APPS = [
    ...
    'safecloud_api.apps.audit',
    'safecloud_api.apps.sigra',
    ...
]
```

### 2. Agregar URLs a urls.py
```python
urlpatterns = [
    ...
    path('api/sigra/', include('safecloud_api.apps.sigra.urls')),
    ...
]
```

### 3. Ejecutar migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Configurar Celery
```python
# celery.py
from celery import Celery

app = Celery('safecloud_api')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Ejecutar worker
celery -A safecloud_api worker -l info
```

## 📊 Monitoreo

### Dashboard de SIGRA en Django Admin
```
/admin/sigra/sigra-event/
/admin/sigra/sigra-alert/
```

### Logs
```bash
tail -f logs/sigra.log
```

### Métricas
- Total de eventos procesados
- Alertas abiertas por severidad
- Usuarios de alto riesgo
- Tendencias de riesgo (últimos 7, 30 días)

## 🛡️ Casos de Uso

### UC-001: Login con riesgo
```
1. Usuario intenta login desde IP desconocida
2. AuditLog: action='LOGIN', ip='1.2.3.4', status='SUCCESS'
3. process_event_async dispara RiskScorer
4. unknown_ip +20, new_user +10 → score=30 (MEDIUM)
5. Si score >= 50: crear alerta
```

### UC-003: Descarga masiva
```
1. Usuario descarga 15 documentos en 5 minutos
2. Cada descarga crea AuditLog
3. RiskScorer detecta mass_download (+25, +5 extra)
4. score=65 (HIGH) → alerta enviada
```

### UC-004: Visualizar alertas
```
GET /api/sigra/alerts/?status=OPEN&severity=CRITICAL
→ Retorna alertas abiertas críticas para dashboard
```

## 🔐 Consideraciones de Seguridad

1. **Auditoría inmutable**: No se pueden borrar AuditLogs
2. **Permisos**: Usuarios solo ven sus propios eventos/alertas
3. **Admin**: Staff ve todo
4. **Escenarios críticos**: Se escalan automáticamente
5. **Logging detallado**: Todas las decisiones quedan registradas

## 📈 Rendimiento

- **Procesamiento**: < 500ms por evento (target)
- **Base de datos**: Índices en company, user, risk_level, created_at
- **Asincrónico**: Celery evita bloquear requests
- **Limpieza**: Task programada para purgar eventos antiguos

## 🔄 Próximos Pasos

1. **Machine Learning**: Integrar modelos para detección de anomalías
2. **Threat Intelligence**: Conectar con feeds de IPs/dominios maliciosos
3. **Integración SIEM**: Enviar alertas a SIEM externo
4. **Dashboards**: Frontend con visualizaciones en tiempo real
5. **Automatización**: Acciones automáticas según severidad (bloquear usuario, etc.)
