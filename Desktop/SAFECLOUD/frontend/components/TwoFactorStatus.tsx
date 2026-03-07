import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use2FA } from '@/hooks/use2FA';

export const TwoFactorStatus = () => {
  const { loading, error, getStatus, disable, regenerateCodes } = use2FA();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [disableLoading, setDisableLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Obtener estado 2FA
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getStatus();
        setTwoFAEnabled(status.two_factor_enabled || false);
      } catch (err) {
        // Silenciar error, solo mostrar como deshabilitado
        setTwoFAEnabled(false);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [getStatus]);

  // Deshabilitar 2FA
  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword.trim()) {
      return;
    }

    setDisableLoading(true);
    try {
      await disable(disablePassword);
      setTwoFAEnabled(false);
      setDisablePassword('');
      setShowDisableForm(false);
      setSuccessMessage('2FA ha sido deshabilitado');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      // Error ya manejado en el hook
    } finally {
      setDisableLoading(false);
    }
  };

  // Regenerar códigos
  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regeneratePassword.trim()) {
      return;
    }

    setRegenerateLoading(true);
    try {
      const response = await regenerateCodes(regeneratePassword);
      setRegeneratePassword('');
      setShowRegenerateForm(false);
      setSuccessMessage('Códigos de respaldo regenerados');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      // Error ya manejado en el hook
    } finally {
      setRegenerateLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <div className={`rounded-lg border-2 p-6 ${
        twoFAEnabled
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Autenticación de Dos Factores
            </h3>
            <p className={`text-sm mt-1 ${
              twoFAEnabled ? 'text-green-700' : 'text-gray-600'
            }`}>
              {twoFAEnabled ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                  Habilitado
                </span>
              ) : (
                'No está configurado'
              )}
            </p>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            twoFAEnabled
              ? 'bg-green-200 text-green-800'
              : 'bg-gray-200 text-gray-800'
          }`}>
            {twoFAEnabled ? '✓ Activo' : 'Inactivo'}
          </div>
        </div>

        {!twoFAEnabled && (
          <p className="text-gray-600 text-sm mb-4">
            Protege tu cuenta añadiendo una capa extra de seguridad con autenticación de dos factores.
            Necesitarás una aplicación autenticadora en tu teléfono para iniciar sesión.
          </p>
        )}

        {twoFAEnabled && (
          <p className="text-green-700 text-sm mb-4">
            Tu cuenta está protegida. Se requiere un código adicional para iniciar sesión.
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        {!twoFAEnabled ? (
          <Link
            href="/settings/security/2fa-setup"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            Configurar Autenticación 2FA
          </Link>
        ) : (
          <>
            <button
              onClick={() => setShowRegenerateForm(!showRegenerateForm)}
              className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
            >
              Regenerar Códigos de Respaldo
            </button>
            <button
              onClick={() => setShowDisableForm(!showDisableForm)}
              className="w-full bg-red-100 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              Deshabilitar 2FA
            </button>
          </>
        )}
      </div>

      {/* Formulario deshabilitar */}
      {showDisableForm && twoFAEnabled && (
        <form onSubmit={handleDisable} className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Para deshabilitar 2FA, ingresa tu contraseña:
          </p>
          <input
            type="password"
            placeholder="Tu contraseña"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={disableLoading}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={disableLoading || !disablePassword.trim()}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
            >
              {disableLoading ? 'Deshabilitando...' : 'Deshabilitar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisableForm(false);
                setDisablePassword('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Formulario regenerar */}
      {showRegenerateForm && twoFAEnabled && (
        <form onSubmit={handleRegenerate} className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Para regenerar códigos de respaldo, ingresa tu contraseña:
          </p>
          <input
            type="password"
            placeholder="Tu contraseña"
            value={regeneratePassword}
            onChange={(e) => setRegeneratePassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={regenerateLoading}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={regenerateLoading || !regeneratePassword.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {regenerateLoading ? 'Regenerando...' : 'Regenerar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRegenerateForm(false);
                setRegeneratePassword('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">✓ {successMessage}</p>
        </div>
      )}
    </div>
  );
};
