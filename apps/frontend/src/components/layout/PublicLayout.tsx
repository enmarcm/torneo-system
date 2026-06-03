import { Box, AppBar, Toolbar, Typography, Stack, Button, IconButton, Tooltip, Container } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LightModeRounded, DarkModeRounded } from '@mui/icons-material';
import { useGlobalStore } from '@/store/useGlobalStore';
import { ROUTES } from '@/routes/routes';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, toggleMode } = useGlobalStore();

  const NAV = [
    { label: 'Inicio', to: ROUTES.public.home },
    { label: 'Competiciones', to: ROUTES.public.competitions },
    { label: 'Calendario', to: ROUTES.public.schedule },
    { label: 'En vivo', to: ROUTES.public.live },
    { label: 'Estadísticas', to: ROUTES.public.stats },
    { label: 'Equipos', to: ROUTES.public.teams },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, minHeight: 72 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ cursor: 'pointer' }} onClick={() => navigate(ROUTES.public.home)}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'var(--brandGradient)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontFamily: '"Plus Jakarta Sans"' }}>L</Box>
              <Typography variant="h4" sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800 }}>LigaApp</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ ml: 3, display: { xs: 'none', md: 'flex' } }}>
              {NAV.map((n) => (
                <Button
                  key={n.to}
                  onClick={() => navigate(n.to)}
                  color={pathname === n.to ? 'primary' : 'inherit'}
                  sx={{ fontWeight: 600 }}
                >
                  {n.label}
                </Button>
              ))}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton onClick={toggleMode} aria-label="Cambiar tema">
                {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
              </IconButton>
            </Tooltip>
            <Button variant="contained" onClick={() => navigate(ROUTES.login)}>
              Iniciar sesión
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, mt: 4 }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} LigaApp — Torneos de fútbol
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Realizado por Enmanuel Colina y Royer Merchan
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
