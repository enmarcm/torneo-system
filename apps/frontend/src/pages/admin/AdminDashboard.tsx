import { Grid2 as Grid, Box, Card, Stack, Typography, Button } from '@mui/material';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SportsSoccerRounded from '@mui/icons-material/SportsSoccerRounded';
import FiberManualRecordRounded from '@mui/icons-material/FiberManualRecordRounded';
import { useEditionsQuery, useDashboardMetricsQuery, useMatchesQuery, usePublicStandingsQuery, useCompetitionsQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EntityHeroCard } from '@/components/sport/EntityHeroCard';
import { MatchCard } from '@/components/sport/MatchCard';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { LoadingState, SkeletonCard } from '@/components/ui/LoadingState';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useMemo } from 'react';
import { formatDateTime } from '@/utils/formatDate';
import { ErrorState } from '@/components/ui/ErrorState';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: editions = [], isLoading: loadingEd } = useEditionsQuery();
  const selectedEditionId = useGlobalStore((s) => s.selectedEditionId);
  const activeEdition = useMemo(() => {
    if (selectedEditionId) return editions.find((e) => e.id === selectedEditionId);
    return editions.find((e) => e.status === 'ACTIVE') ?? editions[0];
  }, [editions, selectedEditionId]);

  const { data: metrics, isLoading: loadingMetrics, isError: metricsError, refetch: retryMetrics } = useDashboardMetricsQuery(activeEdition?.id ?? '');
  const { data: matches = [], isLoading: loadingMatches, isError: matchesError, refetch: retryMatches } = useMatchesQuery(undefined, 'SCHEDULED');
  const { data: comps = [] } = useCompetitionsQuery(activeEdition?.id);
  const firstCompId = comps[0]?.id;
  const { data: standings = [], isLoading: loadingStandings } = usePublicStandingsQuery(firstCompId ?? '');

  return (
    <Box>
      <PageHeader
        title="Resumen de la liga"
        subtitle={activeEdition ? `Resumen de ${activeEdition.name}` : 'Resumen general del sistema'}
        action={<Button variant="contained" onClick={() => navigate(ROUTES.admin.schedule)}>Programar partidos</Button>}
      />

      {activeEdition && (
        <Box sx={{ mb: 3 }}>
          <EntityHeroCard
            title={activeEdition.name}
            subtitle={activeEdition.startDate ? formatDateTime(activeEdition.startDate) : ''}
            chips={
              <Stack direction="row" spacing={1}>
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'var(--primarySoft)', fontSize: 12, fontWeight: 600 }}>
                  Temporada {activeEdition.seasonNumber}
                </Box>
              </Stack>
            }
          />
        </Box>
      )}

      {metricsError ? <Box sx={{ mb: 3 }}><ErrorState title="No pudimos cargar el resumen" onRetry={() => void retryMetrics()} /></Box> : <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Equipos inscritos"
            value={metrics?.teams ?? '—'}
            icon={<GroupsRounded />}
            tint="primary"
            loading={loadingMetrics}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Jugadores activos"
            value={metrics?.players ?? '—'}
            icon={<PersonRounded />}
            tint="info"
            loading={loadingMetrics}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Partidos jugados"
            value={metrics?.matchesPlayed ?? '—'}
            icon={<SportsSoccerRounded />}
            tint="success"
            loading={loadingMetrics}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="En vivo ahora"
            value={metrics?.matchesLive ?? '—'}
            icon={<FiberManualRecordRounded />}
            tint="danger"
            loading={loadingMetrics}
          />
        </Grid>
      </Grid>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box component="section">
            <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Próximos partidos</Typography>
            {matchesError ? <ErrorState title="No pudimos cargar los partidos" onRetry={() => void retryMatches()} /> : loadingMatches ? <LoadingState rows={3} /> : matches.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay partidos programados.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {matches.slice(0, 5).map((m) => <MatchCard key={m.id} match={m} onClick={() => navigate(ROUTES.admin.matchDetail.replace(':id', m.id))} />)}
              </Stack>
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {loadingStandings ? (
            <SkeletonCard />
          ) : firstCompId ? (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {comps[0]?.name}
              </Typography>
              <StandingsTable rows={standings.slice(0, 6)} compact />
            </Box>
          ) : (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">Sin competiciones activas.</Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
