import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface AuditEvent {
  id: string;
  action: string;
  action_display: string;
  entity: string;
  entity_id: string;
  ip: string;
  user_agent: string;
  status: string;
  data: Record<string, any>;
  created_at: string;
  actor_user: {
    id: string;
    email: string;
    name: string;
  };
}

interface AuditEventsResponse {
  results: AuditEvent[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const useAuditLog = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Obtener eventos de auditoría
  const fetchEvents = useCallback(
    async (page: number = 1, filters?: { action?: string; entity?: string; search?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {
          page,
          page_size: pageSize,
          ordering: '-created_at',
        };

        if (filters?.action) params.action = filters.action;
        if (filters?.entity) params.entity = filters.entity;
        if (filters?.search) params.search = filters.search;

        const response = await api.get<AuditEventsResponse>('/audit/logs/', { params });

        setEvents(response.data.results || []);
        setTotalCount(response.data.count || 0);
        setCurrentPage(page);
      } catch (err: any) {
        const message = err.response?.data?.error || 'Error al obtener eventos de auditoría';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Obtener tipos de acciones disponibles
  const fetchActionTypes = useCallback(async () => {
    try {
      const response = await api.get<{ types: Record<string, string> }>('/audit/action-types/');
      return Object.entries(response.data.types).map(([key, label]) => ({
        value: key,
        label: label,
      }));
    } catch (err) {
      console.error('Error fetching action types:', err);
      return [];
    }
  }, []);

  // Exportar eventos
  const exportEvents = useCallback(async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/audit/logs/export/`, {
        params: { format },
        responseType:format === 'csv' ? 'blob' : 'json',
      });

      // Crear descarga
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Error al exportar eventos');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    events,
    totalCount,
    loading,
    error,
    currentPage,
    pageSize,
    setPageSize,
    fetchEvents,
    fetchActionTypes,
    exportEvents,
    clearError,
  };
};
