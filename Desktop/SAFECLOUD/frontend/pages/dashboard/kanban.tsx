import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/router';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'DOING' | 'DONE';
  priority: 1 | 2 | 3;
  project: string;  // Project UUID
  project_name?: string;
  assigned_to?: string | null;  // User UUID
  assigned_name?: string;
  created_by?: string;  // User UUID
  created_by_name?: string;
  due_at?: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const KanbanBoard = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token, refreshToken } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 2,
    project: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 2,
    assigned_to: '',
    due_at: '',
  });

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    
    // Only PROJECT members and admins can see kanban
    if (!['SUPERADMIN', 'STAFF_PM', 'CLIENT_ADMIN', 'CLIENT_USER'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, authLoading, access_token, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${apiUrl}/projects/tasks/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiUrl}/projects/projects/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      // Si alguno devuelve 401, refrescar token y reintentar
      if (tasksRes.status === 401 || projectsRes.status === 401) {
        console.warn('Token expirado, intentando refrescar...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          const newToken = useAuth.getState().access_token;
          const retryTasks = await fetch(`${apiUrl}/projects/tasks/`, {
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          const retryProjects = await fetch(`${apiUrl}/projects/projects/`, {
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (retryTasks.ok) {
            const data = await retryTasks.json();
            const taskList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setTasks(taskList);
          }

          if (retryProjects.ok) {
            const data = await retryProjects.json();
            const projectList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setProjects(projectList);
            if (projectList.length > 0 && !selectedProject) {
              setSelectedProject(projectList[0].id);
            }
          }
        } else {
          router.push('/login');
        }
        setLoading(false);
        return;
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        const taskList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setTasks(taskList);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        const projectList = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setProjects(projectList);
        if (projectList.length > 0 && !selectedProject) {
          setSelectedProject(projectList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = selectedProject 
    ? tasks.filter(t => t.project === selectedProject)
    : tasks;

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const doingTasks = filteredTasks.filter(t => t.status === 'DOING');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/tasks/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: 'TODO',
          priority: formData.priority,
          project: selectedProject || formData.project,
        }),
      });

      // Si el token expiró (401), intentar refrescar y reintentar
      if (response.status === 401) {
        console.warn('❌ Token expirado, intentando refrescar...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          console.log('✅ Token refrescado, reintentando...');
          // Reintentar con el nuevo token
          const newToken = useAuth.getState().access_token;
          const retryResponse = await fetch(`${apiUrl}/projects/tasks/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              status: 'TODO',
              priority: formData.priority,
              project: selectedProject || formData.project,
            }),
          });

          if (retryResponse.ok) {
            setFormData({ title: '', description: '', priority: 2, project: '' });
            setShowCreateModal(false);
            fetchData();
            alert('✅ Tarea creada exitosamente');
            return;
          }
        } else {
          alert('❌ Tu sesión ha expirado. Por favor vuelve a iniciar sesión.');
          router.push('/login');
          return;
        }
      }

      if (response.ok) {
        setFormData({ title: '', description: '', priority: 2, project: '' });
        setShowCreateModal(false);
        fetchData();
        alert('✅ Tarea creada exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || 'No se pudo crear la tarea'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error al crear la tarea');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'TODO' | 'DOING' | 'DONE') => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/tasks/${taskId}/change_status/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      // Si el token expiró (401), intentar refrescar y reintentar
      if (response.status === 401) {
        console.warn('❌ Token expirado, intentando refrescar...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          console.log('✅ Token refrescado, reintentando...');
          // Reintentar con el nuevo token
          const newToken = useAuth.getState().access_token;
          const retryResponse = await fetch(`${apiUrl}/projects/tasks/${taskId}/change_status/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          });

          if (retryResponse.ok) {
            await fetchData();
            const statusLabels: {[key: string]: string} = {
              'TODO': 'Por Hacer',
              'DOING': 'En Progreso',
              'DONE': 'Completada'
            };
            alert(`✅ Tarea movida a: ${statusLabels[newStatus]}`);
            return;
          }
        } else {
          alert('❌ Tu sesión ha expirado. Por favor vuelve a iniciar sesión.');
          router.push('/login');
          return;
        }
      }

      if (response.ok) {
        await fetchData();
        
        // Mostrar mensaje de éxito
        const statusLabels: {[key: string]: string} = {
          'TODO': 'Por Hacer',
          'DOING': 'En Progreso',
          'DONE': 'Completada'
        };
        alert(`✅ Tarea movida a: ${statusLabels[newStatus]}`);
      } else {
        const errorData = await response.json();
        alert(`❌ Error al actualizar tarea: ${errorData.detail || errorData.error || 'Error desconocido'}`);
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`❌ Error al actualizar tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_at: task.due_at || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editFormData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/tasks/${editingTask.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          priority: editFormData.priority,
          assigned_to: editFormData.assigned_to || null,
          due_at: editFormData.due_at || null,
        }),
      });

      if (response.status === 401) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          const newToken = useAuth.getState().access_token;
          const retryResponse = await fetch(`${apiUrl}/projects/tasks/${editingTask.id}/`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: editFormData.title,
              description: editFormData.description,
              priority: editFormData.priority,
              assigned_to: editFormData.assigned_to || null,
              due_at: editFormData.due_at || null,
            }),
          });

          if (retryResponse.ok) {
            setShowEditModal(false);
            setEditingTask(null);
            fetchData();
            alert('✅ Tarea actualizada exitosamente');
            return;
          }
        } else {
          alert('❌ Tu sesión ha expirado. Por favor vuelve a iniciar sesión.');
          router.push('/login');
          return;
        }
      }

      if (response.ok) {
        setShowEditModal(false);
        setEditingTask(null);
        fetchData();
        alert('✅ Tarea actualizada exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || 'No se pudo actualizar la tarea'}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/projects/tasks/${taskId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          const newToken = useAuth.getState().access_token;
          const retryResponse = await fetch(`${apiUrl}/projects/tasks/${taskId}/`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (retryResponse.ok || retryResponse.status === 204) {
            fetchData();
            alert('✅ Tarea eliminada exitosamente');
            return;
          }
        } else {
          alert('❌ Tu sesión ha expirado. Por favor vuelve a iniciar sesión.');
          router.push('/login');
          return;
        }
      }

      if (response.ok || response.status === 204) {
        fetchData();
        alert('✅ Tarea eliminada exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || 'No se pudo eliminar la tarea'}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea');
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels: {[key: number]: string} = {
      1: '🟢 Baja',
      2: '🟡 Media',
      3: '🔴 Alta',
    };
    return labels[priority] || 'Desconocida';
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 flex-1">{task.title}</h4>
        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      <div className="text-xs text-gray-500 mb-3 space-y-1">
        {task.project_name && <p>📁 {task.project_name}</p>}
        {task.assigned_name && <p>👤 {task.assigned_name}</p>}
      </div>
      
      <div className="flex gap-2 mb-2">
        {task.status !== 'TODO' && (
          <Button
            variant="secondary"
            className="text-xs py-1 px-2 flex-1"
            onClick={() => handleStatusChange(task.id, 'TODO')}
          >
            ↩️ Por Hacer
          </Button>
        )}
        {task.status !== 'DOING' && (
          <Button
            variant="primary"
            className="text-xs py-1 px-2 flex-1"
            onClick={() => handleStatusChange(task.id, 'DOING')}
          >
            ⏳ En Progreso
          </Button>
        )}
        {task.status !== 'DONE' && (
          <Button
            variant="primary"
            className="text-xs py-1 px-2 flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleStatusChange(task.id, 'DONE')}
          >
            ✅ Completada
          </Button>
        )}
      </div>

      {user?.id === task.created_by && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="text-xs py-1 px-3 flex-1"
            onClick={() => handleEditTask(task)}
          >
            ✏️ Editar
          </Button>
          <Button
            variant="secondary"
            className="text-xs py-1 px-3 flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleDeleteTask(task.id)}
          >
            🗑️ Eliminar
          </Button>
        </div>
      )}
    </div>
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tablero...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">🎯 Tablero Kanban</h1>
            <p className="text-gray-500 mt-2">Gestiona el progreso de tus tareas de forma visual.</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            ➕ Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Project Filter */}
      {projects.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">📁 Filtrar por proyecto:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* TODO Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 Por Hacer</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
              {todoTasks.length}
            </span>
          </div>
          <div className="space-y-3 min-h-96 bg-blue-50 rounded-lg p-4">
            {todoTasks.length > 0 ? (
              todoTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">📭 Sin tareas</p>
              </div>
            )}
          </div>
        </div>

        {/* DOING Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">⏳ En Progreso</h2>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
              {doingTasks.length}
            </span>
          </div>
          <div className="space-y-3 min-h-96 bg-yellow-50 rounded-lg p-4">
            {doingTasks.length > 0 ? (
              doingTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">📭 Sin tareas</p>
              </div>
            )}
          </div>
        </div>

        {/* DONE Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">✅ Completadas</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
              {doneTasks.length}
            </span>
          </div>
          <div className="space-y-3 min-h-96 bg-green-50 rounded-lg p-4">
            {doneTasks.length > 0 ? (
              doneTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">📭 Sin tareas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total de Tareas</p>
            <p className="text-3xl font-bold text-gray-900">{filteredTasks.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Progreso</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredTasks.length > 0 ? Math.round((doneTasks.length / filteredTasks.length) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Tareas Críticas</p>
            <p className="text-3xl font-bold text-red-600">
              {filteredTasks.filter(t => t.priority === 3 && t.status !== 'DONE').length}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Tiempo Promedio</p>
            <p className="text-lg font-bold text-gray-900">~3 días</p>
          </div>
        </div>
      </Card>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">➕ Nueva Tarea</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ej: Implementar login"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) as 1 | 2 | 3})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>🟢 Baja</option>
                  <option value={2}>🟡 Media</option>
                  <option value={3}>🔴 Alta</option>
                </select>
              </div>

              {projects.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proyecto</label>
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateTask}
                className="flex-1"
              >
                Crear Tarea
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">✏️ Editar Tarea</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  placeholder="Título de la tarea"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({...editFormData, priority: parseInt(e.target.value) as 1 | 2 | 3})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>🟢 Baja</option>
                  <option value={2}>🟡 Media</option>
                  <option value={3}>🔴 Alta</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                className="flex-1"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default KanbanBoard;
