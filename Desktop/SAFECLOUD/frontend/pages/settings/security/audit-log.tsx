import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuditLogList } from '@/components/AuditLogList';

export default function AuditLogPage() {
  const router = useRouter();
  const { events, totalCount, loading, error, currentPage, pageSize, fetchEvents, fetchActionTypes, exportEvents, clearError } = useAuditLog();
  const [actionTypes, setActionTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Cargar tipos de acciones y eventos iniciales
  useEffect(() => {
    const loadData = async () => {
      await fetchActionTypes().then((types) => {
        if (types) setActionTypes(types);
      });
      await fetchEvents(1, { action: selectedAction || undefined, search: searchQuery || undefined });
    };
    loadData();
  }, []);

  // Manejar cambios de filtro
  const handleFilterChange = async (newAction: string = selectedAction, newSearch: string = searchQuery) => {
    setSelectedAction(newAction);
    setSearchQuery(newSearch);
    await fetchEvents(1, { action: newAction || undefined, search: newSearch || undefined });
  };

  // Manejar cambio de página
  const handlePageChange = async (page: number) => {
    await fetchEvents(page, { action: selectedAction || undefined, search: searchQuery || undefined });
  };

  // Manejar cambio de tamaño de página
  const handlePageSizeChange = async (size: number) => {
    await fetchEvents(1, { action: selectedAction || undefined, search: searchQuery || undefined });
  };

  // Exportar eventos
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      await exportEvents(format);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="CLIENT_ADMIN">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">📋 Registro de Auditoría</h1>
            <p className="text-gray-600 mt-1">Historial completo de actividades de seguridad y cambios del sistema</p>
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Buscar evento</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFilterChange(selectedAction, e.currentTarget.value);
                    }
                  }}
                  placeholder="Usuario, IP, entidad..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtro por acción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Filtrar por acción</label>
                <select
                  value={selectedAction}
                  onChange={(e) => handleFilterChange(e.target.value, searchQuery)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las acciones</option>
                  {actionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de acción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📥 Descargar</label>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={events.length === 0 || exporting}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {exporting ? '⏳ Descargando...' : '📥 Exportar'}
                  </button>

                  {/* Menú desplegable de exportación */}
                  {showExportMenu && !exporting && (
                    <div className="absolute right-0 mt-2 w-full bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-200 font-semibold text-gray-700"
                      >
                        📊 Exportar como CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 font-semibold text-gray-700"
                      >
                        {'{}'} Exportar como JSON
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de búsqueda */}
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange(selectedAction, searchQuery)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                🔎 Buscar
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedAction('');
                  handleFilterChange('', '');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                ↺ Limpiar filtros
              </button>
            </div>
          </div>

          {/* Errores */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error al cargar eventos</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => clearError()}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Estadísticas de filtrado */}
          {(selectedAction || searchQuery) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-blue-900 font-semibold">
                  📊 Mostrando {events.length} de {totalCount} eventos
                </p>
                {selectedAction && <p className="text-blue-700 text-sm">Acción: {selectedAction}</p>}
                {searchQuery && <p className="text-blue-700 text-sm">Búsqueda: "{searchQuery}"</p>}
              </div>
              <button
                onClick={() => {
                  setSelectedAction('');
                  setSearchQuery('');
                  handleFilterChange('', '');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Lista de eventos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <AuditLogList
              events={events}
              loading={loading}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>

          {/* Tabla de referencia rápida */}
          {events.length > 0 && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">📚 Guía de iconos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔓</span>
                  <span className="text-gray-600">Login</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  <span className="text-gray-600">Logout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <span className="text-gray-600">Seguridad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">➕</span>
                  <span className="text-gray-600">Crear</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  <span className="text-gray-600">Editar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗑️</span>
                  <span className="text-gray-600">Eliminar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⬇️</span>
                  <span className="text-gray-600">Descargar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  <span className="text-gray-600">Permisos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
