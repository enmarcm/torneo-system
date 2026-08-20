import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  MenuRounded,
  MenuOpenRounded,
  LightModeRounded,
  DarkModeRounded,
  LoginRounded,
} from '@mui/icons-material';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logoAzul from '@/assets/logo_azul.PNG';
import logoBlanco from '@/assets/logo.PNG';
import { ROUTES } from '@/routes/routes';
import { useGlobalStore } from '@/store/useGlobalStore';

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
  const isDark = mode === 'dark';
  /*
    framer-motion no lo apaga la regla CSS de movimiento reducido: es JS. Hay
    que preguntarlo a mano, como en el resto del sitio.
  */
  const reduceMotion = useReducedMotion();
  // El logotipo tiene que contrastar con la barra, que cambia con el tema.
  const logoSrc = isDark ? logoBlanco : logoAzul;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'var(--sidebar)',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'var(--sidebarBorder)',
        // Por encima de la columna lateral: la barra cruza la pantalla entera.
        zIndex: (t) => t.zIndex.drawer + 2,
      }}
    >
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
            sx={{ color: 'var(--sidebarText)' }}
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
              color: 'var(--logo)',
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
            sx={{ color: 'var(--sidebarText)', '&:hover': { color: 'var(--logo)' } }}
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

        <Button
          variant="contained"
          onClick={() => navigate(ROUTES.login)}
          startIcon={<LoginRounded sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
          sx={{
            flexShrink: 0,
            ml: { xs: 0.25, md: 0.5 },
            px: { xs: 1.5, md: 2.25 },
            py: { xs: 0.75, md: 1 },
            fontSize: { xs: 13, md: 14 },
            whiteSpace: 'nowrap',
            '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: 0 },
          }}
        >
          Iniciar sesión
        </Button>
      </Toolbar>
    </AppBar>
  );
};
