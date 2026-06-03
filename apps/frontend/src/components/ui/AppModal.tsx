import { Modal, Box, Typography, IconButton, Stack } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: number;
}

export const AppModal: React.FC<Props> = ({ open, onClose, title, subtitle, children, actions, maxWidth = 560 }) => (
  <Modal open={open} onClose={onClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      sx={{
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 4,
        p: { xs: 2.5, md: 3 },
        outline: 'none',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
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
      <Box>{children}</Box>
      {actions && (
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          {actions}
        </Stack>
      )}
    </Box>
  </Modal>
);
