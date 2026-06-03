import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TeamSidebar } from './TeamSidebar';
import { Topbar } from './Topbar';
import { useGlobalStore } from '@/store/useGlobalStore';

export const TeamLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
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
        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
