import { useState } from 'react';

interface NotificationPreferencesProps {
  onUpdate: (preferences: any) => void;
  loading: boolean;
  onReset: () => void;
}

export const NotificationPreferences = ({ onUpdate, loading, onReset }: NotificationPreferencesProps) => {
  const [emailTickets, setEmailTickets] = useState(true);
  const [emailDocuments, setEmailDocuments] = useState(true);
  const [emailProjects, setEmailProjects] = useState(true);
  const [emailComments, setEmailComments] = useState(true);
  const [emailSecurity, setEmailSecurity] = useState(true);
  const [emailSystem, setEmailSystem] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('IMMEDIATE');
  const [showInDashboard, setShowInDashboard] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await onUpdate({
        email_tickets: emailTickets,
        email_documents: emailDocuments,
        email_projects: emailProjects,
        email_comments: emailComments,
        email_security: emailSecurity,
        email_system: emailSystem,
        digest_frequency: digestFrequency,
        show_in_dashboard: showInDashboard,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      // Error manejado por el componente padre
    }
  };

  const togglePreference = (setter: any, currentValue: boolean) => {
    setter(!currentValue);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferencias de Notificaciones</h3>
        <p className="text-gray-600 text-sm">
          Controla cómo y cuándo recibir notificaciones por correo electrónico
        </p>
      </div>

      {/* Notificaciones por Email */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Notificaciones por Email</h4>

        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={emailTickets}
            onChange={() => togglePreference(setEmailTickets, emailTickets)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">🎫 Notificaciones de Tickets</p>
            <p className="text-sm text-gray-600">Recibe alertas cuando se crean o actualizan tickets</p>
          </div>
        </label>

        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={emailDocuments}
            onChange={() => togglePreference(setEmailDocuments, emailDocuments)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">📄 Notificaciones de Documentos</p>
            <p className="text-sm text-gray-600">Recibe alertas sobre cambios en documentos compartidos</p>
          </div>
        </label>

        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={emailProjects}
            onChange={() => togglePreference(setEmailProjects, emailProjects)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">📊 Notificaciones de Proyectos</p>
            <p className="text-sm text-gray-600">Recibe actualizaciones sobre tus proyectos</p>
          </div>
        </label>

        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={emailComments}
            onChange={() => togglePreference(setEmailComments, emailComments)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">💬 Notificaciones de Comentarios</p>
            <p className="text-sm text-gray-600">Recibe alertas cuando alguien comenta en tus items</p>
          </div>
        </label>

        <label className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100">
          <input
            type="checkbox"
            checked={emailSecurity}
            onChange={() => togglePreference(setEmailSecurity, emailSecurity)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">🔐 Alertas de Seguridad</p>
            <p className="text-sm text-gray-600">Recibe notificaciones sobre cambios de seguridad y 2FA</p>
          </div>
        </label>

        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={emailSystem}
            onChange={() => togglePreference(setEmailSystem, emailSystem)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">⚙️ Anuncios del Sistema</p>
            <p className="text-sm text-gray-600">Recibe actualizaciones sobre mantenimiento y nuevas funciones</p>
          </div>
        </label>
      </div>

      {/* Frecuencia de Resumen */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Frecuencia de Resumen</h4>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="digest"
              value="IMMEDIATE"
              checked={digestFrequency === 'IMMEDIATE'}
              onChange={(e) => setDigestFrequency(e.target.value)}
              className="w-4 h-4"
              disabled={loading}
            />
            <div>
              <p className="font-semibold text-gray-900">Inmediata</p>
              <p className="text-xs text-gray-600">Recibe notificaciones al instante</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="digest"
              value="HOURLY"
              checked={digestFrequency === 'HOURLY'}
              onChange={(e) => setDigestFrequency(e.target.value)}
              className="w-4 h-4"
              disabled={loading}
            />
            <div>
              <p className="font-semibold text-gray-900">Cada Hora</p>
              <p className="text-xs text-gray-600">Recibe un resumen cada hora</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="digest"
              value="DAILY"
              checked={digestFrequency === 'DAILY'}
              onChange={(e) => setDigestFrequency(e.target.value)}
              className="w-4 h-4"
              disabled={loading}
            />
            <div>
              <p className="font-semibold text-gray-900">Diaria</p>
              <p className="text-xs text-gray-600">Recibe un resumen diario</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="digest"
              value="WEEKLY"
              checked={digestFrequency === 'WEEKLY'}
              onChange={(e) => setDigestFrequency(e.target.value)}
              className="w-4 h-4"
              disabled={loading}
            />
            <div>
              <p className="font-semibold text-gray-900">Semanal</p>
              <p className="text-xs text-gray-600">Recibe un resumen semanal</p>
            </div>
          </label>
        </div>
      </div>

      {/* Centro de Notificaciones */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Centro de Notificaciones</h4>

        <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={showInDashboard}
            onChange={() => togglePreference(setShowInDashboard, showInDashboard)}
            className="w-5 h-5 rounded"
            disabled={loading}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Mostrar en Dashboard</p>
            <p className="text-sm text-gray-600">Muestra un widget con tus notificaciones recientes en el dashboard</p>
          </div>
        </label>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
        <button
          onClick={onReset}
          disabled={loading}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
        >
          Reiniciar Valores por Defecto
        </button>
      </div>

      {/* Mensaje de éxito */}
      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">✓ Preferencias guardadas exitosamente</p>
        </div>
      )}
    </div>
  );
};
