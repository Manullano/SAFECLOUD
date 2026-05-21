import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.css';
import { PermissionProvider } from '@/context/PermissionContext';
import { useAuth } from '@/stores/auth';

function App({ Component, pageProps }: AppProps) {
  const getCurrentUser = useAuth((state) => state.getCurrentUser);

  useEffect(() => {
    // Inicializar estado de autenticación al cargar la app
    getCurrentUser();
  }, [getCurrentUser]);

  return (
    <PermissionProvider>
      <Component {...pageProps} />
    </PermissionProvider>
  );
}

export default App;
