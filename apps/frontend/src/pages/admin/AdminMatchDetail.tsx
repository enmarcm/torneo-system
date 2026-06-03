import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBackRounded, SportsSoccerRounded } from '@mui/icons-material';
import { useMatchQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { formatDateTime } from '@/utils/formatDate';
import { getStatusLabel } from '@/utils/statusLabels';
import { ROUTES } from '@/routes/routes';

const AdminMatchDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: match, isLoading } = useMatchQuery(id!);

  if (isLoading) return <Typography color="text.secondary">Cargando…</Typography>;
  if (!match) return <Typography color="text.secondary">Partido no encontrado.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.schedule)} sx={{ mb: 2 }}>
        Volver a programación
      </Button>
      <PageHeader
        title={`${match.homeRegistration.team.name} vs ${match.awayRegistration.team.name}`}
        subtitle={`Jornada ${match.matchday} · ${formatDateTime(match.scheduledAt)} ${match.venue ? `· ${match.venue}` : ''}`}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <StatusBadge status={match.status} />
        <Chip size="small" label={`Etapa: ${getStatusLabel(match.stage)}`} variant="outlined" />
      </Stack>
      <Card sx={{ p: 3, mb: 3 }}>
        <LiveScoreboard match={match} size="lg" />
      </Card>
      <Typography variant="h4" sx={{ mb: 2 }}>Eventos del partido</Typography>
      {!match.events || match.events.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Aún no hay eventos registrados.</Typography>
        </Card>
      ) : (
        <Stack spacing={1}>
          {match.events.map((ev) => (
            <Card key={ev.id} sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans"', fontVariantNumeric: 'tabular-nums', minWidth: 32 }}>
                  {ev.minute}&apos;
                </Typography>
                <Chip size="small" label={getStatusLabel(ev.type)} variant="outlined" />
                <Typography variant="body2">
                  {ev.player ? `${ev.player.firstName} ${ev.player.lastName}` : '—'}
                </Typography>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default AdminMatchDetail;
