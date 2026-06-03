import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Avatar, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBackRounded, GroupsRounded, PersonRounded, SportsSoccerRounded } from '@mui/icons-material';
import { useTeamQuery, useMatchesQuery, usePlayerStatsQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { MatchCard } from '@/components/sport/MatchCard';
import { ROUTES } from '@/routes/routes';

const AdminTeamDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: team, isLoading } = useTeamQuery(id!);
  const { data: matches = [] } = useMatchesQuery();
  const { data: stats = [] } = usePlayerStatsQuery({ teamId: id });

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
            subtitle={team.leader?.email ? `Líder: ${team.leader.email}` : 'Sin líder asignado'}
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
