import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MenuRounded,
  MenuOpenRounded,
  LightModeRounded,
  DarkModeRounded,
} from '@mui/icons-material';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoAzul from '@/assets/logo_azul.PNG';
import logoBlanco from '@/assets/logo.PNG';
import { ROUTES } from '@/routes/routes';
import { useGlobalStore } from '@/store/useGlobalStore';
import { RouteProgress } from '@/components/ui/RouteProgress';

/** Alto de la barra. Es el desplazamiento de todo lo que va debajo, así que vive acá. */
export const PUBLIC_TOPBAR_H = { xs: 60, md: 72 };

interface Props {
  /** Abre o cierra el panel de navegación, que vive escondido. */
  onToggleNav: () => void;
  /** Solo para el icono y el rótulo del botón. */
  navExpanded: boolean;
}

/**
 * Barra superior del sitio público.
 *
 * Carga lo que es del sitio entero y no del recorrido: la marca, el tema y la
 * entrada al panel. Al sacarlos de la columna lateral, esa columna queda
 * siendo solo navegación y puede plegarse a un riel de iconos sin que se
 * pierda ni el logo ni el botón de sesión.
 */
export const PublicTopbar: React.FC<Props> = ({ onToggleNav, navExpanded }) => {
  const navigate = useNavigate();
  const { mode, toggleMode } = useGlobalStore();
  const heroActive = useGlobalStore((s) => s.publicHeroActive);
  const isDark = mode === 'dark';

  /*
    La barra se apoya sobre la portada mientras esta la esté cubriendo, y recién
    ahí puede ser transparente. La portada mide una pantalla y arranca pegada
    arriba, así que deja de taparla en cuanto se baja más de una pantalla menos
    el alto de la propia barra.
  */
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    if (!heroActive) return;
    const alto = () =>
      window.innerWidth >= 900 ? PUBLIC_TOPBAR_H.md : PUBLIC_TOPBAR_H.xs;
    const check = () => setPastHero(window.scrollY > window.innerHeight - alto());
    check();
    // `passive`: no se cancela el scroll, y así no se le pega al hilo de pintado.
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [heroActive]);

  /*
    Transparente solo cuando hay portada debajo sosteniendo el contraste. En
    cualquier otra pantalla la barra es la de siempre: sin fondo propio, el
    texto quedaría sobre el contenido que pase por abajo.
  */
  const sobreHero = heroActive && !pastHero;
  // Sobre la portada, oscura y con velo, todo va en blanco.
  const tinta = sobreHero ? '#fff' : 'var(--sidebarText)';
  /*
    framer-motion no lo apaga la regla CSS de movimiento reducido: es JS. Hay
    que preguntarlo a mano, como en el resto del sitio.
  */
  const reduceMotion = useReducedMotion();
  // El logotipo tiene que contrastar con lo que tenga detrás: el tema, o la
  // portada oscura cuando la barra se apoya sobre ella.
  const logoSrc = isDark || sobreHero ? logoBlanco : logoAzul;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: sobreHero ? 'transparent' : 'var(--sidebar)',
        color: sobreHero ? '#fff' : 'text.primary',
        borderBottom: '1px solid',
        borderColor: sobreHero ? 'transparent' : 'var(--sidebarBorder)',
        // Por encima de la columna lateral: la barra cruza la pantalla entera.
        zIndex: (t) => t.zIndex.drawer + 2,
        // El cambio al pasar la portada se acompaña; de golpe se lee como un parpadeo.
        transition: 'background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* Línea naranja de progreso al cambiar de sección; pegada al borde superior. */}
      <RouteProgress />
      <Toolbar
        sx={{
          minHeight: { xs: PUBLIC_TOPBAR_H.xs, md: PUBLIC_TOPBAR_H.md },
          px: { xs: 1, md: 2 },
          gap: { xs: 0.5, md: 1 },
        }}
      >
        <Tooltip title={navExpanded ? 'Cerrar menú' : 'Abrir menú'}>
          <IconButton
            onClick={onToggleNav}
            aria-label={navExpanded ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={navExpanded}
            sx={{ color: tinta, transition: 'color 0.25s ease' }}
          >
            {navExpanded ? <MenuOpenRounded /> : <MenuRounded />}
          </IconButton>
        </Tooltip>

        <Stack
          direction="row"
          alignItems="center"
          spacing={{ xs: 1, md: 1.25 }}
          component="a"
          href={ROUTES.public.home}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            navigate(ROUTES.public.home);
          }}
          sx={{
            minWidth: 0,
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: 2,
            px: 0.5,
            py: 0.5,
            transition: 'opacity 0.18s ease',
            '&:hover': { opacity: 0.75 },
          }}
        >
          <Box
            component="img"
            src={logoSrc}
            alt=""
            sx={{
              width: { xs: 32, md: 38 },
              height: { xs: 32, md: 38 },
              borderRadius: '50%',
              flexShrink: 0,
              /* Sobre el casi negro el escudo redondo flota; el filo lo apoya. */
              boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.12)' : 'none',
            }}
          />
          <Typography
            component="span"
            noWrap
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: { xs: 15, md: 17 },
              letterSpacing: '-0.01em',
              color: sobreHero ? '#fff' : 'var(--logo)',
              transition: 'color 0.25s ease',
              // Sobre la foto el blanco necesita apoyo para no diluirse.
              textShadow: sobreHero ? '0 1px 10px rgba(0,0,0,0.45)' : 'none',
            }}
          >
            {/* En teléfono la sigla; el nombre entero empuja al botón de sesión fuera. */}
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              LLF
            </Box>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Liga Lago Futsal
            </Box>
          </Typography>
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton
            onClick={toggleMode}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            sx={{
              color: tinta,
              transition: 'color 0.25s ease',
              '&:hover': { color: sobreHero ? '#fff' : 'var(--logo)' },
            }}
          >
            {/*
              El único momento animado de la barra: el icono gira mientras el
              tema cambia, así el interruptor se siente accionado y no recargado.
            */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mode}
                initial={reduceMotion ? false : { rotate: -70, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { rotate: 70, opacity: 0, scale: 0.7 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex' }}
              >
                {isDark ? <LightModeRounded /> : <DarkModeRounded />}
              </motion.span>
            </AnimatePresence>
          </IconButton>
        </Tooltip>

        {/*
          El acceso al panel administrativo vive en el menú lateral. Acá ocupaba
          el rincón más visible de un sitio que es para el público, y su rótulo
          entero no entraba en la barra de un teléfono.
        */}
      </Toolbar>
    </AppBar>
  );
};
