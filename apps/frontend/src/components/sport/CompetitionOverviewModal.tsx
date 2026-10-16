import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useState } from 'react';
import type { Competition } from '@/api/competitions.api';
import { useCompetitionQuery, useStandingsQuery } from '@/hooks/queries';
import { getDivisionLabel } from '@/utils/statusLabels';
import { AppModal } from '@/components/ui/AppModal';
import { Crest } from '@/components/ui/Crest';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState, StandingsSkeleton } from '@/components/ui/LoadingState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StandingsTable } from './StandingsTable';
import { RosterEditor } from './RosterEditor';

interface Props {
  competition: Competition;
  onClose: () => void;
}

export const CompetitionOverviewModal: React.FC<Props> = ({ competition, onClose }) => {
  const detail = useCompetitionQuery(competition.id);
  const standings = useStandingsQuery(competition.id);
  const [selectedTeam, setSelectedTeam] = useState<{ registrationId: string; name: string } | null>(null);
  const openRoster = (registrationId: string, name: string) => setSelectedTeam({ registrationId, name });
  const registrations = [...(detail.data?.registrations ?? [])].sort((a, b) =>
    a.team.name.localeCompare(b.team.name, 'es'),
  );

  return (
    <AppModal
      open
      onClose={onClose}
      title={selectedTeam?.name ?? competition.name}
      subtitle={selectedTeam ? `${competition.name} · Jugadores inscritos` : getDivisionLabel(competition.divisionLevel) || competition.division || undefined}
      maxWidth={1040}
    >
      {selectedTeam ? (
        <Stack spacing={2}>
          <Button startIcon={<ArrowBackRounded />} onClick={() => setSelectedTeam(null)} sx={{ alignSelf: 'flex-start' }}>Volver a la competición</Button>
          <RosterEditor key={selectedTeam.registrationId} registrationId={selectedTeam.registrationId} maxPlayers={competition.maxPlayers} />
        </Stack>
      ) : <Stack spacing={3}>
        <Stack direction="row" spacing={1}>
          <StatusBadge status={competition.format} />
          <StatusBadge status={detail.data?.status ?? competition.status} />
        </Stack>
        <Box component="section" aria-label="Equipos de la competición">
          <Typography variant="h4" sx={{ mb: 2 }}>
            Equipos inscritos{detail.data ? ` (${registrations.length})` : ''}
          </Typography>
          {detail.isPending ? <LoadingState rows={3} /> : detail.isError ? (
            <ErrorState title="No pudimos cargar los equipos" onRetry={() => void detail.refetch()} retrying={detail.isFetching} />
          ) : registrations.length === 0 ? (
            <EmptyState compact title="Todavía no hay equipos inscritos" description="Los equipos aparecerán aquí cuando se inscriban en esta competición." />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3 }}>
              {registrations.map((registration) => (
                <Stack component={ButtonBase} onClick={() => openRoster(registration.id, registration.team.name)} aria-label={`Ver jugadores de ${registration.team.name}`} key={registration.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, width: '100%', textAlign: 'left', minWidth: 0, borderBottom: '1px solid', borderColor: 'divider', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}>
                  <Crest src={registration.team.logoUrl ?? undefined} alt={registration.team.name} sx={{ width: 40, height: 40, bgcolor: 'background.default', color: 'text.secondary', '& img': { objectFit: 'contain' } }}>
                    {registration.team.name.charAt(0)}
                  </Crest>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{registration.team.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{registration.roster.length} jugadores</Typography>
                  </Box>
                  <StatusBadge status={registration.status} />
                </Stack>
              ))}
            </Box>
          )}
        </Box>
        <Box component="section" aria-label="Tabla de posiciones" sx={{ minWidth: 0 }}>
          {standings.isPending ? <StandingsSkeleton rows={4} /> : standings.isError ? (
            <ErrorState title="No pudimos cargar la tabla de posiciones" onRetry={() => void standings.refetch()} retrying={standings.isFetching} />
          ) : (
            <>
              {!standings.data?.length && <Typography variant="h4" sx={{ mb: 2 }}>Tabla de posiciones</Typography>}
              <StandingsTable rows={standings.data ?? []} ghostTeams={registrations.map((registration) => ({ ...registration.team, registrationId: registration.id }))} onTeamClick={openRoster} />
            </>
          )}
        </Box>
      </Stack>}
    </AppModal>
  );
};
