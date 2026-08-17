import { useState } from 'react';
import {
  Card,
  Stack,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  Divider,
} from '@mui/material';
import { MilitaryTechRounded, DeleteOutlineRounded } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { MvpCard } from '@/components/sport/MvpCard';
import { useSetMatchMvp, useClearMatchMvp } from '@/hooks/mutations';
import { useRosterQuery } from '@/hooks/queries';
import { extractErrorMessage } from '@/api/axios';
import type { Match } from '@/api/matches.api';

interface Props {
  match: Match;
}

/**
 * Designación del MVP. Solo se habilita con el partido finalizado y la lista de
 * jugadores sale de las plantillas de los dos equipos que jugaron.
 */
export const MvpEditor: React.FC<Props> = ({ match }) => {
  const { enqueueSnackbar } = useSnackbar();
  const setMvp = useSetMatchMvp();
  const clearMvp = useClearMatchMvp();

  const { data: homeRoster = [] } = useRosterQuery(match.homeRegistrationId);
  const { data: awayRoster = [] } = useRosterQuery(match.awayRegistrationId);

  const [playerId, setPlayerId] = useState(match.mvpPlayerId ?? '');
  const [photoUrl, setPhotoUrl] = useState(match.mvpPhotoUrl ?? '');
  const [note, setNote] = useState(match.mvpNote ?? '');

  const isFinished = match.status === 'FINISHED';

  const options = [
    { label: match.homeRegistration.team.name, entries: homeRoster },
    { label: match.awayRegistration.team.name, entries: awayRoster },
  ];

  const save = async () => {
    try {
      await setMvp.mutateAsync({
        id: match.id,
        data: { playerId, photoUrl: photoUrl || null, note: note || null },
      });
      enqueueSnackbar('MVP designado', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(extractErrorMessage(err), { variant: 'error' });
    }
  };

  const clear = async () => {
    try {
      await clearMvp.mutateAsync(match.id);
      setPlayerId('');
      setPhotoUrl('');
      setNote('');
      enqueueSnackbar('MVP quitado', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(extractErrorMessage(err), { variant: 'error' });
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <MilitaryTechRounded sx={{ color: 'warning.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Figura del partido
        </Typography>
      </Stack>

      {!isFinished ? (
        <Alert severity="info" variant="outlined">
          El MVP se designa una vez que el partido está finalizado.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {match.mvpPlayer && (
            <>
              <MvpCard match={match} compact />
              <Divider />
            </>
          )}

          <TextField
            select
            fullWidth
            size="small"
            label="Jugador"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            helperText="Solo jugadores de las plantillas de estos dos equipos."
          >
            {options.map((group) => [
              <MenuItem key={group.label} disabled sx={{ fontWeight: 800, opacity: 1 }}>
                {group.label}
              </MenuItem>,
              ...group.entries.map((entry) => (
                <MenuItem key={entry.id} value={entry.player.id} sx={{ pl: 3 }}>
                  {entry.player.firstName} {entry.player.lastName}
                  {entry.jerseyNumber ? ` · #${entry.jerseyNumber}` : ''}
                </MenuItem>
              )),
            ])}
          </TextField>

          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            label="Subir foto del MVP"
          />
          <Typography variant="caption" color="text.secondary">
            La foto queda pública: cualquiera puede descargarla desde el portal.
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Nota (opcional)"
            placeholder="Ej: doblete y asistencia"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={save}
              disabled={!playerId || setMvp.isPending}
            >
              {match.mvpPlayerId ? 'Actualizar MVP' : 'Designar MVP'}
            </Button>
            {match.mvpPlayerId && (
              <Button
                color="error"
                startIcon={<DeleteOutlineRounded />}
                onClick={clear}
                disabled={clearMvp.isPending}
              >
                Quitar
              </Button>
            )}
          </Stack>
        </Stack>
      )}
    </Card>
  );
};
