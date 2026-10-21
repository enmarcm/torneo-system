import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TeamTournamentList } from '@/components/sport/TeamTournamentList';
import { Box, Button, Card, Chip, Divider, Grid2 as Grid, Stack, Typography, TextField, MenuItem } from '@mui/material';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamRegistrationsQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CompetitionSectionTabs } from '@/components/sport/CompetitionSectionTabs';
import { RosterEditor } from '@/components/sport/RosterEditor';
import { getCompetitionAgeGroup, getCompetitionShortLabel, getCompetitionSubtitle, sortCompetitions } from '@/utils/competitionMeta';
import { canManageRoster, getVisibleTeamRegistrations, getTeamCompetitions } from '@/utils/teamRegistrations';
import type { Competition } from '@/api/competitions.api';
import { RefreshRounded } from '@mui/icons-material';

const TeamSquads: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const teamId = useAuthStore((state) => state.user?.teamId);
  const { data: registrations = [], isLoading, error, refetch } = useTeamRegistrationsQuery(teamId ?? undefined, true);
  const [pickedAgeGroup, setAgeGroup] = useState<Competition['ageGroup'] | null>(null);
  const selectedId = searchParams.get('plantilla');
  const setSelectedId = (id: string | null) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (id) next.set('plantilla', id); else next.delete('plantilla');
    return next;
  });
  const [showHistory, setShowHistory] = useState(false);
  const displayedRegistrations = getVisibleTeamRegistrations(registrations, showHistory);
  const selected = displayedRegistrations.find((registration) => registration.id === selectedId);
  const competitions = getTeamCompetitions(displayedRegistrations);
  const ageGroup = pickedAgeGroup ?? (selected ? getCompetitionAgeGroup(selected.competition) : competitions.some((competition) => getCompetitionAgeGroup(competition) === 'ADULT') ? 'ADULT' : 'YOUTH');
  const visible = sortCompetitions(competitions.filter((competition) => getCompetitionAgeGroup(competition) === ageGroup));

  return (
    <Box>
      <PageHeader compactMobile title="Mis torneos" subtitle="El administrador inscribe a tu equipo. Aquí agregas jugadores y gestionas una plantilla independiente para cada torneo." action={<Button startIcon={<RefreshRounded />} onClick={() => void refetch()} disabled={!teamId || isLoading}>Actualizar</Button>} />
      {!teamId ? <EmptyState title="No tienes equipo asignado" description="Contacta al administrador para vincular tu cuenta de delegado con un equipo." />
        : isLoading ? <LoadingState rows={3} />
        : error ? <ErrorState onRetry={() => void refetch()} />
        : registrations.length === 0 ? <EmptyState title="Tu equipo aún no está inscrito en torneos" description="Cuando el administrador inscriba a tu equipo, el torneo aparecerá aquí para que agregues jugadores." />
        : <>
          <TextField select size="small" label="Inscripciones" value={showHistory ? 'all' : 'current'} sx={{ mb: 2, minWidth: 0, width: { xs: '100%', sm: 260 } }} onChange={(event) => { setShowHistory(event.target.value === 'all'); setSelectedId(null); }}>
            <MenuItem value="current">Torneos actuales</MenuItem>
            <MenuItem value="all">Todas, incluido el historial</MenuItem>
          </TextField>
          <CompetitionSectionTabs value={ageGroup} onChange={setAgeGroup} competitions={competitions} />
          {visible.length === 0 ? <EmptyState title={showHistory ? 'No hay inscripciones en este apartado' : 'No hay torneos actuales en este apartado'} description="Aquí aparecen las inscripciones de tu equipo. Puedes consultar las anteriores seleccionando el historial." />
            : <>
            <TeamTournamentList registrations={visible.map((competition) => displayedRegistrations.find((registration) => registration.competitionId === competition.id)!)} onManage={setSelectedId} />
            <Grid container spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {visible.map((competition) => {
                const registration = registrations.find((r) => r.competition.id === competition.id)!;
                const editable = canManageRoster(registration);
                const count = registration.roster.filter((entry) => entry.status === 'ACTIVE').length;
                return <Grid key={registration.id} size={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h4" sx={{ overflowWrap: 'anywhere', mb: 1 }}>{getCompetitionShortLabel(competition)}</Typography>
                    <Typography variant="body2" color="text.secondary">{getCompetitionSubtitle(competition)}</Typography>
                    {competition.edition && <Typography variant="body2" color="text.secondary">{competition.edition.name} · {competition.edition.year}</Typography>}
                    <Stack direction="row" spacing={1} sx={{ my: 2 }} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`${count}/${competition.maxPlayers} jugadores`} variant="outlined" />
                      <StatusBadge status={competition.status} />
                      {!editable && <Chip size="small" label="Solo consulta" variant="outlined" />}
                    </Stack>
                    <Button variant={editable ? 'contained' : 'outlined'} onClick={() => setSelectedId(registration.id)}>{editable ? 'Gestionar jugadores' : 'Ver plantilla'}</Button>
                  </Card>
                </Grid>;
              })}
            </Grid></>}
        </>}
      <AppDrawer open={!!selected} onClose={() => setSelectedId(null)} title={selected ? getCompetitionShortLabel(selected.competition) : 'Plantilla'} subtitle="Plantilla de tu equipo en este torneo." width={560}>
        {selected && (canManageRoster(selected)
          ? <RosterEditor key={selected.id} registrationId={selected.id} maxPlayers={selected.competition.maxPlayers} canApproveEligibility={false} allowCreatePlayer />
          : <Stack divider={<Divider />} spacing={1}>
            {selected.roster.length === 0 && <Typography color="text.secondary">Esta plantilla no tiene jugadores.</Typography>}
            {selected.roster.map((entry) => <Stack key={entry.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography>{entry.player.firstName} {entry.player.lastName}</Typography><StatusBadge status={entry.status} />
            </Stack>)}
          </Stack>)}
      </AppDrawer>
    </Box>
  );
};
export default TeamSquads;
