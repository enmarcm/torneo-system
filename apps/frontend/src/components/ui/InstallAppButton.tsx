import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import InstallMobileRounded from '@mui/icons-material/InstallMobileRounded';
import IosShareRounded from '@mui/icons-material/IosShareRounded';
import AddBoxOutlined from '@mui/icons-material/AddBoxOutlined';
import { usePwaInstall } from '@/hooks/common/usePwaInstall';

interface Props {
  /** Color del texto y del borde; cambia cuando la barra pasa de transparente a sólida. */
  color?: string;
}

/**
 * Botón para instalar la app (PWA). Solo se ve en pantallas pequeñas y solo
 * cuando hay algo que instalar: si ya corre instalada, no aparece.
 */
export const InstallAppButton: React.FC<Props> = ({ color = 'inherit' }) => {
  const { canInstall, needsManualSteps, install } = usePwaInstall();
  const [stepsOpen, setStepsOpen] = useState(false);

  if (!canInstall) return null;

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<InstallMobileRounded />}
        onClick={() => (needsManualSteps ? setStepsOpen(true) : void install())}
        aria-label="Instalar la aplicación"
        sx={{
          // En escritorio el navegador ya ofrece instalar desde la barra de direcciones.
          display: { xs: 'inline-flex', md: 'none' },
          color,
          borderColor: 'currentColor',
          borderRadius: 999,
          px: 1.5,
          py: 0.25,
          minWidth: 0,
          flexShrink: 0,
          fontWeight: 700,
          textTransform: 'none',
          transition: 'color 0.25s ease',
          '&:hover': { borderColor: 'currentColor', bgcolor: 'rgba(127,127,127,0.12)' },
        }}
      >
        Instalar
      </Button>

      <Dialog open={stepsOpen} onClose={() => setStepsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Instalar LLF en tu iPhone</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IosShareRounded color="primary" />
              <Typography variant="body2">
                Toca el botón <b>Compartir</b> de Safari, en la barra de abajo.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AddBoxOutlined color="primary" />
              <Typography variant="body2">
                Elige <b>Agregar a pantalla de inicio</b>.
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Funciona solo desde Safari. Si abriste el enlace en otra app, cópialo y ábrelo allí.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStepsOpen(false)}>Entendido</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
