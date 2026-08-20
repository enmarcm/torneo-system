import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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

export const PUBLIC_SIDEBAR_WIDTH = 260;

interface Props {
  /** El panel se cierra al navegar: se abrió para ir a un lado, ya se fue. */
  onNavigate?: () => void;
}

/**
 * Panel de navegación del sitio público.
 *
 * No ocupa lugar: vive escondido y sale por encima del contenido cuando se
 * toca el botón de la barra superior. Eso es lo que le devuelve el ancho
 * completo de la pantalla a lo que el visitante vino a leer, que en un teléfono
 * en la cancha es todo lo que hay.
 *
 * Solo destinos: la marca, el interruptor de tema y la entrada a la sesión
 * viven en la barra superior, siempre a la vista sin abrir nada.
 *
 * El único dato que muestra por su cuenta es cuántos partidos hay en vivo,
 * porque es la respuesta que hace que alguien entre al sitio.
 */
export const PublicSidebar: React.FC<Props> = ({ onNavigate }) => {
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
        width: PUBLIC_SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        /*
          Velo, no panel: sale por encima del contenido y lo deja entrever. El
          desenfoque no es adorno — flota sobre lo que toque (tarjeta blanca,
          panel héroe, la foto de una competición) y sin él los rótulos se
          pierden sobre la mitad de esos fondos.
        */
        bgcolor: 'var(--railScrim)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderRight: '1px solid',
        borderColor: 'var(--sidebarBorder)',
        '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))':
          {
            bgcolor: 'var(--railScrimSolid)',
          },
      }}
    >
      <List sx={{ flex: 1, px: 1.25, py: 1.5 }}>
        {PUBLIC_NAV.map((item) => {
          const isActive = pathname === item.to;
          const isLiveItem = item.to === ROUTES.public.live && liveCount > 0;

          return (
            <ListItemButton
              key={item.to}
              onClick={() => go(item.to)}
              aria-current={isActive ? 'page' : undefined}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 44,
                px: 1.5,
                color: isActive ? 'primary.main' : 'var(--sidebarText)',
                bgcolor: isActive ? 'var(--sidebarActiveBg)' : 'transparent',
                transition: 'background-color 0.16s ease, color 0.16s ease',
                '&:hover': {
                  bgcolor: isActive ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)',
                  color: isActive ? 'primary.main' : 'var(--logo)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 1.75, color: 'inherit', '& svg': { fontSize: 21 } }}>
                {item.icon}
              </ListItemIcon>

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
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};
