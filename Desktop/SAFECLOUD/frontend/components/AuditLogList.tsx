import { AuditEvent } from '@/hooks/useAuditLog';

interface AuditLogListProps {
  events: AuditEvent[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const AuditLogList = ({
  events,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AuditLogListProps) => {
  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return '🔓';
    if (action.includes('LOGOUT')) return '🔐';
    if (action.includes('PASSWORD') || action.includes('2FA')) return '🔑';
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('DOWNLOAD') || action.includes('EXPORT')) return '⬇️';
    if (action.includes('SHARE') || action.includes('PERMISSION')) return '👥';
    if (action.includes('ACCESS') || action.includes('VIEW')) return '👁️';
    return '📋';
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'text-green-600 bg-green-50';
    if (action.includes('LOGOUT')) return 'text-gray-600 bg-gray-50';
    if (action.includes('PASSWORD') || action.includes('2FA') || action.includes('DELETE'))
      return 'text-red-600 bg-red-50';
    if (action.includes('CREATE') || action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
    if (action.includes('DOWNLOAD') || action.includes('EXPORT')) return 'text-purple-600 bg-purple-50';
    if (action.includes('SHARE') || action.includes('PERMISSION')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatIP = (ip: string) => {
    if (!ip) return 'Desconocida';
    return ip.split(',')[0].trim();
  };

  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return 'Desconocido';
    if (userAgent.includes('Chrome')) return '🌐 Chrome';
    if (userAgent.includes('Firefox')) return '🔥 Firefox';
    if (userAgent.includes('Safari')) return '🧭 Safari';
    if (userAgent.includes('Edge')) return '📘 Edge';
    return '🌐 Navegador';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay eventos de auditoría</h3>
        <p className="text-gray-600">No hay registros que coincidan con tus filtros</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de eventos */}
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* Icono de acción */}
              <div className={`text-2xl flex-shrink-0 mt-1 p-2 rounded-lg ${getActionColor(event.action)}`}>
                {getActionIcon(event.action)}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{event.action_display}</h3>

                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      {/* Usuario */}
                      <div>
                        <p className="text-gray-600">
                          <span className="font-semibold">Por:</span> {event.actor_user.name}
                        </p>
                        <p className="text-gray-500 text-xs">{event.actor_user.email}</p>
                      </div>

                      {/* Entidad */}
                      {event.entity && (
                        <div>
                          <p className="text-gray-600">
                            <span className="font-semibold">Entidad:</span> {event.entity}
                          </p>
                          {event.entity_id && <p className="text-gray-500 text-xs">ID: {event.entity_id}</p>}
                        </div>
                      )}

                      {/* IP y Navegador */}
                      <div>
                        <p className="text-gray-600">
                          <span className="font-semibold">IP:</span> {formatIP(event.ip)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-600">{getBrowserInfo(event.user_agent)}</p>
                      </div>
                    </div>

                    {/* Detalles adicionales */}
                    {event.data && Object.keys(event.data).length > 0 && (
                      <details className="mt-3 cursor-pointer">
                        <summary className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                          Ver detalles
                        </summary>
                        <div className="mt-2 pl-4 border-l-2 border-gray-300 space-y-1 text-xs text-gray-600">
                          {Object.entries(event.data).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-semibold min-w-fit">{key}:</span>
                              <span className="text-gray-700 break-all">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Fecha */}
                    <p className="text-xs text-gray-500 mt-3">{formatDate(event.created_at)}</p>
                  </div>

                  {/* Badge de estado */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        event.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.status === 'success' ? '✓ Exitoso' : event.status === 'error' ? '✗ Error' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Elementos por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage > totalPages - 2 ? totalPages - 4 + i : Math.max(1, currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} ({totalCount} eventos)
          </div>
        </div>
      )}
    </div>
  );
};
