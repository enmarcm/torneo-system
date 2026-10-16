import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Avatar, Stack, Typography, Grid2 as Grid, TablePagination } from '@mui/material';
import { ArrowBackRounded, PersonRounded, SportsSoccerRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { historyApi, type HistoryFilters } from '@/api/history.api';
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
  const query = useQuery({ queryKey: ['history', 'team', id, filters], queryFn: () => historyApi.team(id!, filters), enabled: !!id, staleTime: 15000 });
  if (query.isPending) return <PageLoader />;
  if (query.error || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;
  const data = query.data, team = data.team;
  const historicalPlayers = data.career.flatMap((r) => r.roster.map((entry) => ({ ...entry, competition: r.competition })));
  return <Box>
    <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.teams)} sx={{ mb: 2 }}>Volver a equipos</Button>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}><Avatar src={team.logoUrl || undefined} sx={{ width: 64, height: 64 }} /><Box>
      <PageHeader title={team.name} subtitle={`${team.leader ? `Delegado: ${team.leader.username}` : 'Sin delegado asignado'} · Registro: ${formatDate(team.createdAt)}`} /><StatusBadge status={team.status} />
    </Box></Stack>
    <HistoryControls value={filters} onChange={(next) => { setRosterPage(0); setFilters(next); }} />
    <Grid container spacing={2} sx={{ mb: 3 }}>{[
      ['Torneos', data.career.length, <EmojiEventsRounded />], ['Jugadores únicos', data.players, <PersonRounded />],
      ['Partidos jugados', data.totals.matchesPlayed, <SportsSoccerRounded />], ['Goles a favor', data.totals.goalsFor, <SportsSoccerRounded />],
    ].map(([label, value, icon]) => <Grid key={String(label)} size={{ xs: 6, md: 3 }}><StatCard label={String(label)} value={value as number} icon={icon} /></Grid>)}</Grid>
    <Typography sx={{ mb: 3 }}>Ganados: {data.totals.wins} · Empatados: {data.totals.draws} · Perdidos: {data.totals.losses} · Goles en contra: {data.totals.goalsAgainst}</Typography>
    <Typography variant="h4" sx={{ mb: 2 }}>Torneos y plantillas históricas</Typography>
    <DataTable rows={data.career} getRowKey={(r) => r.id} emptyTitle="Sin torneos en este periodo" emptyDescription="Consulta otro periodo o limpia los filtros." columns={[
      { key: 'edition', label: 'Edición', render: (r) => `${r.competition.edition.year} · ${r.competition.edition.name}` },
      { key: 'competition', label: 'Torneo', render: (r) => <Button onClick={() => navigate(`/admin/competiciones/${r.competition.id}`)}>{r.competition.name}</Button> },
      { key: 'status', label: 'Inscripción', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'outcome', label: 'Resultado de edición', render: (r) => ({ NONE: 'Sin decisión', PROMOTED: 'Ascendido', RELEGATED: 'Descendido', WITHDRAWN: 'No participa' }[r.outcome] ?? r.outcome) },
      { key: 'players', label: 'Jugadores', render: (r) => r.roster.length },
      { key: 'matches', label: 'PJ', render: (r) => r.totals.matchesPlayed },
      { key: 'results', label: 'G / E / P', render: (r) => `${r.totals.wins} / ${r.totals.draws} / ${r.totals.losses}` },
      { key: 'goals', label: 'GF / GC', render: (r) => `${r.totals.goalsFor} / ${r.totals.goalsAgainst}` },
      { key: 'roster', label: 'Plantilla', render: (r) => <Button onClick={() => setRosterOf({ id: r.id, label: `${r.competition.name} · ${r.competition.edition.name}`, max: r.competition.maxPlayers })}>Consultar / editar</Button> },
    ]} />
    <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>Jugadores por torneo</Typography>
    <DataTable rows={historicalPlayers.slice(rosterPage * 25, (rosterPage + 1) * 25)} getRowKey={(r) => r.id}
      emptyTitle="Sin jugadores inscritos" emptyDescription="No hay plantillas en el periodo seleccionado." columns={[
        { key: 'player', label: 'Jugador', render: (r) => <Button onClick={() => navigate(`/admin/jugadores/${r.player.id}`)}>{r.player.firstName} {r.player.lastName}</Button> },
        { key: 'competition', label: 'Torneo', render: (r) => `${r.competition.name} · ${r.competition.edition.year}` },
        { key: 'status', label: 'Plantilla', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'matches', label: 'PJ', render: (r) => r.stats?.matchesPlayed ?? 0 },
        { key: 'goals', label: 'Goles', render: (r) => r.stats?.goals ?? 0 },
        { key: 'cards', label: 'TA / TR', render: (r) => `${r.stats?.yellowCards ?? 0} / ${r.stats?.redCards ?? 0}` },
      ]} />
    <TablePagination component="div" count={historicalPlayers.length} page={rosterPage} rowsPerPage={25} rowsPerPageOptions={[]} onPageChange={(_e, page) => setRosterPage(page)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} />
    <Box sx={{ mt: 4 }}><HistoryMatches matches={data.matches} total={data.totalMatches} page={filters.page ?? 1} limit={filters.limit ?? 25} onPage={(page) => setFilters({ ...filters, page })} /></Box>
    <AppDrawer open={!!rosterOf} onClose={() => setRosterOf(null)} title="Plantilla del torneo" subtitle={rosterOf?.label}>
      {rosterOf && <RosterEditor registrationId={rosterOf.id} maxPlayers={rosterOf.max} />}
    </AppDrawer>
  </Box>;
};
export default AdminTeamDetail;
