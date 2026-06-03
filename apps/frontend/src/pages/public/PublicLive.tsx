import { Box, Container, Grid2 as Grid, Typography, Card, Button } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePublicMatchesQuery } from '@/hooks/queries';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { ROUTES } from '@/routes/routes';
import type { Match } from '@/api/public.api';

const PublicLive: React.FC = () => {
  const navigate = useNavigate();
  const { data: live = [] } = usePublicMatchesQuery(undefined, 'LIVE');
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>En vivo</Typography>
      {live.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay partidos en vivo en este momento.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {live.map((m: Match) => (
            <Grid size={{ xs: 12, md: 6 }} key={m.id}>
              <LiveScoreboard match={m} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default PublicLive;
