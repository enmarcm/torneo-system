import { Box, Container, Grid2 as Grid, Card, Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePublicEditionsQuery, usePublicCompetitionsQuery, usePublicMatchesQuery } from '@/hooks/queries';
import { MatchCard } from '@/components/sport/MatchCard';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { EntityHeroCard } from '@/components/sport/EntityHeroCard';
import { CompetitionCard } from '@/components/sport/CompetitionCard';
import { AppModal } from '@/components/ui/AppModal';
import { ROUTES } from '@/routes/routes';
import { sortCompetitions, getCompetitionShortLabel } from '@/utils/competitionMeta';
import type { Edition, Competition, Match } from '@/api/public.api';

const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const { data: editions = [] } = usePublicEditionsQuery();
  const active: Edition | undefined = editions.find((e: Edition) => e.status === 'ACTIVE') ?? editions[0];
  const { data: rawComps = [] } = usePublicCompetitionsQuery(active?.id);
  const comps = sortCompetitions(rawComps as Competition[]);
  const { data: liveMatches = [] } = usePublicMatchesQuery(undefined, 'LIVE', active?.id);
  const { data: upcoming = [] } = usePublicMatchesQuery(undefined, 'SCHEDULED', active?.id);

  const competitionLabel = (m: Match) =>
    m.competition ? getCompetitionShortLabel(m.competition) : undefined;

  return (
    <Box>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        {active ? (
          <EntityHeroCard
            title={active.name}
            subtitle="La liga está en marcha. Sigue cada partido en vivo."
            chips={
              <Stack direction="row" spacing={1}>
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700 }}>
                  Temporada {active.seasonNumber}
                </Box>
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'var(--live)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  ● {liveMatches.length} EN VIVO
                </Box>
              </Stack>
            }
          />
        ) : null}

        {liveMatches.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'var(--live)', animation: 'pulse 1.4s infinite' }} />
              <Typography variant="h3">En vivo ahora</Typography>
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
          <Typography variant="h3" sx={{ mb: 2 }}>Próximos partidos</Typography>
          {upcoming.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay partidos programados.</Typography>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {upcoming.slice(0, 6).map((m: Match) => (
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
          <Typography variant="h3" sx={{ mb: 2 }}>Competiciones</Typography>
          <Grid container spacing={2.5}>
            {comps.slice(0, 6).map((c: Competition) => (
              <Grid size={{ xs: 12, md: 6 }} key={c.id}>
                <CompetitionCard
                  competition={c}
                  onClick={() => navigate(ROUTES.public.competitions)}
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
        {selectedMatch && <LiveScoreboard match={selectedMatch} size="lg" />}
      </AppModal>
    </Box>
  );
};

export default PublicHome;
