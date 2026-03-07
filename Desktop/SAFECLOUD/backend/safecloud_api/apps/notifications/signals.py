from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.apps import apps

from safecloud_api.apps.notifications.models import Notification, NotificationPreference
from safecloud_api.apps.notifications.tasks import send_notification_email


@receiver(post_save, sender='companies.Ticket')
def notify_ticket_events(sender, instance, created, **kwargs):
    """Send notification when ticket is created or updated"""
    try:
        if created:
            # Ticket created
            notification_type = 'TICKET_CREATED'
            title = f"Nuevo Ticket: {instance.title}"
            message = f"Se ha creado un nuevo ticket #{instance.id}"
            
            # Notify assigned user
            if instance.assigned_to:
                notification = Notification.objects.create(
                    user=instance.assigned_to,
                    company=instance.company,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    related_object_type='Ticket',
                    related_object_id=instance.id,
                    data={
                        'ticket_id': str(instance.id),
                        'ticket_title': instance.title,
                        'priority': instance.priority,
                        'category': instance.category,
                    }
                )
                send_notification_email.delay(str(notification.id))
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in notify_ticket_events: {str(e)}")


@receiver(post_save, sender='companies.Document')
def notify_document_events(sender, instance, created, **kwargs):
    """Send notification when document is created or updated"""
    try:
        if created:
            notification_type = 'DOCUMENT_SHARED'
            title = f"Nuevo Documento: {instance.title}"
            message = f"Se ha subido un nuevo documento: {instance.title}"
            
            # Notify company users
            if instance.company:
                for user in instance.company.users.all():
                    if user != instance.created_by:
                        notification = Notification.objects.create(
                            user=user,
                            company=instance.company,
                            notification_type=notification_type,
                            title=title,
                            message=message,
                            related_object_type='Document',
                            related_object_id=instance.id,
                            data={
                                'document_id': str(instance.id),
                                'document_title': instance.title,
                                'category': instance.category,
                            }
                        )
                        send_notification_email.delay(str(notification.id))
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in notify_document_events: {str(e)}")


@receiver(post_save, sender='companies.TwoFactorAuth')
def notify_2fa_events(sender, instance, created, **kwargs):
    """Send notification when 2FA is enabled"""
    try:
        if created or (not created and instance.is_verified):
            notification_type = '2FA_ENABLED'
            title = "Autenticación de Dos Factores Habilitada"
            message = "Tu cuenta ahora está protegida con autenticación de dos factores (2FA)."
            
            notification = Notification.objects.create(
                user=instance.user,
                company=instance.user.company,
                notification_type=notification_type,
                title=title,
                message=message,
                data={'2fa_method': 'TOTP'}
            )
            send_notification_email.delay(str(notification.id))
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in notify_2fa_events: {str(e)}")


def create_notification_preference(sender, instance, created, **kwargs):
    """Create default notification preferences for new users"""
    if created:
        NotificationPreference.objects.get_or_create(user=instance)


def ready(self):
    """Connect signals when app is ready"""
    # Connect user post_save to create preference
    from safecloud_api.apps.companies.models import User
    post_save.connect(create_notification_preference, sender=User)
