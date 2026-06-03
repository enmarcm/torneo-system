import { Box, Container, Grid2 as Grid, Card, Stack, Typography, Avatar, Button, Chip } from '@mui/material';
import { ArrowBackRounded, PersonRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePublicTeamsQuery, useTeamPlayersQuery } from '@/hooks/queries';
import { AppModal } from '@/components/ui/AppModal';
import { ROUTES } from '@/routes/routes';
import type { Team } from '@/api/public.api';
import type { TeamRosterEntry } from '@/api/teams.api';

const PublicTeams: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { data: teams = [] } = usePublicTeamsQuery();
  const { data: players = [] } = useTeamPlayersQuery(selectedTeam?.id);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>Equipos</Typography>
      <Grid container spacing={2}>
        {teams.map((t: Team) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={t.id}>
            <Card sx={{ p: 3, textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedTeam(t)}>
              <Avatar src={t.logoUrl ?? undefined} sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 800, fontSize: 24 }}>
                {t.name[0]}
              </Avatar>
              <Typography variant="h4" sx={{ mb: 0.5 }}>{t.name}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <AppModal
        open={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={selectedTeam?.name ?? ''}
        subtitle="Jugadores del equipo"
        maxWidth={560}
      >
        {players.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Este equipo no tiene jugadores registrados.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {players.map((p: TeamRosterEntry) => (
              <Card key={p.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={p.player.photoUrl ?? undefined} sx={{ width: 44, height: 44, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700 }}>
                  {p.player.firstName[0]}{p.player.lastName[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{p.player.firstName} {p.player.lastName}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                    {p.jerseyNumber && <Chip label={`#${p.jerseyNumber}`} size="small" variant="outlined" />}
                    {p.player.position && <Chip label={p.player.position} size="small" variant="outlined" />}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
                  <PersonRounded sx={{ fontSize: 16 }} />
                  <Typography variant="caption">{p.stats?.goals ?? 0} goles</Typography>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </AppModal>
    </Container>
  );
};

export default PublicTeams;
