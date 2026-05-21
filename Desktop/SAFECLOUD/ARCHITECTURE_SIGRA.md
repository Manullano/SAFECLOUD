# Arquitectura SAFECloud + SIGRA
## Diagrama de Sistema y Modelo de Datos

**Fecha:** Mayo 21, 2026  
**Versión:** 1.0  

---

## 1. Arquitectura de Capas (C4 Model)

### 1.1 Nivel 1: Contexto del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     SAFECloud Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│   │  End Users     │  │  Administrators  │  │  Auditors        ││
│   │ (Employees)    │  │  (Company)       │  │ (Compliance)     ││
│   └────────┬───────┘  └────────┬─────────┘  └────────┬─────────┘│
│            │                    │                      │          │
│            └────────────────────┼──────────────────────┘          │
│                                 │                                  │
│                    ┌────────────▼────────────┐                   │
│                    │   SAFECloud SaaS        │                   │
│                    │   Platform              │                   │
│                    └────────────┬────────────┘                   │
│                                 │                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │ • Document Management                              │      │
│    │ • User & Role Management                           │      │
│    │ • Project Management                               │      │
│    │ • Audit Logging                                    │      │
│    │ • SIGRA Intelligence Engine                        │      │
│    │ • Risk Scoring & Alerts                            │      │
│    │ • Dashboard & Reports                              │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Nivel 2: Contenedores

```
┌──────────────────────────────────────────────────────────────┐
│                 SAFECloud Platform                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐                   ┌──────────────────┐   │
│  │  Web Client   │─────────────────→ │  API Gateway     │   │
│  │  (React/Next) │  HTTPS            │  (Django REST)   │   │
│  │               │ ← ────────────────│                  │   │
│  └───────────────┘                   └────────┬─────────┘   │
│                                               │              │
│        ┌──────────────────────────────────────┼──────┐       │
│        │                                      │      │       │
│  ┌─────▼──────────────┐          ┌───────────▼──┐  │       │
│  │ Business Logic     │          │ SIGRA Engine │  │       │
│  │ • Auth Service     │          │ • Scoring    │  │       │
│  │ • User Service     │          │ • Analysis   │  │       │
│  │ • Document Service │          │ • Alerting   │  │       │
│  │ • Project Service  │          └──────┬───────┘  │       │
│  │ • Audit Service    │                 │          │       │
│  └──────────┬─────────┘                 │          │       │
│             │                           │          │       │
│             └───────────────────────────┼──────────┘       │
│                                         │                  │
│  ┌──────────────────────────────────────┼─────────────┐   │
│  │                                      │             │   │
│  ▼                          ┌───────────▼──────────┐  │   │
│  ┌─────────────────────┐   │                      │  │   │
│  │  PostgreSQL DB      │◄──┤  Cache (Redis)       │  │   │
│  │  • Users            │   │  • Sessions          │  │   │
│  │  • Documents        │   │  • Permissions       │  │   │
│  │  • Audit Logs       │   │  • Config            │  │   │
│  │  • SIGRA Events     │   │                      │  │   │
│  │  • Alerts           │   └──────────────────────┘  │   │
│  └─────────────────────┘                             │   │
│                                    ┌──────────────────┘   │
│                                    │                      │
│  ┌─────────────────────────────────▼──────────────────┐  │
│  │  Async Processing (Celery)                         │  │
│  │  • Event Processing                                │  │
│  │  • Alert Generation                                │  │
│  │  • Report Generation                               │  │
│  │  • Email Notifications                             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  File Storage                                      │  │
│  │  • S3 / MinIO (Documents, Exports)                 │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo de Datos Conceptual (ER Diagram)

### 2.1 Diagrama Entidad-Relación Completo

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SAFECloud Data Model                              │
└──────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │  Companies   │
                            ├──────────────┤
                            │ id (PK)      │
                            │ name         │
                            │ slug         │
                            │ industry     │
                            │ timezone     │
                            │ created_at   │
                            └──────┬───────┘
                                   │ 1:N
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼────────┐          ┌────────▼─────────┐
            │  Users         │          │  Projects        │
            ├────────────────┤          ├──────────────────┤
            │ id (PK)        │◄─────┐   │ id (PK)          │
            │ company_id (FK)│  N:N  │   │ company_id (FK)  │
            │ email          │   ├───┤   │ name             │
            │ password_hash  │   │ │ │   │ status           │
            │ first_name     │   │ │ │   │ created_at       │
            │ role           │   │ │ │   └──────┬──────────┘
            │ is_active      │   │ │ │          │ 1:N
            │ created_at     │   │ │ │          │
            └────────┬───────┘   │ │ │   ┌──────▼──────────┐
                     │           │ │ │   │  Documents      │
                     │ 1:N        │ │ │   ├─────────────────┤
                     │           │ │ │   │ id (PK)         │
        ┌────────────▼──────┐    │ │ │   │ project_id (FK) │
        │ Roles             │    │ │ │   │ company_id (FK) │
        ├───────────────────┤    │ │ │   │ name            │
        │ id (PK)           │    │ │ │   │ file_path       │
        │ company_id (FK)   │    │ │ │   │ file_hash       │
        │ name              │    │ │ │   │ criticality_lvl │
        │ description       │    │ │ │   │ uploaded_by(FK) │
        └────────┬──────────┘    │ │ │   │ created_at      │
                 │               │ │ │   │ is_deleted      │
                 │ 1:N           │ │ │   └───────┬─────────┘
        ┌────────▼──────────┐    │ │ │           │ 1:N
        │ Permissions       │    │ │ │   ┌───────▼──────────────┐
        ├───────────────────┤    │ │ │   │ DocumentVersions     │
        │ id (PK)           │    │ │ │   ├──────────────────────┤
        │ role_id (FK)      │    │ │ │   │ id (PK)              │
        │ permission_type   │    │ │ │   │ document_id (FK)     │
        └───────────────────┘    │ │ │   │ version_number       │
                                 │ │ │   │ file_path            │
                                 │ │ │   │ uploaded_by (FK)     │
                                 │ │ │   │ created_at           │
                                 │ │ │   └──────────────────────┘
                                 │ │ │
                                 │ │ │   ┌──────────────────────┐
                                 │ │ └──→│ DocumentPermissions  │
                                 │ │     ├──────────────────────┤
                                 │ │     │ id (PK)              │
                                 │ │     │ document_id (FK)     │
                                 │ │     │ user_id (FK)         │
                                 │ │     │ permission_type      │
                                 │ │     │ created_at           │
                                 │ │     └──────────────────────┘
                                 │ │
            ┌────────────────────┘ │
            │ ProjectUsers (N:N)   │
            │ ├─ user_id (FK)      │
            │ ├─ project_id (FK)   │
            └────────────────────────
```

### 2.2 Diagrama SIGRA y Auditoría

```
                        ┌──────────────────┐
                        │  Users (ref)     │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼──────────┐    ┌────────▼──────────┐
            │  AuditLogs       │    │  Sessions         │
            ├──────────────────┤    ├───────────────────┤
            │ id (PK)          │    │ id (PK)           │
            │ company_id (FK)  │    │ user_id (FK)      │
            │ user_id (FK)     │    │ token_jti         │
            │ action           │    │ ip_address        │
            │ document_id (FK) │    │ user_agent        │
            │ ip_address       │    │ device_id         │
            │ user_agent       │    │ created_at        │
            │ device_id        │    │ expires_at        │
            │ status           │    │ is_active         │
            │ created_at       │    └───────────────────┘
            └────────┬─────────┘
                     │
                     │ 1:N
            ┌────────▼──────────────┐
            │  SIGRAEvents          │
            ├───────────────────────┤
            │ id (PK)               │
            │ company_id (FK)       │
            │ audit_log_id (FK)     │
            │ user_id (FK)          │
            │ event_type            │
            │ event_data (JSONB)    │
            │ risk_score            │
            │ risk_level            │
            │ created_at            │
            └────────┬──────────────┘
                     │
                     │ 1:N (triggers)
            ┌────────▼──────────────┐
            │  SIGRAAlerts          │
            ├───────────────────────┤
            │ id (PK)               │
            │ company_id (FK)       │
            │ sigra_event_id (FK)   │
            │ user_id (FK)          │
            │ alert_type            │
            │ severity              │
            │ title                 │
            │ description           │
            │ evidence (JSONB)      │
            │ status                │
            │ resolved_by (FK)      │
            │ resolved_at           │
            │ created_at            │
            └───────────────────────┘

Known Tracking Tables:
            ┌──────────────────┐
            │  KnownDevices    │
            ├──────────────────┤
            │ id (PK)          │
            │ user_id (FK)     │
            │ device_id        │
            │ device_type      │
            │ is_trusted       │
            │ created_at       │
            └──────────────────┘

            ┌──────────────────┐
            │  KnownIPs        │
            ├──────────────────┤
            │ id (PK)          │
            │ user_id (FK)     │
            │ ip_address       │
            │ city             │
            │ country          │
            │ is_corporate     │
            │ created_at       │
            └──────────────────┘
```

---

## 3. Flujos de Datos Principales

### 3.1 Flujo de Login

```
User
  │
  ├─→ POST /api/auth/login/
  │      └─→ Validate Credentials
  │           └─→ Check if 2FA enabled?
  │                ├─ YES → Generate temp token → Return 202 with "2fa_required"
  │                └─ NO  → Generate JWT tokens
  │                         Create Session
  │                         Log Audit Event
  │                         Return tokens
  │
  ├─→ POST /api/auth/2fa/verify/
  │      └─→ Validate TOTP code
  │           └─→ Generate JWT tokens
  │               Create Session
  │               Trigger SIGRA event analysis
  │               Return tokens
  │
  └─→ Store tokens (localStorage/sessionStorage)
```

### 3.2 Flujo de Acceso a Documento

```
User (Authenticated)
  │
  ├─→ GET /api/documents/{id}/download/
  │
  ├─→ Backend:
  │   ├─ Check JWT token validity
  │   ├─ Check document permissions
  │   │  └─ If denied → Log DENIED_ACCESS event
  │   │              → Trigger SIGRA
  │   │              → Return 403 Forbidden
  │   │
  │   ├─ Log DOWNLOAD_DOC in AuditLog
  │   ├─ Trigger SIGRA event processing (async)
  │   └─ Return file
  │
  └─→ SIGRA (Async via Celery):
      ├─ Enrich event with context
      ├─ Apply scoring rules
      ├─ Calculate risk_score
      ├─ Determine risk_level
      ├─ Create SIGRAEvent
      │
      ├─ IF risk_score >= MEDIUM (31):
      │  ├─ Create SIGRAAlert
      │  ├─ Send email to admin
      │  └─ Update dashboard
      │
      ├─ IF risk_score >= CRITICAL (81):
      │  ├─ Block subsequent downloads
      │  ├─ Send SMS to admin
      │  ├─ Escalate to incident management
      │  └─ Create investigation task
      │
      └─ Store in database
```

### 3.3 Flujo de SIGRA Event Processing

```
Event Source (Login, Download, Edit, etc)
  │
  ├─→ Log in AuditLog table
  │
  ├─→ Trigger process_event_async.delay()
  │
  └─→ Celery Worker:
      ├─ 1. Fetch event data
      ├─ 2. Enrichment:
      │   ├─ Get user profile
      │   ├─ Get document metadata
      │   ├─ Fetch user history (last 30 days)
      │   ├─ Get IP geolocation
      │   └─ Determine if within business hours
      │
      ├─ 3. Rule Engine:
      │   ├─ For each rule:
      │   │  ├─ Check conditions
      │   │  ├─ Add base score
      │   │  └─ Apply modifiers
      │   └─ Accumulate total score
      │
      ├─ 4. Anomaly Detection:
      │   ├─ Compare with user baseline
      │   ├─ Check for statistical outliers
      │   └─ Apply anomaly modifier
      │
      ├─ 5. Create SIGRAEvent:
      │   ├─ Save score and level
      │   ├─ Store evidence (JSONB)
      │   └─ Index for fast retrieval
      │
      ├─ 6. Alert Generation (if score >= threshold):
      │   ├─ Create SIGRAAlert
      │   ├─ Set severity level
      │   ├─ Generate title/description
      │   └─ Attach evidence
      │
      ├─ 7. Notification (if severity >= HIGH):
      │   ├─ Send email to admin
      │   ├─ Send SMS to admin (if CRITICAL)
      │   ├─ Update dashboard in real-time (WebSocket)
      │   └─ Create incident ticket
      │
      ├─ 8. Blocking (if score >= CRITICAL):
      │   ├─ Set user flag: user.is_blocked
      │   ├─ Add to deny_list
      │   └─ Prevent subsequent downloads until resolved
      │
      └─ 9. Audit Trail:
          └─ Store everything with timestamps
```

---

## 4. Vista de Deployment

### 4.1 Producción (Kubernetes)

```
┌──────────────────────────────────────────────────────────────┐
│              Kubernetes Cluster (Production)                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Ingress (HTTPS, TLS 1.3)                                 │ │
│  │ ├─ Route /api/* → Backend Service                         │ │
│  │ ├─ Route /* → Frontend Service                            │ │
│  │ └─ SSL Certificate (Let's Encrypt)                        │ │
│  └──────┬──────────────────────────────────────────────────┘ │
│         │                                                      │
│  ┌──────▼──────────────────────────────────────────────────┐ │
│  │ Deployments (Replicas for HA)                            │ │
│  │                                                            │ │
│  │ ┌─────────────────┐  ┌──────────────────────┐           │ │
│  │ │ Backend Pods    │  │ Frontend Pods        │           │ │
│  │ │ (3 replicas)    │  │ (2 replicas)         │           │ │
│  │ │ - Gunicorn      │  │ - Node.js            │           │ │
│  │ │ - Django        │  │ - Next.js            │           │ │
│  │ │ - uWSGI         │  │                      │           │ │
│  │ └─────────────────┘  └──────────────────────┘           │ │
│  │                                                            │ │
│  │ ┌─────────────────┐  ┌──────────────────────┐           │ │
│  │ │ Celery Workers  │  │ Celery Beat Scheduler│           │ │
│  │ │ (2 replicas)    │  │ (1 replica)          │           │ │
│  │ │ - Event Process │  │ - Report generation  │           │ │
│  │ │ - Alert Gen     │  │ - Cleanup tasks      │           │ │
│  │ └─────────────────┘  └──────────────────────┘           │ │
│  │                                                            │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ StatefulSets                                         │ │ │
│  │ │ - PostgreSQL (with PVC)                              │ │ │
│  │ │ - Redis (with PVC)                                   │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Services                                                 │ │
│  │ - ClusterIP (internal): backend, frontend, db, cache    │ │
│  │ - LoadBalancer: external API access                      │ │
│  │ - NodePort: internal access (optional)                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Storage                                                  │ │
│  │ - PersistentVolume: PostgreSQL data                      │ │
│  │ - PersistentVolume: Redis cache                          │ │
│  │ - S3/Blob Storage: Documents and exports                 │ │
│  │ - ConfigMap: App configuration                           │ │
│  │ - Secret: API keys, DB credentials                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Monitoring & Logging                                     │ │
│  │ - Prometheus (metrics)                                    │ │
│  │ - Grafana (dashboards)                                    │ │
│  │ - ELK Stack (logs)                                        │ │
│  │ - Sentry (error tracking)                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Patrones de Seguridad

### 5.1 Capas de Seguridad

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Edge (CDN/WAF)                             │
│ - DDOS Protection                                    │
│ - Bot Detection                                      │
│ - SQL Injection / XSS Prevention                     │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Layer 2: Transport                                  │
│ - HTTPS / TLS 1.3                                    │
│ - Certificate Pinning (mobile)                       │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Layer 3: Authentication                             │
│ - JWT Token Validation                              │
│ - 2FA / TOTP Verification                           │
│ - Session Management                                │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Layer 4: Authorization                              │
│ - Role-Based Access Control (RBAC)                  │
│ - Granular Permissions by Document                  │
│ - Resource-level ACLs                               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Layer 5: Application Logic                          │
│ - Input Validation                                   │
│ - Business Rule Enforcement                         │
│ - Data Integrity Checks                             │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Layer 6: Database                                   │
│ - Encrypted Connections                             │
│ - Row-Level Security (RLS)                          │
│ - Encrypted Sensitive Fields                        │
│ - Audit Triggers                                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Layer 7: Monitoring (SIGRA)                         │
│ - Real-time Threat Detection                        │
│ - Anomaly Detection                                 │
│ - Behavioral Analysis                               │
│ - Automated Blocking                                │
└─────────────────────────────────────────────────────┘
```

---

## 6. Matriz de Trazabilidad de Datos

### 6.1 Flujo de Datos Sensibles

```
Documento Crítico (Level 4)
  │
  ├─→ Storage: Encrypted S3/Blob (AES-256)
  │
  ├─→ In-Transit: HTTPS/TLS 1.3
  │
  ├─→ In-Memory: Redis (encrypted at-rest)
  │
  ├─→ Database: PostgreSQL
  │   ├─ Encrypted password hashes
  │   ├─ Encrypted sensitive metadata
  │   └─ Audit trail with hash verification
  │
  ├─→ Access Log:
  │   ├─ User ID
  │   ├─ Timestamp (UTC)
  │   ├─ IP Address
  │   ├─ Action
  │   ├─ Hash of document (no content)
  │   └─ Status (SUCCESS/BLOCKED)
  │
  ├─→ SIGRA Analysis:
  │   ├─ Risk Score calculated
  │   ├─ Alert generated if needed
  │   ├─ Evidence stored (not document content)
  │   └─ Notification sent
  │
  └─→ Retention:
      └─ Minimum 5 years per compliance
```

---

## 7. Matriz de Críticidad de Componentes

| Componente | Criticidad | RTO | RPO | Redundancia |
|---|---|---|---|---|
| PostgreSQL | CRÍTICO | 15 min | 5 min | Multi-replica, backup 6h |
| Redis | ALTA | 30 min | 0 | Puede reconstruirse |
| Backend API | CRÍTICO | 5 min | - | 3 replicas + LB |
| Frontend | MEDIA | 1 hora | - | 2 replicas + CDN |
| Celery Workers | MEDIA | 30 min | - | 2 workers |
| S3/Blob Storage | CRÍTICO | 1 hora | 0 | Replicado cross-region |
| SIGRA Engine | CRÍTICO | 15 min | 5 min | Parte de backend |

---

## 8. Matriz de Escalabilidad

| Dimensión | Capacidad Inicial | Meta | Estrategia |
|---|---|---|---|
| Usuarios por empresa | 100 | 10,000 | Particionamiento de datos |
| Documentos por empresa | 10,000 | 1,000,000 | Sharding de storage |
| Eventos/segundo | 10 | 1,000 | Kafka / Event streaming |
| Almacenamiento total | 100 GB | 100 TB | S3 / Blob infinito |
| Concurrent users | 50 | 10,000 | K8s horizontal autoscaling |
| API Requests/second | 100 | 10,000 | API Gateway + caching |

---

## 9. Ciclo de Vida de un Evento SIGRA

```
Timeline:

T+0ms: User action (download document)
  └─→ Audit log created immediately
      └─→ Return response to user (< 100ms)

T+50ms: Async event processing starts
  ├─ Celery task queued
  ├─ Data enrichment begins
  └─ IP geolocation lookup

T+200ms: Scoring engine executes
  ├─ Apply rules
  ├─ Calculate anomalies
  └─ Generate final score

T+250ms: Alert generation (if needed)
  ├─ Create SIGRAAlert record
  ├─ Queue notifications
  └─ Update dashboard cache

T+300ms: Notifications sent (async)
  ├─ Email to admin
  ├─ SMS (if critical)
  └─ WebSocket to dashboard

T+500ms: All processing complete
  └─ Event fully indexed in database

Total latency: 500-1000ms (user action → fully processed)
User experience: < 100ms (user never waits)
```

---

## 10. Dependencias entre Módulos

```
Frontend
  ├─ depends on → API Gateway (REST)
  ├─ depends on → Auth Service (JWT validation)
  └─ depends on → Configuration (API_URL)

Backend API
  ├─ depends on → Database (PostgreSQL)
  ├─ depends on → Cache (Redis)
  ├─ depends on → File Storage (S3/Blob)
  └─ depends on → Task Queue (Celery)

SIGRA Engine
  ├─ depends on → Database (events, rules, baselines)
  ├─ depends on → Cache (user profiles, baselines)
  ├─ depends on → Rules Engine (external config)
  └─ depends on → Notification Service

Notification Service
  ├─ depends on → Email Service (SMTP)
  ├─ depends on → SMS Service (Twilio/AWS SNS)
  └─ depends on → Template Engine

Audit Service
  ├─ depends on → Database (append-only logs)
  └─ depends on → Encryption (log encryption)
```

---

**Fin de Documento de Arquitectura**
