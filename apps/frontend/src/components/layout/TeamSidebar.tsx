import { Box, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, IconButton, Divider } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeRounded,
  PersonRounded,
  GroupRounded,
  BarChartRounded,
  HistoryRounded,
  SwapHorizRounded,
  SportsSoccerRounded,
  LightModeRounded,
  DarkModeRounded,
  LogoutRounded,
} from '@mui/icons-material';
import { ROUTES } from '@/routes/routes';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  icon: ReactNode;
  to: string;
}

const NAV: NavItem[] = [
  { label: 'Inicio', icon: <HomeRounded />, to: ROUTES.team.home },
  { label: 'Jugadores', icon: <PersonRounded />, to: ROUTES.team.players },
  { label: 'Plantillas', icon: <GroupRounded />, to: ROUTES.team.squads },
  { label: 'Partidos', icon: <SportsSoccerRounded />, to: ROUTES.team.matches },
  { label: 'Estadísticas', icon: <BarChartRounded />, to: ROUTES.team.stats },
  { label: 'Historial', icon: <HistoryRounded />, to: ROUTES.team.history },
  { label: 'Traspasos', icon: <SwapHorizRounded />, to: ROUTES.team.transfers },
];

const SIDEBAR_WIDTH = 264;

export const TeamSidebar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mode, toggleMode } = useGlobalStore();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const isActive = (item: NavItem) => {
    if (item.to === '/equipo') return pathname === '/equipo';
    return pathname === item.to || pathname.startsWith(item.to + '/');
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--sidebar)',
        color: 'var(--sidebarText)',
        borderRight: '1px solid var(--sidebarBorder)',
        overflow: 'hidden',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--sidebarBorder)', borderRadius: 4 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 2, minHeight: 64 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            background: 'var(--brandGradient)',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 16,
          }}
        >
          L
        </Box>
        <Typography
          sx={{ color: 'var(--logo)', fontWeight: 700, fontFamily: '"Inter", system-ui, sans-serif', fontSize: 16 }}
          noWrap
        >
          Mi Equipo
        </Typography>
      </Box>

      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--sidebarBorder)', borderRadius: 4 },
        }}
      >
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <ListItemButton
              key={item.to}
              onClick={() => navigate(item.to)}
              sx={{
                borderRadius: 1.5,
                mb: 0.25,
                py: 0.75,
                color: active ? 'var(--primary)' : 'var(--sidebarText)',
                bgcolor: active ? 'var(--sidebarActiveBg)' : 'transparent',
                '&:hover': { bgcolor: active ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)' },
                px: 1.5,
                minHeight: 40,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 1.5,
                  color: active ? 'var(--primary)' : 'inherit',
                  '& svg': { fontSize: 20 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  noWrap: true,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'var(--sidebarBorder)', mx: 1.5 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', px: 1, py: 0.75, gap: 0.25 }}>
        <ListItemButton
          onClick={toggleMode}
          sx={{
            borderRadius: 1.5,
            color: 'var(--sidebarText)',
            px: 1.5,
            py: 0.5,
            minHeight: 36,
            '&:hover': { bgcolor: 'var(--sidebarHover)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
            {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
          </ListItemIcon>
          <ListItemText
            primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            primaryTypographyProps={{ fontSize: 13, fontFamily: '"Inter", system-ui, sans-serif' }}
          />
        </ListItemButton>
      </Box>
      <Divider sx={{ borderColor: 'var(--sidebarBorder)', mx: 1.5 }} />
      {user && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25 }}>
          <Avatar
            sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
          >
            {user.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ color: 'var(--logo)', fontSize: 12, fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif' }}
              noWrap
            >
              {user.email.toUpperCase()}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'var(--sidebarText)' }}>Líder de equipo</Typography>
          </Box>
          <IconButton
            onClick={logout}
            size="small"
            sx={{
              color: 'var(--sidebarText)',
              '&:hover': { color: 'var(--danger)', bgcolor: 'var(--sidebarHover)' },
              flexShrink: 0,
              minWidth: 28,
              minHeight: 28,
            }}
          >
            <LogoutRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};
