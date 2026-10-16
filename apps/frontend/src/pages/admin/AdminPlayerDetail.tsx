import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Avatar, Stack, Typography, Grid2 as Grid } from '@mui/material';
import { ArrowBackRounded, GroupsRounded, SportsSoccerRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { historyApi, type HistoryFilters } from '@/api/history.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageLoader } from '@/components/ui/PageLoader';
import { HistoryControls } from '@/components/sport/HistoryControls';
import { HistoryMatches } from '@/components/sport/HistoryMatches';
import { calcAge, formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routes';

const AdminPlayerDetail: React.FC = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [filters, setFilters] = useState<HistoryFilters>({ page: 1, limit: 25 });
  const query = useQuery({ queryKey: ['history', 'player', id, filters], queryFn: () => historyApi.player(id!, filters), enabled: !!id, staleTime: 15000 });
  if (query.isPending) return <PageLoader />;
  if (query.error || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;
  const data = query.data, player = data.player;
  return <Box>
    <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.players)} sx={{ mb: 2 }}>Volver a jugadores</Button>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}><Avatar src={player.photoUrl || undefined} sx={{ width: 64, height: 64 }} /><Box>
      <PageHeader title={`${player.firstName} ${player.lastName}`} subtitle={`${player.documentType === 'CEDULA' ? 'C.I.' : 'P.N.'} ${player.documentNumber} · ${calcAge(player.birthDate)} años · Registro: ${formatDate(player.createdAt)}`} />
      <Stack direction="row" spacing={1.5} alignItems="center"><StatusBadge status={player.status} />{player.universityDegreeVerified && <Typography variant="caption" color="success.main">Título verificado</Typography>}</Stack>
    </Box></Stack>
    <HistoryControls value={filters} onChange={setFilters} teamFilter />
    <Grid container spacing={2} sx={{ mb: 3 }}>{[
      ['Equipos', data.teams, <GroupsRounded />], ['Torneos', data.tournaments, <EmojiEventsRounded />],
      ['Partidos acumulados', data.totals.matchesPlayed, <SportsSoccerRounded />], ['Goles', data.totals.goals, <SportsSoccerRounded />],
    ].map(([label, value, icon]) => <Grid key={String(label)} size={{ xs: 6, md: 3 }}><StatCard label={String(label)} value={value as number} icon={icon} /></Grid>)}</Grid>
    <Typography variant="h4" sx={{ mb: 2 }}>Trayectoria por equipo y torneo</Typography>
    <DataTable rows={data.career} getRowKey={(r) => r.id} emptyTitle="Sin inscripciones en este periodo" emptyDescription="Consulta otro periodo o limpia los filtros." columns={[
      { key: 'edition', label: 'Edición', render: (r) => `${r.teamRegistration.competition.edition.year} · ${r.teamRegistration.competition.edition.name}` },
      { key: 'team', label: 'Equipo', render: (r) => <Button onClick={() => navigate(`/admin/equipos/${r.teamRegistration.team.id}`)}>{r.teamRegistration.team.name}</Button> },
      { key: 'competition', label: 'Torneo', render: (r) => <Button onClick={() => navigate(`/admin/competiciones/${r.teamRegistration.competition.id}`)}>{r.teamRegistration.competition.name}</Button> },
      { key: 'section', label: 'Apartado', render: (r) => r.teamRegistration.competition.ageGroup === 'YOUTH' ? 'Menores' : 'Adultos' },
      { key: 'status', label: 'Plantilla', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'matches', label: 'PJ', align: 'right', render: (r) => r.stats?.matchesPlayed ?? 0 },
      { key: 'goals', label: 'Goles', align: 'right', render: (r) => r.stats?.goals ?? 0 },
      { key: 'assists', label: 'Asistencias', align: 'right', render: (r) => r.stats?.assists ?? 0 },
      { key: 'cards', label: 'TA / TR', render: (r) => `${r.stats?.yellowCards ?? 0} / ${r.stats?.redCards ?? 0}` },
    ]} />
    <Box sx={{ mt: 4 }}><HistoryMatches player matches={data.matches} total={data.totalMatches} page={filters.page ?? 1} limit={filters.limit ?? 25} onPage={(page) => setFilters({ ...filters, page })} /></Box>
    <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>Traspasos registrados</Typography>
    <DataTable rows={data.transfers} getRowKey={(r) => r.id} emptyTitle="Sin traspasos registrados" emptyDescription="La trayectoria anterior muestra las inscripciones aunque no exista un traspaso formal." columns={[
      { key: 'date', label: 'Fecha', render: (r) => formatDate(r.createdAt) },
      { key: 'from', label: 'Origen', render: (r) => r.fromRegistration?.team.name ?? 'Alta inicial' },
      { key: 'to', label: 'Destino', render: (r) => r.toRegistration.team.name },
      { key: 'competition', label: 'Torneo', render: (r) => `${r.toRegistration.competition.name} · ${r.edition.name}` },
      { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
    ]} />
  </Box>;
};
export default AdminPlayerDetail;
