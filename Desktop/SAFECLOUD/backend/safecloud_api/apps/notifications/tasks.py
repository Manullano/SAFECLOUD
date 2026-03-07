from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import timedelta
import logging

from safecloud_api.apps.notifications.models import Notification, NotificationPreference

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_notification_email(self, notification_id):
    """
    Send email notification asynchronously
    Retries up to 3 times if failed
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        user = notification.user
        
        # Check user preferences
        try:
            prefs = NotificationPreference.objects.get(user=user)
            # Check if user wants emails for this type
            notification_type = notification.notification_type
            if notification_type.startswith('TICKET') and not prefs.email_tickets:
                logger.warning(f"User {user.email} disabled email for tickets")
                return
            if notification_type.startswith('DOCUMENT') and not prefs.email_documents:
                return
            if notification_type.startswith('PROJECT') and not prefs.email_projects:
                return
            if notification_type.startswith('COMMENT') and not prefs.email_comments:
                return
            if 'ALERT' in notification_type and not prefs.email_security:
                return
            if notification_type == 'SYSTEM_ANNOUNCEMENT' and not prefs.email_system:
                return
        except NotificationPreference.DoesNotExist:
            # Create default preferences
            NotificationPreference.objects.create(user=user)
        
        # Prepare email context
        context = notification.get_email_context()
        context['notification_id'] = str(notification.id)
        
        # Render email template
        html_message = render_to_string('notifications/email_notification.html', context)
        text_message = render_to_string('notifications/email_notification.txt', context)
        
        # Send email
        subject = f"[SAFECLOUD] {notification.title}"
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email='noreply@safecloud.com',
            to=[user.email]
        )
        email.attach_alternative(html_message, "text/html")
        
        email.send(fail_silently=False)
        
        # Mark as sent
        notification.email_sent = True
        notification.email_status = 'SENT'
        notification.email_sent_at = timezone.now()
        notification.save()
        
        logger.info(f"Email notification sent to {user.email} for {notification.notification_type}")
        return {'status': 'sent', 'notification_id': str(notification_id)}
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return {'status': 'not_found'}
    
    except Exception as exc:
        logger.error(f"Failed to send notification email: {str(exc)}")
        
        # Retry with exponential backoff
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.email_status = 'FAILED'
            notification.email_error = str(exc)
            notification.save()
        except:
            pass
        
        # Retry
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def send_bulk_notifications(user_ids, notification_type, title, message, data=None):
    """
    Send notifications to multiple users
    """
    count = 0
    for user_id in user_ids:
        try:
            from safecloud_api.apps.companies.models import User
            user = User.objects.get(id=user_id)
            
            notification = Notification.objects.create(
                user=user,
                company=user.company,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {}
            )
            
            # Send email async
            send_notification_email.delay(str(notification.id))
            count += 1
        except Exception as e:
            logger.error(f"Failed to create notification for user {user_id}: {str(e)}")
    
    logger.info(f"Created {count} notifications of type {notification_type}")
    return {'created': count, 'type': notification_type}


@shared_task
def cleanup_old_notifications():
    """
    Delete old notifications (older than NOTIFICATION_RETENTION_DAYS)
    Should be run daily via Celery Beat
    """
    from django.conf import settings
    
    retention_days = getattr(settings, 'NOTIFICATION_RETENTION_DAYS', 30)
    cutoff_date = timezone.now() - timedelta(days=retention_days)
    
    deleted_count, _ = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_read=True  # Only delete read notifications
    ).delete()
    
    logger.info(f"Cleaned up {deleted_count} old notifications")
    return {'deleted': deleted_count}


@shared_task
def send_security_alert(user_id, title, message, **kwargs):
    """
    Send security alert email immediately (high priority)
    """
    try:
        from safecloud_api.apps.companies.models import User
        user = User.objects.get(id=user_id)
        
        notification = Notification.objects.create(
            user=user,
            company=user.company if hasattr(user, 'company') else None,
            notification_type='SECURITY_ALERT',
            title=title,
            message=message,
            data=kwargs
        )
        
        # Send immediately
        send_notification_email.apply_async(
            args=[str(notification.id)],
            priority=10  # High priority
        )
        
        logger.warning(f"Security alert sent to {user.email}: {title}")
        return {'status': 'sent', 'user': str(user_id)}
    
    except Exception as e:
        logger.error(f"Failed to send security alert to {user_id}: {str(e)}")
        return {'status': 'failed', 'error': str(e)}
