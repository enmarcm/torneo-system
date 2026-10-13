import { useState } from 'react';
import { Avatar, Box, Card, Checkbox, Chip, Divider, FormControlLabel, Grid2 as Grid, Stack, Typography } from '@mui/material';
import { useMatchAttendanceQuery } from '@/hooks/queries';
import { useSetMatchAttendance } from '@/hooks/mutations';
import { usePermissions } from '@/hooks/common/usePermissions';
import { useToast } from '@/hooks/common/useToast';
import { SaveButton } from '@/components/ui/SaveButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { extractErrorMessage } from '@/api/axios';
import { formatDateTime } from '@/utils/formatDate';

export const MatchAttendanceEditor: React.FC<{ matchId: string }> = ({ matchId }) => {
  const { scoreMatches } = usePermissions();
  const { data: sheet, isLoading, error, refetch, isFetching } = useMatchAttendanceQuery(matchId, scoreMatches);
  const saveAttendance = useSetMatchAttendance();
  const toast = useToast();
  const [draft, setDraft] = useState<Record<string, boolean>>({});

  if (!scoreMatches) return null;
  if (isLoading) return <LoadingState rows={3} />;
  if (error) return <ErrorState title="No pudimos cargar la asistencia" onRetry={() => void refetch()} retrying={isFetching} />;
  if (!sheet) return null;

  const players = sheet.teams.flatMap((team) => team.players);
  const valueFor = (entry: typeof players[number]) => draft[entry.rosterEntryId] ?? entry.present;
  const save = async () => {
    try {
      await saveAttendance.mutateAsync({
        id: matchId,
        entries: players.map((entry) => ({ rosterEntryId: entry.rosterEntryId, present: valueFor(entry) ?? false })),
      });
      setDraft({});
      toast.success('Asistencia guardada');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Card id="asistencia" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Asistencia del partido</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Marca quienes asistieron. Al guardar, los demás quedan como ausentes. La lista corresponde a las plantillas de esta competición.
      </Typography>
      <Grid container spacing={3}>
        {sheet.teams.map((team) => {
          const presentCount = team.players.filter((entry) => valueFor(entry) === true).length;
          return (
            <Grid key={team.registrationId} size={{ xs: 12, md: 6 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{team.team.name}</Typography>
                <Chip size="small" variant="outlined" label={`${presentCount}/${team.players.length} presentes`} />
              </Stack>
              {team.players.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Este equipo no tiene jugadores inscritos en la plantilla de este torneo.</Typography>
              ) : (
                <>
                  <FormControlLabel label="Todos presentes" control={
                    <Checkbox disabled={saveAttendance.isPending} checked={presentCount === team.players.length} indeterminate={presentCount > 0 && presentCount < team.players.length}
                      onChange={(_, checked) => setDraft((current) => ({ ...current, ...Object.fromEntries(team.players.map((entry) => [entry.rosterEntryId, checked])) }))}
                    />
                  } />
                  <Stack divider={<Divider />}>
                    {team.players.map((entry) => {
                      const name = `${entry.player.firstName} ${entry.player.lastName}`;
                      const present = valueFor(entry);
                      return (
                        <Stack key={entry.rosterEntryId} direction="row" alignItems="center" spacing={1} sx={{ py: 1, minWidth: 0 }}>
                          <FormControlLabel sx={{ m: 0, flex: 1, minWidth: 0, '& .MuiFormControlLabel-label': { minWidth: 0, flex: 1 } }} control={
                            <Checkbox checked={present === true} disabled={saveAttendance.isPending}
                              onChange={(_, checked) => setDraft((current) => ({ ...current, [entry.rosterEntryId]: checked }))}
                              inputProps={{ 'aria-label': `Asistencia de ${name}, ${team.team.name}` }} />
                          } label={
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                              <Avatar src={entry.player.photoUrl ?? undefined} sx={{ width: 32, height: 32 }}>{entry.player.firstName[0]}</Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {entry.jerseyNumber != null ? `Dorsal ${entry.jerseyNumber}` : 'Sin dorsal'}{!entry.active ? ' · Inscripción anterior' : ''}
                                </Typography>
                              </Box>
                            </Stack>
                          } />
                          <Chip size="small" variant="outlined" color={present === true ? 'success' : 'default'} label={present == null ? 'Sin registrar' : present ? 'Presente' : 'Ausente'} />
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              )}
            </Grid>
          );
        })}
      </Grid>
      <Divider sx={{ my: 3 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
        <Typography variant="caption" color="text.secondary" aria-live="polite">
          {sheet.updatedAt ? `Último guardado: ${formatDateTime(sheet.updatedAt)}` : 'Asistencia sin guardar'}
          {Object.keys(draft).length > 0 ? ' · Cambios sin guardar' : ''}
        </Typography>
        <SaveButton loading={saveAttendance.isPending} error={saveAttendance.isError} onClick={save} disabled={players.length === 0}>
          Guardar asistencia
        </SaveButton>
      </Stack>
    </Card>
  );
};
