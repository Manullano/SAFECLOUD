from django.contrib import admin
from safecloud_api.apps.notifications.models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'email_status', 'is_read', 'created_at')
    list_filter = ('notification_type', 'email_status', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')
    readonly_fields = ('id', 'created_at', 'updated_at', 'email_sent_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'user', 'company', 'notification_type', 'title', 'message')
        }),
        ('Email', {
            'fields': ('email_sent', 'email_status', 'email_sent_at', 'email_error')
        }),
        ('Estado', {
            'fields': ('is_read', 'read_at')
        }),
        ('Referencia', {
            'fields': ('related_object_type', 'related_object_id')
        }),
        ('Metadata', {
            'fields': ('data', 'created_at', 'updated_at')
        }),
    )
    
    def has_delete_permission(self, request):
        return False


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'digest_frequency', 'email_tickets', 'email_security', 'updated_at')
    list_filter = ('digest_frequency', 'email_tickets', 'email_documents', 'email_security')
    search_fields = ('user__email', 'user__full_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Usuario', {
            'fields': ('id', 'user')
        }),
        ('Notificaciones de Email', {
            'fields': (
                'email_tickets',
                'email_documents',
                'email_projects',
                'email_comments',
                'email_security',
                'email_system'
            )
        }),
        ('Preferencias', {
            'fields': ('digest_frequency', 'show_in_dashboard')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
