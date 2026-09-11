import { AppModal } from './AppModal';
import { Button, Typography, Stack } from '@mui/material';
import { SaveButton } from './SaveButton';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** `mutation.isError`: si falló, el botón vuelve a su estado sin confirmar. */
  error?: boolean;
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
  error,
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
        <SaveButton
          color="error"
          onClick={onConfirm}
          loading={!!loading}
          error={error}
          busyLabel="Eliminando…"
          doneLabel="Listo"
        >
          {confirmLabel}
        </SaveButton>
      </Stack>
    }
  >
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </AppModal>
);
