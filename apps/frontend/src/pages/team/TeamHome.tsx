import { Box, Grid2 as Grid, Card, Stack, Typography, Chip } from '@mui/material';
import { GroupsRounded, SportsSoccerRounded } from '@mui/icons-material';
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

  return (
    <Box>
      <PageHeader title="Inicio" subtitle={`Bienvenido, ${user?.email}`} />
      {team && (
        <EntityHeroCard
          title={team.name}
          subtitle="Tu equipo"
          chips={<Chip size="small" label={team.status} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} />}
        />
      )}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inscripciones" value={team?._count?.registrations ?? 0} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Partidos" value={myMatches.length} icon={<SportsSoccerRounded />} tint="info" />
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
