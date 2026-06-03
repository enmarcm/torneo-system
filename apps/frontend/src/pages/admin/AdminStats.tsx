import { Box, Card, Typography, Stack, Avatar, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useState, useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePlayerStatsQuery, useCompetitionsQuery } from '@/hooks/queries';
import { GroupsRounded, SportsSoccerRounded, AssistantRounded, SquareRounded, FlagRounded } from '@mui/icons-material';

const AdminStats: React.FC = () => {
  const { data: stats = [], isLoading, error, refetch } = usePlayerStatsQuery();
  const { data: comps = [] } = useCompetitionsQuery();
  const [filterCompetition, setFilterCompetition] = useState<string>('');

  const filtered = useMemo(() => {
    if (!filterCompetition) return stats as any[];
    return (stats as any[]).filter(
      (s) => s.rosterEntry?.teamRegistration?.competitionId === filterCompetition,
    );
  }, [stats, filterCompetition]);

  const summary = useMemo(() => ({
    totalPlayers: filtered.length,
    totalGoals: filtered.reduce((s: number, p: any) => s + (p.goals ?? 0), 0),
    totalAssists: filtered.reduce((s: number, p: any) => s + (p.assists ?? 0), 0),
    totalYellow: filtered.reduce((s: number, p: any) => s + (p.yellowCards ?? 0), 0),
    totalRed: filtered.reduce((s: number, p: any) => s + (p.redCards ?? 0), 0),
  }), [filtered]);

  const topScorers = useMemo(() =>
    [...filtered].sort((a: any, b: any) => (b.goals ?? 0) - (a.goals ?? 0)).slice(0, 10), [filtered]);

  const topAssists = useMemo(() =>
    [...filtered].sort((a: any, b: any) => (b.assists ?? 0) - (a.assists ?? 0)).slice(0, 10), [filtered]);

  const topCards = useMemo(() =>
    [...filtered].sort((a: any, b: any) => ((b.yellowCards ?? 0) + (b.redCards ?? 0)) - ((a.yellowCards ?? 0) + (a.redCards ?? 0))).slice(0, 10), [filtered]);

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Estadísticas Generales" subtitle="Cargando estadísticas del sistema…" />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, md: 2.4 }}>
              <StatCard label="…" value={0} icon={<GroupsRounded />} loading />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Box>
      <PageHeader
        title="Estadísticas Generales"
        subtitle="Goleadores, asistentes, tarjetas y rendimiento detallado por jugador."
      />

      {comps.length > 0 && (
        <Card sx={{ p: { xs: 1.5, md: 2 }, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
            <InputLabel>Competición</InputLabel>
            <Select
              label="Competición"
              value={filterCompetition}
              onChange={(e) => setFilterCompetition(e.target.value)}
            >
              <MenuItem value="">Todas las competiciones</MenuItem>
              {comps.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Jugadores" value={summary.totalPlayers} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Goles" value={summary.totalGoals} icon={<SportsSoccerRounded />} tint="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Asistencias" value={summary.totalAssists} icon={<AssistantRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Tarjetas Amarillas" value={summary.totalYellow} icon={<SquareRounded />} tint="warning" />
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Tarjetas Rojas" value={summary.totalRed} icon={<FlagRounded />} tint="danger" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <SportsSoccerRounded color="success" />
              <Typography variant="h3">Máximos Goleadores</Typography>
            </Stack>
            {topScorers.length === 0 || topScorers.every((s: any) => !s.goals) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aún no hay goles registrados.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: topScorers.map((s: any) => `${s.rosterEntry?.player?.firstName ?? ''} ${s.rosterEntry?.player?.lastName ?? ''}`.split(' ')[0]) }]}
                  series={[{ data: topScorers.map((s: any) => s.goals ?? 0), label: 'Goles', color: '#22C55E' }]}
                  layout="horizontal"
                  margin={{ left: 80, right: 20, top: 10, bottom: 30 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </Box>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <AssistantRounded color="info" />
              <Typography variant="h3">Mayores Asistentes</Typography>
            </Stack>
            {topAssists.length === 0 || topAssists.every((s: any) => !s.assists) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aún no hay asistencias registradas.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: topAssists.map((s: any) => `${s.rosterEntry?.player?.firstName ?? ''} ${s.rosterEntry?.player?.lastName ?? ''}`.split(' ')[0]) }]}
                  series={[{ data: topAssists.map((s: any) => s.assists ?? 0), label: 'Asistencias', color: '#3B82F6' }]}
                  layout="horizontal"
                  margin={{ left: 80, right: 20, top: 10, bottom: 30 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </Box>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <SquareRounded color="warning" />
              <Typography variant="h3">Tarjetas</Typography>
            </Stack>
            {topCards.length === 0 || topCards.every((s: any) => !s.yellowCards && !s.redCards) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aún no hay tarjetas registradas.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: topCards.map((s: any) => `${s.rosterEntry?.player?.firstName ?? ''} ${s.rosterEntry?.player?.lastName ?? ''}`.split(' ')[0]) }]}
                  series={[
                    { data: topCards.map((s: any) => s.yellowCards ?? 0), label: 'Amarillas', color: '#F59E0B', stack: 'total' },
                    { data: topCards.map((s: any) => s.redCards ?? 0), label: 'Rojas', color: '#EF4444', stack: 'total' },
                  ]}
                  layout="horizontal"
                  margin={{ left: 80, right: 20, top: 20, bottom: 30 }}
                  slotProps={{ legend: { position: { vertical: 'top', horizontal: 'left' } } }}
                />
              </Box>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <SportsSoccerRounded color="primary" />
              <Typography variant="h3">Minutos Jugados</Typography>
            </Stack>
            {topScorers.length === 0 || topScorers.every((s: any) => !s.minutesPlayed) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aún no hay minutos registrados.</Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: [...filtered].sort((a: any, b: any) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0)).slice(0, 10).map((s: any) => `${s.rosterEntry?.player?.firstName ?? ''} ${s.rosterEntry?.player?.lastName ?? ''}`.split(' ')[0]) }]}
                  series={[{ data: [...filtered].sort((a: any, b: any) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0)).slice(0, 10).map((s: any) => s.minutesPlayed ?? 0), label: 'Minutos', color: '#8B5CF6' }]}
                  layout="horizontal"
                  margin={{ left: 80, right: 20, top: 10, bottom: 30 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h3">Tabla Completa de Estadísticas</Typography>
          <Chip label={`${filtered.length} jugadores`} size="small" variant="outlined" />
        </Stack>
        {filtered.length === 0 ? (
          <Typography color="text.secondary">Aún no hay estadísticas. Finaliza partidos para empezar a contar.</Typography>
        ) : (
          <DataTable
            columns={[
              {
                key: 'player',
                label: 'Jugador',
                render: (row: any) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700, fontSize: 12 }}>
                      {row.rosterEntry?.player?.firstName?.[0]}{row.rosterEntry?.player?.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        {row.rosterEntry?.player?.firstName} {row.rosterEntry?.player?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.rosterEntry?.teamRegistration?.team?.name}
                      </Typography>
                    </Box>
                  </Box>
                ),
              },
              {
                key: 'team',
                label: 'Equipo',
                render: (row: any) => (
                  <Chip label={row.rosterEntry?.teamRegistration?.team?.name ?? '—'} size="small" variant="outlined" />
                ),
                hideInMobile: true,
              },
              {
                key: 'pj',
                label: 'PJ',
                render: (row: any) => <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{row.matchesPlayed ?? 0}</Typography>,
                align: 'right',
                width: 50,
              },
              {
                key: 'goals',
                label: 'G',
                render: (row: any) => <Typography sx={{ fontWeight: 700, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}>{row.goals ?? 0}</Typography>,
                align: 'right',
                width: 50,
              },
              {
                key: 'assists',
                label: 'A',
                render: (row: any) => <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.assists ?? 0}</Typography>,
                align: 'right',
                width: 50,
              },
              {
                key: 'yellow',
                label: 'TA',
                render: (row: any) => (
                  <Chip label={row.yellowCards ?? 0} size="small" sx={{ bgcolor: 'warning.soft', color: 'warning.main', fontWeight: 700, minWidth: 32, fontVariantNumeric: 'tabular-nums' }} />
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'red',
                label: 'TR',
                render: (row: any) => (
                  <Chip label={row.redCards ?? 0} size="small" sx={{ bgcolor: 'danger.soft', color: 'danger.main', fontWeight: 700, minWidth: 32, fontVariantNumeric: 'tabular-nums' }} />
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'min',
                label: 'Min',
                render: (row: any) => <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.minutesPlayed ?? 0}</Typography>,
                align: 'right',
                width: 50,
                hideInMobile: true,
              },
            ]}
            rows={[...filtered].sort((a: any, b: any) => (b.goals ?? 0) - (a.goals ?? 0))}
            getRowKey={(r: any) => r.id}
            emptyTitle="Sin estadísticas"
            emptyDescription="Finaliza partidos para que las estadísticas comiencen a generarse."
          />
        )}
      </Card>
    </Box>
  );
};

export default AdminStats;
