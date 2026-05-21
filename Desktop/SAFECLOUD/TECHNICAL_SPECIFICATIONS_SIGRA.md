# Especificaciones Técnicas
## SAFECloud + SIGRA Security Intelligence Engine

**Fecha:** Mayo 21, 2026  
**Versión:** 1.0  
**Estado:** En desarrollo

---

## 1. Arquitectura General

### 1.1 Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────────┐         ┌──────────────────────┐ │
│  │   React Frontend  │         │   Admin Dashboard    │ │
│  │  (TypeScript)     │         │   (Analytics/Alerts) │ │
│  └────────┬─────────┘         └──────────┬───────────┘ │
└───────────┼────────────────────────────────┼────────────┘
            │                                │
            │           HTTPS/WSS            │
            │                                │
┌───────────┼────────────────────────────────┼────────────┐
│           │      API GATEWAY LAYER        │            │
│  ┌────────▼──────────────────────────────▼──────┐      │
│  │    Django REST API (Port 8000)               │      │
│  │  - Authentication (JWT + 2FA)                │      │
│  │  - Rate limiting & throttling                │      │
│  │  - CORS configuration                        │      │
│  │  - Request/Response logging                  │      │
│  └──────────────────┬──────────────────────────┘      │
└─────────────────────┼────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──┐   ┌─────▼────┐   ┌───▼──────┐
│ Business │   │  SIGRA   │   │ Audit    │
│  Logic   │   │  Engine  │   │ Logger   │
│          │   │          │   │          │
└────┬─────┘   └─────┬────┘   └───┬──────┘
     │               │            │
     └───────────────┼────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐    ┌──────┐    ┌──▼───┐
    │PostgreSQL   │Redis  │    │S3/   │
    │(Main DB)│   │Cache  │    │MinIO │
    └────────┘    └──────┘    │(Files)
                               └──────┘
```

### 1.2 Servicios Microservicios (Opcional Future)

Para escalabilidad futura, se podrán separar en:
- `auth-service` - Autenticación y sesiones
- `document-service` - Gestión documental
- `sigra-service` - Motor de análisis de riesgos
- `audit-service` - Auditoría y logs
- `notification-service` - Alertas y notificaciones

---

## 2. Backend API Specification

### 2.1 Stack Backend

```
Framework:    Django 4.2 LTS
API:          Django REST Framework 3.14+
Autenticación: djangorestframework-simplejwt 5.2+
2FA:          django-otp 1.1+
Async:        Celery 5.3+ with Redis
Testing:      pytest + pytest-django
Database:     PostgreSQL 14+
Cache:        Redis 7+
File Storage: S3 compatible (MinIO) o Azure Blob
```

### 2.2 Estructura de Carpetas Backend

```
backend/
├── manage.py
├── requirements.txt
├── pytest.ini
├── docker-compose.yml
├── Dockerfile
├── entrypoint.sh
├── safecloud_api/
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── settings.py           # Configuración Django
│   ├── urls.py               # URLs principales
│   ├── middleware.py         # Middleware personalizado
│   ├── decorators.py         # Decoradores útiles
│   ├── config.py             # Configuración app
│   └── apps/
│       ├── auth/             # Autenticación y sesiones
│       │   ├── models.py
│       │   ├── views.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── permissions.py
│       │   └── tests/
│       ├── users/            # Gestión de usuarios
│       ├── companies/        # Empresas/clientes
│       ├── projects/         # Proyectos
│       ├── documents/        # Gestión documental
│       ├── sigra/            # Motor SIGRA ⭐
│       │   ├── engine.py     # Motor de riesgo
│       │   ├── models.py     # Alertas, eventos
│       │   ├── scoring.py    # Algoritmo de scoring
│       │   ├── rules.py      # Reglas de SIGRA
│       │   ├── views.py
│       │   └── tasks.py      # Celery tasks
│       ├── audit/            # Auditoría y logs
│       ├── notifications/    # Alertas y notificaciones
│       └── core/             # Utilidades compartidas
│           ├── permissions.py
│           ├── serializers.py
│           ├── utils.py
│           └── decorators.py
└── tests/
    ├── conftest.py           # Pytest fixtures
    ├── test_auth.py
    ├── test_sigra.py
    └── factories.py          # Data factories
```

### 2.3 Endpoints Clave

#### Autenticación
```
POST   /api/auth/login/              - Login
POST   /api/auth/logout/             - Logout
POST   /api/auth/refresh/            - Refresh JWT
POST   /api/auth/register/           - Registro (admin only)
POST   /api/auth/2fa/setup/          - Setup 2FA
POST   /api/auth/2fa/verify/         - Verify 2FA token
GET    /api/auth/me/                 - Current user
```

#### Usuarios
```
GET    /api/users/                   - List users
POST   /api/users/                   - Create user (admin)
GET    /api/users/{id}/              - Get user detail
PATCH  /api/users/{id}/              - Update user
DELETE /api/users/{id}/              - Delete user (soft delete)
GET    /api/users/{id}/sessions/     - User sessions
```

#### Documentos
```
GET    /api/documents/               - List documents
POST   /api/documents/               - Upload document
GET    /api/documents/{id}/          - Get document metadata
PATCH  /api/documents/{id}/          - Update metadata
DELETE /api/documents/{id}/          - Delete document
GET    /api/documents/{id}/download/ - Download file
GET    /api/documents/{id}/versions/ - Version history
```

#### SIGRA - Alertas y Riesgos
```
GET    /api/sigra/alerts/            - List alerts
GET    /api/sigra/alerts/{id}/       - Alert detail
POST   /api/sigra/alerts/{id}/resolve/ - Resolve alert
GET    /api/sigra/risk-score/        - User risk scores
GET    /api/sigra/anomalies/         - Detected anomalies
GET    /api/sigra/events/            - All events
```

#### Auditoría
```
GET    /api/audit/logs/              - Audit log
GET    /api/audit/logs/{id}/         - Log detail
GET    /api/audit/export/            - Export audit (PDF/Excel)
```

#### Dashboards
```
GET    /api/dashboard/summary/       - Overview
GET    /api/dashboard/alerts/        - Active alerts
GET    /api/dashboard/users-risk/    - Users by risk
GET    /api/dashboard/documents/     - Document stats
```

---

## 3. Frontend Specification

### 3.1 Stack Frontend

```
Framework:    React 18+
Language:     TypeScript 5+
Build:        Next.js 13+ (App Router)
Styling:      Tailwind CSS 3+
State:        Zustand 4+
HTTP:         Axios + interceptors
UI Components: Radix UI / Headless UI
Charts:       Recharts
Tables:       TanStack Table (React Table)
Auth:         Custom JWT + 2FA handler
```

### 3.2 Estructura Frontend

```
frontend/
├── pages/
│   ├── login.tsx              # Login page
│   ├── register.tsx           # Registration
│   ├── dashboard/
│   │   ├── index.tsx          # Main dashboard
│   │   ├── alerts.tsx         # SIGRA alerts
│   │   ├── users.tsx          # User management
│   │   ├── documents.tsx      # Document management
│   │   └── audit.tsx          # Audit logs
│   ├── settings/
│   │   └── security.tsx       # 2FA setup, sessions
│   └── reports/
│       └── index.tsx          # Reports export
├── components/
│   ├── Layout.tsx             # Main layout
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── AlertCard.tsx          # Alert display
│   ├── UserRiskBadge.tsx      # Risk level badge
│   ├── DocumentTable.tsx
│   └── Charts/
│       ├── RiskTrendChart.tsx
│       └── AlertsChart.tsx
├── context/
│   ├── AuthContext.tsx        # Auth state
│   ├── AlertContext.tsx       # Alert notifications
│   └── PermissionContext.tsx  # Permissions
├── hooks/
│   ├── useAuth.ts
│   ├── useUser.ts
│   ├── useDocuments.ts
│   ├── useSIGRA.ts
│   ├── use2FA.ts
│   └── useAuditLog.ts
├── stores/
│   ├── auth.ts                # Zustand stores
│   ├── ui.ts
│   └── sigra.ts
├── lib/
│   ├── api.ts                 # API client
│   ├── auth.ts                # Auth utilities
│   └── utils.ts
├── styles/
│   └── globals.css
├── public/
│   ├── icons/
│   ├── images/
│   └── logos/
└── types/
    ├── api.ts                 # API response types
    ├── auth.ts
    ├── sigra.ts
    └── common.ts
```

### 3.3 Key Pages/Components

#### Dashboard
- Overview con métricas clave
- Alertas activas (tabla interactiva)
- Gráfico de tendencias de alertas
- Usuarios con mayor riesgo
- Documentos más accedidos

#### Alertas SIGRA
- Tabla de alertas con filtros
- Detalle de alerta (evento, razón, evidencia)
- Acción: resolver alerta
- Acción: investigar evento
- Acción: bloquear usuario

#### Gestión de Usuarios
- Tabla de usuarios con búsqueda
- Crear/editar usuario
- Asignar roles y permisos
- Ver historial de acciones
- Bloquear/desbloquear usuario

#### Gestión de Documentos
- Interfaz de carga de archivos (drag & drop)
- Tabla de documentos
- Filtro por clasificación
- Historial de versiones
- Control de permisos por documento

---

## 4. Motor SIGRA - Especificación Técnica

### 4.1 Arquitectura de SIGRA

```
┌─────────────────────────────────────────┐
│        EVENT CAPTURE LAYER              │
│  - Login events                         │
│  - Document access events               │
│  - Permission changes                   │
│  - Admin actions                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     EVENT ENRICHMENT LAYER              │
│  - Add user context                     │
│  - Add document metadata                │
│  - Add historical data                  │
│  - Geolocation lookup                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     RULE ENGINE LAYER                   │
│  - Apply static rules                   │
│  - Apply dynamic rules                  │
│  - Calculate intermediate scores        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   ANOMALY DETECTION LAYER               │
│  - Statistical analysis                 │
│  - Behavior baseline comparison         │
│  - Peer group comparison                │
│  - Time series analysis                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     SCORING LAYER                       │
│  - Aggregate scores                     │
│  - Apply modifiers                      │
│  - Final risk calculation               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    RESPONSE LAYER                       │
│  - Generate alert if needed             │
│  - Trigger notifications                │
│  - Block action if critical             │
│  - Create audit record                  │
└─────────────────────────────────────────┘
```

### 4.2 Scoring Algorithm

```python
def calculate_risk_score(event: Event, user: User, context: Dict) -> int:
    """
    Calcula puntaje de riesgo para un evento
    
    Returns: int (0-100+)
    """
    
    base_score = 0
    
    # 1. Aplicar puntajes base por tipo de evento
    base_score += get_event_base_score(event.type)
    
    # 2. Aplicar modificadores por contexto
    base_score += get_time_modifier(event.timestamp)      # Horario
    base_score += get_ip_modifier(event.ip_address)       # IP
    base_score += get_device_modifier(event.device_id)    # Dispositivo
    base_score += get_document_modifier(event.document)   # Crítica doc
    
    # 3. Aplicar modificadores por usuario
    base_score += get_user_history_modifier(user)         # Historial
    base_score += get_role_modifier(user.role, event)     # Rol compatible
    
    # 4. Aplicar modificadores por anomalía
    base_score += get_anomaly_modifier(user, context)     # Comportamiento anómalo
    
    # 5. Aplicar reducción por buen comportamiento
    if user.clean_history_days > 90:
        base_score -= 5
    
    # 6. Limitar a rango válido
    final_score = max(0, min(base_score, 100))
    
    return final_score
```

### 4.3 Implementación en Django

```python
# sigra/models.py
class SIGRAEvent(models.Model):
    """Evento analizado por SIGRA"""
    user = ForeignKey(User)
    document = ForeignKey(Document, null=True)
    event_type = CharField(choices=EVENT_TYPES)
    ip_address = GenericIPAddressField()
    device_id = CharField()
    risk_score = IntegerField()
    risk_level = CharField(choices=RISK_LEVELS)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            Index(fields=['user', '-created_at']),
            Index(fields=['risk_level', '-created_at']),
        ]

class SIGRAAlert(models.Model):
    """Alerta generada por SIGRA"""
    event = ForeignKey(SIGRAEvent)
    user = ForeignKey(User)
    alert_type = CharField(choices=ALERT_TYPES)
    severity = CharField(choices=['MEDIUM', 'HIGH', 'CRITICAL'])
    title = CharField()
    description = TextField()
    evidence = JSONField()  # Contexto del evento
    status = CharField(choices=['OPEN', 'INVESTIGATING', 'RESOLVED'])
    resolved_at = DateTimeField(null=True)
    resolved_by = ForeignKey(User, null=True, related_name='resolved_alerts')
    created_at = DateTimeField(auto_now_add=True)

# sigra/scoring.py
class RiskScorer:
    def __init__(self):
        self.rules = load_rules_from_db()
        self.thresholds = load_thresholds_from_db()
    
    def score_event(self, event: dict) -> Tuple[int, str]:
        """
        Calcula score y nivel de riesgo
        Returns: (score: int, level: str)
        """
        score = 0
        
        # Aplicar cada regla
        for rule in self.rules:
            if rule.matches(event):
                score += rule.points
                if rule.modifiers:
                    score += self.apply_modifiers(rule, event)
        
        # Determinar nivel
        level = self.get_risk_level(score)
        
        return score, level

# sigra/tasks.py (Celery)
@app.task
def process_event_async(event_data: dict):
    """Procesa evento de forma async"""
    event_obj = SIGRAEvent.objects.create(**event_data)
    
    scorer = RiskScorer()
    score, level = scorer.score_event(event_data)
    
    event_obj.risk_score = score
    event_obj.risk_level = level
    event_obj.save()
    
    if score >= MEDIUM_THRESHOLD:
        create_alert(event_obj, score, level)
        notify_administrators(event_obj)
    
    if score >= CRITICAL_THRESHOLD:
        block_action(event_obj)
        escalate_incident(event_obj)
```

### 4.4 Event Processing Pipeline

```python
# middleware.py o signals
@receiver(post_save, sender=AuditLog)
def on_audit_event(sender, instance, created, **kwargs):
    """Trigger SIGRA analysis cuando hay evento de auditoría"""
    if created:
        process_event_async.delay({
            'user_id': instance.user_id,
            'action': instance.action,
            'document_id': instance.document_id,
            'timestamp': instance.timestamp,
            'ip_address': instance.ip_address,
            'user_agent': instance.user_agent,
        })
```

---

## 5. Base de Datos - Especificación

### 5.1 Schema Principal

```sql
-- Empresas (Multi-tenant)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    industry VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    business_hours_start TIME DEFAULT '09:00',
    business_hours_end TIME DEFAULT '18:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios
CREATE TABLE auth_user (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_email (company_id, email)
);

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proyectos
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_project (company_id, status)
);

-- Documentos
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,  -- SHA-256
    file_size BIGINT,
    mime_type VARCHAR(100),
    criticality_level INTEGER DEFAULT 2,  -- 1-4
    uploaded_by INTEGER NOT NULL REFERENCES auth_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    INDEX idx_criticality (criticality_level),
    INDEX idx_company_created (company_id, created_at)
);

-- Versiones de documentos
CREATE TABLE document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id),
    version_number INTEGER NOT NULL,
    file_path VARCHAR(500),
    file_hash VARCHAR(64),
    uploaded_by INTEGER NOT NULL REFERENCES auth_user(id),
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permisos de documentos
CREATE TABLE document_permissions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id),
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    permission_type VARCHAR(50) NOT NULL,  -- 'view', 'edit', 'delete'
    granted_by INTEGER NOT NULL REFERENCES auth_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, user_id, permission_type)
);

-- Auditoría - Eventos
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    action VARCHAR(100) NOT NULL,  -- 'LOGIN', 'VIEW_DOC', 'DOWNLOAD_DOC', 'EDIT_DOC', 'DELETE_DOC', 'CHANGE_PERMISSION'
    document_id INTEGER REFERENCES documents(id),
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'SUCCESS',  -- SUCCESS, FAILED, BLOCKED
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_company_user_action (company_id, user_id, action, created_at),
    INDEX idx_user_time (user_id, created_at DESC),
    INDEX idx_action_time (action, created_at DESC)
);

-- SIGRA - Eventos
CREATE TABLE sigra_events (
    id BIGSERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    audit_log_id BIGINT REFERENCES audit_logs(id),
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,  -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_risk_level (risk_level, created_at DESC),
    INDEX idx_user_risk (user_id, created_at DESC)
);

-- SIGRA - Alertas
CREATE TABLE sigra_alerts (
    id BIGSERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    sigra_event_id BIGINT NOT NULL REFERENCES sigra_events(id),
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- 'MEDIUM', 'HIGH', 'CRITICAL'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',  -- 'OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES auth_user(id),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_severity (status, severity, created_at DESC),
    INDEX idx_user_open_alerts (user_id, status)
);

-- Sesiones activas
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    token_jti VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_active (user_id, is_active)
);

-- Dispositivos conocidos
CREATE TABLE known_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),  -- 'desktop', 'mobile', 'tablet'
    user_agent TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    UNIQUE(user_id, device_id)
);

-- IPs conocidas
CREATE TABLE known_ips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id),
    ip_address INET NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    is_corporate BOOLEAN DEFAULT FALSE,
    is_vpn BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    UNIQUE(user_id, ip_address)
);
```

### 5.2 Índices Críticos

```sql
-- Auditoría (búsquedas frecuentes)
CREATE INDEX CONCURRENTLY idx_audit_company_date 
  ON audit_logs(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_user_date 
  ON audit_logs(user_id, created_at DESC);

-- SIGRA (alertas activas)
CREATE INDEX CONCURRENTLY idx_sigra_alerts_status 
  ON sigra_alerts(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_sigra_alerts_severity 
  ON sigra_alerts(severity, created_at DESC);

-- Documentos críticos
CREATE INDEX CONCURRENTLY idx_documents_criticality 
  ON documents(criticality_level) 
  WHERE is_deleted = FALSE;
```

---

## 6. Seguridad - Implementación

### 6.1 Autenticación JWT + 2FA

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': settings.SECRET_KEY,
    'VERIFYING_KEY': None,
    'JTI_CLAIM': 'jti',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# auth/views.py
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(email=email, password=password)
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=401
            )
        
        # Check 2FA
        if user.totp_enabled:
            # Generar código temporal
            temp_token = generate_temp_auth_token(user)
            return Response({
                '2fa_required': True,
                'temp_token': temp_token
            }, status=202)
        
        # Login exitoso
        tokens = get_tokens_for_user(user)
        create_session(user, request)
        
        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': UserSerializer(user).data
        })

class Verify2FAView(APIView):
    def post(self, request):
        temp_token = request.data.get('temp_token')
        totp_code = request.data.get('code')
        
        user = verify_temp_token(temp_token)
        if not verify_totp(user, totp_code):
            return Response(
                {'error': 'Invalid 2FA code'},
                status=401
            )
        
        tokens = get_tokens_for_user(user)
        create_session(user, request)
        
        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
        })
```

### 6.2 Permisos Granulares

```python
# core/permissions.py
class HasDocumentPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        doc = obj  # Document
        
        # Check si usuario tiene permiso
        has_perm = DocumentPermission.objects.filter(
            document=doc,
            user=user,
            permission_type__in=['view', 'edit', 'delete']
        ).exists()
        
        # Log en auditoría
        if not has_perm:
            log_audit(
                user=user,
                action='DENIED_ACCESS',
                document=doc,
                ip_address=request.META.get('REMOTE_ADDR'),
                reason='No permission'
            )
        
        return has_perm

# views.py
class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated, HasDocumentPermission]
    
    def get(self, request, pk):
        doc = Document.objects.get(pk=pk)
        self.check_object_permissions(request, doc)
        
        # Log descarga
        log_audit(
            user=request.user,
            action='DOWNLOAD_DOC',
            document=doc,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        # Trigger SIGRA
        process_event_async.delay({
            'user_id': request.user.id,
            'action': 'DOWNLOAD_DOC',
            'document_id': doc.id,
            'document_criticality': doc.criticality_level,
        })
        
        # Return file
        return FileResponse(doc.file)
```

### 6.3 Rate Limiting y DDoS

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# middleware.py
class SuspiciousActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.ip_attempt_cache = {}
    
    def __call__(self, request):
        ip = request.META.get('REMOTE_ADDR')
        
        # Check failed login attempts
        attempts = cache.get(f'login_attempts:{ip}', 0)
        if attempts >= 5:
            log_audit(
                action='BLOCKED_IP',
                ip_address=ip,
                reason='Multiple failed login attempts'
            )
            return JsonResponse(
                {'error': 'Too many attempts'},
                status=429
            )
        
        response = self.get_response(request)
        return response
```

---

## 7. Performance y Optimization

### 7.1 Database Optimization

```python
# queries.py - Uso de select_related y prefetch_related
def get_user_with_context(user_id):
    return User.objects.select_related(
        'company',
        'role'
    ).prefetch_related(
        'projects',
        'sessions',
        'known_devices'
    ).get(id=user_id)

# Caching
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)  # 5 minutes
def get_company_stats(company_id):
    return {
        'total_users': User.objects.filter(company_id=company_id).count(),
        'total_documents': Document.objects.filter(company_id=company_id).count(),
        'active_alerts': SIGRAAlert.objects.filter(
            company_id=company_id,
            status='OPEN'
        ).count()
    }
```

### 7.2 Async Processing con Celery

```python
# tasks.py
@app.task(bind=True, max_retries=3)
def process_event_async(self, event_data):
    try:
        scorer = RiskScorer()
        score, level = scorer.score_event(event_data)
        
        # Guardar evento
        event = SIGRAEvent.objects.create(
            user_id=event_data['user_id'],
            risk_score=score,
            risk_level=level,
            event_data=event_data
        )
        
        # Crear alerta si es necesario
        if score >= MEDIUM_THRESHOLD:
            create_alert(event)
        
        return {'event_id': event.id, 'score': score}
    
    except Exception as exc:
        # Retry con exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

# Llamar async desde views
log_audit(...)
process_event_async.delay(event_data)  # Non-blocking
```

---

## 8. Testing Strategy

### 8.1 Tipos de Tests

```
Unit Tests (80% cobertura):
  - Models
  - Serializers
  - Utilities
  - SIGRA scoring rules

Integration Tests:
  - Auth flow (login, 2FA, logout)
  - Document CRUD with permissions
  - SIGRA event processing
  - Alert generation
  
E2E Tests:
  - Full user journey
  - Admin workflows
  - Security scenarios
  
Performance Tests:
  - API response times
  - Database query performance
  - SIGRA scoring latency
  - Bulk operations (import 1000 docs)
```

### 8.2 Example Tests

```python
# tests/test_auth.py
import pytest

@pytest.mark.django_db
class TestAuthentication:
    def test_login_success(self, client, user):
        response = client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'testpass123'
        })
        assert response.status_code == 200
        assert 'access' in response.json()
    
    def test_login_invalid_password(self, client, user):
        response = client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'wrongpassword'
        })
        assert response.status_code == 401

# tests/test_sigra.py
@pytest.mark.django_db
class TestSIGRAScoring:
    def test_score_critical_document_access(self):
        scorer = RiskScorer()
        event = {
            'user_id': 1,
            'action': 'DOWNLOAD_DOC',
            'document_criticality': 4,  # Crítico
            'is_within_business_hours': False,
            'is_ip_known': False,
        }
        
        score, level = scorer.score_event(event)
        assert score >= 60  # Should be HIGH or CRITICAL
        assert level in ['HIGH', 'CRITICAL']
```

---

## 9. Deployment y Infrastructure

### 9.1 Docker Compose (Desarrollo)

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: safecloud
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    environment:
      DEBUG: "True"
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/safecloud
      REDIS_URL: redis://redis:6379
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
  
  celery:
    build: ./backend
    command: celery -A safecloud_api worker -l info
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/safecloud
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api
```

---

## 10. Monitoreo y Observabilidad

### 10.1 Logging

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/safecloud/app.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/safecloud/audit.log',
            'maxBytes': 1024 * 1024 * 50,  # 50MB
            'backupCount': 30,  # 5 años @ 1MB/día
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
        'audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 10.2 Alertas

```python
# Integración con Sentry (errores en producción)
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="https://<key>@sentry.io/<project>",
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    environment='production'
)
```

---

**Fin de Especificaciones Técnicas**
