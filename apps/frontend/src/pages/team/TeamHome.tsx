import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Divider } from '@mui/material';
import { GroupsRounded, SportsSoccerRounded, BarChartRounded } from '@mui/icons-material';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamsQuery, useMatchesQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EntityHeroCard } from '@/components/sport/EntityHeroCard';
import { MatchCard } from '@/components/sport/MatchCard';

const TeamHome: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { data: teams = [] } = useTeamsQuery();
  const team = teams.find((t) => t.id === user?.teamId);
  const { data: matches = [] } = useMatchesQuery();

  const myMatches = matches.filter((m) => m.homeRegistration.team.id === user?.teamId || m.awayRegistration.team.id === user?.teamId);

  const teamId = user?.teamId;
  const wins = myMatches.filter((m) => m.status === 'FINISHED' && ((m.homeRegistration.team.id === teamId && m.homeScore > m.awayScore) || (m.awayRegistration.team.id === teamId && m.awayScore > m.homeScore))).length;
  const draws = myMatches.filter((m) => m.status === 'FINISHED' && m.homeScore === m.awayScore).length;
  const losses = myMatches.filter((m) => m.status === 'FINISHED' && ((m.homeRegistration.team.id === teamId && m.homeScore < m.awayScore) || (m.awayRegistration.team.id === teamId && m.awayScore < m.homeScore))).length;
  const pending = myMatches.filter((m) => m.status === 'SCHEDULED' || m.status === 'POSTPONED').length;

  return (
    <Box>
      <PageHeader title="Inicio" subtitle={`Bienvenido, ${user?.email}`} />
      {team && (
        <Box sx={{ mb: 2 }}>
          <EntityHeroCard
            title={team.name}
            subtitle="Tu equipo"
            chips={<Chip size="small" label={team.status} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} />}
          />
        </Box>
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inscripciones" value={team?._count?.registrations ?? 0} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Partidos" value={myMatches.length} icon={<SportsSoccerRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Card sx={{ p: { xs: 2, md: 3 }, height: '100%', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(3, 66, 146, 0.08)',
                  color: '#034292',
                  '& svg': { fontSize: 24 },
                }}
              >
                <BarChartRounded />
              </Box>
            </Box>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: 14,
                color: 'text.secondary',
                mb: 1.5,
              }}
            >
              Rendimiento
            </Typography>
            <Stack direction="row" spacing={0.5} divider={<Divider orientation="vertical" flexItem />}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'success.main' }}>{wins}</Typography>
                <Typography variant="caption" color="text.secondary">V</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'warning.main' }}>{draws}</Typography>
                <Typography variant="caption" color="text.secondary">E</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'error.main' }}>{losses}</Typography>
                <Typography variant="caption" color="text.secondary">D</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'info.main' }}>{pending}</Typography>
                <Typography variant="caption" color="text.secondary">P</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Tus próximos partidos</Typography>
        {myMatches.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Aún no tienes partidos asignados.</Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {myMatches.slice(0, 4).map((m) => (
              <Grid size={{ xs: 12, md: 6 }} key={m.id}>
                <MatchCard match={m} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default TeamHome;
