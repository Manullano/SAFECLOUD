# 🔒 SIGRA - Quick Start Guide

## ¿Qué es SIGRA?

**SIGRA** (Security Intelligence Engine) es el módulo de seguridad inteligente de SAFECLOUD que:
- 🚨 Detecta comportamientos anómalos en tiempo real
- 📊 Calcula puntajes de riesgo para cada acción
- 🎯 Genera alertas automáticas
- 📱 Notifica a usuarios y admins
- 🔐 Mantiene auditoría inmutable

## ⚡ Quick Start (5 minutos)

### 1. Copiar configuración a settings.py
```bash
# Ver archivo SIGRA_SETTINGS_EXAMPLE.py y copiar valores
cp SIGRA_SETTINGS_EXAMPLE.py temp.txt  # Para referencia
```

Agregar a `safecloud_api/settings.py`:
```python
# Apps
INSTALLED_APPS += [
    'safecloud_api.apps.audit',
    'safecloud_api.apps.sigra',
]

# URLs
urlpatterns += [
    path('api/sigra/', include('safecloud_api.apps.sigra.urls')),
]

# Copiar configuración de SIGRA_SETTINGS_EXAMPLE.py
SIGRA_CONFIG = { ... }
CELERY_BROKER_URL = 'redis://localhost:6379/0'
```

### 2. Crear migraciones e instalar
```bash
cd backend
pip install celery redis django-celery-beat

python manage.py makemigrations
python manage.py migrate
```

### 3. Iniciar servicios (3 terminales)
```bash
# Terminal 1
redis-server

# Terminal 2
celery -A safecloud_api worker -l info

# Terminal 3
python manage.py runserver
```

### 4. Acceder a Django Admin
```
http://localhost:8000/admin
Login con tu usuario admin
→ SIGRA → SIGRAEvent / SIGRAAlert
```

### 5. Probar con script
```bash
python manage.py shell < test_sigra.py
```

## 🎨 Cómo funciona

```
Usuario realiza acción (login, descarga, etc)
    ↓
AuditLog registra el evento
    ↓
SIGRA automáticamente:
  - Calcula riesgo (score 0-100+)
  - Clasifica (LOW/MEDIUM/HIGH/CRITICAL)
  - Genera alerta si score >= 50
  - Notifica por email/SMS
    ↓
Admin ve alertas en dashboard
```

## 📌 Puntos clave

1. **Automático**: Después de crear AuditLog, SIGRA procesa automáticamente
2. **Asincrónico**: No bloquea requests (usa Celery)
3. **Inteligente**: Evalúa 10+ variables de contexto
4. **Escalable**: Almacena en Redis, procesa en workers
5. **Auditable**: Todos los eventos quedan registrados

## 📚 Documentos

| Archivo | Propósito |
|---------|-----------|
| `SIGRA_INTEGRATION_GUIDE.md` | Guía técnica completa |
| `SIGRA_SETTINGS_EXAMPLE.py` | Configuración template |
| `SIGRA_IMPLEMENTATION_COMPLETE.md` | Summary de lo creado |
| `test_sigra.py` | Script para probar |
| `setup_sigra.sh` | Instalación automatizada |

## 🔑 Conceptos

### Risk Score (0-100+)
Suma ponderada de:
- Base score por evento (15-35)
- Context modifiers (-15 a +30)
- Anomaly detection (+5 a +35)
- History modifiers (-5 a +30)

### Risk Levels
- **LOW** (0-30): Actividad normal
- **MEDIUM** (31-60): Algo inusual, monitorear
- **HIGH** (61-80): Sospechoso, acción recomendada
- **CRITICAL** (81+): Muy sospechoso, escalación

### Alert Types
- ANOMALOUS_TIME: Acceso fuera de horario
- UNKNOWN_IP: IP desconocida
- UNKNOWN_DEVICE: Dispositivo desconocido
- FAILED_LOGINS: Múltiples intentos fallidos
- MASS_DOWNLOAD: Descargas anómales
- CRITICAL_DOC_ACCESS: Documento crítico accedido
- PERMISSION_CHANGE: Cambio de permisos
- ROLE_ANOMALY: Acción no compatible con rol
- EXPORT_ATTEMPT: Intento de exportación

## 🚀 API Endpoints (ejemplos)

```bash
# Ver eventos SIGRA
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/sigra/events/

# Ver alertas abiertas
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/sigra/alerts/?status=OPEN

# Mi perfil de riesgo
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/sigra/risk-score/my_risk_profile/

# Anomalías detectadas
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/sigra/anomalies/list_anomalies/
```

## 🛠️ Troubleshooting

**Problema**: SIGRAEvent no se crea después de AuditLog
```
Solución: Verificar que Celery worker está corriendo
celery -A safecloud_api worker -l info
```

**Problema**: Error "Redis connection refused"
```
Solución: Iniciar Redis
redis-server
```

**Problema**: Migraciones fallidas
```
Solución: Asegurar que audit y sigra están en INSTALLED_APPS
python manage.py makemigrations audit sigra
python manage.py migrate
```

**Problema**: Alerts no se generan
```
Solución: Verificar threshold (default 50)
En SIGRA_CONFIG: 'RISK_THRESHOLD_ALERT': 50
```

## 📊 Monitoreo

```bash
# Ver logs SIGRA
tail -f logs/sigra.log

# Ver logs Celery
tail -f celery.log

# Django shell para queries
python manage.py shell
>>> from sigra.models import SIGRAEvent, SIGRAAlert
>>> SIGRAAlert.objects.filter(status='OPEN').count()
```

## 🔐 Seguridad

- ✅ AuditLogs no se pueden borrar
- ✅ Usuarios ven solo sus eventos
- ✅ Admin ve todo
- ✅ Tokens requeridos para API
- ✅ Logging detallado de todo

## 📈 Variables evaluadas

El motor SIGRA analiza:

1. **Acceso temporal**: ¿A qué hora? (fuera de horario = +15)
2. **Ubicación (IP)**: ¿IP conocida? (nueva = +20)
3. **Dispositivo**: ¿Dispositivo conocido? (nuevo = +20)
4. **Rol**: ¿Acción compatible con rol? (no = +25)
5. **Documento**: ¿Qué criticidad? (+0 a +30)
6. **Acción**: ¿Qué tipo? lectura/descarga/editar/borrar (+0 a +20)
7. **Volumen**: ¿Demasiadas acciones? descarga masiva = +25
8. **Historial**: ¿Usuario de confianza? buen comportamiento = -5
9. **Usuario nuevo**: Menos de 1 semana = +10
10. **Alertas previas**: Indicador de patrón = +5 cada una

## 🎓 Ejemplo de flujo

```
1. Usuario login desde China (IP desconocida)
   - unknown_ip: +20
   - new_ip: +10
   → score = 30 (MEDIUM)
   → Sin alerta (< 50)

2. Usuario descarga 20 docs en 5 min desde IP desconocida
   - mass_download: +25
   - unknown_ip: +20
   - anomalous_time (3am): +15
   → score = 60 (HIGH)
   → ✅ Alerta generada
   → Email enviado

3. Admin intenta borrar documentos críticos desde país desconocido
   - document_criticality: +30
   - delete_action: +20
   - unknown_ip: +20
   - anomalous_time: +15
   → score = 85 (CRITICAL)
   → ✅ Alerta crítica
   → ✅ Escalación automática
   → Crear incidente
```

## 💡 Casos de uso

✅ **Detección de fraude**: IP nueva + descarga masiva
✅ **Cuenta comprometida**: Muchos intentos fallidos
✅ **Insider threat**: Employee sabotea datos críticos
✅ **Compliance**: Auditoría de quién accedió qué cuándo
✅ **Incidente response**: Investigar alertas críticas

## 📞 Ayuda

Si algo no funciona:
1. Revisar `logs/sigra.log`
2. Ejecutar `python manage.py shell < test_sigra.py`
3. Verificar Redis y Celery están corriendo
4. Revisar que apps están en INSTALLED_APPS

---

**¡SIGRA está listo para usar!** 🚀

Para más detalles: Ver `SIGRA_INTEGRATION_GUIDE.md`
