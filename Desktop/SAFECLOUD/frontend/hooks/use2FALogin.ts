import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface VerifyLoginRequest {
  token?: string;
  backup_code?: string;
}

interface VerifyLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

export const use2FALogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [usedBackupCode, setUsedBackupCode] = useState(false);

  // Verificar 2FA durante login
  const verifyLogin = useCallback(async (token: string, useBackupCode: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const payload: VerifyLoginRequest = useBackupCode
        ? { backup_code: token }
        : { token };

      const response = await api.post<VerifyLoginResponse>('/auth/2fa/verify-login/', payload);
      
      if (useBackupCode) {
        setUsedBackupCode(true);
      }
      
      return response.data;
    } catch (err: any) {
      let message = 'Código inválido. Intenta de nuevo.';
      
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    twoFARequired,
    usedBackupCode,
    verifyLogin,
    setTwoFARequired,
    clearError,
  };
};
