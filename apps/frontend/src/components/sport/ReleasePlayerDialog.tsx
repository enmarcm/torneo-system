import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import type { AgeGroup } from '@/api/players.api';
import { extractErrorMessage } from '@/api/axios';
import { useReleasePlayer } from '@/hooks/mutations';
import { useToast } from '@/hooks/common/useToast';
import { AGE_GROUP_LABELS } from '@/utils/competitionMeta';

export interface ReleaseTarget {
  playerId: string;
  playerName: string;
  /** Apartados en los que algún equipo tiene al jugador y que se pueden liberar. */
  holds: Array<{ ageGroup: AgeGroup; teamName: string }>;
}

interface Props {
  target: ReleaseTarget | null;
  onClose: () => void;
}

/**
 * Liberar a un jugador: su equipo suelta el pase en un apartado y otro club
 * puede inscribirlo. Cierra sus plantillas vigentes en el club que lo tenía; el
 * historial de torneos terminados no se toca.
 */
export const ReleasePlayerDialog: React.FC<Props> = ({ target, onClose }) => {
  const release = useReleasePlayer();
  const toast = useToast();

  const confirm = async (ageGroup: AgeGroup) => {
    if (!target) return;
    try {
      await release.mutateAsync({ id: target.playerId, ageGroup });
      toast.success(`${target.playerName} quedó libre en ${AGE_GROUP_LABELS[ageGroup]}`);
      onClose();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Dialog open={!!target} onClose={release.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Liberar a {target?.playerName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined">
            Se da de baja de las plantillas vigentes de ese equipo en el apartado y otro equipo podrá inscribirlo.
            Sus torneos anteriores y estadísticas se conservan.
          </Alert>
          {target?.holds.map((hold) => (
            <Stack key={hold.ageGroup} direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
              <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                <strong>{AGE_GROUP_LABELS[hold.ageGroup]}</strong> · {hold.teamName}
              </Typography>
              <Button
                color="error"
                variant="contained"
                size="small"
                startIcon={<LockOpenRounded />}
                disabled={release.isPending}
                onClick={() => confirm(hold.ageGroup)}
                sx={{ flexShrink: 0 }}
              >
                Liberar
              </Button>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={release.isPending}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
};
