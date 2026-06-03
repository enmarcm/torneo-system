import { Box, Typography, Button } from '@mui/material';
import { ErrorOutlineRounded, RefreshRounded } from '@mui/icons-material';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<Props> = ({
  title = 'Algo salió mal',
  message = 'No pudimos cargar los datos. Revisa tu conexión e intenta nuevamente.',
  onRetry,
}) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 6,
      px: 3,
      border: '1px dashed',
      borderColor: 'error.light',
      borderRadius: 4,
      bgcolor: 'background.default',
    }}
  >
    <Box
      sx={{
        width: 64,
        height: 64,
        mx: 'auto',
        mb: 2,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'error.light',
        color: 'error.main',
      }}
    >
      <ErrorOutlineRounded sx={{ fontSize: 32 }} />
    </Box>
    <Typography variant="h4" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
      {message}
    </Typography>
    {onRetry && (
      <Button variant="outlined" startIcon={<RefreshRounded />} onClick={onRetry}>
        Reintentar
      </Button>
    )}
  </Box>
);
