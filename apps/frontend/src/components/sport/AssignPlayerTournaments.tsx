import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { SaveButton } from '@/components/ui/SaveButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PlayerTournamentSelect } from './PlayerTournamentSelect';
import { teamsApi, type Team } from '@/api/teams.api';
import { useTeamRegistrationsQuery } from '@/hooks/queries';
import { useAddRoster } from '@/hooks/mutations';
import { registerSelectedCompetitions } from '@/utils/batchRegistrations';
import { playerTournamentBlockedReason } from '@/utils/playerTournamentRegistrations';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

export function AssignPlayerTournaments({ player, teamId, onClose }: {
  player: { id: string; firstName: string; lastName: string };
  teamId?: string;
  onClose: () => void;
}) {
  const [team, setTeam] = useState<Team | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<Array<{ name: string; message: string }>>([]);
  const teams = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list, enabled: !teamId });
  const selectedTeamId = teamId ?? team?.id;
  const { data: registrations = [], isLoading, error, refetch } = useTeamRegistrationsQuery(selectedTeamId, true);
  const add = useAddRoster();
  const toast = useToast();
  const blocked = selected.some((id) => {
    const registration = registrations.find((entry) => entry.id === id);
    return !registration || !!playerTournamentBlockedReason(registration, player.id);
  });
  const save = async () => {
    if (busy || !selected.length || blocked) return;
    setBusy(true);
    setFailures([]);
    try {
      const result = await registerSelectedCompetitions(selected, (registrationId) => add.mutateAsync({ registrationId, data: { playerId: player.id } }));
      if (result.succeeded.length) toast.success(`Jugador agregado a ${result.succeeded.length} ${result.succeeded.length === 1 ? 'torneo' : 'torneos'}`);
      if (!result.failed.length) onClose();
      else {
        setSelected(result.failed.map(({ id }) => id));
        setFailures(result.failed.map(({ id, error }) => ({ name: getCompetitionShortLabel(registrations.find((registration) => registration.id === id)!.competition), message: extractErrorMessage(error) })));
        await refetch();
      }
    } finally { setBusy(false); }
  };
  return (
    <AppDrawer open onClose={() => { if (!busy) onClose(); }} title="Inscribir jugador en torneos" subtitle={`${player.firstName} ${player.lastName}`} width={560}>
      <Stack spacing={2}>
        {!teamId && <>
          <Autocomplete options={teams.data ?? []} value={team} disabled={busy || teams.isLoading} getOptionLabel={(option) => option.name} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_event, value) => { setTeam(value); setSelected([]); setFailures([]); }} noOptionsText="No hay equipos" renderInput={(params) => <TextField {...params} label="Equipo" />} />
          {teams.error && <ErrorState onRetry={() => void teams.refetch()} />}
        </>}
        {selectedTeamId && (isLoading ? <LoadingState rows={2} /> : error ? <ErrorState onRetry={() => void refetch()} /> : <PlayerTournamentSelect registrations={registrations} value={selected} onChange={(ids) => { setSelected(ids); setFailures([]); }} playerId={player.id} disabled={busy} />)}
        <Typography variant="body2" color="text.secondary">El jugador conserva una sola ficha y una plantilla independiente en cada torneo. Las inscripciones completadas se conservan si otra falla.</Typography>
        {!!failures.length && <Alert severity="error">{failures.map((failure, index) => <Typography key={index} variant="body2">{failure.name}: {failure.message}</Typography>)}</Alert>}
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
          <Button disabled={busy} onClick={onClose}>Cancelar</Button>
          <SaveButton loading={busy} busyLabel="Inscribiendo…" error={!!failures.length} disabled={!selected.length || blocked || isLoading || !!error} onClick={save}>Inscribir en {selected.length} {selected.length === 1 ? 'torneo' : 'torneos'}</SaveButton>
        </Stack>
      </Stack>
    </AppDrawer>
  );
}
