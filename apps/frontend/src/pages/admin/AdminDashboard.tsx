import { Grid2 as Grid, Box, Card, Stack, Typography } from '@mui/material';
import { GroupsRounded, PersonRounded, SportsSoccerRounded, FiberManualRecordRounded } from '@mui/icons-material';
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

const AdminDashboard: React.FC = () => {
  const { data: editions = [], isLoading: loadingEd } = useEditionsQuery();
  const selectedEditionId = useGlobalStore((s) => s.selectedEditionId);
  const activeEdition = useMemo(() => {
    if (selectedEditionId) return editions.find((e) => e.id === selectedEditionId);
    return editions.find((e) => e.status === 'ACTIVE') ?? editions[0];
  }, [editions, selectedEditionId]);

  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetricsQuery(activeEdition?.id ?? '');
  const { data: matches = [], isLoading: loadingMatches } = useMatchesQuery(undefined, 'SCHEDULED');
  const { data: comps = [] } = useCompetitionsQuery(activeEdition?.id);
  const firstCompId = comps[0]?.id;
  const { data: standings = [], isLoading: loadingStandings } = usePublicStandingsQuery(firstCompId ?? '');

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={activeEdition ? `Resumen de ${activeEdition.name}` : 'Resumen general del sistema'}
      />

      {activeEdition && (
        <Box sx={{ mb: 3 }}>
          <EntityHeroCard
            title={activeEdition.name}
            subtitle={`${activeEdition.startDate ? formatDateTime(activeEdition.startDate) : ''} · ${activeEdition.transfersOpen ? 'Traspasos abiertos' : 'Traspasos cerrados'}`}
            chips={
              <Stack direction="row" spacing={1}>
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 600 }}>
                  Temporada {activeEdition.seasonNumber}
                </Box>
              </Stack>
            }
          />
        </Box>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Equipos inscritos"
            value={metrics?.teams ?? 0}
            icon={<GroupsRounded />}
            tint="primary"
            loading={loadingMetrics}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Jugadores activos"
            value={metrics?.players ?? 0}
            icon={<PersonRounded />}
            tint="info"
            loading={loadingMetrics}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Partidos jugados"
            value={metrics?.matchesPlayed ?? 0}
            icon={<SportsSoccerRounded />}
            tint="success"
            loading={loadingMetrics}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="En vivo ahora"
            value={metrics?.matchesLive ?? 0}
            icon={<FiberManualRecordRounded />}
            tint="danger"
            loading={loadingMetrics}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Próximos partidos</Typography>
            {loadingMatches ? <LoadingState rows={3} /> : matches.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay partidos programados.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {matches.slice(0, 5).map((m) => <MatchCard key={m.id} match={m} />)}
              </Stack>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {loadingStandings ? (
            <SkeletonCard />
          ) : firstCompId ? (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {comps[0]?.name}
              </Typography>
              <StandingsTable rows={standings.slice(0, 6)} />
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
