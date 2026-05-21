from django.db import models
from django.conf import settings
from safecloud_api.apps.companies.models import Company
from safecloud_api.apps.audit.models import AuditLog
import uuid

class SIGRAEvent(models.Model):
    """
    Evento analizado por el motor SIGRA.
    Contiene el puntaje de riesgo y análisis.
    """
    
    EVENT_TYPES = [
        ('LOGIN', 'Login'),
        ('DOWNLOAD_DOC', 'Document Download'),
        ('UPLOAD_DOC', 'Document Upload'),
        ('EDIT_DOC', 'Document Edit'),
        ('DELETE_DOC', 'Document Delete'),
        ('CHANGE_PERMISSION', 'Permission Change'),
        ('FAILED_LOGIN', 'Failed Login'),
        ('DENIED_ACCESS', 'Denied Access'),
    ]
    
    RISK_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sigra_events')
    audit_log = models.ForeignKey(AuditLog, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sigra_events')
    
    event_type = models.CharField(max_length=100, choices=EVENT_TYPES)
    event_data = models.JSONField(default=dict)  # Raw event data
    
    # SIGRA Scoring
    risk_score = models.IntegerField(default=0)  # 0-100+
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS)
    
    # Variables utilizadas en el scoring
    scoring_breakdown = models.JSONField(
        default=dict,
        help_text="Desglose de cómo se calculó el score"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'sigra_events'
        indexes = [
            models.Index(fields=['company', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['risk_level', 'created_at']),
        ]
        verbose_name = 'SIGRA Event'
        verbose_name_plural = 'SIGRA Events'
    
    def __str__(self):
        return f"{self.event_type} - {self.user.email} - Risk: {self.risk_score}"


class SIGRAAlert(models.Model):
    """
    Alerta generada por SIGRA cuando el riesgo es significativo.
    """
    
    ALERT_TYPES = [
        ('ANOMALOUS_TIME', 'Access Outside Business Hours'),
        ('UNKNOWN_IP', 'Access From Unknown IP'),
        ('UNKNOWN_DEVICE', 'Access From Unknown Device'),
        ('FAILED_LOGINS', 'Multiple Failed Logins'),
        ('MASS_DOWNLOAD', 'Mass Document Download'),
        ('CRITICAL_DOC_ACCESS', 'Critical Document Access'),
        ('PERMISSION_CHANGE', 'Suspicious Permission Change'),
        ('ROLE_ANOMALY', 'Action Incompatible With Role'),
        ('EXPORT_ATTEMPT', 'Data Export Attempt'),
    ]
    
    SEVERITY_CHOICES = [
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('INVESTIGATING', 'Investigating'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sigra_alerts')
    sigra_event = models.OneToOneField(SIGRAEvent, on_delete=models.CASCADE, related_name='alert')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sigra_alerts')
    
    alert_type = models.CharField(max_length=100, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Evidencia del evento
    evidence = models.JSONField(
        default=dict,
        help_text="Contexto completo del evento que disparó la alerta"
    )
    
    # Estado de la alerta
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='OPEN')
    
    # Resolución
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    resolution_notes = models.TextField(null=True, blank=True)
    
    # Acciones tomadas
    is_blocked = models.BooleanField(default=False)
    is_escalated = models.BooleanField(default=False)
    incident_ticket_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sigra_alerts'
        indexes = [
            models.Index(fields=['status', 'severity', 'created_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['company', 'created_at']),
        ]
        verbose_name = 'SIGRA Alert'
        verbose_name_plural = 'SIGRA Alerts'
    
    def __str__(self):
        return f"{self.title} - {self.user.email} - {self.severity}"
