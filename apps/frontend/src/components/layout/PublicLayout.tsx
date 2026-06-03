import { Box, AppBar, Toolbar, Typography, Stack, Button, IconButton, Tooltip, Container, Drawer, List, ListItemButton, ListItemText, Divider } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LightModeRounded, DarkModeRounded, MenuRounded, CloseRounded } from '@mui/icons-material';
import { useState, Suspense } from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { LoadingState } from '@/components/ui/LoadingState';
import { ROUTES } from '@/routes/routes';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, toggleMode } = useGlobalStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const NAV = [
    { label: 'Inicio', to: ROUTES.public.home },
    { label: 'Competiciones', to: ROUTES.public.competitions },
    { label: 'Calendario', to: ROUTES.public.schedule },
    { label: 'En vivo', to: ROUTES.public.live },
    { label: 'Estadísticas', to: ROUTES.public.stats },
    { label: 'Equipos', to: ROUTES.public.teams },
  ];

  const handleNav = (to: string) => {
    navigate(to);
    setDrawerOpen(false);
  };

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
              <Typography variant="h4" sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, display: { xs: 'none', sm: 'block' } }}>Liga Lago Futsal</Typography>
            </Stack>

            {/* Desktop nav */}
            <Stack direction="row" spacing={0.5} sx={{ ml: 1, display: { xs: 'none', md: 'flex' } }}>
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

            {/* Mobile hamburger */}
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ display: { md: 'none' } }} aria-label="Abrir menú">
              <MenuRounded />
            </IconButton>

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

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: 'background.paper', borderRadius: 0 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 2, minHeight: 72 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: 'var(--brandGradient)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>L</Box>
            <Typography sx={{ fontWeight: 800 }}>Liga Lago Futsal</Typography>
          </Stack>
          <IconButton onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú">
            <CloseRounded />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {NAV.map((n) => (
            <ListItemButton
              key={n.to}
              onClick={() => handleNav(n.to)}
              selected={pathname === n.to}
              sx={{ borderRadius: 1.5, mb: 0.25, '&.Mui-selected': { bgcolor: 'primary.soft', color: 'primary.main' } }}
            >
              <ListItemText
                primary={n.label}
                primaryTypographyProps={{ fontWeight: pathname === n.to ? 700 : 500, fontSize: 15 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1 }}>
        <Suspense fallback={<LoadingState rows={4} />}>
          <Outlet />
        </Suspense>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, mt: 4 }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} LLF — Liga Lago Futsal
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
