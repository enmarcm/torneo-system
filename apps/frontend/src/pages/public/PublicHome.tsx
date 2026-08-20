import { Box, Container, Grid2 as Grid, Card, Chip, Stack, Typography, Button } from '@mui/material';
import { TodayRounded, StarRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import dayjs from 'dayjs';
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
  /*
    Los de hoy van sin filtro de estado y en orden de hora: el que está por
    empezar, el que se está jugando y el que ya terminó son la misma jornada y
    el visitante los lee de corrido.
  */
  const todayQuery = usePublicMatchesQuery(undefined, undefined, active?.id, {
    day: 'today',
    limit: 8,
  });
  const todayMatches: Match[] = todayQuery.data ?? [];
  const todayIds = new Set(todayMatches.map((m: Match) => m.id));

  /*
    Destacados: los que el administrador marcó con el check al ponerles día y
    hora. Es la curaduría de la liga sobre su propio fixture.
  */
  const featuredQuery = usePublicMatchesQuery(undefined, 'SCHEDULED', active?.id, {
    featured: true,
    upcoming: true,
    limit: 12,
  });
  /*
    "De la semana" se resuelve acá: la API no sabe acotar por semana, y un
    destacado dentro de tres meses no es la respuesta que alguien vino a buscar
    hoy. Lo que ya está en la columna de hoy tampoco se repite al lado.
  */
  const weekEnd = dayjs().add(7, 'day');
  const featuredWeek: Match[] = (featuredQuery.data ?? [])
    .filter(
      (m: Match) => !todayIds.has(m.id) && m.scheduledAt && dayjs(m.scheduledAt).isBefore(weekEnd),
    )
    .slice(0, 6);

  const finishedQuery = usePublicMatchesQuery(undefined, 'FINISHED', active?.id, {
    limit: 8,
    order: 'desc',
  });
  // Lo de hoy ya tiene su columna: la última jornada muestra lo anterior.
  const finished: Match[] = (finishedQuery.data ?? [])
    .filter((m: Match) => !todayIds.has(m.id))
    .slice(0, 4);

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
    featuredQuery.isError ||
    finishedQuery.isError ||
    todayQuery.isError;
  const retryAll = () => {
    void editionsQuery.refetch();
    void compsQuery.refetch();
    void liveQuery.refetch();
    void featuredQuery.refetch();
    void finishedQuery.refetch();
    void todayQuery.refetch();
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
          Las dos preguntas del día, una al lado de la otra: qué se juega hoy y
          cuáles son los partidos que la liga eligió destacar esta semana.
          Apiladas empujaban todo fuera de la primera pantalla del teléfono.
        */}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              <TodayRounded sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="h4" component="h2">Partidos de hoy</Typography>
              {todayMatches.length > 0 && (
                <Chip
                  size="small"
                  label={todayMatches.length}
                  color="primary"
                  sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                />
              )}
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
                Ver calendario
              </Button>
            </Stack>
            {todayQuery.isLoading ? (
              <LoadingState rows={3} height={96} />
            ) : todayMatches.length === 0 ? (
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Hoy no se juega. El calendario tiene la próxima jornada.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={1.5}>
                {todayMatches.map((m: Match) => (
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
              <StarRounded sx={{ fontSize: 20, color: 'var(--accent)' }} />
              <Typography variant="h4" component="h2">Destacados de la semana</Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
                Ver calendario
              </Button>
            </Stack>
            {featuredQuery.isLoading ? (
              <LoadingState rows={3} height={96} />
            ) : featuredWeek.length === 0 ? (
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  La liga todavía no destacó partidos para esta semana.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={1.5}>
                {featuredWeek.map((m: Match) => (
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

        {/*
          Los resultados no se van de la portada: el visitante llega "justo
          después del pitazo final" a preguntar cómo quedó. Lo de hoy ya está
          arriba, así que acá queda lo anterior.
        */}
        {finished.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              <Typography variant="h4" component="h2">Última jornada</Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => navigate(ROUTES.public.schedule)}>
                Ver todos
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {finished.map((m: Match) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={m.id}>
                  <MatchCard
                    match={m}
                    compact
                    competitionLabel={competitionLabel(m)}
                    onClick={() => setSelectedMatch(m)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

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
