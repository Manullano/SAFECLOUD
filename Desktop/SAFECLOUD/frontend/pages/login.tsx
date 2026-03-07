import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/auth';
import { TwoFALoginModal } from '@/components/TwoFALoginModal';
import { use2FALogin } from '@/hooks/use2FALogin';

const LoginPage = () => {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const { verifyLogin, loading: twoFALoading, error: twoFAError } = use2FALogin();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para 2FA
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      console.log('[LOGIN DEBUG] Using API URL:', apiUrl);

      const response = await fetch(`${apiUrl}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('[LOGIN DEBUG] Response status:', response.status);

      // Si la respuesta es 202, se requiere 2FA
      if (response.status === 202) {
        console.log('[LOGIN DEBUG] 2FA required');
        setUserEmail(formData.email);
        setTwoFARequired(true);
        setShowTwoFAModal(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Credenciales inválidas');
      }

      const data = await response.json();
      console.log('[LOGIN DEBUG] Login successful, saving tokens and user...');

      // Guardar tokens y usuario en Zustand + localStorage
      const user = data.user;
      const accessToken = data.access;
      const refreshToken = data.refresh;

      // Usar setUser y setTokens del store
      setUser(user);
      setTokens(accessToken, refreshToken);

      // Esperar un poco para que Zustand persista
      setTimeout(() => {
        console.log('[LOGIN DEBUG] Redirecting to dashboard...');
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Manejar verificación 2FA
  const handleVerify2FA = async (token: string, useBackupCode: boolean) => {
    try {
      const response = await verifyLogin(token, useBackupCode);

      if (response.access && response.user) {
        // Guardar tokens y usuario
        setUser(response.user);
        setTokens(response.access, response.refresh);

        // Cerrar modal y redirigir
        setShowTwoFAModal(false);
        setTimeout(() => {
          console.log('[LOGIN DEBUG] 2FA verified, redirecting to dashboard...');
          router.push('/dashboard');
        }, 500);
      }
    } catch (err) {
      // El error ya está manejado en el hook
      console.error('[2FA ERROR]', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-0 shadow-card">
          <div className="text-center mb-8">
            <img src="/logos/safecloud_logo.png" alt="SAFE Cloud" className="h-32 w-auto mx-auto mb-4" />
            <p className="text-gray-500 text-sm mt-2">Accede a tu plataforma segura</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="tu@empresa.com"
              value={formData.email}
              onChange={handleChange}
              disabled={twoFARequired}
              required
            />
            <Input
              label="Contraseña"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={twoFARequired}
              required
            />

            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || twoFARequired}
              className="w-full mb-4"
              size="md"
            >
              {loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {twoFARequired && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">✓ Credenciales verificadas</p>
              <p>Se requiere autenticación en dos pasos</p>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿Primera vez aquí?</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            No tienes cuenta?{' '}
            <Link href="/register" className="text-primary-500 hover:text-primary-600 font-semibold">
              Regístrate aquí
            </Link>
          </p>
        </Card>
      </div>

      {/* Modal 2FA */}
      <TwoFALoginModal
        isOpen={showTwoFAModal}
        email={userEmail}
        onVerify={handleVerify2FA}
        onCancel={() => {
          setShowTwoFAModal(false);
          setTwoFARequired(false);
          setUserEmail('');
        }}
        loading={twoFALoading}
        error={twoFAError}
      />
    </Layout>
  );
};

export default LoginPage;
