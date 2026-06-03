import { AppModal } from './AppModal';
import { Button, Typography, Stack } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading,
}) => (
  <AppModal
    open={open}
    onClose={onClose}
    title={title}
    maxWidth={420}
    actions={
      <Stack direction="row" spacing={1.5}>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Eliminando…' : confirmLabel}
        </Button>
      </Stack>
    }
  >
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </AppModal>
);
