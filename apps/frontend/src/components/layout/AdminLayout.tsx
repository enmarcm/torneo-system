import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageLoader } from '@/components/ui/PageLoader';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { RouteProgressSignal } from '@/components/ui/RouteProgress';
import { isMatchRoute } from '@/routes/routes';
import { useGlobalStore } from '@/store/useGlobalStore';

export const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { sidebarCollapsed } = useGlobalStore();
  const sidebarWidth = sidebarCollapsed ? 64 : 264;

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default', width: '100%', [theme.breakpoints.down('sm')]: {
      '& .MuiButton-root, & .MuiIconButton-root': { minHeight: 44 },
      '& .MuiIconButton-root': { minWidth: 44 },
      '& .MuiInputBase-input': { fontSize: 16 },
      '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1, px: 0, py: 1 },
      '& .MuiTablePagination-spacer': { display: 'none' },
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { m: 0 },
      '& .MuiTablePagination-actions': { ml: 0 },
    } }}>
      {!isMobile && <Sidebar />}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { bgcolor: 'var(--sidebar)', borderRadius: 0 } }}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
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
        <Box component="main" className="llf-page" key={pathname} sx={{ p: { xs: 2, md: 4 }, pb: { xs: 'max(16px, env(safe-area-inset-bottom))', md: 4 }, flex: 1, minWidth: 0, width: '100%', overflowWrap: 'anywhere', '& .MuiGrid2-root': { minWidth: 0 } }}>
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
    </Box>
  );
};
