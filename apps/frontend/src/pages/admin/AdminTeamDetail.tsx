import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Avatar, Stack, Typography, Grid2 as Grid, TablePagination } from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import SportsSoccerRounded from '@mui/icons-material/SportsSoccerRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import { useParams, useNavigate } from 'react-router-dom';
import { historyApi, type HistoryFilters } from '@/api/history.api';
import type { PlayerHold } from '@/api/players.api';
import { usePlayerHoldsQuery } from '@/hooks/queries';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import { ReleasePlayerDialog, type ReleaseTarget } from '@/components/sport/ReleasePlayerDialog';
import { AGE_GROUP_LABELS } from '@/utils/competitionMeta';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageLoader } from '@/components/ui/PageLoader';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { RosterEditor } from '@/components/sport/RosterEditor';
import { HistoryControls } from '@/components/sport/HistoryControls';
import { HistoryMatches } from '@/components/sport/HistoryMatches';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routes';

const AdminTeamDetail: React.FC = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [filters, setFilters] = useState<HistoryFilters>({ page: 1, limit: 25 });
  const [rosterOf, setRosterOf] = useState<{ id: string; label: string; max: number } | null>(null);
  const [rosterPage, setRosterPage] = useState(0);
  const [releasing, setReleasing] = useState<ReleaseTarget | null>(null);
  const holdsQuery = usePlayerHoldsQuery(id, !!id);
  const query = useQuery({ queryKey: ['history', 'team', id, filters], queryFn: () => historyApi.team(id!, filters), enabled: !!id, staleTime: 15000 });
  if (query.isPending) return <PageLoader />;
  if (query.error || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;
  const data = query.data, team = data.team;
  const historicalPlayers = data.career.flatMap((r) => r.roster.map((entry) => ({ ...entry, competition: r.competition })));
  return <Box>
    <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.teams)} sx={{ mb: 2 }}>Volver a equipos</Button>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3, minWidth: 0 }}><Avatar src={team.logoUrl || undefined} sx={{ width: 64, height: 64, flexShrink: 0 }} /><Box sx={{ minWidth: 0, width: '100%' }}>
      <PageHeader title={team.name} subtitle={`${team.leader ? `Delegado: ${team.leader.username}` : 'Sin delegado asignado'} · Registro: ${formatDate(team.createdAt)}`} /><StatusBadge status={team.status} />
    </Box></Stack>
    <HistoryControls value={filters} onChange={(next) => { setRosterPage(0); setFilters(next); }} />
    <Grid container spacing={2} sx={{ mb: 3 }}>{[
      ['Torneos', data.career.length, <EmojiEventsRounded />], ['Jugadores únicos', data.players, <PersonRounded />],
      ['Partidos jugados', data.totals.matchesPlayed, <SportsSoccerRounded />], ['Goles a favor', data.totals.goalsFor, <SportsSoccerRounded />],
    ].map(([label, value, icon]) => <Grid key={String(label)} size={{ xs: 6, md: 3 }}><StatCard label={String(label)} value={value as number} icon={icon} /></Grid>)}</Grid>
    <Typography sx={{ mb: 3 }}>Ganados: {data.totals.wins} · Empatados: {data.totals.draws} · Perdidos: {data.totals.losses} · Goles en contra: {data.totals.goalsAgainst}</Typography>
    <Typography variant="h4" sx={{ mb: 1 }}>Jugadores del equipo</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Los que este equipo tiene hoy en Adultos y en Menores. Al liberarlos, otro equipo podrá inscribirlos.</Typography>
    <DataTable<PlayerHold>
      rows={holdsQuery.data ?? []}
      loading={holdsQuery.isLoading}
      getRowKey={(r) => r.id}
      emptyTitle="Sin jugadores asignados"
      emptyDescription="Cuando el equipo inscriba jugadores, aparecerán aquí."
      columns={[
        { key: 'player', label: 'Jugador', render: (r) => <Button onClick={() => navigate(`/admin/jugadores/${r.player.id}`)}>{r.player.firstName} {r.player.lastName}</Button> },
        { key: 'section', label: 'Apartado', render: (r) => AGE_GROUP_LABELS[r.ageGroup] },
        { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.player.status} /> },
      ]}
      actions={[{
        label: 'Liberar jugador',
        icon: <LockOpenRounded fontSize="small" />,
        color: 'error',
        onClick: (r) => setReleasing({ playerId: r.player.id, playerName: `${r.player.firstName} ${r.player.lastName}`, holds: [{ ageGroup: r.ageGroup, teamName: team.name }] }),
      }]}
    />
    <ReleasePlayerDialog target={releasing} onClose={() => setReleasing(null)} />
    <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>Torneos y plantillas históricas</Typography>
    <DataTable rows={data.career} getRowKey={(r) => r.id} emptyTitle="Sin torneos en este periodo" emptyDescription="Consulta otro periodo o limpia los filtros." columns={[
      { key: 'edition', label: 'Edición', render: (r) => `${r.competition.edition.year} · ${r.competition.edition.name}` },
      { key: 'competition', label: 'Torneo', render: (r) => <Button onClick={() => navigate(`/admin/competiciones/${r.competition.id}`)}>{r.competition.name}</Button> },
      { key: 'status', label: 'Inscripción', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'outcome', label: 'Resultado de edición', render: (r) => ({ NONE: 'Sin decisión', PROMOTED: 'Ascendido', RELEGATED: 'Descendido', WITHDRAWN: 'No participa' }[r.outcome] ?? r.outcome) },
      { key: 'players', label: 'Jugadores', align: 'right', render: (r) => r.roster.length },
      { key: 'matches', label: 'PJ', align: 'right', render: (r) => r.totals.matchesPlayed },
      { key: 'results', label: 'G / E / P', align: 'right', render: (r) => `${r.totals.wins} / ${r.totals.draws} / ${r.totals.losses}` },
      { key: 'goals', label: 'GF / GC', align: 'right', render: (r) => `${r.totals.goalsFor} / ${r.totals.goalsAgainst}` },
      { key: 'roster', label: 'Plantilla', render: (r) => <Button onClick={() => setRosterOf({ id: r.id, label: `${r.competition.name} · ${r.competition.edition.name}`, max: r.competition.maxPlayers })}>Consultar / editar</Button> },
    ]} />
    <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>Jugadores por torneo</Typography>
    <DataTable rows={historicalPlayers.slice(rosterPage * 25, (rosterPage + 1) * 25)} getRowKey={(r) => r.id}
      emptyTitle="Sin jugadores inscritos" emptyDescription="No hay plantillas en el periodo seleccionado." columns={[
        { key: 'player', label: 'Jugador', render: (r) => <Button onClick={() => navigate(`/admin/jugadores/${r.player.id}`)}>{r.player.firstName} {r.player.lastName}</Button> },
        { key: 'competition', label: 'Torneo', render: (r) => `${r.competition.name} · ${r.competition.edition.year}` },
        { key: 'status', label: 'Plantilla', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'matches', label: 'PJ', align: 'right', render: (r) => r.stats?.matchesPlayed ?? 0 },
        { key: 'goals', label: 'Goles', align: 'right', render: (r) => r.stats?.goals ?? 0 },
        { key: 'cards', label: 'TA / TR', align: 'right', render: (r) => `${r.stats?.yellowCards ?? 0} / ${r.stats?.redCards ?? 0}` },
      ]} />
    <TablePagination component="div" count={historicalPlayers.length} page={rosterPage} rowsPerPage={25} rowsPerPageOptions={[]} onPageChange={(_e, page) => setRosterPage(page)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} />
    <Box sx={{ mt: 4 }}><HistoryMatches matches={data.matches} total={data.totalMatches} page={filters.page ?? 1} limit={filters.limit ?? 25} onPage={(page) => setFilters({ ...filters, page })} /></Box>
    <AppDrawer open={!!rosterOf} onClose={() => setRosterOf(null)} title="Plantilla del torneo" subtitle={rosterOf?.label}>
      {rosterOf && <RosterEditor registrationId={rosterOf.id} maxPlayers={rosterOf.max} />}
    </AppDrawer>
  </Box>;
};
export default AdminTeamDetail;
