# SIGRA Database Schema

## 📊 Tablas Principales

### 1. audit_logs (Auditoría de eventos)

```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY,
    company_id INT NOT NULL FOREIGN KEY,
    user_id INT NOT NULL FOREIGN KEY,
    action VARCHAR(100) NOT NULL,
    document_id INT NULL FOREIGN KEY,
    resource_type VARCHAR(50),
    resource_id INT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    status VARCHAR(50),  -- SUCCESS, FAILED, DENIED, BLOCKED
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL (indexed)
);

CREATE INDEX idx_audit_company_created ON audit_logs(company_id, created_at);
CREATE INDEX idx_audit_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_action_created ON audit_logs(action, created_at);
CREATE INDEX idx_audit_status_created ON audit_logs(status, created_at);
```

**Propósito**: Registro inmutable de todas las acciones del sistema

**Acciones registradas**:
- LOGIN, LOGOUT
- VIEW_DOC, DOWNLOAD_DOC, UPLOAD_DOC, EDIT_DOC, DELETE_DOC
- CHANGE_PERMISSION
- CREATE_USER, UPDATE_USER, DELETE_USER, CHANGE_ROLE
- FAILED_LOGIN, DENIED_ACCESS
- CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT

---

### 2. known_ips (IPs conocidas)

```sql
CREATE TABLE known_ips (
    id BIGINT PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY,
    ip_address INET NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    country_code VARCHAR(2),
    latitude FLOAT,
    longitude FLOAT,
    is_corporate BOOLEAN,
    is_vpn BOOLEAN,
    created_at TIMESTAMP NOT NULL,
    last_used TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_known_ips_user_ip ON known_ips(user_id, ip_address);
```

**Propósito**: Registro de IPs conocidas para detectar acceso desde ubicaciones nuevas

**Campos**:
- `is_corporate`: IP del rango corporativo (reduce riesgo)
- `is_vpn`: Conexión a través de VPN corporativa (reduce riesgo)
- `last_used`: Para actualizar en cada acceso

---

### 3. known_devices (Dispositivos conocidos)

```sql
CREATE TABLE known_devices (
    id BIGINT PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),  -- desktop, mobile, tablet
    user_agent TEXT,
    is_trusted BOOLEAN,
    created_at TIMESTAMP NOT NULL,
    last_used TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_known_devices_user_device ON known_devices(user_id, device_id);
```

**Propósito**: Registro de dispositivos conocidos para detectar nuevos dispositivos

**Campos**:
- `device_type`: desktop, mobile, tablet
- `is_trusted`: Usuario marcó como dispositivo de confianza
- `device_id`: Hash o identificador único del dispositivo

---

### 4. sigra_events (Eventos procesados por SIGRA)

```sql
CREATE TABLE sigra_events (
    id BIGINT PRIMARY KEY,
    company_id INT NOT NULL FOREIGN KEY,
    audit_log_id BIGINT NULL FOREIGN KEY,
    user_id INT NOT NULL FOREIGN KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    risk_score INT NOT NULL,  -- 0-100+
    risk_level VARCHAR(20) NOT NULL,  -- LOW, MEDIUM, HIGH, CRITICAL
    scoring_breakdown JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL (indexed)
);

CREATE INDEX idx_sigra_events_company_created ON sigra_events(company_id, created_at);
CREATE INDEX idx_sigra_events_user_created ON sigra_events(user_id, created_at);
CREATE INDEX idx_sigra_events_risk_level ON sigra_events(risk_level, created_at);
```

**Propósito**: Almacena eventos analizados por SIGRA con sus puntajes de riesgo

**Campos**:
- `event_type`: LOGIN, DOWNLOAD_DOC, UPLOAD_DOC, EDIT_DOC, DELETE_DOC, CHANGE_PERMISSION, FAILED_LOGIN, DENIED_ACCESS
- `risk_score`: Puntaje 0-100+ (resultado del cálculo)
- `risk_level`: Clasificación (LOW=0-30, MEDIUM=31-60, HIGH=61-80, CRITICAL=81+)
- `scoring_breakdown`: JSON con desglose del cálculo
  ```json
  {
    "anomalous_time": 15,
    "unknown_ip": 20,
    "unknown_device": 0,
    "mass_download": 0,
    "document_criticality": 0,
    "document_action": 0,
    "corporate_ip": 0,
    "good_behavior": -5
  }
  ```

**Ejemplo de event_data**:
```json
{
  "action": "DOWNLOAD_DOC",
  "ip_address": "203.0.113.5",
  "device_id": "device-001",
  "document_id": 42,
  "timestamp": "2024-01-15T22:30:00Z",
  "status": "SUCCESS"
}
```

---

### 5. sigra_alerts (Alertas generadas)

```sql
CREATE TABLE sigra_alerts (
    id BIGINT PRIMARY KEY,
    company_id INT NOT NULL FOREIGN KEY,
    sigra_event_id BIGINT NOT NULL FOREIGN KEY (UNIQUE),
    user_id INT NOT NULL FOREIGN KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- MEDIUM, HIGH, CRITICAL
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB NOT NULL,
    status VARCHAR(50),  -- OPEN, INVESTIGATING, RESOLVED, DISMISSED
    is_blocked BOOLEAN,
    is_escalated BOOLEAN,
    incident_ticket_id VARCHAR(255),
    resolved_at TIMESTAMP NULL,
    resolved_by_id INT NULL FOREIGN KEY,
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL (indexed),
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sigra_alerts_status_severity ON sigra_alerts(status, severity, created_at);
CREATE INDEX idx_sigra_alerts_user_status ON sigra_alerts(user_id, status);
CREATE INDEX idx_sigra_alerts_company_created ON sigra_alerts(company_id, created_at);
```

**Propósito**: Alertas generadas cuando el riesgo es significativo

**Alert Types**:
- ANOMALOUS_TIME: Acceso fuera de horario laboral
- UNKNOWN_IP: Acceso desde IP desconocida
- UNKNOWN_DEVICE: Acceso desde dispositivo desconocido
- FAILED_LOGINS: Múltiples intentos fallidos de login
- MASS_DOWNLOAD: Descarga anómala de documentos
- CRITICAL_DOC_ACCESS: Acceso a documento crítico
- PERMISSION_CHANGE: Cambio de permisos sospechoso
- ROLE_ANOMALY: Acción incompatible con el rol
- EXPORT_ATTEMPT: Intento de exportación de datos

**Severities**:
- MEDIUM: Investigación recomendada
- HIGH: Acción recomendada
- CRITICAL: Escalación requerida

**States**:
- OPEN: Nueva alerta, sin revisión
- INVESTIGATING: Admin está investigando
- RESOLVED: Resuelto, falso positivo o legítimo
- DISMISSED: Ignorada (no tomar acción)

**Ejemplo de evidence**:
```json
{
  "event_type": "DOWNLOAD_DOC",
  "risk_score": 65,
  "scoring_breakdown": {
    "unknown_ip": 20,
    "mass_download": 25,
    "anomalous_time": 15,
    "good_behavior": -5
  },
  "event_data": {
    "action": "DOWNLOAD_DOC",
    "ip_address": "198.51.100.5",
    "device_id": "unknown",
    "timestamp": "2024-01-15T22:30:00Z"
  }
}
```

---

## 🔗 Relaciones

```
┌─────────────────┐
│    Company      │
└────────┬────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
    │                              │
┌───▼──────────┐          ┌───────▼────┐
│  AuditLog    │          │ SIGRAEvent │
│              │◄─────────┤            │
│ - action     │ 1:1      │ - risk     │
│ - ip_address │          │ - level    │
│ - device_id  │          └───┬────────┘
│ - timestamp  │              │
└──────────────┘              │ 1:1
                          ┌───▼────────┐
                          │SIGRAAlert  │
                          │            │
                          │ - severity │
                          │ - status   │
                          └────────────┘

┌──────────────────┐      ┌─────────────┐
│      User        │──────┤ KnownIP     │
│                  │      │             │
│                  │  N:M │ - is_vpn    │
└──────────────────┘      └─────────────┘
    │
    │ N:M
    │
┌─────────────────┐
│ KnownDevice     │
│                 │
│ - device_id     │
│ - is_trusted    │
└─────────────────┘
```

---

## 📈 Índices por Rendimiento

**Queries frecuentes y sus índices**:

```sql
-- Buscar alertas abiertas para usuario
CREATE INDEX idx_alerts_user_status 
ON sigra_alerts(user_id, status);

-- Contar eventos por riesgo en período
CREATE INDEX idx_events_risk_level_created 
ON sigra_events(risk_level, created_at);

-- Limpieza de eventos antiguos
CREATE INDEX idx_events_created 
ON sigra_events(created_at);

-- Auditoría por usuario y período
CREATE INDEX idx_audit_user_created 
ON audit_logs(user_id, created_at);

-- Estadísticas por acción
CREATE INDEX idx_audit_action_created 
ON audit_logs(action, created_at);
```

---

## 💾 Estimaciones de Tamaño

Asumiendo 1000 usuarios y 10 acciones/usuario/día:

```
AuditLog:
- 10,000 registros/día × 30 días = 300K registros
- ~500 bytes/registro → 150 MB/mes

SIGRAEvent:
- ~20% de auditlogs generan eventos = 60K registros/mes
- ~1 KB/registro → 60 MB/mes

SIGRAAlert:
- ~10% de eventos generan alertas = 6K registros/mes
- ~2 KB/registro → 12 MB/mes

KnownIP/Device:
- ~1K IPs × 30 actualizaciones = 30K/mes
- ~200 bytes → 6 MB/mes
```

**Total estimado: ~230 MB/mes**

Con limpieza automática de eventos > 90 días:
- AuditLog: 450 MB (rotación 3 meses)
- SIGRAEvent: 180 MB (rotación 3 meses)
- SIGRAAlert: 36 MB (permanente para auditoría)

---

## 🔍 Queries útiles

```sql
-- Alertas abiertas críticas
SELECT * FROM sigra_alerts 
WHERE status = 'OPEN' AND severity = 'CRITICAL'
ORDER BY created_at DESC;

-- Usuarios de alto riesgo
SELECT user_id, COUNT(*) as alert_count
FROM sigra_alerts
WHERE severity = 'CRITICAL' AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(*) > 3
ORDER BY alert_count DESC;

-- Eventos por tipo
SELECT event_type, COUNT(*) as count, AVG(risk_score) as avg_score
FROM sigra_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- IPs sospechosas
SELECT ip_address, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'FAILED_LOGIN'
AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY attempts DESC;

-- Documentos críticos accedidos
SELECT d.id, d.title, a.user_id, COUNT(*) as access_count
FROM audit_logs a
JOIN documents d ON a.document_id = d.id
WHERE d.criticality_level = 4
AND a.action IN ('VIEW_DOC', 'DOWNLOAD_DOC')
AND a.created_at >= NOW() - INTERVAL '7 days'
GROUP BY d.id, d.title, a.user_id
ORDER BY access_count DESC;
```

---

## 🔐 Privacidad y Retención

**Políticas de retención**:
- AuditLog: 1 año (compliance)
- SIGRAEvent: 90 días (análisis)
- SIGRAAlert: Permanente (incidents)
- KnownIP/Device: Actualización continuous, limpieza anual

**GDPR**: 
- Derecho al olvido: Puede anonimizarse si no hay alertas abiertas
- Política: Purgar después de 90 días sin alertas críticas

---

## 📝 Migración (Django)

```bash
# Crear migraciones
python manage.py makemigrations audit sigra

# Ver SQL generado
python manage.py sqlmigrate audit 0001
python manage.py sqlmigrate sigra 0001

# Aplicar migraciones
python manage.py migrate
```

**Archivo**: `backend/safecloud_api/apps/[audit|sigra]/migrations/`
