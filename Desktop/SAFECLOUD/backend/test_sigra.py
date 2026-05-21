#!/usr/bin/env python
"""
Script de testing para SIGRA
Ejecuta: python manage.py shell < test_sigra.py
"""

import os
import django
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.utils import timezone

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

from audit.models import AuditLog, KnownIP, KnownDevice
from sigra.models import SIGRAEvent, SIGRAAlert
from sigra.scoring import RiskScorer
from companies.models import Company

print("\n🔒 SIGRA Testing Script")
print("=" * 50)

# ============================================
# 1. Crear usuario de prueba
# ============================================
print("\n1️⃣  Creando usuario de prueba...")

user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@safecloud.local',
        'first_name': 'Test',
        'last_name': 'User',
    }
)
print(f"   Usuario: {user.email} (created={created})")

# ============================================
# 2. Obtener o crear compañía
# ============================================
print("\n2️⃣  Obtener compañía...")

try:
    company = Company.objects.first()
    if not company:
        print("   ⚠️  No hay compañías. Crear una primero en Django admin")
        company = None
except:
    company = None
    print("   ℹ️  (Compañía opcional para testing)")

# ============================================
# 3. Crear AuditLog de prueba
# ============================================
print("\n3️⃣  Creando AuditLog de prueba (dispara SIGRA)...")

audit_log = AuditLog.objects.create(
    company=company,
    user=user,
    action='LOGIN',
    ip_address='203.0.113.5',  # IP de prueba
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    device_id='device-001',
    status='SUCCESS',
)
print(f"   AuditLog creado: {audit_log.id}")
print(f"   Action: {audit_log.action}")
print(f"   IP: {audit_log.ip_address}")

# ============================================
# 4. Verificar que SIGRA procesó el evento
# ============================================
print("\n4️⃣  Verificando SIGRA Event...")

try:
    sigra_event = SIGRAEvent.objects.filter(audit_log=audit_log).first()
    if sigra_event:
        print(f"   ✅ SIGRAEvent creado: {sigra_event.id}")
        print(f"   Risk Score: {sigra_event.risk_score}")
        print(f"   Risk Level: {sigra_event.risk_level}")
        print(f"   Breakdown: {sigra_event.scoring_breakdown}")
    else:
        print("   ⚠️  SIGRAEvent no encontrado")
        print("   Verificar que Celery está ejecutándose")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ============================================
# 5. Verificar SIGRA Alert
# ============================================
print("\n5️⃣  Verificando SIGRA Alert...")

try:
    sigra_alert = SIGRAAlert.objects.filter(user=user).first()
    if sigra_alert:
        print(f"   ✅ SIGRAAlert creado: {sigra_alert.id}")
        print(f"   Title: {sigra_alert.title}")
        print(f"   Severity: {sigra_alert.severity}")
        print(f"   Status: {sigra_alert.status}")
    else:
        print("   ℹ️  Sin alertas (risk_score puede estar debajo del threshold)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# ============================================
# 6. Prueba de RiskScorer directo
# ============================================
print("\n6️⃣  Probando RiskScorer directamente...")

scorer = RiskScorer(user, company)

# Evento de login con IP desconocida fuera de horario
event_data = {
    'action': 'LOGIN',
    'ip_address': '198.51.100.5',
    'device_id': 'unknown-device',
    'timestamp': datetime.now(),
}

risk_score, risk_level, breakdown = scorer.calculate_risk(event_data)

print(f"   Risk Score: {risk_score}")
print(f"   Risk Level: {risk_level}")
print(f"   Breakdown:")
for key, value in breakdown.items():
    print(f"     - {key}: {value}")

# ============================================
# 7. Crear evento de alto riesgo
# ============================================
print("\n7️⃣  Creando evento de alto riesgo...")

# Simular 10 descargas en 5 minutos
for i in range(10):
    AuditLog.objects.create(
        company=company,
        user=user,
        action='DOWNLOAD_DOC',
        ip_address='198.51.100.10',
        user_agent='Mozilla/5.0',
        status='SUCCESS',
    )

print(f"   Creados 10 descargas (simula descarga masiva)")
print("   ⏳ Esperar a que Celery procese...")

# ============================================
# 8. Estadísticas
# ============================================
print("\n8️⃣  Estadísticas de SIGRA para usuario...")

events = SIGRAEvent.objects.filter(user=user)
alerts = SIGRAAlert.objects.filter(user=user)

print(f"   Total Events: {events.count()}")
print(f"   Total Alerts: {alerts.count()}")
print(f"   Open Alerts: {alerts.filter(status='OPEN').count()}")
print(f"   Critical Alerts: {alerts.filter(severity='CRITICAL').count()}")

if events.exists():
    avg_score = events.aggregate(
        avg=models.Avg('risk_score')
    )['avg'] or 0
    max_score = events.aggregate(
        max=models.Max('risk_score')
    )['max'] or 0
    
    print(f"   Average Risk Score: {avg_score:.1f}")
    print(f"   Max Risk Score: {max_score}")

# ============================================
# 9. Prueba de endpoints
# ============================================
print("\n9️⃣  URLs de API para testing...")

print(f"   GET  /api/sigra/events/")
print(f"   GET  /api/sigra/alerts/")
print(f"   GET  /api/sigra/risk-score/my_risk_profile/")
print(f"   GET  /api/sigra/anomalies/list_anomalies/")

# ============================================
# 10. Limpiar datos de prueba (opcional)
# ============================================
print("\n🔟 Para limpiar datos de prueba:")
print(f"   python manage.py shell")
print(f"   >>> User.objects.filter(username='testuser').delete()")

print("\n✅ Testing completado!")
print("\n📚 Próximos pasos:")
print("   1. Ejecutar Celery worker: celery -A safecloud_api worker -l info")
print("   2. Revisar logs: tail -f logs/sigra.log")
print("   3. Acceder a Django admin: /admin/sigra/")
print("=" * 50 + "\n")

# Importación para usar en script
from django.db import models
