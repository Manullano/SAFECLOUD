import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/stores/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TwoFactorStatus } from '@/components/TwoFactorStatus';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="CLIENT_ADMIN">
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Encabezado */}
          <div className="mb-8">
            <Link
              href="/settings"
              className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
            >
              ← Volver a Configuración
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Seguridad
            </h1>
            <p className="text-gray-600">
              Gestiona la seguridad de tu cuenta y privacidad
            </p>
          </div>

          <div className="space-y-8">
            {/* Autenticación de Dos Factores */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🔐 Autenticación Multifactor
                </h2>
                <p className="text-gray-600">
                  Protege tu cuenta con un nivel adicional de seguridad
                </p>
              </div>
              <TwoFactorStatus />
            </section>

            {/* Cambiar Contraseña */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🔑 Contraseña
                </h2>
                <p className="text-gray-600">
                  Cambia tu contraseña regularmente para mantener tu cuenta segura
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Última actualización: Nunca</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Te recomendamos cambiar tu contraseña cada 90 días
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/settings/security/change-password')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </section>

            {/* Sesiones Activas */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📱 Sesiones Activas
                </h2>
                <p className="text-gray-600">
                  Gestiona tus sesiones en diferentes dispositivos
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                      Sesión Actual
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'Navegador'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Conectado desde hace poco</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 text-center py-4">
                  No hay otras sesiones activas
                </p>

                <button
                  onClick={() => {
                    // Cerrar todas las demás sesiones
                  }}
                  className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200"
                >
                  Cerrar todas las otras sesiones
                </button>
              </div>
            </section>

            {/* Registro de Auditoría */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📋 Registro de Auditoría
                </h2>
                <p className="text-gray-600">
                  Ve el historial de actividad de tu cuenta
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  Aquí podrás ver todos los eventos importantes de tu cuenta como inicios de sesión,
                  cambios de configuración y actividades de seguridad.
                </p>

                <button
                  onClick={() => router.push('/settings/security/audit-log')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Ver Registro de Auditoría
                </button>
              </div>
            </section>

            {/* Privacidad */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  👁️ Privacidad
                </h2>
                <p className="text-gray-600">
                  Gestiona tus preferencias de privacidad
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Perfil visible en directorio</p>
                    <p className="text-sm text-gray-600">Otros miembros pueden verte en el directorio de la empresa</p>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Mostrar estado en línea</p>
                    <p className="text-sm text-gray-600">Los otros sabrán si estás en línea o no</p>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Recibir notificaciones de marketing</p>
                    <p className="text-sm text-gray-600">Recibe actualizaciones sobre nuevas características</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Zona de Peligro */}
            <section className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-red-900 mb-2">
                  ⚠️ Zona de Peligro
                </h2>
                <p className="text-red-700">
                  Acciones que no se pueden deshacer
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white border border-red-200 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">Descargar tus datos</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Descarga una copia de todos tus datos personales
                  </p>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700">
                    Descargar datos
                  </button>
                </div>

                <div className="p-4 bg-white border border-red-200 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">Eliminar cuenta</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Elimina tu cuenta de forma permanente junto con todos tus datos
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                    Eliminar cuenta
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
