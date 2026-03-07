import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
  id: string;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationWidget = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notificationsRes, countRes] = await Promise.all([
          api.get<{ results: Notification[] }>('/notifications/notifications/', {
            params: { limit: 5 },
          }),
          api.get<{ count: number }>('/notifications/notifications/unread_count/'),
        ]);

        setNotifications(notificationsRes.data.results?.slice(0, 5) || []);
        setUnreadCount(countRes.data.count || 0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
      case 'TICKET_UPDATED':
        return '🎫';
      case 'DOCUMENT_CREATED':
      case 'DOCUMENT_UPDATED':
        return '📄';
      case 'PROJECT_CREATED':
        return '📊';
      case '2FA_ENABLED':
      case '2FA_DISABLED':
        return '🔐';
      case 'SYSTEM_UPDATE':
        return '⚙️';
      default:
        return '📬';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">📬 Notificaciones</h3>
        {unreadCount > 0 && (
          <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
            {unreadCount} sin leer
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No hay notificaciones nuevas</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg text-sm ${
                  notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-l-blue-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.notification_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-1">{notification.title}</p>
                    <p className="text-gray-600 text-xs line-clamp-1">{notification.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(notification.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/notifications/center"
            className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Ver todas las notificaciones
          </Link>
        </>
      )}
    </div>
  );
};
