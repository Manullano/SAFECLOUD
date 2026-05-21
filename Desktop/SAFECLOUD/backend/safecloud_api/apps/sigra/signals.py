"""
Señales Django para integrar SIGRA con el sistema de auditoría.

Cuando se crea un AuditLog, se dispara automáticamente el procesamiento
de SIGRA de forma asincrónica.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import logging

from safecloud_api.apps.audit.models import AuditLog
from safecloud_api.apps.sigra.tasks import process_event_async

logger = logging.getLogger('sigra')


@receiver(post_save, sender=AuditLog)
def trigger_sigra_processing(sender, instance, created, **kwargs):
    """
    Dispara el procesamiento de SIGRA cuando se crea un nuevo AuditLog.
    
    Se ejecuta de forma asincrónica mediante Celery para no bloquear
    la solicitud HTTP.
    """
    if created:
        # Disparar tarea asincrónica
        process_event_async.delay(instance.id)
        
        logger.info(
            f"SIGRA processing triggered for AuditLog {instance.id} "
            f"- Action: {instance.action} - User: {instance.user.email}"
        )
