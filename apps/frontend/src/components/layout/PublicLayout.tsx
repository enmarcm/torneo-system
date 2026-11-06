import { Box, Typography, Stack, Container, Drawer, Link, IconButton } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import MailRounded from '@mui/icons-material/MailRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';
import { useState, useEffect, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PageLoader } from '@/components/ui/PageLoader';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { RouteProgressSignal } from '@/components/ui/RouteProgress';
import { ROUTES, isMatchRoute, legalPath } from '@/routes/routes';
import { COMING_SOON } from '@/routes/comingSoon';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { usePublicSiteQuery } from '@/hooks/queries';
import { FALLBACK_SETTINGS } from '@/api/site.api';
import { AdSlot } from '@/components/ui/AdSlot';
import { useLiveMatchSync } from '@/hooks/common/useLiveMatchSync';
import { PublicSidebar, PUBLIC_NAV } from './PublicSidebar';
import { PublicTopbar, PUBLIC_TOPBAR_H } from './PublicTopbar';

/** WhatsApp se guarda como número; el enlace lo arma wa.me con solo los dígitos. */
const whatsappUrl = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return digits ? 'https://wa.me/' + digits : '';
};

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  /*
    Los datos del pie los edita el administrador desde el panel. Mientras llegan
    (o si el API no responde) se usa el valor de respaldo, para que el pie no
    salte ni quede vacío.
  */
  const { data: site } = usePublicSiteQuery();
  const settings = site?.settings ?? FALLBACK_SETTINGS;
  const legalPages = site?.legalPages ?? [];
  const contacto = [
    { icon: <PlaceRounded sx={{ fontSize: 17 }} />, text: settings.address },
    { icon: <PhoneRounded sx={{ fontSize: 17 }} />, text: settings.phone },
    { icon: <MailRounded sx={{ fontSize: 17 }} />, text: settings.email },
    { icon: <ScheduleRounded sx={{ fontSize: 17 }} />, text: settings.schedule },
  ].filter((c) => c.text.trim());
  const redes = [
    { label: 'Instagram', icon: <InstagramIcon fontSize="small" />, href: settings.instagramUrl },
    { label: 'Facebook', icon: <FacebookIcon fontSize="small" />, href: settings.facebookUrl },
    { label: 'TikTok', icon: <MusicNoteRounded fontSize="small" />, href: settings.tiktokUrl },
    { label: 'WhatsApp', icon: <WhatsAppIcon fontSize="small" />, href: whatsappUrl(settings.whatsapp) },
  ].filter((r) => r.href);

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
        '--public-topbar-height': { xs: `${PUBLIC_TOPBAR_H.xs}px`, md: `${PUBLIC_TOPBAR_H.md}px` },
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
          pt: 'var(--public-topbar-height)',
        }}
      >
        {/*
          `key={pathname}` + `.llf-page`: cada pantalla monta de cero y sus
          bloques entran en cascada (regla en el tema). El fallback avisa a la
          barra de ruta de la barra superior mientras baja el código.
        */}
        <Box component="main" id="main-content" tabIndex={-1} className="llf-page" key={pathname} sx={{ flex: 1 }}>
          <Suspense
            fallback={
              <>
                <RouteProgressSignal />
                {isMatchRoute(pathname) ? <MatchLoader minHeight="60vh" /> : <PageLoader />}
              </>
            }
          >
            {/* Una sección marcada como pendiente no carga su página: muestra la obra. */}
            {COMING_SOON[pathname] ? (
              <ComingSoon
                title={COMING_SOON[pathname].title}
                description={COMING_SOON[pathname].description}
                onBack={() => navigate(ROUTES.public.home)}
                secondary={
                  COMING_SOON[pathname].alternative && {
                    label: COMING_SOON[pathname].alternative.label,
                    onClick: () => navigate(COMING_SOON[pathname].alternative!.to),
                  }
                }
              />
            ) : (
              <Outlet />
            )}
          </Suspense>
        </Box>

        {/* La franja comparte el fondo del pie, con un separador blanco fino. */}
        <Box sx={{ bgcolor: 'var(--footerSurface)' }}>
          <Container maxWidth="xl" sx={{
            py: 2,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: { xs: 24, md: 32 },
              right: { xs: 24, md: 32 },
              height: '1px',
              bgcolor: 'var(--sponsorDivider)',
              pointerEvents: 'none',
            },
          }}>
            <AdSlot placement="FOOTER_LOGOS" />
          </Container>
        </Box>

        <Box
          component="footer"
          sx={{
            py: { xs: 4, md: 5 },
            background: 'var(--footerSurface)',
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
                    {settings.siteName}
                  </Typography>
                  {settings.tagline && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                      {settings.tagline}
                    </Typography>
                  )}
                </Stack>

                {/* Sin ningún dato de contacto, la columna entera se omite: un título solo no dice nada. */}
                {(contacto.length > 0 || redes.length > 0) && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mb: 1.5,
                      fontWeight: 700,
                      letterSpacing: 0,
                      textTransform: 'none',
                      color: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    Contacto
                  </Typography>
                  <Stack spacing={1}>
                    {contacto.map((item) => (
                      <Stack key={item.text} direction="row" spacing={1} alignItems="center">
                        <Box sx={{ color: 'rgba(255,255,255,0.75)', display: 'flex' }}>{item.icon}</Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {item.text}
                        </Typography>
                      </Stack>
                    ))}
                    {redes.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ pt: 0.5 }}>
                        {redes.map((r) => (
                          <IconButton
                            key={r.label}
                            component="a"
                            href={r.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={r.label}
                            size="small"
                            sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff' } }}
                          >
                            {r.icon}
                          </IconButton>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Box>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mb: 1.5,
                      fontWeight: 700,
                      letterSpacing: 0,
                      textTransform: 'none',
                      color: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    La liga
                  </Typography>
                  <Stack spacing={{ xs: 1.5, md: 0.75 }}>
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
                          // Zona táctil de ~44 px sin alterar el aspecto: el dedo no acierta a un texto de 24 px.
                          '&::before': { content: '""', position: 'absolute', left: -4, right: -4, top: -9, bottom: -9 },
                        }}
                      >
                        {n.label}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Box>

              {/* Documentos legales: los administra el staff desde Configuración. */}
              {legalPages.length > 0 && (
                <Stack
                  component="nav"
                  aria-label="Información legal"
                  direction="row"
                  useFlexGap
                  flexWrap="wrap"
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                  columnGap={2.5}
                  rowGap={0.75}
                  sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {legalPages.map((p) => (
                    <Link
                      key={p.slug}
                      component="button"
                      type="button"
                      underline="hover"
                      onClick={() => navigate(legalPath(p.slug))}
                      sx={{
                        color: 'rgba(255,255,255,0.75)',
                        font: 'inherit',
                        fontSize: 13,
                        py: 1,
                        '&:hover': { color: '#fff' },
                      }}
                    >
                      {p.title}
                    </Link>
                  ))}
                </Stack>
              )}

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={legalPages.length > 0 ? undefined : { pt: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                  © {new Date().getFullYear()} {settings.legalName || settings.siteName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                  Developed with{' '}
                  <Link
                    href="https://www.instagram.com/enmarcm?cplk=OXFremx5NzJyNThs"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                    underline="hover"
                    sx={{ display: 'inline-block', py: 1.25 }}
                  >
                    Colina
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="https://www.instagram.com/royermerchan17?xtok=cnJ6dXFwYng3Zmk1"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                    underline="hover"
                    sx={{ display: 'inline-block', py: 1.25 }}
                  >
                    Merchan
                  </Link>
                </Typography>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};
