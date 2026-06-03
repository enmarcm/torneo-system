import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

// Por ahora usa el mismo Sidebar genérico; se puede especializar luego con un TeamSidebar.
export const TeamLayout: React.FC = () => (
  <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
    <Sidebar />
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <Box sx={{ p: { xs: 2, md: 4 }, flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  </Box>
);
