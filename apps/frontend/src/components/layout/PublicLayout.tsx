import { Box, Typography, Stack, Container, Drawer } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PlaceRounded, PhoneRounded, MailRounded, ScheduleRounded } from '@mui/icons-material';
import { useState, useEffect, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PageLoader } from '@/components/ui/PageLoader';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { RouteProgressSignal } from '@/components/ui/RouteProgress';
import { isMatchRoute } from '@/routes/routes';
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
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Un solo oyente para todo el sitio público: sin esto los marcadores de las
  // listas quedan congelados en el valor con el que cargó la página.
  useLiveMatchSync();

  /*
    El carril de la barra de desplazamiento lo dibuja el navegador fuera de la
    caja de contenido: ningún elemento puede pintar ahí, ni con `100vw`. La
    única manera de que no sea una franja blanca al costado de la portada es
    pedirle al navegador que lo pinte de otro color, y eso se hace con esta
    clase, cuyas reglas viven en el tema.

    Es del sitio público nada más, y se saca al salir: en el panel de
    administración un riel oscuro al borde no tendría con qué combinar.
  */
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('llf-publico');
    return () => html.classList.remove('llf-publico');
  }, []);

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
        /*
          Por encima de la barra superior, no por debajo: el panel entra de
          arriba del todo y trae su propia marca, que reemplaza a la de la barra
          mientras se desliza. Antes quedaban las dos a la vez, una encima de la
          otra.
        */
        sx={{ zIndex: (t) => t.zIndex.drawer + 3 }}
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
          },
        }}
      >
        <PublicSidebar
          onNavigate={() => setNavOpen(false)}
          onClose={() => setNavOpen(false)}
        />
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
        {/*
          `key={pathname}` + `.llf-page`: cada pantalla monta de cero y sus
          bloques entran en cascada (regla en el tema). El fallback avisa a la
          barra de ruta de la barra superior mientras baja el código.
        */}
        <Box component="main" className="llf-page" key={pathname} sx={{ flex: 1 }}>
          <Suspense
            fallback={
              <>
                <RouteProgressSignal />
                {isMatchRoute(pathname) ? <MatchLoader minHeight="60vh" /> : <PageLoader />}
              </>
            }
          >
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
                ancho natural es mucho menor que el del pie.

                Tres columnas iguales: con fracciones distintas, la del medio se
                llevaba más ancho del que su contenido necesita y quedaba un
                hueco entre el contacto y los enlaces. Iguales, el aire sobrante
                se reparte parejo y las tres arrancan en una línea regular.
              */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                  columnGap: { sm: 4, md: 5 },
                  rowGap: { xs: 3.5, sm: 4 },
                  alignItems: 'start',
                }}
              >
                {/*
                  Alineada a la izquierda como las otras dos: centrada, era la
                  única columna que no arrancaba en el mismo eje y el pie se leía
                  desparejo. En teléfono sí se centra, porque ahí las columnas se
                  apilan y no hay eje común que respetar.
                */}
                <Stack
                  alignItems={{ xs: 'center', sm: 'flex-start' }}
                  spacing={1.5}
                  sx={{
                    maxWidth: 320,
                    mx: { xs: 'auto', sm: 0 },
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
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
                    El nombre va derecho bajo el monograma: la sigla es itálica y
                    el texto no la acompaña, la sostiene.
                  */}
                  <Typography
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
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
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
                        /* Subrayado que crece desde el centro; la sección actual queda en naranja. */
                        className={`llf-navlink${pathname === n.to ? ' active' : ''}`}
                        sx={{
                          background: 'none',
                          border: 'none',
                          p: 0,
                          alignSelf: 'flex-start',
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
                  Developed with Colina and Merchan
                </Typography>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};
