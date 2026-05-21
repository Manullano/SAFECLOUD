"""
Celery tasks para procesamiento de eventos SIGRA
"""

from celery import shared_task
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import logging

from safecloud_api.apps.sigra.models import SIGRAEvent, SIGRAAlert
from safecloud_api.apps.sigra.scoring import RiskScorer
from safecloud_api.apps.audit.models import AuditLog, KnownIP, KnownDevice
from safecloud_api.apps.notifications.models import Notification

logger = logging.getLogger('sigra')


@shared_task(bind=True, max_retries=3)
def process_event_async(self, audit_log_id: int):
    """
    Procesa un evento de auditoría con SIGRA.
    
    Ejecutado de forma asincrónica después de registrar un evento.
    
    Args:
        audit_log_id: ID del AuditLog a procesar
    """
    try:
        audit_log = AuditLog.objects.get(id=audit_log_id)
        
        # Construir datos del evento
        event_data = {
            'action': audit_log.action,
            'ip_address': audit_log.ip_address,
            'device_id': audit_log.device_id,
            'document_id': audit_log.document_id,
            'timestamp': audit_log.created_at,
            'status': audit_log.status,
        }
        
        # Calcular riesgo
        scorer = RiskScorer(audit_log.user, audit_log.company)
        risk_score, risk_level, breakdown = scorer.calculate_risk(event_data)
        
        # Crear evento SIGRA
        sigra_event = SIGRAEvent.objects.create(
            company=audit_log.company,
            audit_log=audit_log,
            user=audit_log.user,
            event_type=audit_log.action,
            event_data=event_data,
            risk_score=risk_score,
            risk_level=risk_level,
            scoring_breakdown=breakdown,
        )
        
        logger.info(
            f"SIGRA Event Created: {sigra_event.id} - "
            f"User: {audit_log.user.email} - "
            f"Risk Score: {risk_score} - "
            f"Level: {risk_level}"
        )
        
        # Generar alerta si el riesgo es significativo
        if risk_score >= 50:  # Threshold para alerta
            create_alert_async.delay(sigra_event.id)
        
        # Registrar IP y dispositivo conocidos
        if audit_log.status == 'SUCCESS':
            register_known_ip.delay(
                audit_log.user_id,
                audit_log.ip_address,
                audit_log.company_id
            )
            if audit_log.device_id:
                register_known_device.delay(
                    audit_log.user_id,
                    audit_log.device_id,
                    audit_log.device_name,
                    audit_log.user_agent
                )
        
        return {
            'status': 'success',
            'event_id': sigra_event.id,
            'risk_score': risk_score,
            'risk_level': risk_level,
        }
        
    except AuditLog.DoesNotExist:
        logger.error(f"AuditLog {audit_log_id} not found")
        return {'status': 'error', 'message': 'AuditLog not found'}
    except Exception as exc:
        logger.exception(f"Error processing event {audit_log_id}: {exc}")
        # Reintentar con backoff exponencial
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=2)
def create_alert_async(self, sigra_event_id: int):
    """
    Crea una alerta SIGRA para eventos de riesgo alto.
    
    Args:
        sigra_event_id: ID del evento SIGRA
    """
    try:
        sigra_event = SIGRAEvent.objects.get(id=sigra_event_id)
        
        # Determinar tipo de alerta
        alert_type, severity = _determine_alert_type(sigra_event)
        
        if not alert_type:
            return {'status': 'skip', 'reason': 'No alert condition met'}
        
        # Generar título y descripción
        title, description = _generate_alert_message(alert_type, sigra_event)
        
        # Crear alerta
        alert = SIGRAAlert.objects.create(
            company=sigra_event.company,
            sigra_event=sigra_event,
            user=sigra_event.user,
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            evidence={
                'event_type': sigra_event.event_type,
                'risk_score': sigra_event.risk_score,
                'scoring_breakdown': sigra_event.scoring_breakdown,
                'event_data': sigra_event.event_data,
            },
        )
        
        logger.warning(
            f"SIGRA Alert Created: {alert.id} - "
            f"User: {sigra_event.user.email} - "
            f"Type: {alert_type} - "
            f"Severity: {severity}"
        )
        
        # Enviar notificación
        send_alert_notification.delay(alert.id)
        
        # Si es crítico, escalar
        if severity == 'CRITICAL':
            escalate_alert.delay(alert.id)
        
        return {
            'status': 'success',
            'alert_id': alert.id,
            'alert_type': alert_type,
            'severity': severity,
        }
        
    except SIGRAEvent.DoesNotExist:
        logger.error(f"SIGRAEvent {sigra_event_id} not found")
        return {'status': 'error', 'message': 'SIGRAEvent not found'}
    except Exception as exc:
        logger.exception(f"Error creating alert for event {sigra_event_id}: {exc}")
        raise self.retry(exc=exc, countdown=30)


@shared_task
def send_alert_notification(alert_id: int):
    """
    Envía notificación de alerta SIGRA.
    
    Args:
        alert_id: ID de la alerta SIGRA
    """
    try:
        alert = SIGRAAlert.objects.get(id=alert_id)
        
        # Determinar canal de notificación según severidad
        channels = ['in_app']
        if alert.severity in ['HIGH', 'CRITICAL']:
            channels.extend(['email', 'sms'])
        
        # Crear notificación
        for channel in channels:
            if channel == 'in_app':
                Notification.objects.create(
                    user=alert.user,
                    type='SECURITY_ALERT',
                    title=alert.title,
                    message=alert.description,
                    metadata={
                        'alert_id': alert.id,
                        'severity': alert.severity,
                    }
                )
            elif channel == 'email':
                # Enviar email
                send_alert_email.delay(alert.id)
            elif channel == 'sms':
                # Enviar SMS
                send_alert_sms.delay(alert.id)
        
        logger.info(f"Alert notification sent for alert {alert_id}")
        return {'status': 'success', 'alert_id': alert_id}
        
    except SIGRAAlert.DoesNotExist:
        logger.error(f"SIGRAAlert {alert_id} not found")
        return {'status': 'error', 'message': 'SIGRAAlert not found'}
    except Exception as exc:
        logger.exception(f"Error sending alert notification {alert_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}


@shared_task
def send_alert_email(alert_id: int):
    """Envía email de alerta"""
    from django.core.mail import send_mail
    from django.template.loader import render_to_string
    
    try:
        alert = SIGRAAlert.objects.get(id=alert_id)
        
        # Renderizar email
        email_context = {
            'alert': alert,
            'user': alert.user,
            'company': alert.company,
        }
        
        html_message = render_to_string('sigra/alert_email.html', email_context)
        text_message = render_to_string('sigra/alert_email.txt', email_context)
        
        # Enviar
        send_mail(
            subject=f"🔒 SAFECLOUD Security Alert: {alert.title}",
            message=text_message,
            from_email='security@safecloud.com',
            recipient_list=[alert.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Alert email sent for alert {alert_id}")
        return {'status': 'success', 'alert_id': alert_id}
        
    except Exception as exc:
        logger.exception(f"Error sending alert email {alert_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}


@shared_task
def send_alert_sms(alert_id: int):
    """Envía SMS de alerta"""
    try:
        alert = SIGRAAlert.objects.get(id=alert_id)
        
        # TODO: Integrar con servicio de SMS (Twilio, AWS SNS, etc.)
        message = f"SAFECLOUD Security Alert: {alert.title}. Severity: {alert.severity}"
        
        logger.info(f"Alert SMS would be sent for alert {alert_id}: {message}")
        return {'status': 'success', 'alert_id': alert_id}
        
    except Exception as exc:
        logger.exception(f"Error sending alert SMS {alert_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}


@shared_task
def escalate_alert(alert_id: int):
    """
    Escala una alerta crítica
    """
    try:
        alert = SIGRAAlert.objects.get(id=alert_id)
        alert.is_escalated = True
        alert.save()
        
        # TODO: Crear ticket en sistema de incidentes
        logger.warning(f"Alert {alert_id} escalated to incident management")
        return {'status': 'success', 'alert_id': alert_id}
        
    except Exception as exc:
        logger.exception(f"Error escalating alert {alert_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}


@shared_task
def register_known_ip(user_id: int, ip_address: str, company_id: int):
    """
    Registra una IP conocida del usuario.
    """
    try:
        user = User.objects.get(id=user_id)
        
        known_ip, created = KnownIP.objects.update_or_create(
            user=user,
            ip_address=ip_address,
            defaults={
                'last_used': timezone.now(),
            }
        )
        
        if created:
            logger.info(f"New IP registered for user {user.email}: {ip_address}")
        
        return {'status': 'success', 'user_id': user_id, 'ip': ip_address}
        
    except Exception as exc:
        logger.exception(f"Error registering IP for user {user_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}


@shared_task
def register_known_device(user_id: int, device_id: str, device_name: str = None, user_agent: str = None):
    """
    Registra un dispositivo conocido del usuario.
    """
    try:
        user = User.objects.get(id=user_id)
        
        known_device, created = KnownDevice.objects.update_or_create(
            user=user,
            device_id=device_id,
            defaults={
                'device_name': device_name,
                'user_agent': user_agent,
                'last_used': timezone.now(),
            }
        )
        
        if created:
            logger.info(f"New device registered for user {user.email}: {device_id}")
        
        return {'status': 'success', 'user_id': user_id, 'device_id': device_id}
        
    except Exception as exc:
        logger.exception(f"Error registering device for user {user_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}


@shared_task
def cleanup_old_events(days=90):
    """
    Limpia eventos SIGRA antiguos (mantiene auditoria pero purga eventos de SIGRA).
    
    Args:
        days: Días de antigüedad para purgar
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        
        deleted_count, _ = SIGRAEvent.objects.filter(
            created_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"Cleaned up {deleted_count} old SIGRA events")
        return {'status': 'success', 'deleted_count': deleted_count}
        
    except Exception as exc:
        logger.exception(f"Error cleaning up old events: {exc}")
        return {'status': 'error', 'message': str(exc)}


# ============= Funciones auxiliares =============

def _determine_alert_type(sigra_event: SIGRAEvent) -> tuple:
    """
    Determina el tipo de alerta basado en el evento SIGRA.
    
    Returns:
        (alert_type: str, severity: str) o (None, None)
    """
    event_type = sigra_event.event_type
    breakdown = sigra_event.scoring_breakdown
    
    # Anomalía de tiempo
    if 'anomalous_time' in breakdown:
        return ('ANOMALOUS_TIME', 'HIGH')
    
    # IP desconocida
    if 'unknown_ip' in breakdown:
        return ('UNKNOWN_IP', 'MEDIUM')
    
    # Dispositivo desconocido
    if 'unknown_device' in breakdown:
        return ('UNKNOWN_DEVICE', 'MEDIUM')
    
    # Intentos de login fallidos
    if 'failed_logins' in breakdown and breakdown['failed_logins'] > 15:
        return ('FAILED_LOGINS', 'HIGH')
    
    # Descarga masiva
    if 'mass_download' in breakdown:
        return ('MASS_DOWNLOAD', 'HIGH')
    
    # Documento crítico
    if 'document_criticality' in breakdown and breakdown['document_criticality'] >= 30:
        return ('CRITICAL_DOC_ACCESS', 'CRITICAL')
    
    # Cambio de permisos
    if 'permission_change' in breakdown:
        return ('PERMISSION_CHANGE', 'HIGH')
    
    # Acción incompatible con rol
    if 'role_anomaly' in breakdown:
        return ('ROLE_ANOMALY', 'HIGH')
    
    # Intento de exportación
    if 'export_attempt' in breakdown:
        return ('EXPORT_ATTEMPT', 'CRITICAL')
    
    # Historial de alertas previas
    if sigra_event.scoring_breakdown.get('history_alerts', 0) >= 20:
        return ('ANOMALOUS_BEHAVIOR', 'HIGH')
    
    # Si el score es crítico pero no hay una categoría específica
    if sigra_event.risk_score >= 81:
        return ('CRITICAL_BEHAVIOR', 'CRITICAL')
    
    return None, None


def _generate_alert_message(alert_type: str, sigra_event: SIGRAEvent) -> tuple:
    """
    Genera título y descripción de la alerta.
    
    Returns:
        (title: str, description: str)
    """
    user_email = sigra_event.user.email
    event_type = sigra_event.event_type
    
    messages = {
        'ANOMALOUS_TIME': (
            'Access Outside Business Hours',
            f'{user_email} accessed the system outside of business hours '
            f'({sigra_event.event_data.get("timestamp")}). Risk Score: {sigra_event.risk_score}'
        ),
        'UNKNOWN_IP': (
            'Access From Unknown IP',
            f'{user_email} accessed from an unknown IP address '
            f'({sigra_event.event_data.get("ip_address")}). Risk Score: {sigra_event.risk_score}'
        ),
        'UNKNOWN_DEVICE': (
            'Access From Unknown Device',
            f'{user_email} accessed from an unknown device '
            f'(Device ID: {sigra_event.event_data.get("device_id")}). Risk Score: {sigra_event.risk_score}'
        ),
        'FAILED_LOGINS': (
            'Multiple Failed Login Attempts',
            f'{user_email} has {sigra_event.scoring_breakdown.get("failed_logins", 0)} '
            f'failed login attempts in 24 hours. Risk Score: {sigra_event.risk_score}'
        ),
        'MASS_DOWNLOAD': (
            'Unusual Download Volume',
            f'{user_email} downloaded {sigra_event.scoring_breakdown.get("mass_download", 0)} '
            f'documents in a short time period. Risk Score: {sigra_event.risk_score}'
        ),
        'CRITICAL_DOC_ACCESS': (
            'Critical Document Accessed',
            f'{user_email} accessed critical document ID {sigra_event.event_data.get("document_id")}. '
            f'Risk Score: {sigra_event.risk_score}'
        ),
        'PERMISSION_CHANGE': (
            'Suspicious Permission Change',
            f'{user_email} changed document permissions. Risk Score: {sigra_event.risk_score}'
        ),
        'ROLE_ANOMALY': (
            'Action Incompatible With User Role',
            f'{user_email} performed action "{event_type}" which is unusual for their role. '
            f'Risk Score: {sigra_event.risk_score}'
        ),
        'EXPORT_ATTEMPT': (
            'Unauthorized Data Export Attempt',
            f'{user_email} attempted to export data. Risk Score: {sigra_event.risk_score}'
        ),
        'ANOMALOUS_BEHAVIOR': (
            'Pattern of Anomalous Behavior',
            f'{user_email} has exhibited multiple suspicious activities. '
            f'Risk Score: {sigra_event.risk_score}'
        ),
        'CRITICAL_BEHAVIOR': (
            'Critical Security Alert',
            f'{user_email} triggered a critical security event. '
            f'Risk Score: {sigra_event.risk_score}. Immediate investigation recommended.'
        ),
    }
    
    return messages.get(alert_type, ('Security Alert', f'Risk Score: {sigra_event.risk_score}'))
