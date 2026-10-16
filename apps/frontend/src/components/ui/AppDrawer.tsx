import { Drawer, Box, Typography, IconButton, Stack, Divider, useTheme } from '@mui/material';
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

export const AppDrawer: React.FC<Props> = ({ open, onClose, title, subtitle, children, footer, width = 420 }) => {
  const theme = useTheme();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: theme.zIndex.modal }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: width },
          maxWidth: '100vw',
          height: '100dvh',
          borderRadius: 0,
          overflowWrap: 'anywhere',
          [theme.breakpoints.down('sm')]: {
            '& .MuiButton-root, & .MuiIconButton-root': { minHeight: 44 },
            '& .MuiIconButton-root': { minWidth: 44 },
            '& .MuiInputBase-input, & input': { fontSize: 16 },
          },
          zIndex: theme.zIndex.modal,
        },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5 }, pb: 'max(20px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2, flexShrink: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3">{title}</Typography>
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
        <Divider sx={{ mb: 2 }} />
        {/*
          `overflow: auto` recorta lo que se dibuje fuera de la caja, y la etiqueta
          flotante de un TextField se posiciona ~9px por encima del input. Sin este
          padding superior, la etiqueta del primer campo del formulario aparece
          cortada por la mitad.
        */}
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', pt: 1.5, px: 0.25, mx: -0.25 }}>{children}</Box>
        {footer && (
          <Box sx={{ pt: 2, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', '& .MuiStack-root': { flexWrap: 'wrap', gap: 1 } }}>{footer}</Box>
        )}
      </Box>
    </Drawer>
  );
};
