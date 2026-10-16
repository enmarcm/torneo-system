import { Box, Chip, Stack, Typography } from '@mui/material';
import { usePublicRosterQuery } from '@/hooks/queries';
import { Crest } from '@/components/ui/Crest';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { RosterSkeleton } from '@/components/ui/LoadingState';

export const CompetitionRoster: React.FC<{ registrationId: string }> = ({ registrationId }) => {
  const { data: roster = [], isPending, isError, refetch, isFetching } = usePublicRosterQuery(registrationId);
  if (isPending) return <RosterSkeleton rows={5} />;
  if (isError) return <ErrorState title="No pudimos cargar los jugadores" onRetry={() => void refetch()} retrying={isFetching} />;
  if (!roster.length) return <EmptyState compact variant="bench" title="Todavía no hay jugadores inscritos" description="Este equipo no tiene jugadores activos inscritos en esta competición." />;

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">{roster.length} jugadores inscritos en esta competición</Typography>
      {roster.map((entry) => (
        <Stack key={entry.id} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', minWidth: 0 }}>
          <Crest src={entry.player.photoUrl ?? undefined} alt={`${entry.player.firstName} ${entry.player.lastName}`} sx={{ width: 44, height: 44, flexShrink: 0, bgcolor: 'primary.soft', color: 'primary.main' }}>
            {entry.player.firstName.charAt(0)}{entry.player.lastName.charAt(0)}
          </Crest>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{entry.player.firstName} {entry.player.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{entry.stats?.goals ?? 0} goles · {entry.stats?.matchesPlayed ?? 0} partidos</Typography>
          </Box>
          {entry.jerseyNumber != null && <Chip size="small" variant="outlined" label={`#${entry.jerseyNumber}`} aria-label={`Dorsal ${entry.jerseyNumber}`} />}
        </Stack>
      ))}
    </Stack>
  );
};
