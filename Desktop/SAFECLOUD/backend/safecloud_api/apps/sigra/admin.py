from django.contrib import admin
from django.utils.html import format_html
from safecloud_api.apps.sigra.models import SIGRAEvent, SIGRAAlert


@admin.register(SIGRAEvent)
class SIGRAEventAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'event_type',
        'risk_score',
        'risk_level_colored',
        'created_at',
    )
    list_filter = (
        'risk_level',
        'event_type',
        'created_at',
    )
    search_fields = (
        'user__email',
        'event_type',
    )
    readonly_fields = (
        'id',
        'risk_score',
        'risk_level',
        'scoring_breakdown',
        'created_at',
        'event_data',
    )
    
    fieldsets = (
        ('Información básica', {
            'fields': ('id', 'company', 'user', 'audit_log', 'event_type')
        }),
        ('Scoring SIGRA', {
            'fields': ('risk_score', 'risk_level', 'scoring_breakdown')
        }),
        ('Datos del evento', {
            'fields': ('event_data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    def risk_level_colored(self, obj):
        """Mostrar nivel de riesgo con color"""
        colors = {
            'LOW': 'green',
            'MEDIUM': 'orange',
            'HIGH': 'red',
            'CRITICAL': 'darkred',
        }
        color = colors.get(obj.risk_level, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.risk_level
        )
    risk_level_colored.short_description = 'Risk Level'
    
    def has_add_permission(self, request):
        """No permitir agregar eventos manualmente"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar eventos (son parte del audit trail)"""
        return False


@admin.register(SIGRAAlert)
class SIGRAAlertAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'alert_type',
        'severity_colored',
        'status_colored',
        'is_escalated',
        'created_at',
    )
    list_filter = (
        'severity',
        'status',
        'alert_type',
        'is_escalated',
        'created_at',
    )
    search_fields = (
        'user__email',
        'title',
        'description',
    )
    readonly_fields = (
        'id',
        'sigra_event',
        'evidence',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Información de alerta', {
            'fields': ('id', 'user', 'company', 'alert_type', 'severity', 'sigra_event')
        }),
        ('Contenido', {
            'fields': ('title', 'description')
        }),
        ('Estado', {
            'fields': ('status', 'is_escalated', 'is_blocked')
        }),
        ('Resolución', {
            'fields': ('resolved_at', 'resolved_by', 'resolution_notes')
        }),
        ('Incidente', {
            'fields': ('incident_ticket_id',)
        }),
        ('Evidencia', {
            'fields': ('evidence',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['mark_investigating', 'mark_resolved', 'escalate_alerts']
    
    def severity_colored(self, obj):
        """Mostrar severidad con color"""
        colors = {
            'MEDIUM': 'orange',
            'HIGH': 'red',
            'CRITICAL': 'darkred',
        }
        color = colors.get(obj.severity, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.severity
        )
    severity_colored.short_description = 'Severity'
    
    def status_colored(self, obj):
        """Mostrar estado con color"""
        colors = {
            'OPEN': 'red',
            'INVESTIGATING': 'orange',
            'RESOLVED': 'green',
            'DISMISSED': 'gray',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.status
        )
    status_colored.short_description = 'Status'
    
    def mark_investigating(self, request, queryset):
        """Marcar alertas como bajo investigación"""
        count = queryset.update(status='INVESTIGATING')
        self.message_user(request, f'{count} alerts marked as investigating')
    mark_investigating.short_description = 'Mark selected alerts as investigating'
    
    def mark_resolved(self, request, queryset):
        """Marcar alertas como resueltas"""
        from django.utils import timezone
        count = queryset.update(
            status='RESOLVED',
            resolved_at=timezone.now(),
            resolved_by=request.user
        )
        self.message_user(request, f'{count} alerts marked as resolved')
    mark_resolved.short_description = 'Mark selected alerts as resolved'
    
    def escalate_alerts(self, request, queryset):
        """Escalar alertas a incidentes"""
        count = queryset.update(is_escalated=True)
        self.message_user(request, f'{count} alerts escalated')
    escalate_alerts.short_description = 'Escalate selected alerts'
