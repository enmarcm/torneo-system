import { Box, Container, Card, Stack, Typography, Avatar, Button } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePublicStatsQuery } from '@/hooks/queries';
import { ROUTES } from '@/routes/routes';

const PublicStats: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats = [] } = usePublicStatsQuery();
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>Estadísticas</Typography>
      <Card sx={{ p: 3 }}>
        {stats.length === 0 ? <Typography color="text.secondary">Aún no hay estadísticas.</Typography> : (
          <Stack spacing={1}>
            {stats.slice(0, 20).map((s: any, i: number) => (
              <Stack key={s.id} direction="row" spacing={2} alignItems="center" sx={{ p: 1, borderRadius: 2 }}>
                <Typography sx={{ width: 28, fontWeight: 800 }}>{i + 1}</Typography>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main' }}>
                  {s.rosterEntry?.player?.firstName?.[0]}{s.rosterEntry?.player?.lastName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{s.rosterEntry?.player?.firstName} {s.rosterEntry?.player?.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.rosterEntry?.teamRegistration?.team?.name}</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800 }}>{s.goals}</Typography>
                    <Typography variant="caption" color="text.secondary">Goles</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800 }}>{s.matchesPlayed}</Typography>
                    <Typography variant="caption" color="text.secondary">PJ</Typography>
                  </Box>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Container>
  );
};

export default PublicStats;
