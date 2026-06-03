import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Drawer } from '@mui/material';

export const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && <Sidebar />}
      {isMobile && (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { bgcolor: 'var(--sidebar)', borderRadius: 0 } }}>
          <Box sx={{ width: 264 }}><Sidebar /></Box>
        </Drawer>
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1 }}><Outlet /></Box>
      </Box>
    </Box>
  );
};
