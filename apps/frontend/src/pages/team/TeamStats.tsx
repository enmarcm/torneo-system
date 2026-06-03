import { useState, useMemo } from 'react';
import { Box, Card, FormControl, InputLabel, Select, MenuItem, Typography, Avatar, Chip, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  GroupRounded, SportsSoccerRounded, AssistantRounded,
  SquareRounded, FlagRounded,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamRegistrationsQuery } from '@/hooks/queries';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';

interface PlayerStatItem {
  playerId: string;
  name: string;
  position: string | null;
  photoUrl: string | null;
  jerseyNumber: number | null;
  competitionId: string;
  competitionName: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

const TeamStats: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;
  const { data: registrations = [], isLoading, error, refetch } = useTeamRegistrationsQuery(teamId ?? undefined);
  const [filterCompetition, setFilterCompetition] = useState<string>('');

  const competitionOptions = useMemo(() => {
    const seen = new Set<string>();
    return registrations
      .map((r) => ({ id: r.competitionId, name: r.competition.name }))
      .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
  }, [registrations]);

  const players = useMemo(() => {
    const filtered = filterCompetition
      ? registrations.filter((r) => r.competitionId === filterCompetition)
      : registrations;
    return filtered.flatMap((reg) =>
      reg.roster.map((entry) => ({
        playerId: entry.player.id,
        name: `${entry.player.firstName} ${entry.player.lastName}`,
        position: entry.player.position,
        photoUrl: entry.player.photoUrl,
        jerseyNumber: entry.jerseyNumber,
        competitionId: reg.competitionId,
        competitionName: reg.competition.name,
        matchesPlayed: entry.stats?.matchesPlayed ?? 0,
        goals: entry.stats?.goals ?? 0,
        assists: entry.stats?.assists ?? 0,
        yellowCards: entry.stats?.yellowCards ?? 0,
        redCards: entry.stats?.redCards ?? 0,
        minutesPlayed: entry.stats?.minutesPlayed ?? 0,
      }))
    );
  }, [registrations, filterCompetition]);

  const summary = useMemo(() => ({
    totalPlayers: players.length,
    totalGoals: players.reduce((s, p) => s + p.goals, 0),
    totalAssists: players.reduce((s, p) => s + p.assists, 0),
    totalYellow: players.reduce((s, p) => s + p.yellowCards, 0),
    totalRed: players.reduce((s, p) => s + p.redCards, 0),
  }), [players]);

  const topScorers = useMemo(() =>
    [...players].sort((a, b) => b.goals - a.goals).slice(0, 10), [players]);

  const topCards = useMemo(() =>
    [...players].sort((a, b) => (b.yellowCards + b.redCards) - (a.yellowCards + a.redCards)).slice(0, 10), [players]);

  const sortedPlayers = useMemo(() =>
    [...players].sort((a, b) => b.goals - a.goals), [players]);

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Estadísticas del Equipo" subtitle="Cargando estadísticas…" />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, md: 2.4 }}>
              <StatCard label="…" value={0} icon={<GroupRounded />} loading />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title="Estadísticas del Equipo" subtitle="Error al cargar estadísticas." />
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>No pudimos cargar las estadísticas.</Typography>
          <Chip label="Reintentar" color="primary" clickable onClick={() => refetch()} />
        </Card>
      </Box>
    );
  }

  if (!teamId) {
    return (
      <Box>
        <PageHeader title="Estadísticas del Equipo" subtitle="Sin equipo asignado." />
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No tienes un equipo asignado para ver estadísticas.</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Estadísticas del Equipo"
        subtitle="Rendimiento detallado de tus jugadores en todas las competiciones."
      />

      {competitionOptions.length > 1 && (
        <Card sx={{ p: { xs: 1.5, md: 2 }, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
            <InputLabel>Competición</InputLabel>
            <Select
              label="Competición"
              value={filterCompetition}
              onChange={(e) => setFilterCompetition(e.target.value)}
            >
              <MenuItem value="">Todas las competiciones</MenuItem>
              {competitionOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <StatCard label="Jugadores" value={summary.totalPlayers} icon={<GroupRounded />} tint="primary" />
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

      {/* Goal distribution by competition */}
      {(() => {
        const byComp = registrations
          .filter((r) => !filterCompetition || r.competitionId === filterCompetition)
          .map((r) => ({
            id: r.competitionId,
            name: r.competition.name,
            goals: r.roster.reduce((s, e) => s + (e.stats?.goals ?? 0), 0),
            color: r.competitionId === registrations[0]?.competitionId ? '#034292' : '#22C55E',
          }))
          .filter((c) => c.goals > 0);
        if (byComp.length > 0) {
          const colors = ['#034292', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];
          return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h3" sx={{ mb: 2 }}>Goles por Competición</Typography>
                  <Box sx={{ width: '100%', height: 280 }}>
                    <PieChart
                      series={[{
                        data: byComp.map((c, i) => ({ id: c.id, value: c.goals, label: c.name, color: colors[i % colors.length] })),
                        arcLabel: (v) => `${v.label}`,
                        arcLabelMinAngle: 30,
                      }]}
                      margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      slotProps={{ legend: { hidden: true } }}
                    />
                  </Box>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h3" sx={{ mb: 2 }}>Promedio de Goles por Jugador</Typography>
                  {(() => {
                    const avg = players.length > 0 ? (summary.totalGoals / players.length).toFixed(1) : '0.0';
                    const best = [...players].sort((a, b) => b.goals - a.goals)[0];
                    return (
                      <Stack spacing={2} sx={{ py: 2 }}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.soft', textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Promedio general</Typography>
                          <Typography sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 36, color: 'primary.main' }}>{avg}</Typography>
                          <Typography variant="caption" color="text.secondary">goles por jugador</Typography>
                        </Box>
                        {best && best.goals > 0 && (
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'success.soft', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Máximo goleador</Typography>
                            <Typography sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 28, color: 'success.main' }}>{best.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{best.goals} goles · {best.matchesPlayed} PJ</Typography>
                          </Box>
                        )}
                      </Stack>
                    );
                  })()}
                </Card>
              </Grid>
            </Grid>
          );
        }
        return null;
      })()}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Máximos Goleadores</Typography>
            {topScorers.length === 0 || topScorers.every((p) => p.goals === 0) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Aún no hay goles registrados.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: topScorers.map((p) => p.name.split(' ')[0]) }]}
                  series={[{ data: topScorers.map((p) => p.goals), label: 'Goles', color: '#22C55E' }]}
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
            <Typography variant="h3" sx={{ mb: 2 }}>Tarjetas</Typography>
            {topCards.length === 0 || topCards.every((p) => p.yellowCards + p.redCards === 0) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Aún no hay tarjetas registradas.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: topCards.map((p) => p.name.split(' ')[0]) }]}
                  series={[
                    { data: topCards.map((p) => p.yellowCards), label: 'Amarillas', color: '#F59E0B', stack: 'cards' },
                    { data: topCards.map((p) => p.redCards), label: 'Rojas', color: '#EF4444', stack: 'cards' },
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
            <Typography variant="h3" sx={{ mb: 2 }}>Asistencias</Typography>
            {topScorers.length === 0 || topScorers.every((p) => p.assists === 0) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Aún no hay asistencias registradas.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: [...players].sort((a, b) => b.assists - a.assists).slice(0, 10).map((p) => p.name.split(' ')[0]) }]}
                  series={[{ data: [...players].sort((a, b) => b.assists - a.assists).slice(0, 10).map((p) => p.assists), label: 'Asistencias', color: '#3B82F6' }]}
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
            <Typography variant="h3" sx={{ mb: 2 }}>Minutos Jugados</Typography>
            {topScorers.length === 0 || topScorers.every((p) => p.minutesPlayed === 0) ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Aún no hay minutos registrados.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <BarChart
                  yAxis={[{ scaleType: 'band', data: [...players].sort((a, b) => b.minutesPlayed - a.minutesPlayed).slice(0, 10).map((p) => p.name.split(' ')[0]) }]}
                  series={[{ data: [...players].sort((a, b) => b.minutesPlayed - a.minutesPlayed).slice(0, 10).map((p) => p.minutesPlayed), label: 'Min', color: '#8B5CF6' }]}
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
        <Typography variant="h3" sx={{ mb: 2 }}>Estadísticas por Jugador</Typography>
        {sortedPlayers.length === 0 ? (
          <Typography color="text.secondary">
            No hay jugadores en la plantilla{filterCompetition ? ' para esta competición' : ''}.
          </Typography>
        ) : (
          <DataTable
            columns={[
              {
                key: 'player',
                label: 'Jugador',
                render: (row: PlayerStatItem) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={row.photoUrl ?? undefined} sx={{ width: 32, height: 32, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700, fontSize: 12 }}>
                      {row.name[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.position ?? 'Sin posición'}{row.jerseyNumber ? ` · #${row.jerseyNumber}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                ),
              },
              {
                key: 'competition',
                label: 'Competición',
                render: (row: PlayerStatItem) => (
                  <Chip label={row.competitionName} size="small" variant="outlined" />
                ),
                hideInMobile: true,
              },
              {
                key: 'matchesPlayed',
                label: 'PJ',
                render: (row: PlayerStatItem) => (
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{row.matchesPlayed}</Typography>
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'goals',
                label: 'G',
                render: (row: PlayerStatItem) => (
                  <Typography sx={{ fontWeight: 700, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}>{row.goals}</Typography>
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'assists',
                label: 'A',
                render: (row: PlayerStatItem) => (
                  <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.assists}</Typography>
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'yellowCards',
                label: 'TA',
                render: (row: PlayerStatItem) => (
                  <Chip label={row.yellowCards} size="small" sx={{ bgcolor: 'warning.soft', color: 'warning.main', fontWeight: 700, minWidth: 32, fontVariantNumeric: 'tabular-nums' }} />
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'redCards',
                label: 'TR',
                render: (row: PlayerStatItem) => (
                  <Chip label={row.redCards} size="small" sx={{ bgcolor: 'danger.soft', color: 'danger.main', fontWeight: 700, minWidth: 32, fontVariantNumeric: 'tabular-nums' }} />
                ),
                align: 'right',
                width: 50,
              },
              {
                key: 'minutesPlayed',
                label: 'Min',
                render: (row: PlayerStatItem) => (
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.minutesPlayed}</Typography>
                ),
                align: 'right',
                width: 50,
                hideInMobile: true,
              },
            ]}
            rows={sortedPlayers}
            getRowKey={(r) => `${r.playerId}-${r.competitionId}`}
            emptyTitle="Sin estadísticas"
            emptyDescription="Los jugadores aún no tienen estadísticas registradas."
          />
        )}
      </Card>
    </Box>
  );
};

export default TeamStats;
