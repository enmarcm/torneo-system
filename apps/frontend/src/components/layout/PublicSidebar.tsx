import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import {
  HomeRounded,
  EmojiEventsRounded,
  CalendarMonthRounded,
  LiveTvRounded,
  BarChartRounded,
  GroupsRounded,
  LoginRounded,
  LightModeRounded,
  DarkModeRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import logoAzul from '@/assets/logo_azul.PNG';
import logoBlanco from '@/assets/logo.PNG';
import { ROUTES } from '@/routes/routes';
import { useGlobalStore } from '@/store/useGlobalStore';
import type { ReactNode } from 'react';

export interface PublicNavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

/** Recorrido público, en el orden en que le sirve al visitante. */
export const PUBLIC_NAV: PublicNavItem[] = [
  { label: 'Inicio', to: ROUTES.public.home, icon: <HomeRounded /> },
  { label: 'Competiciones', to: ROUTES.public.competitions, icon: <EmojiEventsRounded /> },
  { label: 'Calendario', to: ROUTES.public.schedule, icon: <CalendarMonthRounded /> },
  { label: 'En vivo', to: ROUTES.public.live, icon: <LiveTvRounded /> },
  { label: 'Estadísticas', to: ROUTES.public.stats, icon: <BarChartRounded /> },
  { label: 'Equipos', to: ROUTES.public.teams, icon: <GroupsRounded /> },
];

export const PUBLIC_SIDEBAR_WIDTH = 244;

interface Props {
  /** En móvil el cajón tiene que cerrarse al navegar. */
  onNavigate?: () => void;
}

/**
 * Navegación lateral del sitio público.
 *
 * Reemplaza a la barra superior: con seis destinos, una columna los muestra
 * todos a la vez con su icono y deja el ancho completo de la pantalla para el
 * contenido, en lugar de repartir los enlaces en una fila que en teléfono
 * terminaba escondida detrás de una hamburguesa.
 */
export const PublicSidebar: React.FC<Props> = ({ onNavigate }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mode, toggleMode } = useGlobalStore();
  // El logotipo tiene que contrastar con el fondo de la barra, que cambia con el tema.
  const logoSrc = mode === 'dark' ? logoBlanco : logoAzul;

  const go = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <Box
      sx={{
        width: PUBLIC_SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--sidebar)',
        borderRight: '1px solid',
        borderColor: 'var(--sidebarBorder)',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 2, minHeight: 72, cursor: 'pointer' }}
        onClick={() => go(ROUTES.public.home)}
      >
        <Box
          component="img"
          src={logoSrc}
          alt="Liga Lago Futsal"
          sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
        />
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: 15,
            lineHeight: 1.15,
            color: 'var(--logo)',
          }}
        >
          Liga Lago
          <br />
          Futsal
        </Typography>
      </Stack>

      <Divider sx={{ borderColor: 'var(--sidebarBorder)' }} />

      <List sx={{ flex: 1, px: 1, pt: 1.5 }}>
        {PUBLIC_NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              onClick={() => go(item.to)}
              sx={{
                borderRadius: 1.5,
                mb: 0.25,
                minHeight: 42,
                color: active ? 'primary.main' : 'var(--sidebarText)',
                bgcolor: active ? 'var(--sidebarActiveBg)' : 'transparent',
                '&:hover': { bgcolor: active ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'var(--sidebarBorder)' }} />

      <Stack spacing={1} sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={toggleMode}
          sx={{
            borderRadius: 1.5,
            minHeight: 40,
            color: 'var(--sidebarText)',
            '&:hover': { bgcolor: 'var(--sidebarHover)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
            {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
          </ListItemIcon>
          <ListItemText
            primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
          />
        </ListItemButton>

        <Button
          variant="contained"
          fullWidth
          startIcon={<LoginRounded />}
          onClick={() => go(ROUTES.login)}
        >
          Iniciar sesión
        </Button>
      </Stack>
    </Box>
  );
};
