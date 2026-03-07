import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NotificationList } from '@/components/NotificationList';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import api from '@/lib/api';

interface Notification {
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

interface NotificationFilter {
  label: string;
  value: string;
}

export default function NotificationCenterPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filters, setFilters] = useState<NotificationFilter[]>([]);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  // Obtener notificaciones
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ results: Notification[] }>(
        '/notifications/notifications/'
      );
      setNotifications(response.data.results || []);
      applyFilter(selectedFilter, response.data.results);
    } catch (err: any) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener conteo de no leídas
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<{ count: number }>(
        '/notifications/notifications/unread_count/'
      );
      setUnreadCount(response.data.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Obtener filtros disponibles
  const fetchFilters = async () => {
    try {
      const response = await api.get<{ types: Record<string, string> }>(
        '/notifications/notifications/filters/'
      );
      const filterList = Object.entries(response.data.types).map(([key, label]) => ({
        value: key,
        label: label,
      }));
      setFilters(filterList);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  // Aplicar filtro
  const applyFilter = (filter: string, notificationList?: Notification[]) => {
    const list = notificationList || notifications;
    if (filter === 'all') {
      setFilteredNotifications(list);
    } else if (filter === 'unread') {
      setFilteredNotifications(list.filter((n) => !n.is_read));
    } else {
      setFilteredNotifications(list.filter((n) => n.notification_type === filter));
    }
    setSelectedFilter(filter);
  };

  // Cargar datos al montar
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    fetchFilters();
  }, []);

  // Marcar como leído
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/notifications/${id}/mark_as_read/`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
      applyFilter(selectedFilter);
    } catch (err) {
      setError('Error al marcar como leído');
    }
  };

  // Marcar como no leído
  const handleMarkAsUnread = async (id: string) => {
    try {
      await api.post(`/notifications/notifications/${id}/mark_as_unread/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false, read_at: null } : n))
      );
      setUnreadCount(unreadCount + 1);
      applyFilter(selectedFilter);
    } catch (err) {
      setError('Error al marcar como no leído');
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/notifications/mark_all_as_read/');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      applyFilter(selectedFilter);
    } catch (err) {
      setError('Error al marcar todas como leídas');
    }
  };

  // Eliminar notificación
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      applyFilter(selectedFilter);
      fetchUnreadCount();
    } catch (err) {
      setError('Error al eliminar notificación');
    }
  };

  // Eliminar todas las notificaciones
  const handleDeleteAll = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar todas tus notificaciones?')) {
      return;
    }
    try {
      await api.post('/notifications/notifications/delete_all/');
      setNotifications([]);
      setFilteredNotifications([]);
      setUnreadCount(0);
      setShowDeleteAll(false);
    } catch (err) {
      setError('Error al eliminar notificaciones');
    }
  };

  // Actualizar preferencias
  const handleUpdatePreferences = async (data: any) => {
    try {
      await api.put('/notifications/preferences/update_preferences/', data);
    } catch (err: any) {
      throw err;
    }
  };

  // Reiniciar preferencias
  const handleResetPreferences = async () => {
    try {
      await api.post('/notifications/preferences/reset_preferences/');
    } catch (err) {
      setError('Error al reiniciar preferencias');
    }
  };

  return (
    <ProtectedRoute requiredRole="CLIENT_ADMIN">
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Encabezado */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
            >
              ← Volver al Dashboard
            </Link>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Centro de Notificaciones</h1>
                <p className="text-gray-600 mt-2">Gestiona todas tus notificaciones y preferencias</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{unreadCount}</div>
                <div className="text-sm text-gray-600">sin leer</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`pb-4 px-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'inbox'
                  ? 'text-blue-600 border-b-blue-600'
                  : 'text-gray-600 border-b-transparent hover:text-gray-900'
              }`}
            >
              📬 Bandeja de Entrada ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-4 px-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'text-blue-600 border-b-blue-600'
                  : 'text-gray-600 border-b-transparent hover:text-gray-900'
              }`}
            >
              ⚙️ Preferencias
            </button>
          </div>

          {/* Contenido */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Tab: Bandeja de Entrada */}
            {activeTab === 'inbox' && (
              <div className="space-y-6">
                {/* Filtros */}
                {filters.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900">Filtrar por tipo:</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => applyFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          selectedFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Todas ({notifications.length})
                      </button>
                      <button
                        onClick={() => applyFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          selectedFilter === 'unread'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Sin leer ({unreadCount})
                      </button>
                      {filters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => applyFilter(filter.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            selectedFilter === filter.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje de error */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Lista de notificaciones */}
                <NotificationList
                  notifications={filteredNotifications}
                  loading={loading}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDelete={handleDelete}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  unreadCount={unreadCount}
                />

                {/* Botón eliminar todas */}
                {notifications.length > 0 && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowDeleteAll(!showDeleteAll)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                    >
                      Eliminar todas las notificaciones
                    </button>
                  </div>
                )}

                {/* Formulario confirmar eliminar todas */}
                {showDeleteAll && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <p className="text-red-800 text-sm">
                      ¿Estás seguro de que deseas eliminar todas tus notificaciones? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAll}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                      >
                        Sí, eliminar todas
                      </button>
                      <button
                        onClick={() => setShowDeleteAll(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Preferencias */}
            {activeTab === 'preferences' && (
              <NotificationPreferences
                onUpdate={handleUpdatePreferences}
                loading={loading}
                onReset={handleResetPreferences}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
