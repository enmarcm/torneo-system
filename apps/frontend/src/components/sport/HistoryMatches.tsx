import { Box, Button, TablePagination, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Match } from '@/api/matches.api';
import { formatDate } from '@/utils/formatDate';

export const HistoryMatches: React.FC<{ matches: Match[]; total: number; page: number; limit: number; onPage: (page: number) => void; player?: boolean }> = ({ matches, total, page, limit, onPage, player = false }) => {
  const navigate = useNavigate();
  return <Box><Typography variant="h4" sx={{ mb: 1 }}>Historial de partidos</Typography>
    {player && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Se muestran los partidos con asistencia o eventos registrados para este jugador. Los acumulados antiguos pueden no tener detalle por partido.</Typography>}
    <DataTable rows={matches} getRowKey={(m) => m.id} emptyTitle="Sin partidos en este periodo" emptyDescription="Prueba otro año o consulta todo el historial." columns={[
      { key: 'date', label: 'Fecha', render: (m) => m.scheduledAt ? formatDate(m.scheduledAt) : 'Sin fecha' },
      { key: 'competition', label: 'Torneo', render: (m) => m.competition?.name ?? '—' },
      { key: 'match', label: 'Partido', render: (m) => `${m.homeRegistration.team.name} – ${m.awayRegistration.team.name}` },
      { key: 'score', label: 'Marcador', render: (m) => m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.homeScore} – ${m.awayScore}` : 'Pendiente' },
      { key: 'status', label: 'Estado', render: (m) => <StatusBadge status={m.status} /> },
      ...(player ? [{ key: 'player', label: 'Jugador', render: (m: Match) => {
        const detail = m as Match & { attendances?: { present: boolean }[]; events?: { type: string }[] };
        const attendance = detail.attendances?.[0];
        return `${attendance ? (attendance.present ? 'Presente' : 'Ausente') : 'Sin asistencia registrada'} · ${detail.events?.filter((event) => event.type === 'GOAL').length ?? 0} goles`;
      } }] : []),
      { key: 'open', label: 'Detalle', render: (m) => <Button size="small" onClick={() => navigate(`/admin/partidos/${m.id}`)}>Ver partido</Button> },
    ]} />
    <TablePagination component="div" count={total} page={page - 1} rowsPerPage={limit} rowsPerPageOptions={[]} onPageChange={(_e, next) => onPage(next + 1)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} />
  </Box>;
};
