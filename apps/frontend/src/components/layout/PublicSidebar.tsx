import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Stack,
  Typography,
} from '@mui/material';
import {
  HomeRounded,
  EmojiEventsRounded,
  CalendarMonthRounded,
  LiveTvRounded,
  BarChartRounded,
  GroupsRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { usePublicEditionsQuery, usePublicMatchesQuery } from '@/hooks/queries';
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
/** Plegada: solo iconos, con el rótulo en el tooltip. */
export const PUBLIC_SIDEBAR_RAIL = 76;

interface Props {
  /** Riel de iconos en lugar de columna con rótulos. Nunca en el cajón de teléfono. */
  collapsed?: boolean;
  /** En móvil el cajón tiene que cerrarse al navegar. */
  onNavigate?: () => void;
}

/**
 * Navegación lateral del sitio público.
 *
 * Solo destinos: la marca, el interruptor de tema y la entrada a la sesión
 * viven en la barra superior. Eso es lo que le permite plegarse a un riel de
 * iconos sin esconder nada que el visitante necesite.
 *
 * El único dato que la columna muestra por su cuenta es cuántos partidos hay
 * en vivo, porque es la respuesta que hace que alguien entre al sitio y no
 * debería obligar a abrir una pantalla para verla.
 */
export const PublicSidebar: React.FC<Props> = ({ collapsed = false, onNavigate }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  /*
    Consultas compartidas con la portada y la pantalla de en vivo: react-query
    las resuelve por clave, así que acá no cuestan una petición nueva. El socket
    del layout las invalida cuando un partido arranca o termina.
  */
  const { data: editions = [] } = usePublicEditionsQuery();
  const active =
    editions.find((e: { status: string }) => e.status === 'ACTIVE') ?? editions[0];
  const { data: liveMatches = [] } = usePublicMatchesQuery(undefined, 'LIVE', active?.id);
  /*
    Hasta que la edición resuelve, la consulta vuelve sin acotar y trae partidos
    de temporadas viejas: el contador parpadearía con un número que no es el que
    muestran la portada ni la pantalla de en vivo.
  */
  const liveCount = active?.id ? liveMatches.length : 0;

  const go = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <Box
      component="nav"
      aria-label="Navegación principal"
      sx={{
        width: collapsed ? PUBLIC_SIDEBAR_RAIL : PUBLIC_SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--sidebar)',
        borderRight: '1px solid',
        borderColor: 'var(--sidebarBorder)',
        overflowX: 'hidden',
        transition: (t) =>
          t.transitions.create('width', {
            duration: t.transitions.duration.shortest,
            easing: t.transitions.easing.easeOut,
          }),
      }}
    >
      <List sx={{ flex: 1, px: collapsed ? 1 : 1.25, py: 1.5 }}>
        {PUBLIC_NAV.map((item) => {
          const isActive = pathname === item.to;
          const isLiveItem = item.to === ROUTES.public.live && liveCount > 0;

          const row = (
            <ListItemButton
              onClick={() => go(item.to)}
              aria-current={isActive ? 'page' : undefined}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 44,
                px: collapsed ? 0 : 1.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'primary.main' : 'var(--sidebarText)',
                bgcolor: isActive ? 'var(--sidebarActiveBg)' : 'transparent',
                transition: 'background-color 0.16s ease, color 0.16s ease',
                '&:hover': {
                  bgcolor: isActive ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)',
                  color: isActive ? 'primary.main' : 'var(--logo)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 1.75,
                  color: 'inherit',
                  position: 'relative',
                  '& svg': { fontSize: 21 },
                }}
              >
                {item.icon}
                {/* Plegada no hay lugar para el contador: queda el latido. */}
                {isLiveItem && collapsed && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -3,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'var(--live)',
                      boxShadow: '0 0 0 2px var(--sidebar)',
                      animation: 'pulse 1.4s infinite',
                    }}
                  />
                )}
              </ListItemIcon>

              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 14,
                      noWrap: true,
                    }}
                  />
                  {isLiveItem && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.625}
                      sx={{
                        px: 0.875,
                        height: 20,
                        borderRadius: 999,
                        bgcolor: 'var(--live)',
                        color: 'var(--liveOn)',
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: 'currentColor',
                          animation: 'pulse 1.4s infinite',
                        }}
                      />
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {liveCount}
                      </Typography>
                    </Stack>
                  )}
                </>
              )}
            </ListItemButton>
          );

          if (!collapsed) return <Box key={item.to}>{row}</Box>;

          const tip = isLiveItem ? item.label + ' · ' + liveCount + ' ahora' : item.label;
          return (
            <Tooltip key={item.to} title={tip} placement="right" arrow>
              <Box>{row}</Box>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );
};
