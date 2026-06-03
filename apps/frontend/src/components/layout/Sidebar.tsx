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
  const { sidebarCollapsed, mode, toggleMode } = useGlobalStore();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const expanded = !sidebarCollapsed;

  const isActive = (item: NavItem) => {
    if (item.to === '/admin') return pathname === '/admin';
    return pathname === item.to || pathname.startsWith(item.to + '/');
  };

  return (
    <motion.div
      animate={{ width: expanded ? 264 : 64 }}
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
      <Box
        sx={{
          width: expanded ? 264 : 64,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: expanded ? 2 : 1, py: 2, minHeight: 64, justifyContent: expanded ? 'flex-start' : 'center' }}>
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
          {expanded && (
            <Typography sx={{ color: 'var(--logo)', fontWeight: 700, fontFamily: '"Inter", system-ui, sans-serif', fontSize: 16, whiteSpace: 'nowrap' }} noWrap>
              Liga Lago Futsal
            </Typography>
          )}
        </Box>

        <List sx={{ flex: 1, overflow: 'auto', px: expanded ? 1 : 0.5, '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--sidebarBorder)', borderRadius: 4 } }}>
          {NAV.map((item) => {
            const active = isActive(item);
            const btn = (
              <ListItemButton
                key={item.to}
                onClick={() => navigate(item.to)}
                sx={{
                  borderRadius: expanded ? 1.5 : 1,
                  mb: 0.25,
                  py: 0.75,
                  color: active ? 'var(--primary)' : 'var(--sidebarText)',
                  bgcolor: active ? 'var(--sidebarActiveBg)' : 'transparent',
                  '&:hover': { bgcolor: active ? 'var(--sidebarActiveBg)' : 'var(--sidebarHover)' },
                  px: expanded ? 1.5 : 0.75,
                  minHeight: 40,
                  justifyContent: expanded ? 'flex-start' : 'center',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: expanded ? 1.5 : 0,
                    color: active ? 'var(--primary)' : 'inherit',
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {expanded && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14, fontFamily: '"Inter", system-ui, sans-serif', noWrap: true }}
                  />
                )}
              </ListItemButton>
            );
            return expanded ? btn : (
              <Tooltip key={item.to} title={item.label} placement="right" arrow>
                {btn}
              </Tooltip>
            );
          })}
        </List>

        {expanded && (
          <>
            <Divider sx={{ borderColor: 'var(--sidebarBorder)', mx: 1.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', px: 1, py: 0.75, gap: 0.25 }}>
              <ListItemButton onClick={toggleMode} sx={{ borderRadius: 1.5, color: 'var(--sidebarText)', px: 1.5, py: 0.5, minHeight: 36, '&:hover': { bgcolor: 'var(--sidebarHover)' } }}>
                <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit', '& svg': { fontSize: 20 } }}>
                  {mode === 'dark' ? <LightModeRounded /> : <DarkModeRounded />}
                </ListItemIcon>
                <ListItemText primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} primaryTypographyProps={{ fontSize: 13, fontFamily: '"Inter", system-ui, sans-serif' }} />
              </ListItemButton>
            </Box>
            <Divider sx={{ borderColor: 'var(--sidebarBorder)', mx: 1.5 }} />
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25 }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {user.email?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: 'var(--logo)', fontSize: 12, fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif' }} noWrap>
                    {user.email.toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: 'var(--sidebarText)' }}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Líder de equipo'}
                  </Typography>
                </Box>
                <Tooltip title="Cerrar sesión" placement="right" arrow>
                  <IconButton
                    onClick={logout}
                    size="small"
                    sx={{ color: 'var(--sidebarText)', '&:hover': { color: 'var(--danger)', bgcolor: 'var(--sidebarHover)' }, flexShrink: 0, minWidth: 28, minHeight: 28 }}
                  >
                    <LogoutRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </>
        )}
      </Box>
    </motion.div>
  );
};
