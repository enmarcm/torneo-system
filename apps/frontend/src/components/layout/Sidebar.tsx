import { Box, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, Tooltip, IconButton, Divider } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GridViewRounded,
  EmojiEventsRounded,
  CategoryRounded,
  SportsSoccerRounded,
  GroupsRounded,
  PersonRounded,
  CalendarMonthRounded,
  BarChartRounded,
  CampaignRounded,
  FactCheckRounded,
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
  { label: 'Dashboard', icon: <GridViewRounded />, to: ROUTES.admin.dashboard },
  { label: 'Ediciones', icon: <EmojiEventsRounded />, to: ROUTES.admin.editions },
  { label: 'Categorías', icon: <CategoryRounded />, to: ROUTES.admin.categories },
  { label: 'Competiciones', icon: <SportsSoccerRounded />, to: ROUTES.admin.competitions },
  { label: 'Equipos', icon: <GroupsRounded />, to: ROUTES.admin.teams },
  { label: 'Jugadores', icon: <PersonRounded />, to: ROUTES.admin.players },
  { label: 'Programación', icon: <CalendarMonthRounded />, to: ROUTES.admin.schedule },
  { label: 'Estadísticas', icon: <BarChartRounded />, to: ROUTES.admin.stats },
  { label: 'Publicidad', icon: <CampaignRounded />, to: ROUTES.admin.ads },
  { label: 'Auditoría', icon: <FactCheckRounded />, to: ROUTES.admin.audit },
];

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, mode, toggleMode } = useGlobalStore();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const W = sidebarCollapsed ? 80 : 264;

  return (
    <Box
      component={motion.aside}
      animate={{ width: W }}
      transition={{ duration: 0.2 }}
      sx={{
        width: W,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        bgcolor: 'var(--sidebar)',
        color: 'var(--sidebarText)',
        display: 'flex',
        flexDirection: 'column',
        p: 1,
        overflow: 'hidden',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 4 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1.5, minHeight: 48 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            background: 'var(--brandGradient)',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
            fontFamily: '"Plus Jakarta Sans"',
            fontSize: 16,
          }}
        >
          L
        </Box>
        {!sidebarCollapsed && (
          <Typography sx={{ color: '#fff', fontWeight: 800, fontFamily: '"Plus Jakarta Sans"', fontSize: 15 }} noWrap>
            LigaApp
          </Typography>
        )}
      </Box>

      <List sx={{ flex: 1, mt: 0.5, overflow: 'auto', '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 } }}>
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + '/');
          const btn = (
            <ListItemButton
              key={item.to}
              onClick={() => navigate(item.to)}
              sx={{
                borderRadius: 2,
                mb: 0.25,
                py: 0.5,
                color: active ? 'var(--text)' : 'var(--sidebarText)',
                bgcolor: active ? 'var(--sidebarActiveBg)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                '&:hover': { bgcolor: active ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)' },
                px: 1.5,
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
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
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

      <Divider sx={{ borderColor: 'var(--sidebarHover)', my: 0.75 }} />

      <Tooltip title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'} placement="right" arrow disableHoverListener={!sidebarCollapsed}>
        <ListItemButton onClick={toggleSidebar} sx={{ borderRadius: 2, color: 'var(--sidebarText)', px: 1.5, py: 0.5, '&:hover': { bgcolor: 'var(--sidebarHover)' } }}>
          <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
            {sidebarCollapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Colapsar" primaryTypographyProps={{ fontSize: 13 }} />}
        </ListItemButton>
      </Tooltip>

      <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} placement="right" arrow disableHoverListener={!sidebarCollapsed}>
        <ListItemButton onClick={toggleMode} sx={{ borderRadius: 2, color: 'var(--sidebarText)', px: 1.5, py: 0.5, '&:hover': { bgcolor: 'var(--sidebarHover)' } }}>
          <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
            {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} primaryTypographyProps={{ fontSize: 13 }} />}
        </ListItemButton>
      </Tooltip>

      <Tooltip title="Cerrar sesión" placement="right" arrow disableHoverListener={!sidebarCollapsed}>
        <ListItemButton onClick={logout} sx={{ borderRadius: 2, color: 'var(--danger)', px: 1.5, py: 0.5, '&:hover': { bgcolor: 'var(--sidebarHover)' } }}>
          <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
            <LogoutRounded />
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontSize: 13 }} />}
        </ListItemButton>
      </Tooltip>

      {user && (
        <Tooltip title={user.email} placement="right" arrow disableHoverListener={!sidebarCollapsed}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              mt: 0.5,
              borderTop: '1px solid var(--sidebarHover)',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'var(--sidebarHover)', borderRadius: 2 },
            }}
          >
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontWeight: 700, fontSize: 13 }}>
              {user?.email?.[0]?.toUpperCase()}
            </Avatar>
            {!sidebarCollapsed && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 600 }} noWrap>
                  {user?.email}
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'var(--sidebarText)' }}>
                  {user?.role === 'ADMIN' ? 'Administrador' : 'Líder de equipo'}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};
