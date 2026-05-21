from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg, Max
from django.utils import timezone
from datetime import timedelta

from safecloud_api.apps.sigra.models import SIGRAEvent, SIGRAAlert
from safecloud_api.apps.sigra.serializers import (
    SIGRAEventSerializer,
    SIGRAAlertSerializer,
    SIGRAAlertDetailSerializer,
    UserRiskProfileSerializer,
    AnomalyReportSerializer,
)
from safecloud_api.apps.audit.models import AuditLog, KnownIP, KnownDevice


class SIGRAEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API para consultar eventos SIGRA.
    
    GET /api/sigra/events/ - Listar eventos
    GET /api/sigra/events/{id}/ - Detalle de evento
    """
    
    serializer_class = SIGRAEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'risk_score']
    ordering = ['-created_at']
    search_fields = ['user__email', 'event_type']
    
    def get_queryset(self):
        """
        Filtrar eventos por compañía del usuario.
        Admins ven todos, usuarios normales solo ven sus propios eventos.
        """
        user = self.request.user
        
        if user.is_staff:
            return SIGRAEvent.objects.all()
        
        return SIGRAEvent.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def by_risk_level(self, request):
        """
        GET /api/sigra/events/by_risk_level/?level=HIGH
        Obtener eventos por nivel de riesgo
        """
        level = request.query_params.get('level')
        
        if not level:
            return Response(
                {'error': 'level parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = self.get_queryset().filter(risk_level=level)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/sigra/events/stats/
        Estadísticas de eventos
        """
        events = self.get_queryset()
        
        stats = {
            'total_events': events.count(),
            'by_risk_level': {
                'LOW': events.filter(risk_level='LOW').count(),
                'MEDIUM': events.filter(risk_level='MEDIUM').count(),
                'HIGH': events.filter(risk_level='HIGH').count(),
                'CRITICAL': events.filter(risk_level='CRITICAL').count(),
            },
            'by_event_type': dict(
                events.values('event_type').annotate(
                    count=Count('id')
                ).values_list('event_type', 'count')
            ),
            'average_risk_score': events.aggregate(Avg('risk_score'))['risk_score__avg'] or 0,
            'max_risk_score': events.aggregate(Max('risk_score'))['risk_score__max'] or 0,
        }
        
        return Response(stats)


class SIGRAAlertViewSet(viewsets.ModelViewSet):
    """
    API para gestionar alertas SIGRA.
    
    GET /api/sigra/alerts/ - Listar alertas
    GET /api/sigra/alerts/{id}/ - Detalle de alerta
    POST /api/sigra/alerts/{id}/resolve/ - Resolver alerta
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']
    search_fields = ['user__email', 'title', 'description']
    
    def get_queryset(self):
        """
        Filtrar alertas por compañía del usuario.
        Admins ven todas, usuarios normales solo ven sus propias alertas.
        """
        user = self.request.user
        
        if user.is_staff:
            return SIGRAAlert.objects.all()
        
        return SIGRAAlert.objects.filter(user=user)
    
    def get_serializer_class(self):
        """Usar serializer detallado para acciones de retrieve"""
        if self.action == 'retrieve':
            return SIGRAAlertDetailSerializer
        return SIGRAAlertSerializer
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        POST /api/sigra/alerts/{id}/resolve/
        Resolver una alerta
        
        Body:
        {
            "resolution_notes": "...",
            "resolution_type": "false_positive|legitimate|mitigated"
        }
        """
        alert = self.get_object()
        
        # Verificar permisos
        if not request.user.is_staff and alert.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Actualizar alerta
        alert.status = 'RESOLVED'
        alert.resolved_at = timezone.now()
        alert.resolved_by = request.user
        alert.resolution_notes = request.data.get('resolution_notes', '')
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def open_alerts(self, request):
        """
        GET /api/sigra/alerts/open_alerts/
        Obtener alertas abiertas
        """
        alerts = self.get_queryset().filter(status='OPEN')
        
        # Paginación
        page = self.paginate_queryset(alerts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_severity(self, request):
        """
        GET /api/sigra/alerts/by_severity/?severity=CRITICAL
        Obtener alertas por severidad
        """
        severity = request.query_params.get('severity')
        
        if not severity:
            return Response(
                {'error': 'severity parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alerts = self.get_queryset().filter(severity=severity)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/sigra/alerts/stats/
        Estadísticas de alertas
        """
        alerts = self.get_queryset()
        
        stats = {
            'total_alerts': alerts.count(),
            'open_alerts': alerts.filter(status='OPEN').count(),
            'by_severity': {
                'MEDIUM': alerts.filter(severity='MEDIUM').count(),
                'HIGH': alerts.filter(severity='HIGH').count(),
                'CRITICAL': alerts.filter(severity='CRITICAL').count(),
            },
            'by_status': {
                'OPEN': alerts.filter(status='OPEN').count(),
                'INVESTIGATING': alerts.filter(status='INVESTIGATING').count(),
                'RESOLVED': alerts.filter(status='RESOLVED').count(),
                'DISMISSED': alerts.filter(status='DISMISSED').count(),
            },
            'escalated_alerts': alerts.filter(is_escalated=True).count(),
        }
        
        return Response(stats)


class UserRiskViewSet(viewsets.ViewSet):
    """
    API para consultar riesgo de usuarios.
    
    GET /api/sigra/risk-score/ - Perfil de riesgo del usuario autenticado
    GET /api/sigra/risk-score/users/ - Listar usuarios con mayor riesgo (admin)
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_risk_profile(self, request):
        """
        GET /api/sigra/risk-score/my_risk_profile/
        Obtener perfil de riesgo del usuario autenticado
        """
        user = request.user
        
        # Obtener datos
        events = SIGRAEvent.objects.filter(user=user)
        alerts = SIGRAAlert.objects.filter(user=user)
        
        one_week_ago = timezone.now() - timedelta(days=7)
        
        risk_profile = {
            'user_id': user.id,
            'email': user.email,
            'total_events': events.count(),
            'high_risk_events': events.filter(risk_level__in=['HIGH', 'CRITICAL']).count(),
            'open_alerts': alerts.filter(status='OPEN').count(),
            'average_risk_score': events.aggregate(Avg('risk_score'))['risk_score__avg'] or 0,
            'max_risk_score': events.aggregate(Max('risk_score'))['risk_score__max'] or 0,
            'last_activity': events.values_list('created_at', flat=True).first(),
            'is_new_user': (timezone.now() - user.date_joined).days < 7,
            'has_clean_history': not alerts.filter(
                created_at__gte=timezone.now() - timedelta(days=90)
            ).exists(),
            'known_ips_count': KnownIP.objects.filter(user=user).count(),
            'known_devices_count': KnownDevice.objects.filter(user=user).count(),
            'recent_alerts': SIGRAAlertSerializer(
                alerts.filter(created_at__gte=one_week_ago)[:5],
                many=True
            ).data,
        }
        
        return Response(risk_profile)
    
    @action(detail=False, methods=['get'])
    def high_risk_users(self, request):
        """
        GET /api/sigra/risk-score/high_risk_users/
        Listar usuarios de alto riesgo (admin only)
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Usuarios con alertas críticas sin resolver
        critical_alert_users = SIGRAAlert.objects.filter(
            severity='CRITICAL',
            status='OPEN'
        ).values('user_id').distinct()
        
        # Usuarios con múltiples eventos de alto riesgo recientes
        one_week_ago = timezone.now() - timedelta(days=7)
        high_activity_users = SIGRAEvent.objects.filter(
            risk_level__in=['HIGH', 'CRITICAL'],
            created_at__gte=one_week_ago
        ).values('user_id').annotate(
            count=Count('id')
        ).filter(count__gte=5).values('user_id')
        
        user_ids = set(
            list(critical_alert_users.values_list('user_id', flat=True)) +
            list(high_activity_users.values_list('user_id', flat=True))
        )
        
        from django.contrib.auth.models import User
        high_risk_users = User.objects.filter(id__in=user_ids)
        
        users_data = []
        for user in high_risk_users:
            events = SIGRAEvent.objects.filter(user=user)
            alerts = SIGRAAlert.objects.filter(user=user)
            
            users_data.append({
                'user_id': user.id,
                'email': user.email,
                'total_events': events.count(),
                'high_risk_events': events.filter(risk_level__in=['HIGH', 'CRITICAL']).count(),
                'open_alerts': alerts.filter(status='OPEN').count(),
                'average_risk_score': events.aggregate(Avg('risk_score'))['risk_score__avg'] or 0,
                'max_risk_score': events.aggregate(Max('risk_score'))['risk_score__max'] or 0,
            })
        
        return Response(sorted(users_data, key=lambda x: x['max_risk_score'], reverse=True))


class AnomalyDetectionViewSet(viewsets.ViewSet):
    """
    API para detectar y reportar anomalías.
    
    GET /api/sigra/anomalies/ - Anomalías detectadas
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def list_anomalies(self, request):
        """
        GET /api/sigra/anomalies/list_anomalies/
        Listar anomalías detectadas
        """
        user = request.user
        
        anomalies = []
        
        # Anomalía 1: Acceso fuera de horario
        events_outside_hours = SIGRAEvent.objects.filter(
            user=user,
            scoring_breakdown__has_key='anomalous_time'
        ).order_by('-created_at')[:5]
        
        for event in events_outside_hours:
            anomalies.append({
                'user_id': user.id,
                'email': user.email,
                'anomaly_type': 'OUTSIDE_BUSINESS_HOURS',
                'detected_at': event.created_at,
                'confidence': 0.95,
                'description': f'Access detected outside business hours',
                'evidence': event.event_data,
            })
        
        # Anomalía 2: IP desconocida
        events_unknown_ip = SIGRAEvent.objects.filter(
            user=user,
            scoring_breakdown__has_key='unknown_ip'
        ).order_by('-created_at')[:5]
        
        for event in events_unknown_ip:
            anomalies.append({
                'user_id': user.id,
                'email': user.email,
                'anomaly_type': 'UNKNOWN_IP',
                'detected_at': event.created_at,
                'confidence': 0.85,
                'description': f'Access from unknown IP: {event.event_data.get("ip_address")}',
                'evidence': event.event_data,
            })
        
        # Anomalía 3: Descarga masiva
        events_mass_download = SIGRAEvent.objects.filter(
            user=user,
            scoring_breakdown__has_key='mass_download'
        ).order_by('-created_at')[:5]
        
        for event in events_mass_download:
            anomalies.append({
                'user_id': user.id,
                'email': user.email,
                'anomaly_type': 'MASS_DOWNLOAD',
                'detected_at': event.created_at,
                'confidence': 0.90,
                'description': f'Unusual download volume detected',
                'evidence': event.event_data,
            })
        
        # Ordenar por confianza y fecha
        anomalies.sort(
            key=lambda x: (x['confidence'], x['detected_at']),
            reverse=True
        )
        
        return Response(anomalies)
