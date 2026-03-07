"""
Notification Views - REST API endpoints for notification management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from safecloud_api.apps.notifications.models import Notification, NotificationPreference
from safecloud_api.core.serializers import NotificationSerializer, NotificationPreferenceSerializer
from safecloud_api.core.utils import log_audit_event


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Notification management endpoints
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        """Return notifications for authenticated user"""
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        
        return Response({
            'count': count,
            'has_unread': count > 0
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get all unread notifications"""
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).order_by('-created_at')
        
        serializer = self.get_serializer(notifications, many=True)
        return Response({
            'count': notifications.count(),
            'notifications': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        
        if notification.user != request.user:
            return Response(
                {'error': 'No tienes permiso para acceder a esta notificación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        log_audit_event(
            actor_user=request.user,
            action='NOTIFICATION_READ',
            company=request.user.company,
            data={'notification_id': str(notification.id)}
        )
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        """Mark notification as unread"""
        notification = self.get_object()
        
        if notification.user != request.user:
            return Response(
                {'error': 'No tienes permiso para acceder a esta notificación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.is_read = False
        notification.read_at = None
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all unread notifications as read"""
        notifications = Notification.objects.filter(
            user=request.user,
            is_read=False
        )
        
        count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        log_audit_event(
            actor_user=request.user,
            action='NOTIFICATIONS_ALL_READ',
            company=request.user.company,
            data={'count': count}
        )
        
        return Response({
            'message': f'{count} notificaciones marcadas como leídas',
            'count': count
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def delete_notification(self, request, pk=None):
        """Delete a notification"""
        notification = self.get_object()
        
        if notification.user != request.user:
            return Response(
                {'error': 'No tienes permiso para eliminar esta notificación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification_id = notification.id
        notification.delete()
        
        log_audit_event(
            actor_user=request.user,
            action='NOTIFICATION_DELETED',
            company=request.user.company,
            data={'notification_id': str(notification_id)}
        )
        
        return Response({
            'message': 'Notificación eliminada'
        }, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        """Delete all notifications for user"""
        count = Notification.objects.filter(user=request.user).count()
        
        Notification.objects.filter(user=request.user).delete()
        
        log_audit_event(
            actor_user=request.user,
            action='ALL_NOTIFICATIONS_DELETED',
            company=request.user.company,
            data={'count': count}
        )
        
        return Response({
            'message': f'{count} notificaciones eliminadas',
            'count': count
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def filters(self, request):
        """Get notification filters by type"""
        notification_types = dict(Notification.NOTIFICATION_TYPES)
        
        return Response({
            'types': notification_types
        }, status=status.HTTP_200_OK)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    User notification preferences management
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer
    
    def get_queryset(self):
        """Return preferences for authenticated user"""
        return NotificationPreference.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """Get current user's notification preferences"""
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            # Create default preferences
            preferences = NotificationPreference.objects.create(user=request.user)
        
        serializer = self.get_serializer(preferences)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['put'])
    def update_preferences(self, request):
        """Update notification preferences"""
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=request.user)
        
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Log only the updated fields
            log_data = {
                'email_tickets': preferences.email_tickets,
                'email_documents': preferences.email_documents,
                'email_projects': preferences.email_projects,
                'email_comments': preferences.email_comments,
                'email_security': preferences.email_security,
                'email_system': preferences.email_system,
                'digest_frequency': preferences.digest_frequency,
                'show_in_dashboard': preferences.show_in_dashboard,
            }
            
            log_audit_event(
                actor_user=request.user,
                action='NOTIFICATION_PREFERENCES_UPDATED',
                company=request.user.company,
                data=log_data
            )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_preferences(self, request):
        """Reset preferences to default values"""
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
            preferences.delete()
        except NotificationPreference.DoesNotExist:
            pass
        
        # Create new default preferences
        preferences = NotificationPreference.objects.create(user=request.user)
        
        log_audit_event(
            actor_user=request.user,
            action='NOTIFICATION_PREFERENCES_RESET',
            company=request.user.company
        )
        
        serializer = self.get_serializer(preferences)
        return Response(serializer.data, status=status.HTTP_200_OK)
