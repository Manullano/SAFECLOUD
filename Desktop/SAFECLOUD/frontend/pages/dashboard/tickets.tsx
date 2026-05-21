import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

const TicketsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { canCreate, canEdit } = useCanAccess();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', assigned_to: '' });
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    fetchTickets();
  }, [user, authLoading, access_token]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(Array.isArray(data.results) ? data.results : data);
      }
    } catch (err) {
      console.error('Error al obtener tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      setStaffLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const url = `${apiUrl}/companies/users/staff/`;
      
      console.log(`[DEBUG] Obteniendo usuarios STAFF desde: ${url}`);
      console.log(`[DEBUG] Autorización: Bearer ${access_token?.substring(0, 20)}...`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[DEBUG] Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[DEBUG] Response data:`, data);
        
        const staff = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
        console.log(`[DEBUG] Parsed staff users (${staff.length}):`, staff);
        
        if (staff.length === 0) {
          console.warn('[WARN] No staff users found!');
        }
        
        setStaffUsers(staff);
      } else {
        const errorData = await response.json();
        console.error(`[ERROR] Status ${response.status}:`, errorData);
        setStaffUsers([]);
      }
    } catch (err) {
      console.error('[ERROR] fetchStaffUsers exception:', err);
      setStaffUsers([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!formData.title.trim()) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: 'OPEN',
          company_id: user?.company_id,
          assigned_to: formData.assigned_to || null,
        }),
      });

      if (response.ok) {
        setFormData({ title: '', description: '', priority: 'MEDIUM', assigned_to: '' });
        setShowForm(false);
        fetchTickets();
        alert('✅ Ticket creado exitosamente');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        console.error('Error creating ticket:', errorData);
        alert(`❌ Error al crear el ticket: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(`❌ Error al crear el ticket: ${error}`);
    }
  };

  const handleEditTicket = async (ticketId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingData.title,
          description: editingData.description,
          priority: editingData.priority,
          status: editingData.status,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingData({ title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
        fetchTickets();
        alert('✅ Ticket actualizado exitosamente');
      } else {
        alert('Error al actualizar el ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketTitle: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${ticketTitle}"?`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/tickets/tickets/${ticketId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (response.ok) {
        fetchTickets();
        alert('✅ Ticket eliminado exitosamente');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.detail || 'Error al eliminar el ticket';
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert(`❌ Error al eliminar el ticket: ${error}`);
    }
  };

  const isTicketCreator = (ticket: any) => {
    return ticket.created_by === user?.id || ticket.created_by?.id === user?.id;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'LOW': 'Baja',
      'MEDIUM': 'Media',
      'HIGH': 'Alta',
      'CRITICAL': 'Crítica',
    };
    return priorityMap[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'OPEN': 'Abierto',
      'IN_PROGRESS': 'En Progreso',
      'WAITING_CUSTOMER': 'Esperando Cliente',
      'RESOLVED': 'Resuelto',
      'CLOSED': 'Cerrado',
    };
    return statusMap[status] || status;
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tickets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Tickets de Soporte</h1>
            <p className="text-gray-500 mt-2">Gestiona tus solicitudes de soporte</p>
          </div>
          {canCreate('TICKETS') && (
            <Button
              variant="primary"
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  // Cargar usuarios STAFF cuando se abre el formulario
                  fetchStaffUsers();
                }
              }}
            >
              + Nuevo Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Crear Nuevo Ticket</h2>
          
          {/* DEBUG INFO */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-600 border border-gray-300">
            <div>🔍 DEBUG: staffUsers.length = {staffUsers.length}</div>
            <div>🔍 DEBUG: staffLoading = {staffLoading ? 'true' : 'false'}</div>
            <div>🔍 DEBUG: user?.id = {user?.id}</div>
            <div>🔍 DEBUG: user?.company_id = {user?.company_id}</div>
            {staffUsers.length > 0 && (
              <div className="mt-2">
                ✅ Staff cargados:
                <ul className="ml-4">
                  {staffUsers.map((s: any) => (
                    <li key={s.id}>{s.full_name} ({s.role})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Título del ticket"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <textarea
              placeholder="Descripción"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              disabled={staffLoading}
            >
              {staffLoading ? (
                <option>Cargando usuarios...</option>
              ) : staffUsers && staffUsers.length > 0 ? (
                <>
                  <option value="">Asignar a (opcional)</option>
                  {staffUsers.map((staff: any) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name} ({staff.role === 'STAFF_PM' ? 'PM' : 'Soporte'})
                    </option>
                  ))}
                </>
              ) : (
                <option>No hay usuarios disponibles</option>
              )}
            </select>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreateTicket}>
                Crear
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', description: '', priority: 'MEDIUM', assigned_to: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket: any) => (
            <Card key={ticket.id} hoverable>
              {editingId === ticket.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Título"
                    value={editingData.title}
                    onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    placeholder="Descripción"
                    value={editingData.description}
                    onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editingData.priority}
                      onChange={(e) => setEditingData({ ...editingData, priority: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="LOW">Prioridad Baja</option>
                      <option value="MEDIUM">Prioridad Media</option>
                      <option value="HIGH">Prioridad Alta</option>
                      <option value="CRITICAL">Prioridad Crítica</option>
                    </select>
                    <select
                      value={editingData.status}
                      onChange={(e) => setEditingData({ ...editingData, status: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="OPEN">Abierto</option>
                      <option value="IN_PROGRESS">En Progreso</option>
                      <option value="WAITING_CUSTOMER">Esperando Cliente</option>
                      <option value="RESOLVED">Resuelto</option>
                      <option value="CLOSED">Cerrado</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1 text-sm"
                      onClick={() => handleEditTicket(ticket.id)}
                    >
                      💾 Guardar
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditingData({ title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
                      }}
                    >
                      ✕ Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">{ticket.description}</p>
                      <div className="mt-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : ticket.status === 'RESOLVED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                        {ticket.assigned_user && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            👤 {ticket.assigned_user.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {canEdit('TICKETS') && (
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm"
                        onClick={() => {
                          setEditingId(ticket.id);
                          setEditingData({
                            title: ticket.title,
                            description: ticket.description,
                            priority: ticket.priority,
                            status: ticket.status,
                          });
                        }}
                      >
                        ✏️ Editar
                      </Button>
                    )}
                    {isTicketCreator(ticket) && (
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm bg-red-100 text-red-700 hover:bg-red-200"
                        onClick={() => handleDeleteTicket(ticket.id, ticket.title)}
                      >
                        🗑️ Eliminar
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">No hay tickets disponibles.</p>
            <p className="text-gray-400 text-sm mb-6">Crea tu primer ticket para solicitar asistencia técnica.</p>
            {canCreate('TICKETS') && (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                🎫 Crear Mi Primer Ticket
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TicketsPage;
