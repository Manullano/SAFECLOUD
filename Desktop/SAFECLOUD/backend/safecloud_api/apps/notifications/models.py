import uuid
from django.db import models
from safecloud_api.apps.companies.models import User, Company


class Notification(models.Model):
    """Store user notifications"""
    
    NOTIFICATION_TYPES = [
        ('TICKET_CREATED', 'Ticket creado'),
        ('TICKET_UPDATED', 'Ticket actualizado'),
        ('TICKET_RESOLVED', 'Ticket resuelto'),
        ('DOCUMENT_SHARED', 'Documento compartido'),
        ('DOCUMENT_UPDATED', 'Documento actualizado'),
        ('PROJECT_CREATED', 'Proyecto creado'),
        ('PROJECT_UPDATED', 'Proyecto actualizado'),
        ('USER_ASSIGNED', 'Usuario asignado'),
        ('COMMENT_POSTED', 'Comentario publicado'),
        ('2FA_ENABLED', '2FA habilitado'),
        ('2FA_DISABLED', '2FA deshabilitado'),
        ('LOGIN_ALERT', 'Alerta de login'),
        ('SECURITY_ALERT', 'Alerta de seguridad'),
        ('SYSTEM_ANNOUNCEMENT', 'Anuncio del sistema'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('SENT', 'Enviado'),
        ('FAILED', 'Fallido'),
        ('READ', 'Leído'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    
    # Notification details
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Email details
    email_sent = models.BooleanField(default=False)
    email_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    email_sent_at = models.DateTimeField(null=True, blank=True)
    email_error = models.TextField(null=True, blank=True)
    
    # Notification status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # References
    related_object_type = models.CharField(max_length=50, null=True, blank=True)  # 'Ticket', 'Document', etc.
    related_object_id = models.UUIDField(null=True, blank=True)
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['email_status', 'email_sent']),
            models.Index(fields=['is_read']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
    
    def get_email_context(self):
        """Get context for email template"""
        return {
            'user_name': self.user.full_name,
            'title': self.title,
            'message': self.message,
            'type': self.get_notification_type_display(),
            'created_at': self.created_at,
            'data': self.data,
        }


class NotificationPreference(models.Model):
    """User notification preferences"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    
    # Email preferences
    email_tickets = models.BooleanField(default=True, verbose_name='Notificaciones de tickets por email')
    email_documents = models.BooleanField(default=True, verbose_name='Notificaciones de documentos por email')
    email_projects = models.BooleanField(default=True, verbose_name='Notificaciones de proyectos por email')
    email_comments = models.BooleanField(default=True, verbose_name='Notificaciones de comentarios por email')
    email_security = models.BooleanField(default=True, verbose_name='Alertas de seguridad por email')
    email_system = models.BooleanField(default=True, verbose_name='Anuncios del sistema por email')
    
    # Digest preferences
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('IMMEDIATE', 'Inmediato'),
            ('HOURLY', 'Cada hora'),
            ('DAILY', 'Diario'),
            ('WEEKLY', 'Semanal'),
            ('NEVER', 'Nunca'),
        ],
        default='IMMEDIATE',
        verbose_name='Frecuencia de resumen'
    )
    
    # Notification center
    show_in_dashboard = models.BooleanField(default=True, verbose_name='Mostrar en dashboard')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Preferencia de notificación'
        verbose_name_plural = 'Preferencias de notificacion'
    
    def __str__(self):
        return f"Notification Preferences - {self.user.email}"
