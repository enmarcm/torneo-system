import { Box, Container, Grid2 as Grid, Card, Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  usePublicEditionsQuery,
  usePublicCompetitionsQuery,
  usePublicMatchesQuery,
  usePublicStandingsQuery,
  usePublicMatchQuery,
} from '@/hooks/queries';
import { MatchCard } from '@/components/sport/MatchCard';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { EditionBar } from '@/components/sport/EditionBar';
import { CompetitionCard } from '@/components/sport/CompetitionCard';
import { AppModal } from '@/components/ui/AppModal';
import { AdSlot } from '@/components/ui/AdSlot';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { sortCompetitions, getCompetitionShortLabel } from '@/utils/competitionMeta';
import type { Edition, Competition, Match } from '@/api/public.api';

const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const editionsQuery = usePublicEditionsQuery();
  const editions: Edition[] = editionsQuery.data ?? [];
  const active: Edition | undefined = editions.find((e: Edition) => e.status === 'ACTIVE') ?? editions[0];
  const compsQuery = usePublicCompetitionsQuery(active?.id);
  const comps = sortCompetitions((compsQuery.data ?? []) as Competition[]);
  const liveQuery = usePublicMatchesQuery(undefined, 'LIVE', active?.id);
  const liveMatches: Match[] = liveQuery.data ?? [];
  /*
    El visitante llega "justo después del pitazo final" a preguntar cómo quedó,
    así que lo primero que tiene que haber es un resultado. Antes la portada
    consultaba solo LIVE y SCHEDULED: el partido que acababa de terminar
    desaparecía del sitio en el momento de mayor tráfico.
  */
  const finishedQuery = usePublicMatchesQuery(undefined, 'FINISHED', active?.id, {
    limit: 6,
    order: 'desc',
  });
  const finished: Match[] = finishedQuery.data ?? [];
  // `upcoming: true` deja fuera los partidos con fecha vencida que nadie cerró.
  const upcomingQuery = usePublicMatchesQuery(undefined, 'SCHEDULED', active?.id, {
    limit: 6,
    upcoming: true,
  });
  const upcoming: Match[] = upcomingQuery.data ?? [];

  /*
    La tabla es una de las tres preguntas que trae el visitante y hoy exige tres
    toques. Se embebe la de la división más alta, que es la que mira la mayoría.
  */
  const topDivision = comps.find((c) => c.kind === 'LEAGUE_DIVISION') ?? comps[0];
  const standingsQuery = usePublicStandingsQuery(topDivision?.id ?? '');
  const standings = standingsQuery.data ?? [];

  /*
    Sin esto las cuatro consultas caían a `[]` ante cualquier fallo, así que
    "cargando", "el servidor no responde" y "todavía no hay partidos" se veían
    exactamente igual: una frase gris diciendo que no hay nada. En un sitio que
    se presenta como la fuente oficial, afirmar que no hay partidos porque falló
    la red es peor que no decir nada.
  */
  const failed =
    editionsQuery.isError ||
    compsQuery.isError ||
    liveQuery.isError ||
    upcomingQuery.isError ||
    finishedQuery.isError;
  const retryAll = () => {
    void editionsQuery.refetch();
    void compsQuery.refetch();
    void liveQuery.refetch();
    void upcomingQuery.refetch();
    void finishedQuery.refetch();
  };

  /*
    El listado no trae los eventos, así que el detalle abría siempre con el
    historial vacío incluso en un partido con cuatro goles cargados.
  */
  const detailQuery = usePublicMatchQuery(selectedMatch?.id);
  const detailedMatch: Match | null = detailQuery.data ?? selectedMatch;

  const competitionLabel = (m: Match) =>
    m.competition ? getCompetitionShortLabel(m.competition) : undefined;

  return (
    <Box>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 3.5 }, pb: { xs: 4, md: 6 } }}>
        {failed ? (
          <ErrorState
            title="No pudimos cargar la jornada"
            message="El sitio no está pudiendo hablar con el servidor de la liga. Los resultados que veas abajo pueden estar desactualizados."
            onRetry={retryAll}
          />
        ) : null}

        {active ? (
          <EditionBar
            name={active.name}
            seasonNumber={active.seasonNumber}
            liveCount={liveMatches.length}
          />
        ) : null}

        <AdSlot placement="HOME_BANNER" priority sx={{ mt: 3 }} />

        {liveMatches.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'var(--live)', animation: 'pulse 1.4s infinite' }} />
              <Typography variant="h3" component="h2">En vivo ahora</Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.live)}>
                Ver todos
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {liveMatches.map((m: Match) => (
                <Grid size={{ xs: 12, md: 6 }} key={m.id}>
                  <MatchCard
                    match={m}
                    competitionLabel={competitionLabel(m)}
                    onClick={() => setSelectedMatch(m)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant="h3" component="h2">Última jornada</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
              Ver todos
            </Button>
          </Stack>
          {finishedQuery.isLoading ? (
            <LoadingState rows={3} height={132} />
          ) : finished.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Todavía no se jugó ningún partido de esta edición.
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {finished.map((m: Match) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                  <MatchCard
                    match={m}
                    competitionLabel={competitionLabel(m)}
                    onClick={() => setSelectedMatch(m)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Box sx={{ mt: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant="h3" component="h2">Próximos partidos</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
              Ver calendario
            </Button>
          </Stack>
          {upcomingQuery.isLoading ? (
            <LoadingState rows={3} height={132} />
          ) : upcoming.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay partidos programados.</Typography>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {upcoming.map((m: Match) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                  <MatchCard
                    match={m}
                    competitionLabel={competitionLabel(m)}
                    showStatus={false}
                    onClick={() => setSelectedMatch(m)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <AdSlot placement="HOME_INLINE" sx={{ mt: 5 }} />

        {topDivision && standings.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Typography variant="h3" component="h2">
                {getCompetitionShortLabel(topDivision)}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.competitions)}>
                Tabla completa
              </Button>
            </Stack>
            <StandingsTable rows={standings.slice(0, 5)} />
          </Box>
        )}

        <Box sx={{ mt: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant="h3" component="h2">Competiciones</Typography>
          </Stack>
          {compsQuery.isLoading && <LoadingState rows={2} height={200} />}
          <Grid container spacing={2.5}>
            {comps.slice(0, 6).map((c: Competition) => (
              <Grid size={{ xs: 12, md: 6 }} key={c.id}>
                <CompetitionCard
                  competition={c}
                  // Antes las seis tarjetas caían en la misma pantalla, que
                  // arrancaba siempre en la primera división: tocabas "Tercera"
                  // y aterrizabas en "Primera".
                  onClick={() => navigate(`${ROUTES.public.competitions}?c=${c.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      <AppModal
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={selectedMatch ? `${selectedMatch.homeRegistration.team.name} vs ${selectedMatch.awayRegistration.team.name}` : ''}
        subtitle={
          selectedMatch
            ? [competitionLabel(selectedMatch), selectedMatch.venue ?? 'Sede por confirmar']
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        maxWidth={640}
      >
        {detailedMatch && (
          <Stack spacing={2}>
            <LiveScoreboard match={detailedMatch} size="lg" />
            <AdSlot placement="MATCH_DETAIL" />
          </Stack>
        )}
      </AppModal>
    </Box>
  );
};

export default PublicHome;
