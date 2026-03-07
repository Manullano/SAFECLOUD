import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { use2FA } from '@/hooks/use2FA';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type SetupStep = 'initial' | 'qr' | 'verify' | 'backup' | 'complete';

export default function TwoFASetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { loading, error, qrCode, secret, backupCodes, generateSetup, verifySetup } = use2FA();

  const [step, setStep] = useState<SetupStep>('initial');
  const [totpToken, setTotpToken] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Generar QR al cargar
  const handleGenerateQR = async () => {
    try {
      setVerifyError(null);
      await generateSetup();
      setStep('qr');
    } catch (err) {
      setVerifyError('Error al generar código QR');
    }
  };

  // Verificar TOTP
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpToken.trim()) {
      setVerifyError('Ingresa el código de 6 dígitos');
      return;
    }

    try {
      setVerifyError(null);
      await verifySetup(totpToken);
      setStep('backup');
    } catch (err) {
      setVerifyError('Código inválido. Verifica e intenta de nuevo.');
      setTotpToken('');
    }
  };

  // Copiar códigos de respaldo
  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  // Marcar como completado
  const handleComplete = () => {
    setStep('complete');
    // Redirigir después de 3 segundos
    setTimeout(() => {
      router.push('/settings/security');
    }, 3000);
  };

  return (
    <ProtectedRoute requiredRole="CLIENT_ADMIN">
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Encabezado */}
          <div className="mb-8">
            <Link
              href="/settings/security"
              className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
            >
              ← Volver a Seguridad
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configurar Autenticación de Dos Factores
            </h1>
            <p className="text-gray-600">
              Protege tu cuenta con una capa adicional de seguridad
            </p>
          </div>

          {/* Progreso */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 'initial' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
                }`}
              >
                1
              </div>
              <div className={`h-1 flex-1 ${step !== 'initial' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ['qr', 'verify', 'backup', 'complete'].includes(step)
                    ? step === 'complete'
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                2
              </div>
              <div
                className={`h-1 flex-1 ${['backup', 'complete'].includes(step) ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ['backup', 'complete'].includes(step)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                3
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Preparación</span>
              <span>Verificación</span>
              <span>Códigos de Respaldo</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Paso 1: Inicial */}
            {step === 'initial' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">¿Qué es 2FA?</h3>
                  <p className="text-sm text-blue-800">
                    La autenticación de dos factores añade una capa extra de seguridad. Además de tu
                    contraseña, tendrás que ingresar un código de tu teléfono para iniciar sesión.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Lo que necesitas:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Una aplicación autenticadora (Google Authenticator, Microsoft Authenticator, Authy)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Tu teléfono disponible para escanear un código QR</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>Un lugar seguro para guardar los códigos de respaldo</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Generando...' : 'Comenzar Configuración'}
                </button>
              </div>
            )}

            {/* Paso 2: QR */}
            {(step === 'qr' || step === 'verify' || step === 'backup' || step === 'complete') && qrCode && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Paso 1: Escanea el código QR</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Abre tu aplicación autenticadora y escanea este código:
                  </p>

                  <div className="bg-gray-100 p-6 rounded-lg flex justify-center mb-4">
                    {qrCode && (
                      <img
                        src={qrCode}
                        alt="QR Code para 2FA"
                        className="w-64 h-64"
                      />
                    )}
                  </div>

                  {secret && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">O ingresa esta clave manualmente:</p>
                      <code className="text-sm font-mono bg-white p-3 rounded border border-gray-200 block break-all">
                        {secret}
                      </code>
                    </div>
                  )}
                </div>

                {step !== 'qr' && (
                  <button
                    onClick={() => setStep('qr')}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    ← Ver código QR de nuevo
                  </button>
                )}
              </div>
            )}

            {/* Paso 2B: Verificación */}
            {(step === 'verify' || step === 'backup' || step === 'complete') && (
              <form onSubmit={handleVerifyToken} className="space-y-6 mt-8 pt-8 border-t">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Paso 2: Verifica tu código</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ingresa el código de 6 dígitos que ves en tu aplicación autenticadora:
                  </p>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={totpToken}
                    onChange={(e) => {
                      setTotpToken(e.target.value.replace(/\D/g, ''));
                      setVerifyError(null);
                    }}
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg font-mono"
                    disabled={step !== 'verify'}
                  />

                  {verifyError && (
                    <p className="text-red-600 text-sm mt-2">{verifyError}</p>
                  )}
                </div>

                {step === 'verify' && (
                  <button
                    type="submit"
                    disabled={totpToken.length !== 6 || loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Verificando...' : 'Verificar y Continuar'}
                  </button>
                )}

                {(step === 'backup' || step === 'complete') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <span className="text-green-600 text-xl mt-0.5">✓</span>
                    <div>
                      <p className="font-semibold text-green-900">Verificación completada</p>
                      <p className="text-sm text-green-800">Tu código TOTP es válido</p>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Paso 3: Códigos de Respaldo */}
            {(step === 'backup' || step === 'complete') && backupCodes.length > 0 && (
              <div className="space-y-6 mt-8 pt-8 border-t">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Paso 3: Guarda tus códigos de respaldo</h3>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">⚠️ Importante:</span> Estos códigos permiten acceder a tu cuenta si pierdes
                      acceso a tu aplicación autenticadora. Guárdalos en un lugar seguro.
                    </p>
                  </div>

                  <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm space-y-2 mb-4">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{idx + 1}.</span>
                        <span className="tracking-wider">{code}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyBackupCodes}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      copiedCodes
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {copiedCodes ? '✓ Copiado' : 'Copiar códigos'}
                  </button>

                  {step === 'backup' && (
                    <div className="mt-6 pt-6 border-t">
                      <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleComplete();
                            }
                          }}
                          className="mt-1"
                        />
                        <span className="text-sm text-gray-700">
                          He guardado mis códigos de respaldo en un lugar seguro
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completado */}
            {step === 'complete' && (
              <div className="space-y-6 text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <span className="text-4xl">✓</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Configuración completada!</h3>
                  <p className="text-gray-600">
                    Tu autenticación de dos factores está ahora habilitada. Para el próximo inicio de sesión,
                    tendrás que ingresar un código de tu aplicación autenticadora.
                  </p>
                </div>
                <p className="text-sm text-gray-500">Redirigiendo a configuración de seguridad...</p>
              </div>
            )}
          </div>

          {/* Error global */}
          {error && !verifyError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
