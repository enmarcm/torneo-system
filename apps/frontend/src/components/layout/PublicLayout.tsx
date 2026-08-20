import { Box, Typography, Stack, Container, Drawer } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { PlaceRounded, PhoneRounded, MailRounded, ScheduleRounded } from '@mui/icons-material';
import { useState, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingState } from '@/components/ui/LoadingState';
import { AdSlot } from '@/components/ui/AdSlot';
import { useLiveMatchSync } from '@/hooks/common/useLiveMatchSync';
import { PublicSidebar, PUBLIC_NAV } from './PublicSidebar';
import { PublicTopbar, PUBLIC_TOPBAR_H } from './PublicTopbar';

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
  const [navOpen, setNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Un solo oyente para todo el sitio público: sin esto los marcadores de las
  // listas quedan congelados en el valor con el que cargó la página.
  useLiveMatchSync();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <PublicTopbar onToggleNav={() => setNavOpen((o) => !o)} navExpanded={navOpen} />

      {/*
        La navegación no ocupa lugar: está escondida y sale por encima del
        contenido con el botón de la barra. Igual en teléfono y en escritorio —
        con seis destinos no hay razón para gastarle una columna permanente a la
        pantalla, y lo que el visitante vino a leer se queda con todo el ancho.
      */}
      <Drawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        /* Un velo suave: el panel ya es traslúcido, un fondo negro lo enturbia. */
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(8,12,24,0.32)' } } }}
        /* El papel no pinta nada: la superficie es la del panel, que va con desenfoque. */
        PaperProps={{
          sx: {
            borderRadius: 0,
            border: 'none',
            boxShadow: 'none',
            bgcolor: 'transparent',
            backgroundImage: 'none',
            // Entra por debajo de la barra: la marca no parpadea al abrirlo.
            top: { xs: `${PUBLIC_TOPBAR_H.xs}px`, md: `${PUBLIC_TOPBAR_H.md}px` },
            height: {
              xs: `calc(100% - ${PUBLIC_TOPBAR_H.xs}px)`,
              md: `calc(100% - ${PUBLIC_TOPBAR_H.md}px)`,
            },
          },
        }}
      >
        <PublicSidebar onNavigate={() => setNavOpen(false)} />
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          // La barra es fija y cruza la pantalla: el contenido arranca debajo.
          pt: { xs: `${PUBLIC_TOPBAR_H.xs}px`, md: `${PUBLIC_TOPBAR_H.md}px` },
        }}
      >
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

              {/*
                Rejilla, no fila. Repartidas con `space-between` las columnas
                dejaban un vacío enorme entre la marca y el contacto, porque su
                ancho natural es mucho menor que el del pie; empacadas a la
                izquierda, el vacío se iba entero a la derecha. Con fracciones
                el aire se reparte parejo y nadie queda flotando.
              */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 0.75fr)',
                  },
                  columnGap: { sm: 4, md: 6 },
                  rowGap: { xs: 3.5, sm: 4 },
                  alignItems: 'start',
                }}
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
              </Box>

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
