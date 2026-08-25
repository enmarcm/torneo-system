import { Box, Grid2 as Grid, Card, Stack, Typography, Avatar, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowBackRounded, GroupsRounded, PersonRounded, SportsSoccerRounded, PeopleAltRounded } from '@mui/icons-material';
import { useTeamQuery, useMatchesQuery, usePlayerStatsQuery, useTeamRegistrationsQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { MatchCard } from '@/components/sport/MatchCard';
import { RosterEditor } from '@/components/sport/RosterEditor';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';
import { ROUTES } from '@/routes/routes';

const AdminTeamDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: team, isLoading } = useTeamQuery(id!);
  const { data: matches = [] } = useMatchesQuery();
  const { data: stats = [] } = usePlayerStatsQuery({ teamId: id });
  const { data: registrations = [] } = useTeamRegistrationsQuery(id);
  /*
    El administrador arma o corrige la plantilla de cualquier equipo sin esperar
    a que entre el delegado: los cierres de inscripción y las sanciones los
    maneja la liga.
  */
  const [rosterOf, setRosterOf] = useState<{ id: string; label: string; max?: number } | null>(null);

  const teamMatches = matches.filter(
    (m) => m.homeRegistration.team.id === id || m.awayRegistration.team.id === id,
  );

  if (isLoading) return <Typography color="text.secondary">Cargando…</Typography>;
  if (!team) return <Typography color="text.secondary">Equipo no encontrado.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.teams)} sx={{ mb: 2 }}>
        Volver a equipos
      </Button>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        {team.logoUrl && <Avatar src={team.logoUrl} sx={{ width: 56, height: 56 }} />}
        <Box>
          <PageHeader
            title={team.name}
            subtitle={team.leader ? `Delegado: ${team.leader.username}` : 'Sin delegado asignado'}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <StatusBadge status={team.status} />
          </Stack>
        </Box>
      </Stack>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Inscripciones" value={team._count?.registrations ?? 0} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Partidos jugados" value={teamMatches.filter((m) => m.status === 'FINISHED').length} icon={<SportsSoccerRounded />} tint="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Jugadores" value={stats.length} icon={<PersonRounded />} tint="info" />
        </Grid>
      </Grid>
      <Typography variant="h4" sx={{ mb: 2 }}>Plantillas por competición</Typography>
      {registrations.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center', mb: 3 }}>
          <Typography color="text.secondary">El equipo no está inscrito en ninguna competición.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {registrations.map((reg) => (
            <Grid size={{ xs: 12, md: 6 }} key={reg.id}>
              <Card sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {getCompetitionShortLabel(reg.competition)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {reg.roster?.filter((e) => e.status === 'ACTIVE').length ?? 0} jugadores activos
                </Typography>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<PeopleAltRounded />}
                  onClick={() =>
                    setRosterOf({
                      id: reg.id,
                      label: getCompetitionShortLabel(reg.competition),
                      max: reg.competition.maxPlayers,
                    })
                  }
                  sx={{ mt: 1.5 }}
                >
                  Editar plantilla
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AppDrawer
        open={!!rosterOf}
        onClose={() => setRosterOf(null)}
        title="Plantilla del equipo"
        subtitle={rosterOf ? `${team.name} · ${rosterOf.label}` : undefined}
      >
        {rosterOf && <RosterEditor registrationId={rosterOf.id} maxPlayers={rosterOf.max} />}
      </AppDrawer>

      <Typography variant="h4" sx={{ mb: 2 }}>Partidos</Typography>
      {teamMatches.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Sin partidos registrados.</Typography></Card>
      ) : (
        <Grid container spacing={2}>
          {teamMatches.slice(0, 6).map((m) => (
            <Grid size={{ xs: 12, md: 6 }} key={m.id}>
              <MatchCard match={m} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminTeamDetail;
