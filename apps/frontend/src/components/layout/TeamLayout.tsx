import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useState, useEffect, Suspense } from 'react';
import { TeamMobileNavigation } from './TeamMobileNavigation';
import { Outlet, useLocation } from 'react-router-dom';
import { TeamSidebar } from './TeamSidebar';
import { Topbar } from './Topbar';
import { PageLoader } from '@/components/ui/PageLoader';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { RouteProgressSignal } from '@/components/ui/RouteProgress';
import { isMatchRoute } from '@/routes/routes';
import { useGlobalStore } from '@/store/useGlobalStore';

export const TeamLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const { sidebarCollapsed } = useGlobalStore();
  const sidebarWidth = sidebarCollapsed ? 64 : 264;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && <TeamSidebar />}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { bgcolor: 'var(--sidebar)', borderRadius: 0 } }}
        >
          <TeamSidebar />
        </Drawer>
      )}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          ml: { xs: 0, md: `${sidebarWidth}px` },
          transition: 'margin-left 0.2s ease-in-out',
        }}
      >
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        {/* Cada ruta monta de cero y entra en cascada; ver `.llf-page` en el tema. */}
        <Box className="llf-page" key={pathname} sx={{ p: { xs: 2, md: 4 }, pb: { xs: 'calc(88px + env(safe-area-inset-bottom))', md: 4 }, flex: 1 }}>
          <Suspense
            fallback={
              <>
                <RouteProgressSignal />
                {isMatchRoute(pathname) ? <MatchLoader minHeight="50vh" /> : <PageLoader minHeight="50vh" />}
              </>
            }
          >
            <Outlet />
          </Suspense>
        </Box>
      </Box>
      <TeamMobileNavigation />
    </Box>
  );
};
