import { Modal, Box, Typography, IconButton, Stack, useTheme } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { motion, useReducedMotion } from 'framer-motion';
import { useId, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: number;
}

export const AppModal: React.FC<Props> = ({ open, onClose, title, subtitle, children, actions, maxWidth = 560 }) => {
  // Sin esto el diálogo se abre sin nombre: el lector de pantalla anuncia
  // "diálogo" y nada más, aunque el título esté dibujado dos líneas abajo.
  const titleId = useId();
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  return (
  <Modal
    open={open}
    onClose={onClose}
    aria-labelledby={titleId}
    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, sm: 2 } }}
  >
    <Box
      component={motion.div}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      sx={{
        width: '100%',
        maxWidth,
        maxHeight: { xs: 'calc(100dvh - 16px)', sm: '90dvh' },
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 4,
        p: { xs: 2, md: 3 },
        overflowWrap: 'anywhere',
        [theme.breakpoints.down('sm')]: {
          '& .MuiButton-root, & .MuiIconButton-root': { minHeight: 44 },
          '& .MuiIconButton-root': { minWidth: 44 },
          '& .MuiInputBase-input': { fontSize: 16 },
        },
        outline: 'none',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" id={titleId}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="Cerrar" size="small" sx={{ flexShrink: 0 }}>
          <CloseRounded />
        </IconButton>
      </Stack>
      <Box>{children}</Box>
      {actions && (
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mt: 3, '& > .MuiStack-root': { flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 } }}>
          {actions}
        </Stack>
      )}
    </Box>
  </Modal>
  );
};
