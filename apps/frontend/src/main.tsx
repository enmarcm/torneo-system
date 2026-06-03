import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { buildTheme } from '@/theme/theme';
import { lightTokens, darkTokens } from '@/theme/tokens';
import { queryClient } from '@/lib/queryClient';
import { useGlobalStore } from '@/store/useGlobalStore';
import { AppRouter } from '@/routes/AppRouter';

const allTokenKeys = new Set([
  ...Object.keys(lightTokens),
  ...Object.keys(darkTokens),
]);

const CssVarsInjector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useGlobalStore((s) => s.mode);
  useEffect(() => {
    const t = mode === 'light' ? lightTokens : darkTokens;
    const r = document.documentElement.style;
    allTokenKeys.forEach((k) => r.removeProperty(`--${k}`));
    Object.entries(t).forEach(([k, v]) => r.setProperty(`--${k}`, String(v)));
  }, [mode]);
  return <>{children}</>;
};

const Root: React.FC = () => {
  const mode = useGlobalStore((s) => s.mode);
  return (
    <ThemeProvider theme={buildTheme(mode)}>
      <CssBaseline />
      <CssVarsInjector>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </QueryClientProvider>
      </CssVarsInjector>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
