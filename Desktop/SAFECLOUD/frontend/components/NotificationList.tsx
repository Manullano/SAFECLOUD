import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface Notification {
  id: string;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
  read_at: string | null;
}

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead: () => void;
  unreadCount: number;
}

export const NotificationList = ({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onMarkAllAsRead,
  unreadCount,
}: NotificationListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace unos segundos';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;

    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
      case 'TICKET_UPDATED':
      case 'TICKET_RESOLVED':
        return '🎫';
      case 'DOCUMENT_CREATED':
      case 'DOCUMENT_UPDATED':
      case 'DOCUMENT_SHARED':
        return '📄';
      case 'PROJECT_CREATED':
      case 'PROJECT_UPDATED':
        return '📊';
      case 'TEAM_MEMBER_ADDED':
      case 'TEAM_MEMBER_REMOVED':
        return '👥';
      case '2FA_ENABLED':
      case '2FA_DISABLED':
      case 'PASSWORD_CHANGED':
      case 'LOGIN_NEW_DEVICE':
        return '🔐';
      case 'SYSTEM_UPDATE':
      case 'MAINTENANCE':
        return '⚙️';
      default:
        return '📬';
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('2FA') || type.includes('PASSWORD') || type.includes('LOGIN'))
      return 'bg-red-50 border-red-200';
    if (type.includes('SYSTEM') || type.includes('MAINTENANCE'))
      return 'bg-blue-50 border-blue-200';
    if (type.includes('ERROR')) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay notificaciones</h3>
        <p className="text-gray-600">Aquí aparecerán tus notificaciones cuando las haya</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado con acciones */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
            </p>
          </div>
          <button
            onClick={onMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-semibold hover:bg-blue-700"
          >
            Marcar todas como leídas
          </button>
        </div>
      )}

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`border rounded-lg p-4 transition-colors ${
              notification.is_read ? 'bg-white border-gray-200' : getNotificationColor(notification.notification_type)
            } ${!notification.is_read && 'border-l-4 border-l-blue-600'}`}
          >
            <div className="flex items-start gap-4">
              {/* Icono */}
              <div className="text-2xl flex-shrink-0 mt-1">
                {getNotificationIcon(notification.notification_type)}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${notification.is_read ? 'text-gray-900' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.message}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{formatDate(notification.created_at)}</span>
                      {notification.email_sent && (
                        <span className="flex items-center gap-1">
                          ✉️ Enviado por email
                        </span>
                      )}
                      <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                        {notification.notification_type_display}
                      </span>
                    </div>
                  </div>

                  {/* Indicador sin leer */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1" />
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex-shrink-0 flex gap-2">
                {!notification.is_read ? (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Marcar como leído"
                  >
                    ✓
                  </button>
                ) : (
                  <button
                    onClick={() => onMarkAsUnread(notification.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Marcar como no leído"
                  >
                    ◯
                  </button>
                )}
                <button
                  onClick={() => onDelete(notification.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
