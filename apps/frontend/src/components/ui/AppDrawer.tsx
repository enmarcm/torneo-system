import { Drawer, Box, Typography, IconButton, Stack, Divider } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export const AppDrawer: React.FC<Props> = ({ open, onClose, title, subtitle, children, footer, width = 420 }) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{ sx: { width: { xs: '100%', sm: width } } }}
  >
    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h3">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="Cerrar" size="small">
          <CloseRounded />
        </IconButton>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>
      {footer && (
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>{footer}</Box>
      )}
    </Box>
  </Drawer>
);
