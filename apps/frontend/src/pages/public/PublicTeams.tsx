import { Box, Container, Grid2 as Grid, Card, Stack, Typography, Avatar, Button } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePublicTeamsQuery } from '@/hooks/queries';
import { ROUTES } from '@/routes/routes';
import type { Team } from '@/api/public.api';

const PublicTeams: React.FC = () => {
  const navigate = useNavigate();
  const { data: teams = [] } = usePublicTeamsQuery();
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>Equipos</Typography>
      <Grid container spacing={2}>
        {teams.map((t: Team) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={t.id}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Avatar src={t.logoUrl ?? undefined} sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 800, fontSize: 24 }}>
                {t.name[0]}
              </Avatar>
              <Typography variant="h4" sx={{ mb: 0.5 }}>{t.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t._count?.registrations ?? 0} inscripciones
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PublicTeams;
