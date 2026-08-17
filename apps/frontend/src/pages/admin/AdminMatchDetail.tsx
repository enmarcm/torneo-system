import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBackRounded } from '@mui/icons-material';
import { useMatchQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { MvpEditor } from '@/components/sport/MvpEditor';
import { formatDateTimeOrPending } from '@/utils/formatDate';
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
        subtitle={`Jornada ${match.matchday} · ${formatDateTimeOrPending(match.scheduledAt)} ${match.venue ? `· ${match.venue}` : ''}`}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <StatusBadge status={match.status} />
        <Chip size="small" label={`Etapa: ${getStatusLabel(match.stage)}`} variant="outlined" />
        {match.leg && (
          <Chip
            size="small"
            color="secondary"
            variant="outlined"
            label={match.leg === 1 ? 'Partido de ida' : 'Partido de vuelta'}
          />
        )}
        {!match.scheduledAt && (
          <Chip size="small" color="warning" variant="outlined" label="Sin día ni hora asignados" />
        )}
      </Stack>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <LiveScoreboard match={match} size="lg" />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <MvpEditor match={match} />
        </Grid>
      </Grid>
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
