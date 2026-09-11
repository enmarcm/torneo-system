import { Box, Typography } from '@mui/material';
import { RefreshRounded } from '@mui/icons-material';
import { SaveButton } from './SaveButton';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** `isFetching` de la consulta: el botón muestra el anillo mientras reintenta. */
  retrying?: boolean;
}

/**
 * No es un vacío, es una falla, y se distingue: el balón con la señal cortada
 * y la cruz roja. El botón reintenta con el mismo patrón que el de guardar.
 */
export const ErrorState: React.FC<Props> = ({
  title = 'No pudimos hablar con el servidor de la liga',
  message = 'Puede ser la señal en la cancha. Lo que veas puede estar desactualizado.',
  onRetry,
  retrying = false,
}) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 6,
      px: 3,
      border: '1px dashed',
      borderColor: 'error.main',
      borderRadius: 4,
      bgcolor: 'background.default',
      display: 'grid',
      justifyItems: 'center',
      gap: 1,
    }}
  >
    <Box
      component="svg"
      viewBox="0 0 150 88"
      aria-hidden
      sx={{ width: 150, height: 88, color: 'text.disabled', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, mb: 0.5 }}
    >
      <circle cx="75" cy="58" r="18" />
      <path d="M75 40v36M57 52l36 12M57 64l36-12" strokeWidth="1" />
      <path d="M45 34a42 42 0 0 1 60 0" strokeDasharray="5 5" />
      <path d="M33 22a60 60 0 0 1 84 0" strokeDasharray="5 5" opacity="0.5" />
      <Box component="path" d="M104 14l10 10M114 14l-10 10" strokeWidth="2.5" strokeLinecap="round" sx={{ stroke: 'error.main' }} />
    </Box>
    <Typography variant="h4" sx={{ mt: 0.5, textWrap: 'balance' }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
      {message}
    </Typography>
    {onRetry && (
      <SaveButton
        variant="outlined"
        onClick={onRetry}
        loading={retrying}
        /* Si este bloque sigue montado después de reintentar es porque volvió a fallar: nunca hay tilde. */
        error
        busyLabel="Reintentando…"
        startIcon={<RefreshRounded />}
        sx={{ mt: 1.5 }}
      >
        Reintentar
      </SaveButton>
    )}
  </Box>
);
