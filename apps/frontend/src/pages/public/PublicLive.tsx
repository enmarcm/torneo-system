import { Container, Grid2 as Grid, Typography, Button } from '@mui/material';
import { ArrowBackRounded, ArrowForwardRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePublicEditionsQuery, usePublicMatchesQuery } from '@/hooks/queries';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AdSlot } from '@/components/ui/AdSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { NextMatchRow } from '@/components/sport/NextMatchRow';
import { MatchLoader } from '@/components/ui/MatchLoader';
import { ROUTES } from '@/routes/routes';
import type { Match } from '@/api/public.api';

const PublicLive: React.FC = () => {
  const navigate = useNavigate();
  /*
    Sin acotar por edición, esta pantalla contaba partidos de temporadas viejas
    y mostraba un número distinto al de la píldora "N EN VIVO" de la portada.
  */
  const { data: editions = [] } = usePublicEditionsQuery();
  const active = editions.find((e: { status: string }) => e.status === 'ACTIVE') ?? editions[0];
  const { data: live = [], isLoading } = usePublicMatchesQuery(undefined, 'LIVE', active?.id);
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>En vivo</Typography>
      {isLoading ? (
        <MatchLoader />
      ) : live.length === 0 ? (
        /* El marcador apagado es el fondo; lo que importa es el próximo partido. */
        <EmptyState
          variant="live"
          title="Ahora no se está jugando"
          extra={<NextMatchRow editionId={active?.id} />}
          actionLabel="Ver calendario completo"
          actionVariant="text"
          actionIcon={<ArrowForwardRounded />}
          onAction={() => navigate(ROUTES.public.schedule)}
        />
      ) : (
        <Grid container spacing={2}>
          {live.map((m: Match) => (
            <Grid size={{ xs: 12, md: 6 }} key={m.id}>
              <LiveScoreboard match={m} />
            </Grid>
          ))}
        </Grid>
      )}

      <AdSlot placement="LIVE" sx={{ mt: 4 }} />
    </Container>
  );
};

export default PublicLive;
