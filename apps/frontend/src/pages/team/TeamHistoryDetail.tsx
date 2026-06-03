import { useMemo } from 'react';
import { Box, Card, Typography, Stack, Chip, Avatar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { MatchCard } from '@/components/sport/MatchCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuthStore } from '@/store/useAuthStore';
import { useEditionQuery, useCompetitionsQuery, useTeamHistoryQuery, useTeamStatsQuery } from '@/hooks/queries';
import { formatDate } from '@/utils/formatDate';
import { EmojiEventsRounded, GroupsRounded, SportsSoccerRounded, BarChartRounded } from '@mui/icons-material';

const TeamHistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;

  const { data: edition, isLoading: loadingEdition, error: editionError, refetch: refetchEdition } = useEditionQuery(id ?? '');
  const { data: comps = [], isLoading: loadingComps } = useCompetitionsQuery(id);
  const { data: history = [], isLoading: loadingHistory } = useTeamHistoryQuery(teamId ?? undefined);
  const { data: stats, isLoading: loadingStats } = useTeamStatsQuery(teamId ?? undefined);

  const editionComps = useMemo(() =>
    comps.filter((c: any) => c.editionId === id), [comps, id]);

  const compMatches = useMemo(() => {
    const compMap: Record<string, typeof history> = {};
    for (const m of history) {
      if (!compMap[m.competitionId]) compMap[m.competitionId] = [];
      compMap[m.competitionId].push(m);
    }
    return compMap;
  }, [history]);

  if (loadingEdition || loadingComps || loadingHistory || loadingStats) return <LoadingState rows={6} />;
  if (editionError) return <ErrorState onRetry={refetchEdition} />;
  if (!edition) return <ErrorState onRetry={refetchEdition} />;

  return (
    <Box>
      <PageHeader
        title={edition.name}
        subtitle={`Temporada ${edition.seasonNumber} · ${edition.year}`}
      />

      <Card sx={{ p: { xs: 2, md: 3 }, mb: 3, background: 'var(--brandGradient)', color: '#fff', borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
          <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center' }}>
            <EmojiEventsRounded sx={{ fontSize: 32 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700 }}>{edition.name}</Typography>
            <Typography sx={{ opacity: 0.8 }}>
              {formatDate(edition.startDate)} → {formatDate(edition.endDate)}
            </Typography>
          </Box>
          <Chip label={edition.transfersOpen ? 'Traspasos abiertos' : 'Traspasos cerrados'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }} />
        </Stack>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Competiciones" value={editionComps.length} icon={<BarChartRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Partidos" value={stats?.totalPlayed ?? 0} icon={<SportsSoccerRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Victorias" value={stats?.wins ?? 0} icon={<EmojiEventsRounded />} tint="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Goles a favor" value={stats?.goalsFor ?? 0} icon={<SportsSoccerRounded />} tint="accent" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Goles en contra" value={stats?.goalsAgainst ?? 0} icon={<SportsSoccerRounded />} tint="danger" />
        </Grid>
      </Grid>

      {editionComps.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <Typography color="text.secondary">No hay competiciones en esta edición.</Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {editionComps.map((comp: any) => {
            const cm = compMatches[comp.id] ?? [];
            const wins = cm.filter((m) => {
              const isHome = m.homeRegistration.team.id === teamId;
              return m.status === 'FINISHED' && (isHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore);
            }).length;
            const gf = cm.reduce((sum, m) => {
              const isHome = m.homeRegistration.team.id === teamId;
              return m.status === 'FINISHED' ? sum + (isHome ? m.homeScore : m.awayScore) : sum;
            }, 0);
            const gc = cm.reduce((sum, m) => {
              const isHome = m.homeRegistration.team.id === teamId;
              return m.status === 'FINISHED' ? sum + (isHome ? m.awayScore : m.homeScore) : sum;
            }, 0);

            return (
              <Card key={comp.id} sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'start', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4">{comp.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comp.category?.name} · {comp.format === 'LEAGUE' ? 'Liga' : 'Copa'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ textAlign: 'center', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'primary.soft' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{cm.length} PJ</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'success.soft' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'success.main' }}>{wins} V</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'accent.soft' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'accent.main' }}>{gf}:{gc}</Typography>
                    </Box>
                  </Stack>
                </Stack>
                {cm.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Sin partidos en esta competición.</Typography>
                ) : (
                  <Grid container spacing={1.5}>
                    {cm.slice(0, 4).map((m) => (
                      <Grid key={m.id} size={{ xs: 12, md: 6 }}>
                        <MatchCard match={m} />
                      </Grid>
                    ))}
                    {cm.length > 4 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                          y {cm.length - 4} partido{cm.length - 4 !== 1 ? 's' : ''} más…
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default TeamHistoryDetail;
