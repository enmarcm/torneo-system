import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBackRounded, EmojiEventsRounded, GroupsRounded, SportsSoccerRounded } from '@mui/icons-material';
import { useCompetitionQuery, useStandingsQuery, useMatchesQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { MatchCard } from '@/components/sport/MatchCard';
import { ROUTES } from '@/routes/routes';
import { getStatusLabel } from '@/utils/statusLabels';

const AdminCompetitionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: comp, isLoading } = useCompetitionQuery(id!);
  const { data: standings = [] } = useStandingsQuery(id ?? '');
  const { data: matches = [] } = useMatchesQuery(id);

  if (isLoading) return <Typography color="text.secondary">Cargando…</Typography>;
  if (!comp) return <Typography color="text.secondary">Competición no encontrada.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.competitions)} sx={{ mb: 2 }}>
        Volver a competiciones
      </Button>
      <PageHeader
        title={comp.name}
        subtitle={`${comp.category?.name ?? 'Sin categoría'} · ${getStatusLabel(comp.format)}`}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <StatusBadge status={comp.status} />
        {comp.division && <Chip size="small" label={comp.division} variant="outlined" />}
        <Chip size="small" label={`Edad: ${comp.ageMin ?? '—'}-${comp.ageMax ?? '∞'}`} variant="outlined" />
        <Chip size="small" label={`Cupo: ${comp.minPlayers}-${comp.maxPlayers}`} variant="outlined" />
      </Stack>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Equipos" value={comp._count?.registrations ?? 0} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Partidos" value={comp._count?.matches ?? 0} icon={<SportsSoccerRounded />} tint="info" />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Tabla de posiciones</Typography>
          {standings.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Sin posiciones aún.</Typography></Card>
          ) : (
            <StandingsTable rows={standings} />
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Partidos</Typography>
          {matches.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Sin partidos aún.</Typography></Card>
          ) : (
            <Stack spacing={1.5}>
              {matches.slice(0, 10).map((m) => <MatchCard key={m.id} match={m} />)}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminCompetitionDetail;
