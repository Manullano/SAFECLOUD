from rest_framework import serializers
from django.contrib.auth.models import User
from safecloud_api.apps.sigra.models import SIGRAEvent, SIGRAAlert
from safecloud_api.apps.audit.models import AuditLog


class SIGRAEventSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = SIGRAEvent
        fields = [
            'id',
            'user_email',
            'event_type',
            'risk_score',
            'risk_level',
            'event_data',
            'scoring_breakdown',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'user_email',
            'risk_score',
            'risk_level',
            'scoring_breakdown',
            'created_at',
        ]


class SIGRAAlertSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    event_type = serializers.CharField(source='sigra_event.event_type', read_only=True)
    
    class Meta:
        model = SIGRAAlert
        fields = [
            'id',
            'user_email',
            'alert_type',
            'event_type',
            'severity',
            'title',
            'description',
            'status',
            'is_escalated',
            'evidence',
            'created_at',
            'resolved_at',
        ]
        read_only_fields = [
            'id',
            'user_email',
            'event_type',
            'evidence',
            'created_at',
            'resolved_at',
        ]


class SIGRAAlertDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para alertas con información completa"""
    user = serializers.SerializerMethodField()
    event = SIGRAEventSerializer(source='sigra_event', read_only=True)
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }
    
    class Meta:
        model = SIGRAAlert
        fields = [
            'id',
            'user',
            'event',
            'alert_type',
            'severity',
            'title',
            'description',
            'status',
            'is_escalated',
            'is_blocked',
            'evidence',
            'incident_ticket_id',
            'created_at',
            'updated_at',
            'resolved_at',
            'resolution_notes',
        ]
        read_only_fields = [
            'id',
            'user',
            'event',
            'evidence',
            'created_at',
            'updated_at',
        ]


class UserRiskProfileSerializer(serializers.Serializer):
    """Perfil de riesgo del usuario"""
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    
    # Conteos
    total_events = serializers.IntegerField()
    high_risk_events = serializers.IntegerField()
    open_alerts = serializers.IntegerField()
    
    # Puntuaciones
    average_risk_score = serializers.FloatField()
    max_risk_score = serializers.IntegerField()
    
    # Comportamiento
    last_activity = serializers.DateTimeField()
    is_new_user = serializers.BooleanField()
    has_clean_history = serializers.BooleanField()
    
    # Ubicación
    known_ips_count = serializers.IntegerField()
    known_devices_count = serializers.IntegerField()


class AnomalyReportSerializer(serializers.Serializer):
    """Reporte de anomalías detectadas"""
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    anomaly_type = serializers.CharField()
    detected_at = serializers.DateTimeField()
    confidence = serializers.FloatField()  # 0.0 - 1.0
    description = serializers.CharField()
    evidence = serializers.JSONField()
