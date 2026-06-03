import { Box, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, Tooltip, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeRounded,
  PersonRounded,
  BarChartRounded,
  HistoryRounded,
  SwapHorizRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
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
  { label: 'Jugadores', icon: <PersonRounded />, to: ROUTES.team.squads },
  { label: 'Estadísticas', icon: <BarChartRounded />, to: ROUTES.team.stats },
  { label: 'Historial', icon: <HistoryRounded />, to: ROUTES.team.history },
  { label: 'Traspasos', icon: <SwapHorizRounded />, to: ROUTES.team.transfers },
];

export const TeamSidebar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, mode, toggleMode } = useGlobalStore();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const W = sidebarCollapsed ? 64 : 264;

  const isActive = (item: NavItem) => pathname === item.to || pathname.startsWith(item.to + '/');

  const content = (
    <Box
      sx={{
        width: sidebarCollapsed ? 64 : 264,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: sidebarCollapsed ? 1 : 2, py: 2, minHeight: 64 }}>
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
        {!sidebarCollapsed && (
          <Typography sx={{ color: 'var(--logo)', fontWeight: 700, fontFamily: '"Inter", system-ui, sans-serif', fontSize: 16 }} noWrap>
            Mi Equipo
          </Typography>
        )}
      </Box>

      <List sx={{ flex: 1, overflow: 'auto', px: sidebarCollapsed ? 0.5 : 1, '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--sidebarBorder)', borderRadius: 4 } }}>
        {NAV.map((item) => {
          const active = isActive(item);
          const btn = (
            <ListItemButton
              key={item.to}
              onClick={() => navigate(item.to)}
              sx={{
                borderRadius: sidebarCollapsed ? 1 : 1.5,
                mb: 0.25,
                py: 0.75,
                color: active ? 'var(--primary)' : 'var(--sidebarText)',
                bgcolor: active ? 'var(--sidebarActiveBg)' : 'transparent',
                '&:hover': { bgcolor: active ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)' },
                px: sidebarCollapsed ? 0.75 : 1.5,
                minHeight: 40,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 1.5,
                  color: active ? 'var(--primary)' : 'inherit',
                  '& svg': { fontSize: 20 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14, fontFamily: '"Inter", system-ui, sans-serif', noWrap: true }}
                />
              )}
            </ListItemButton>
          );
          return sidebarCollapsed ? (
            <Tooltip key={item.to} title={item.label} placement="right" arrow>
              {btn}
            </Tooltip>
          ) : (
            btn
          );
        })}
      </List>

      <Box sx={{ display: 'flex', flexDirection: 'column', px: sidebarCollapsed ? 0.5 : 1, py: 0.75, gap: 0.25 }}>
        <Tooltip title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'} placement="right" arrow>
          <ListItemButton
            onClick={toggleSidebar}
            sx={{
              borderRadius: sidebarCollapsed ? 1 : 1.5,
              color: 'var(--sidebarText)',
              px: sidebarCollapsed ? 0.75 : 1.5,
              py: 0.5,
              minHeight: 36,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              '&:hover': { bgcolor: 'var(--sidebarHover)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
              {sidebarCollapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
            </ListItemIcon>
            {!sidebarCollapsed && <ListItemText primary="Colapsar" primaryTypographyProps={{ fontSize: 13, fontFamily: '"Inter", system-ui, sans-serif' }} />}
          </ListItemButton>
        </Tooltip>
        <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} placement="right" arrow>
          <ListItemButton
            onClick={toggleMode}
            sx={{
              borderRadius: sidebarCollapsed ? 1 : 1.5,
              color: 'var(--sidebarText)',
              px: sidebarCollapsed ? 0.75 : 1.5,
              py: 0.5,
              minHeight: 36,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              '&:hover': { bgcolor: 'var(--sidebarHover)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
              {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
            </ListItemIcon>
            {!sidebarCollapsed && <ListItemText primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} primaryTypographyProps={{ fontSize: 13, fontFamily: '"Inter", system-ui, sans-serif' }} />}
          </ListItemButton>
        </Tooltip>
      </Box>

      {user && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: sidebarCollapsed ? 0 : 1,
            px: sidebarCollapsed ? 0.75 : 1.5,
            py: 1.25,
            borderTop: '1px solid var(--sidebarBorder)',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
            {user.email?.[0]?.toUpperCase()}
          </Avatar>
          {!sidebarCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: 'var(--logo)', fontSize: 12, fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif' }} noWrap>
                {user.email}
              </Typography>
              <Typography sx={{ fontSize: 10, color: 'var(--sidebarText)' }}>Líder de equipo</Typography>
            </Box>
          )}
          <Tooltip title="Cerrar sesión" placement="right" arrow>
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
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <motion.div
      animate={{ width: W }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 1200,
        overflow: 'hidden',
      }}
    >
      {content}
    </motion.div>
  );
};
