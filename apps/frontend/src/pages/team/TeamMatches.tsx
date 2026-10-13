import { useState, useMemo } from 'react';
import { Box, Card, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { PageHeader } from '@/components/ui/PageHeader';
import { MatchCard } from '@/components/sport/MatchCard';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamHistoryQuery, useTeamRegistrationsQuery } from '@/hooks/queries';
import { getTeamCompetitions } from '@/utils/teamRegistrations';
import { ErrorState } from '@/components/ui/ErrorState';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'SCHEDULED', label: 'Programados' },
  { value: 'LIVE', label: 'En vivo' },
  { value: 'FINISHED', label: 'Finalizados' },
  { value: 'POSTPONED', label: 'Aplazados' },
];

const TeamMatches: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;
  const { data: registrations = [], isLoading: loadingRegistrations, error: registrationsError, refetch: refetchRegistrations } = useTeamRegistrationsQuery(teamId ?? undefined, true);
  const comps = getTeamCompetitions(registrations);
  const [filterCompetition, setFilterCompetition] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { data: matches = [], isLoading, error, refetch } = useTeamHistoryQuery(teamId ?? undefined, true);
  const selectedCompetition = comps.some((competition) => competition.id === filterCompetition) ? filterCompetition : '';

  const myMatches = useMemo(() =>
    matches.filter((m) => (!selectedCompetition || m.competitionId === selectedCompetition) && (!filterStatus || m.status === filterStatus)),
    [matches, selectedCompetition, filterStatus],
  );

  return (
    <Box>
      <PageHeader title="Partidos" subtitle="Calendario y resultados de tu equipo." />

      <Card sx={{ p: { xs: 1.5, md: 2 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Competición</InputLabel>
            <Select label="Competición" value={selectedCompetition} onChange={(e) => setFilterCompetition(e.target.value)}>
              <MenuItem value="">Todas las competiciones</MenuItem>
              {/* Las divisiones comparten nombre: sin la división, todas dicen lo mismo. */}
              {comps.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {getCompetitionShortLabel(c)}{c.edition ? ` · ${c.edition.name}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Chip label={`${myMatches.length} partido${myMatches.length !== 1 ? 's' : ''}`} variant="outlined" size="small" sx={{ ml: 'auto' }} />
        </Stack>
      </Card>

      {isLoading || loadingRegistrations ? (
        <MatchLoader />
      ) : error || registrationsError ? (
        <ErrorState onRetry={() => { void refetch(); void refetchRegistrations(); }} />
      ) : myMatches.length === 0 ? (
        <EmptyState variant="court" title="Sin partidos" description="No hay partidos que coincidan con los filtros seleccionados." />
      ) : (
        <Grid container spacing={2}>
          {myMatches.map((m) => (
            <Grid key={m.id} size={{ xs: 12, md: 6 }}>
              <MatchCard match={m} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TeamMatches;
