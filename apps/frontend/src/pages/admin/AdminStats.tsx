import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Stack, Avatar, Tabs, Tab, Typography, Grid2 as Grid, TablePagination } from '@mui/material';
import { GroupsRounded, SportsSoccerRounded, PersonRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { historyApi, type HistoryFilters, type HistoryReportRow } from '@/api/history.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HistoryControls } from '@/components/sport/HistoryControls';
import { useDebouncedValue } from '@/hooks/common/useDebouncedValue';

const AdminStats: React.FC = () => {
  const navigate = useNavigate();
  const [kind, setKind] = useState<'players' | 'teams'>('players');
  const [filters, setFilters] = useState<HistoryFilters>({ page: 1, limit: 25 });
  const settledSearch = useDebouncedValue(filters.q);
  const requestFilters = { ...filters, q: settledSearch };
  const report = useQuery({ queryKey: ['history', 'report', kind, requestFilters], queryFn: () => historyApi.report(kind, requestFilters), staleTime: 15000 });
  const data = report.data;
  const numeric = (key: keyof HistoryReportRow, label: string): DataTableColumn<HistoryReportRow> => ({ key, label, align: 'right', render: (row) => <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{row[key] ?? 0}</Typography> });
  const columns: DataTableColumn<HistoryReportRow>[] = [
    { key: 'name', label: kind === 'players' ? 'Jugador' : 'Equipo', render: (row) => <Stack direction="row" alignItems="center" spacing={1.5}><Avatar src={row.photoUrl || row.logoUrl || undefined} sx={{ width: 36, height: 36 }} /><Box><Typography fontWeight={600}>{row.name}</Typography>{row.documentNumber && <Typography variant="caption" color="text.secondary">{row.documentNumber}</Typography>}</Box></Stack> },
    { key: 'status', label: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
    numeric('tournaments', 'Torneos'), numeric(kind === 'players' ? 'teams' : 'players', kind === 'players' ? 'Equipos' : 'Jugadores únicos'),
    numeric('matchesPlayed', 'PJ'), numeric('goals', kind === 'players' ? 'Goles' : 'GF'),
    ...(kind === 'players' ? [numeric('assists', 'Asistencias'), numeric('yellowCards', 'TA'), numeric('redCards', 'TR')]
      : [numeric('goalsAgainst', 'GC'), numeric('wins', 'Ganados'), numeric('draws', 'Empates'), numeric('losses', 'Perdidos')]),
  ];
  return <Box>
    <PageHeader title="Historial y estadísticas" subtitle="Consulta la trayectoria completa de jugadores y equipos, incluidas las ediciones terminadas y los registros inactivos." />
    <Tabs value={kind} onChange={(_e, next) => { setKind(next); setFilters({ ...filters, page: 1, teamId: undefined }); }} sx={{ mb: 3 }}><Tab value="players" label="Jugadores" /><Tab value="teams" label="Equipos" /></Tabs>
    <HistoryControls key={kind} value={filters} onChange={setFilters} report teamFilter={kind === 'players'} />
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 4 }}><StatCard label={kind === 'players' ? 'Jugadores únicos' : 'Equipos únicos'} value={data?.summary.total ?? 0} icon={kind === 'players' ? <PersonRounded /> : <GroupsRounded />} loading={report.isPending} /></Grid>
      <Grid size={{ xs: 12, sm: 4 }}><StatCard label={kind === 'players' ? 'Goles de jugadores' : 'Goles a favor'} value={data?.summary.goals ?? 0} icon={<SportsSoccerRounded />} tint="success" loading={report.isPending} /></Grid>
      <Grid size={{ xs: 12, sm: 4 }}><StatCard label={kind === 'players' ? 'Participaciones de jugadores' : 'Participaciones de equipos'} value={data?.summary.matchesPlayed ?? 0} icon={<GroupsRounded />} tint="info" loading={report.isPending} /></Grid>
    </Grid>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Los totales incluyen todas las páginas del filtro. PJ de jugadores corresponde a los acumulados guardados al finalizar partidos; PJ de equipos cuenta partidos finalizados. Abre una fila para consultar su trayectoria.</Typography>
    <DataTable rows={data?.rows ?? []} columns={columns} getRowKey={(r) => r.id} loading={report.isPending} error={report.error} onRetry={() => void report.refetch()}
      onRowClick={(r) => navigate(`/admin/${kind === 'players' ? 'jugadores' : 'equipos'}/${r.id}`)} emptyTitle="Sin registros para estos filtros" emptyDescription="Limpia los filtros o prueba otro periodo." />
    <TablePagination component="div" count={data?.total ?? 0} page={(filters.page ?? 1) - 1} rowsPerPage={filters.limit ?? 25} rowsPerPageOptions={[25, 50, 100]}
      onPageChange={(_e, page) => setFilters({ ...filters, page: page + 1 })} onRowsPerPageChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
      labelRowsPerPage="Registros por página" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} />
  </Box>;
};
export default AdminStats;
