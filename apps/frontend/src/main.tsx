import React, { useLayoutEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { buildTheme } from '@/theme/theme';
import { lightTokens, darkTokens } from '@/theme/tokens';
import { queryClient } from '@/lib/queryClient';
import { useGlobalStore } from '@/store/useGlobalStore';
import { AppRouter } from '@/routes/AppRouter';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const allTokenKeys = new Set([
  ...Object.keys(lightTokens),
  ...Object.keys(darkTokens),
]);

const CssVarsInjector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useGlobalStore((s) => s.mode);
  useLayoutEffect(() => {
    const t = mode === 'light' ? lightTokens : darkTokens;
    const r = document.documentElement.style;
    allTokenKeys.forEach((k) => r.removeProperty(`--${k}`));
    Object.entries(t).forEach(([k, v]) => r.setProperty(`--${k}`, String(v)));
  }, [mode]);
  return <>{children}</>;
};

const Root: React.FC = () => {
  const mode = useGlobalStore((s) => s.mode);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} autoHideDuration={2500}>
        <CssVarsInjector>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              {/*
                Red de contención: un error de render dejaba la aplicación en
                blanco, sin manera de volver salvo recargar.
              */}
              <a className="llf-skip-link" href="#main-content">Ir al contenido</a>
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
            </BrowserRouter>
          </QueryClientProvider>
        </CssVarsInjector>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

// Registro del service worker: requisito para que el navegador ofrezca instalar.
// Solo en producción; en desarrollo se cachearía código viejo.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
