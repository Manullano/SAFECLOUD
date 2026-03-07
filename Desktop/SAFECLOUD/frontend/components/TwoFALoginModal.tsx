import { useState, useRef, useEffect } from 'react';

interface TwoFALoginModalProps {
  isOpen: boolean;
  onVerify: (token: string, useBackupCode: boolean) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  email: string;
}

export const TwoFALoginModal: React.FC<TwoFALoginModalProps> = ({
  isOpen,
  onVerify,
  onCancel,
  loading,
  error,
  email,
}) => {
  const [totpToken, setTotpToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCodeInfo, setShowBackupCodeInfo] = useState(false);
  const totpInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen && !useBackupCode) {
      totpInputRef.current?.focus();
    } else if (isOpen && useBackupCode) {
      backupInputRef.current?.focus();
    }
  }, [isOpen, useBackupCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = useBackupCode ? backupCode.replace(/\s/g, '') : totpToken;

    if (!token.trim()) {
      return;
    }

    try {
      await onVerify(token, useBackupCode);
      // Limpiar al éxito
      setTotpToken('');
      setBackupCode('');
    } catch (err) {
      // Error ya manejado en el componente padre
      if (!useBackupCode) {
        setTotpToken('');
        totpInputRef.current?.focus();
      } else {
        setBackupCode('');
        backupInputRef.current?.focus();
      }
    }
  };

  const handleSwitchMode = () => {
    setUseBackupCode(!useBackupCode);
    setTotpToken('');
    setBackupCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Verificación en Dos Pasos</h2>
            <p className="text-blue-100 text-sm mt-1">
              Ingresa el código de tu aplicación autenticadora
            </p>
          </div>

          {/* Contenido */}
          <div className="px-6 py-6 space-y-6">
            {/* Email */}
            <div className="text-center text-sm text-gray-600">
              <span className="text-gray-900 font-medium">{email}</span>
            </div>

            {/* Tab TOTP/Backup */}
            <div className="flex gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => !useBackupCode && handleSwitchMode()}
                className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-all ${
                  !useBackupCode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Código de App
              </button>
              <button
                type="button"
                onClick={() => useBackupCode && handleSwitchMode()}
                className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-all ${
                  useBackupCode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Código de Respaldo
              </button>
            </div>

            {/* Información */}
            {!useBackupCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-900">
                  Abre tu aplicación autenticadora e ingresa el código de 6 dígitos
                </p>
              </div>
            )}

            {useBackupCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="text-amber-900">
                  Ingresa uno de tus códigos de respaldo de 8 caracteres
                </p>
              </div>
            )}

            {/* Input TOTP */}
            {!useBackupCode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  ref={totpInputRef}
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={totpToken}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setTotpToken(value);
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 text-center text-3xl tracking-widest font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-100"
                  autoComplete="off"
                />
              </div>
            )}

            {/* Input Backup Code */}
            {useBackupCode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Respaldo
                </label>
                <input
                  ref={backupInputRef}
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={backupCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setBackupCode(value);
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-100"
                  autoComplete="off"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">❌ {error}</p>
              </div>
            )}

            {/* Info Backup Codes */}
            {!useBackupCode && (
              <button
                type="button"
                onClick={() => setShowBackupCodeInfo(!showBackupCodeInfo)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showBackupCodeInfo ? '✓' : '?'} ¿Perdiste acceso a tu app autenticadora?
              </button>
            )}

            {showBackupCodeInfo && !useBackupCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-2">Códigos de Respaldo</p>
                <p>
                  Si no tienes acceso a tu aplicación autenticadora, puedes usar uno de tus códigos de
                  respaldo para iniciar sesión. Cada código solo se puede usar una vez.
                </p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (!useBackupCode && totpToken.length !== 6) ||
                (useBackupCode && backupCode.replace(/\s/g, '').length !== 8)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
