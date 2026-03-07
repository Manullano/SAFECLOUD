from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'safecloud_api.apps.notifications'
    verbose_name = 'Notificaciones'
    
    def ready(self):
        """Import signals when app is ready"""
        import safecloud_api.apps.notifications.signals
