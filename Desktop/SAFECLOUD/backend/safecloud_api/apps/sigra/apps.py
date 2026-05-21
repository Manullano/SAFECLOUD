from django.apps import AppConfig


class SigraConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'safecloud_api.apps.sigra'
    verbose_name = 'SIGRA Security Engine'
    
    def ready(self):
        """Registrar señales cuando la app esté lista"""
        import safecloud_api.apps.sigra.signals
