import { useState } from 'react';
import api from '@/lib/api';

interface TwoFAVerificationProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

export const TwoFAVerification = ({ onSuccess, onCancel }: TwoFAVerificationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Verificar código TOTP
  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totpCode.trim()) {
      setError('Ingresa un código de 6 dígitos');
      return;
    }

    if (totpCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/2fa/verify-login/', {
        token: totpCode,
      });

      setSuccessMessage('Verificación exitosa');
      setTimeout(() => {
        onSuccess(response.data.access);
      }, 500);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Código inválido. Intenta de nuevo.';
      setError(message);
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  };

  // Verificar código de respaldo
  const handleVerifyBackup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!backupCode.trim()) {
      setError('Ingresa un código de respaldo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/2fa/verify-login/', {
        backup_code: backupCode.replace(/\s/g, ''),
      });

      setSuccessMessage('Código de respaldo verificado');
      setTimeout(() => {
        onSuccess(response.data.access);
      }, 500);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Código de respaldo inválido.';
      setError(message);
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificación de Dos Factores</h2>
        <p className="text-gray-600">
          Ingresa el código de tu aplicación autenticadora para continuar
        </p>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm flex items-center gap-2">
            <span>✓</span>{successMessage}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs - Código TOTP vs Respaldo */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setUseBackup(false);
            setError(null);
            setTotpCode('');
            setBackupCode('');
          }}
          className={`pb-3 font-semibold transition-colors ${
            !useBackup
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Código Autenticador
        </button>
        <button
          onClick={() => {
            setUseBackup(true);
            setError(null);
            setTotpCode('');
            setBackupCode('');
          }}
          className={`pb-3 font-semibold transition-colors ${
            useBackup
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Código de Respaldo
        </button>
      </div>

      {/* Formulario TOTP */}
      {!useBackup && (
        <form onSubmit={handleVerifyTOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setTotpCode(value);
                setError(null);
              }}
              className="w-full px-4 py-3 text-center text-3xl tracking-widest border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Abre tu aplicación autenticadora y busca el código de 6 dígitos
            </p>
          </div>

          <button
            type="submit"
            disabled={totpCode.length !== 6 || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      )}

      {/* Formulario Código de Respaldo */}
      {useBackup && (
        <form onSubmit={handleVerifyBackup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Código de Respaldo
            </label>
            <textarea
              placeholder="Ej: XXXX-XXXX-XXXX"
              value={backupCode}
              onChange={(e) => {
                setBackupCode(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-2">
              Usa uno de tus códigos de respaldo si no tienes acceso a tu autenticador
            </p>
          </div>

          <button
            type="submit"
            disabled={!backupCode.trim() || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Verificando...' : 'Usar Código de Respaldo'}
          </button>
        </form>
      )}

      {/* Enlace para cancelar */}
      <div className="text-center pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900 text-sm font-semibold"
        >
          ← Volver
        </button>
      </div>
    </div>
  );
};
