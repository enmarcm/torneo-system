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
    limit: 4,
    order: 'desc',
  });
  const finished: Match[] = finishedQuery.data ?? [];
  // `upcoming: true` deja fuera los partidos con fecha vencida que nadie cerró.
  const upcomingQuery = usePublicMatchesQuery(undefined, 'SCHEDULED', active?.id, {
    limit: 4,
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
      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 2.5 }, pb: { xs: 3, md: 4 } }}>
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

        <AdSlot placement="HOME_BANNER" priority sx={{ mt: 2 }} />

        {liveMatches.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'var(--live)', animation: 'pulse 1.4s infinite' }} />
              <Typography variant="h4" component="h2">En vivo ahora</Typography>
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

        {/*
          Lo jugado y lo que viene, uno al lado del otro: son las dos preguntas
          que trae el visitante y apiladas empujaban todo fuera de la pantalla.
        */}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              <Typography variant="h4" component="h2">Última jornada</Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
                Ver todos
              </Button>
            </Stack>
            {finishedQuery.isLoading ? (
              <LoadingState rows={3} height={96} />
            ) : finished.length === 0 ? (
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Todavía no se jugó ningún partido de esta edición.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={1.5}>
                {finished.map((m: Match) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    compact
                    competitionLabel={competitionLabel(m)}
                    onClick={() => setSelectedMatch(m)}
                  />
                ))}
              </Stack>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              <Typography variant="h4" component="h2">Próximos partidos</Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
                Ver calendario
              </Button>
            </Stack>
            {upcomingQuery.isLoading ? (
              <LoadingState rows={3} height={96} />
            ) : upcoming.length === 0 ? (
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay partidos programados.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={1.5}>
                {upcoming.map((m: Match) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    compact
                    competitionLabel={competitionLabel(m)}
                    showStatus={false}
                    onClick={() => setSelectedMatch(m)}
                  />
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>

        <AdSlot placement="HOME_INLINE" sx={{ mt: 3 }} />

        {topDivision && standings.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              <Typography variant="h4" component="h2">
                {getCompetitionShortLabel(topDivision)}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                onClick={() => navigate(`${ROUTES.public.competitions}?c=${topDivision.id}`)}
              >
                Tabla completa
              </Button>
            </Stack>
            <StandingsTable rows={standings.slice(0, 5)} />
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 1.5 }}>Competiciones</Typography>
          {compsQuery.isLoading && <LoadingState rows={1} height={130} />}
          {/* En fila: con tres o cuatro torneos entran todos de una pasada. */}
          <Grid container spacing={2}>
            {comps.slice(0, 6).map((c: Competition) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                <CompetitionCard
                  competition={c}
                  compact
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
