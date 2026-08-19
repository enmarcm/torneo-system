import { Box, AppBar, Toolbar, Typography, Stack, Button, IconButton, Tooltip, Container, Drawer, List, ListItemButton, ListItemText, Divider, ListItemIcon } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LightModeRounded, DarkModeRounded, MenuRounded, CloseRounded, HomeRounded, EmojiEventsRounded, CalendarMonthRounded, LiveTvRounded, BarChartRounded, GroupsRounded, LoginRounded, PlaceRounded, PhoneRounded, MailRounded, ScheduleRounded } from '@mui/icons-material';
import logoAzul from '@/assets/logo_azul.PNG';
import logoBlanco from '@/assets/logo.PNG';
import { useState, Suspense, useMemo } from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { LoadingState } from '@/components/ui/LoadingState';
import { AdSlot } from '@/components/ui/AdSlot';
import { useLiveMatchSync } from '@/hooks/common/useLiveMatchSync';
import { ROUTES } from '@/routes/routes';

/*
  DATOS DE MUESTRA. Están puestos para poder ver el pie terminado; ninguno fue
  confirmado por la liga. Reemplazar por los reales antes de publicar.
*/
const CONTACTO = {
  sede: 'Colegio de Abogados del Estado Zulia · Maracaibo',
  telefono: '+58 261 000 0000',
  email: 'contacto@ligalagofutsal.com',
  horario: 'Partidos: viernes y sábados, 18:00 a 23:00',
};

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, toggleMode } = useGlobalStore();
  // Un solo oyente para todo el sitio público: sin esto los marcadores de las
  // listas quedan congelados en el valor con el que cargó la página.
  useLiveMatchSync();
  const logoSrc = useMemo(() => mode === 'dark' ? logoBlanco : logoAzul, [mode]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const NAV = [
    { label: 'Inicio', to: ROUTES.public.home, icon: <HomeRounded /> },
    { label: 'Competiciones', to: ROUTES.public.competitions, icon: <EmojiEventsRounded /> },
    { label: 'Calendario', to: ROUTES.public.schedule, icon: <CalendarMonthRounded /> },
    { label: 'En vivo', to: ROUTES.public.live, icon: <LiveTvRounded /> },
    { label: 'Estadísticas', to: ROUTES.public.stats, icon: <BarChartRounded /> },
    { label: 'Equipos', to: ROUTES.public.teams, icon: <GroupsRounded /> },
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
              <Box component="img" src={logoSrc} alt="Liga Lago Futsal" sx={{ width: 36, height: 36, borderRadius: '50%' }} />
              <Typography variant="h4" sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, display: { xs: 'none', sm: 'block' } }}>Liga Lago Futsal</Typography>
            </Stack>

            {/* Desktop nav */}
            <Stack direction="row" spacing={0.5} sx={{ ml: 1, display: { xs: 'none', md: 'flex' } }}>
              {NAV.map((n) => (
                <Button
                  key={n.to}
                  onClick={() => navigate(n.to)}
                  color={pathname === n.to ? 'primary' : 'inherit'}
                  startIcon={n.icon}
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
            <Button variant="contained" startIcon={<LoginRounded />} onClick={() => navigate(ROUTES.login)}>
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
            <Box component="img" src={logoSrc} alt="" sx={{ width: 32, height: 32, borderRadius: '50%' }} />
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
              <ListItemIcon sx={{ minWidth: 36, color: pathname === n.to ? 'primary.main' : 'inherit' }}>
                {n.icon}
              </ListItemIcon>
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

      {/* Los patrocinadores van sobre el fondo de la página, justo antes del pie. */}
      <Container maxWidth="xl" sx={{ pt: 2, pb: 3 }}>
        <AdSlot placement="FOOTER_LOGOS" />
      </Container>

      <Box
        component="footer"
        sx={{
          mt: 0,
          py: { xs: 4, md: 5 },
          background: 'var(--heroGradient)',
          color: '#fff',
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            {/* Publicidad del pie: sobre fondo oscuro va en blanco, con borde. */}
            <AdSlot placement="FOOTER" onDark />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 3.5, md: 6 }}
              alignItems={{ xs: 'flex-start', md: 'flex-start' }}
            >
              <Box sx={{ maxWidth: 320 }}>
                {/*
                  El monograma va sin fondo ni recorte, apoyado directo sobre el
                  navy. Como es solo la sigla, el nombre completo lo pone el texto
                  de al lado: el logotipo suelto no dice de qué liga se trata.
                */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Box
                    component="img"
                    src="/llf-removebg-preview.png"
                    alt=""
                    sx={{ height: 56, width: 'auto', display: 'block' }}
                  />
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 800,
                      fontSize: 18,
                      lineHeight: 1.15,
                    }}
                  >
                    Liga Lago
                    <br />
                    Futsal
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  Resultados, posiciones y calendario de la liga, al minuto y en un
                  solo lugar.
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 1.5,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Contacto
                </Typography>
                <Stack spacing={1}>
                  {[
                    { icon: <PlaceRounded sx={{ fontSize: 17 }} />, text: CONTACTO.sede },
                    { icon: <PhoneRounded sx={{ fontSize: 17 }} />, text: CONTACTO.telefono },
                    { icon: <MailRounded sx={{ fontSize: 17 }} />, text: CONTACTO.email },
                    { icon: <ScheduleRounded sx={{ fontSize: 17 }} />, text: CONTACTO.horario },
                  ].map((item) => (
                    <Stack key={item.text} direction="row" spacing={1} alignItems="center">
                      <Box sx={{ color: 'rgba(255,255,255,0.5)', display: 'flex' }}>{item.icon}</Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {item.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 1.5,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  La liga
                </Typography>
                <Stack spacing={0.75}>
                  {NAV.map((n) => (
                    <Typography
                      key={n.to}
                      component="button"
                      onClick={() => navigate(n.to)}
                      variant="body2"
                      sx={{
                        background: 'none',
                        border: 'none',
                        p: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        font: 'inherit',
                        color: 'rgba(255,255,255,0.8)',
                        '&:hover': { color: '#fff' },
                      }}
                    >
                      {n.label}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                © {new Date().getFullYear()} LLF — Liga Lago Futsal
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                Realizado por Enmanuel Colina y Royer Merchan
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
