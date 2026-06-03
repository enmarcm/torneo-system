import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBackRounded, EmojiEventsRounded, GroupsRounded, SportsSoccerRounded } from '@mui/icons-material';
import { useEditionQuery, useCompetitionsQuery, useDashboardMetricsQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routes';

const AdminEditionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: edition, isLoading } = useEditionQuery(id!);
  const { data: competitions = [] } = useCompetitionsQuery(id);
  const { data: metrics } = useDashboardMetricsQuery(id ?? '');

  if (isLoading) return <Typography color="text.secondary">Cargando…</Typography>;
  if (!edition) return <Typography color="text.secondary">Edición no encontrada.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.editions)} sx={{ mb: 2 }}>
        Volver a ediciones
      </Button>
      <PageHeader
        title={edition.name}
        subtitle={`Temporada ${edition.seasonNumber} · ${edition.year}`}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <StatusBadge status={edition.status} />
        <Chip size="small" label={`${formatDate(edition.startDate)} → ${formatDate(edition.endDate)}`} variant="outlined" />
        <Chip size="small" label={edition.transfersOpen ? 'Traspasos abiertos' : 'Traspasos cerrados'} color={edition.transfersOpen ? 'success' : 'default'} variant="outlined" />
      </Stack>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4, md: 3 }}>
          <StatCard label="Competiciones" value={competitions.length} icon={<EmojiEventsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 4, md: 3 }}>
          <StatCard label="Equipos" value={metrics?.teams ?? 0} icon={<GroupsRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 4, md: 3 }}>
          <StatCard label="Partidos" value={metrics?.matchesPlayed ?? 0} icon={<SportsSoccerRounded />} tint="success" />
        </Grid>
      </Grid>
      <Typography variant="h4" sx={{ mb: 2 }}>Competiciones</Typography>
      {competitions.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Esta edición no tiene competiciones.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {competitions.map((c) => (
            <Grid size={{ xs: 12, md: 6 }} key={c.id}>
              <Card sx={{ p: 3, cursor: 'pointer' }} onClick={() => navigate(`/admin/competiciones/${c.id}`)}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.soft', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <EmojiEventsRounded />
                  </Box>
                  <Box>
                    <Typography variant="h4">{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.category?.name} · {c.format === 'LEAGUE' ? 'Liga' : 'Copa'}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box><Typography variant="caption" color="text.secondary">Equipos</Typography><Typography sx={{ fontWeight: 700 }}>{c._count?.registrations ?? 0}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Partidos</Typography><Typography sx={{ fontWeight: 700 }}>{c._count?.matches ?? 0}</Typography></Box>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminEditionDetail;
