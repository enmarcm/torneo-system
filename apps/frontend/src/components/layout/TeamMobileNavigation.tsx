import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { HomeRounded, GroupsRounded, EmojiEventsRounded } from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';

export function TeamMobileNavigation() {
  const { pathname } = useLocation();
  return <Paper component="nav" aria-label="Navegación principal del equipo" elevation={0} sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.appBar, borderRadius: 0, borderTop: '1px solid', borderColor: 'divider', pb: 'env(safe-area-inset-bottom)' }}>
    <BottomNavigation value={pathname} showLabels sx={{ height: 64, '& .MuiBottomNavigationAction-root': { minWidth: 0, minHeight: 44 }, '& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected': { fontSize: 12 } }}>
      <BottomNavigationAction component={RouterLink} to={ROUTES.team.home} value={ROUTES.team.home} label="Inicio" icon={<HomeRounded />} aria-current={pathname === ROUTES.team.home ? 'page' : undefined} />
      <BottomNavigationAction component={RouterLink} to={ROUTES.team.players} value={ROUTES.team.players} label="Jugadores" icon={<GroupsRounded />} aria-current={pathname === ROUTES.team.players ? 'page' : undefined} />
      <BottomNavigationAction component={RouterLink} to={ROUTES.team.squads} value={ROUTES.team.squads} label="Mis torneos" icon={<EmojiEventsRounded />} aria-current={pathname === ROUTES.team.squads ? 'page' : undefined} />
    </BottomNavigation>
  </Paper>;
}
