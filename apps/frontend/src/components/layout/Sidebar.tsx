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
  MenuOpenRounded,
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
        p: 1.5,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 2, minHeight: 56 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'var(--brandGradient)',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
            fontFamily: '"Plus Jakarta Sans"',
          }}
        >
          L
        </Box>
        {!sidebarCollapsed && (
          <Typography sx={{ color: '#fff', fontWeight: 800, fontFamily: '"Plus Jakarta Sans"' }} noWrap>
            LigaApp
          </Typography>
        )}
      </Box>

      <List sx={{ flex: 1, mt: 1, overflow: 'auto' }}>
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + '/');
          const btn = (
            <ListItemButton
              key={item.to}
              onClick={() => navigate(item.to)}
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                color: active ? 'var(--text)' : 'var(--sidebarText)',
                bgcolor: active ? 'var(--sidebarActiveBg)' : 'transparent',
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.18)' : 'none',
                '&:hover': { bgcolor: active ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)' },
                px: 1.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 1.5,
                  color: active ? 'var(--primary)' : 'inherit',
                  '& svg': { fontSize: 22 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
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

      <Divider sx={{ borderColor: 'var(--sidebarHover)', my: 1 }} />

      <ListItemButton onClick={toggleSidebar} sx={{ borderRadius: 2.5, color: 'var(--sidebarText)', px: 1.5 }}>
        <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit' }}>
          <MenuOpenRounded />
        </ListItemIcon>
        {!sidebarCollapsed && <ListItemText primary="Colapsar" />}
      </ListItemButton>
      <ListItemButton onClick={toggleMode} sx={{ borderRadius: 2.5, color: 'var(--sidebarText)', px: 1.5 }}>
        <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit' }}>
          {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
        </ListItemIcon>
        {!sidebarCollapsed && <ListItemText primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} />}
      </ListItemButton>
      <ListItemButton onClick={logout} sx={{ borderRadius: 2.5, color: 'var(--danger)', px: 1.5 }}>
        <ListItemIcon sx={{ minWidth: 0, mr: sidebarCollapsed ? 0 : 1.5, color: 'inherit' }}>
          <LogoutRounded />
        </ListItemIcon>
        {!sidebarCollapsed && <ListItemText primary="Cerrar sesión" />}
      </ListItemButton>

      {!sidebarCollapsed && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 1.5,
            mt: 1,
            borderTop: '1px solid var(--sidebarHover)',
          }}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontWeight: 700 }}>
            {user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600 }} noWrap>
              {user?.email}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'var(--sidebarText)' }}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Líder de equipo'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};
