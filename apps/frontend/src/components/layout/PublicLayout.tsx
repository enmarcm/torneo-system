import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Stack,
  IconButton,
  Container,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { MenuRounded, PlaceRounded, PhoneRounded, MailRounded, ScheduleRounded } from '@mui/icons-material';
import logoAzul from '@/assets/logo_azul.PNG';
import logoBlanco from '@/assets/logo.PNG';
import { useState, Suspense, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGlobalStore } from '@/store/useGlobalStore';
import { LoadingState } from '@/components/ui/LoadingState';
import { AdSlot } from '@/components/ui/AdSlot';
import { useLiveMatchSync } from '@/hooks/common/useLiveMatchSync';
import { PublicSidebar, PUBLIC_NAV, PUBLIC_SIDEBAR_WIDTH } from './PublicSidebar';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode } = useGlobalStore();
  const logoSrc = useMemo(() => (mode === 'dark' ? logoBlanco : logoAzul), [mode]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Un solo oyente para todo el sitio público: sin esto los marcadores de las
  // listas quedan congelados en el valor con el que cargó la página.
  useLiveMatchSync();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* En escritorio la navegación es una columna fija; en teléfono, un cajón. */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: PUBLIC_SIDEBAR_WIDTH,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <PublicSidebar />
        </Box>
      )}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { borderRadius: 0 } }}
        >
          <PublicSidebar onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          ml: { xs: 0, md: `${PUBLIC_SIDEBAR_WIDTH}px` },
        }}
      >
        {/* La barra superior queda solo en teléfono, para poder abrir el cajón. */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Toolbar sx={{ gap: 1.5, minHeight: 60 }}>
              <IconButton onClick={() => setDrawerOpen(true)} aria-label="Abrir menú" edge="start">
                <MenuRounded />
              </IconButton>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(ROUTES.public.home)}
              >
                <Box
                  component="img"
                  src={logoSrc}
                  alt="Liga Lago Futsal"
                  sx={{ width: 30, height: 30, borderRadius: '50%' }}
                />
                <Typography sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 15 }}>
                  Liga Lago Futsal
                </Typography>
              </Stack>
            </Toolbar>
          </AppBar>
        )}

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
                alignItems="flex-start"
              >
                <Stack alignItems="center" spacing={1.5} sx={{ maxWidth: 320, mx: { xs: 'auto', md: 0 } }}>
                  {/*
                    El monograma va sin fondo ni recorte, apoyado directo sobre el
                    navy, y late despacio: es lo único con vida propia del pie.
                  */}
                  <Box
                    component={motion.img}
                    src="/llf-removebg-preview.png"
                    alt=""
                    animate={reduceMotion ? undefined : { scale: [1, 1.07, 1], y: [0, -5, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    sx={{ height: 104, width: 'auto', display: 'block' }}
                  />
                  {/*
                    El nombre va derecho y centrado bajo el monograma: la sigla es
                    itálica y el texto no la acompaña, la sostiene.
                  */}
                  <Typography
                    align="center"
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 800,
                      fontSize: 22,
                      letterSpacing: 0.2,
                      lineHeight: 1.1,
                    }}
                  >
                    Liga Lago Futsal
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                    Resultados, posiciones y calendario de la liga, al minuto y en un
                    solo lugar.
                  </Typography>
                </Stack>

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
                    {PUBLIC_NAV.map((n) => (
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
    </Box>
  );
};
