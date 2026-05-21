from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import JSONField
from safecloud_api.apps.companies.models import Company, Document
import uuid

class AuditLog(models.Model):
    """
    Registro inmutable de todas las acciones del sistema.
    Utilizado por SIGRA para análisis de comportamiento.
    """
    
    ACTION_CHOICES = [
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('VIEW_DOC', 'View Document'),
        ('DOWNLOAD_DOC', 'Download Document'),
        ('UPLOAD_DOC', 'Upload Document'),
        ('EDIT_DOC', 'Edit Document'),
        ('DELETE_DOC', 'Delete Document'),
        ('CHANGE_PERMISSION', 'Change Permission'),
        ('CREATE_USER', 'Create User'),
        ('UPDATE_USER', 'Update User'),
        ('DELETE_USER', 'Delete User'),
        ('CHANGE_ROLE', 'Change Role'),
        ('FAILED_LOGIN', 'Failed Login'),
        ('DENIED_ACCESS', 'Denied Access'),
        ('CREATE_PROJECT', 'Create Project'),
        ('UPDATE_PROJECT', 'Update Project'),
        ('DELETE_PROJECT', 'Delete Project'),
    ]
    
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('DENIED', 'Denied'),
        ('BLOCKED', 'Blocked'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=100, choices=ACTION_CHOICES)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    resource_type = models.CharField(max_length=50, null=True, blank=True)
    resource_id = models.IntegerField(null=True, blank=True)
    
    # Contexto técnico
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(null=True, blank=True)
    device_id = models.CharField(max_length=255, null=True, blank=True)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Estado
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='SUCCESS')
    error_message = models.TextField(null=True, blank=True)
    
    # Metadata adicional
    metadata = models.JSONField(default=dict, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['company', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
    
    def __str__(self):
        return f"{self.action} by {self.user.email} at {self.created_at}"


class KnownDevice(models.Model):
    """
    Dispositivos conocidos de un usuario.
    Utilizado por SIGRA para detectar dispositivos nuevos.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='known_devices')
    device_id = models.CharField(max_length=255)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    device_type = models.CharField(max_length=50, null=True, blank=True)  # desktop, mobile, tablet
    user_agent = models.TextField(null=True, blank=True)
    is_trusted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'known_devices'
        unique_together = ['user', 'device_id']
    
    def __str__(self):
        return f"{self.user.email} - {self.device_name}"


class KnownIP(models.Model):
    """
    IPs conocidas de un usuario.
    Utilizado por SIGRA para detectar IPs nuevas.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='known_ips')
    ip_address = models.GenericIPAddressField()
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    is_corporate = models.BooleanField(default=False)
    is_vpn = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'known_ips'
        unique_together = ['user', 'ip_address']
    
    def __str__(self):
        return f"{self.user.email} - {self.ip_address}"
