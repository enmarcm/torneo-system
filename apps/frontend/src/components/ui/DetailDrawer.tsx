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
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, maxWidth: '100vw', height: '100dvh', borderRadius: 0, overflowWrap: 'anywhere' } }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <IconButton onClick={onClose} aria-label="Cerrar" sx={{ flexShrink: 0, minWidth: 44, minHeight: 44 }}><CloseRounded /></IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto', minHeight: 0, flex: 1 }}>{children}</Box>
      {actions && <><Divider /><Box sx={{ p: 2, pb: 'max(16px, env(safe-area-inset-bottom))', display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'flex-end', flexShrink: 0 }}>{actions}</Box></>}
    </Drawer>
  );
}
