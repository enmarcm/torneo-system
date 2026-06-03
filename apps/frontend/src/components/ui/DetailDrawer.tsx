import { Drawer, Box, IconButton, Typography, Divider } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DetailDrawer({ open, onClose, title, subtitle, actions, children }: Props) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <IconButton onClick={onClose}><CloseRounded /></IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>{children}</Box>
      {actions && <><Divider /><Box sx={{ p: 2.5, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>{actions}</Box></>}
    </Drawer>
  );
}
