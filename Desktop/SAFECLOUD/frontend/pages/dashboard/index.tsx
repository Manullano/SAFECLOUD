import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { can, role, isSuperAdmin } = useCanAccess();
  const [stats, setStats] = useState({
    projects: 4,
    documents: 12,
    tickets: 8,
    users: 6,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }
    
    // Redirect CLIENT users to their specific dashboard
    if (user.role?.startsWith('CLIENT_')) {
      router.push('/dashboard/client');
      return;
    }
    
    setLoading(false);
  }, [user, authLoading, router]);

  // Fetch recent activity from audit events
  useEffect(() => {
    if (user && access_token) {
      fetchRecentActivity();
    }
  }, [user, access_token]);

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Hace unos segundos';
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    if (seconds < 2592000) {
      const weeks = Math.floor(seconds / 604800);
      return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    const months = Math.floor(seconds / 2592000);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  };

  const getActionDescription = (action: string, data?: any): string => {
    const actionMap: { [key: string]: string } = {
      'DOCUMENT_CREATED': 'creó un documento',
      'DOCUMENT_UPDATED': 'actualizó un documento',
      'DOCUMENT_DELETED': 'eliminó un documento',
      'TASK_CREATED': 'creó una tarea',
      'TASK_UPDATED': 'editó una tarea',
      'TASK_DELETED': 'eliminó una tarea',
      'TASK_STATUS_CHANGED': 'cambió el estado de una tarea',
      'PROJECT_CREATED': 'creó un proyecto',
      'PROJECT_UPDATED': 'actualizó un proyecto',
      'USER_LOGIN': 'inició sesión',
      'USER_CREATED': 'creó un usuario',
      'PERMISSION_CHANGED': 'cambió permisos',
    };
    return actionMap[action] || 'realizó una acción';
  };

  const fetchRecentActivity = async () => {
    setActivityLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/audit/events/?limit=5', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const events = data.results || data || [];
        setRecentActivity(events.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-red-100 text-red-800';
      case 'STAFF_PM':
        return 'bg-purple-100 text-purple-800';
      case 'STAFF_SUPPORT':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT_ADMIN':
        return 'bg-green-100 text-green-800';
      case 'CLIENT_USER':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLIENT_VIEWER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Super Admin';
      case 'STAFF_PM':
        return 'Gestor de Proyectos';
      case 'STAFF_SUPPORT':
        return 'Soporte Técnico';
      case 'CLIENT_ADMIN':
        return 'Admin del Cliente';
      case 'CLIENT_USER':
        return 'Usuario del Cliente';
      case 'CLIENT_VIEWER':
        return 'Espectador';
      default:
        return role || 'Sin rol';
    }
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Panel de control</h1>
            <p className="text-gray-500">
              Centraliza proyectos, documentación y soporte en un entorno seguro.
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-medium text-sm ${getRoleBadgeColor()}`}>
            {getRoleLabel()}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Card 
          title="Proyectos"
          description={`${stats.projects} activos`}
          hoverable
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {stats.projects}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Card>

        <Card 
          title="Documentos"
          description={`${stats.documents} archivos`}
          hoverable
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {stats.documents}
              </p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
        </Card>

        <Card 
          title="Tickets"
          description={`${stats.tickets} activos`}
          hoverable
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-orange-600 mb-2">
                {stats.tickets}
              </p>
            </div>
            <div className="text-4xl">🎫</div>
          </div>
        </Card>

        <Card 
          title="Usuarios"
          description={`${stats.users} miembros`}
          hoverable
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {stats.users}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Proyectos Recientes" hoverable>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">Proyecto {i}</p>
                  <p className="text-sm text-gray-500">Actualizado hace 2 días</p>
                </div>
                <div className="text-xl">🚀</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Actividad Reciente" hoverable>
          <div className="space-y-4">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 pb-4 border-b last:border-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                    {activity.actor_user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.actor_user?.full_name || activity.actor_user?.email || 'Usuario'} {' '}
                      {getActionDescription(activity.action)}
                    </p>
                    <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Admin Panel */}
      {isSuperAdmin && (
        <div className="mt-12 pt-12 border-t">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Panel de Administración</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div 
              className="cursor-pointer"
              onClick={() => router.push('/dashboard/admin/companies')}
            >
              <Card 
                title="Gestión de Empresas"
                description="Incorporar clients"
                hoverable
              >
                <p className="text-4xl mb-2">🏢</p>
              </Card>
            </div>
            <div 
              className="cursor-pointer"
              onClick={() => router.push('/dashboard/admin/users')}
            >
              <Card 
                title="Gestión de Usuarios"
                description="Administrar usuarios"
                hoverable
              >
                <p className="text-4xl mb-2">👤</p>
              </Card>
            </div>
            <div 
              className="cursor-pointer"
              onClick={() => router.push('/dashboard/admin/audit')}
            >
              <Card 
                title="Auditoría"
                description="Ver logs"
                hoverable
              >
                <p className="text-4xl mb-2">📋</p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Bienvenido a SAFE Cloud</h3>
        <p className="text-blue-700">
          Estás conectado como <strong>{user.email}</strong>. 
          {isSuperAdmin ? ' Tienes acceso total a la plataforma.' : ' Contacta a un administrador para cambios.'}
        </p>
      </div>
    </Layout>
  );
};

export default DashboardPage;
