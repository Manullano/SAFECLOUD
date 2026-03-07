import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface SetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

interface VerifySetupRequest {
  token: string;
}

export const use2FA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Generar código QR y secret
  const generateSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<SetupResponse>('/auth/2fa/setup/');
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al generar la configuración 2FA';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar configuración 2FA
  const verifySetup = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ backup_codes: string[] }>('/auth/2fa/verify-setup/', {
        token,
      });
      setBackupCodes(response.data.backup_codes);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Token inválido. Intenta de nuevo.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estado 2FA
  const getStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/2fa/status/');
      return response.data;
    } catch (err: any) {
      setError('Error al obtener estado 2FA');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deshabilitar 2FA
  const disable = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/2fa/disable/', { password });
      setQrCode(null);
      setSecret(null);
      setBackupCodes([]);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al deshabilitar 2FA';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Regenerar códigos de respaldo
  const regenerateCodes = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ backup_codes: string[] }>('/auth/2fa/regenerate-codes/', {
        password,
      });
      setBackupCodes(response.data.backup_codes);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al regenerar códigos';
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
    qrCode,
    secret,
    backupCodes,
    generateSetup,
    verifySetup,
    getStatus,
    disable,
    regenerateCodes,
    clearError,
  };
};
