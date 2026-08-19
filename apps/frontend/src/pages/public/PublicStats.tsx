import { Box, Container, Card, Stack, Typography, Avatar, Button, Divider } from '@mui/material';
import { ArrowBackRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { usePublicStatsQuery } from '@/hooks/queries';
import { usePublicScope } from '@/hooks/common/usePublicScope';
import { PublicScopeFilters } from '@/components/sport/PublicScopeFilters';
import { CompetitionHeading } from '@/components/sport/CompetitionHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdSlot } from '@/components/ui/AdSlot';
import { ROUTES } from '@/routes/routes';
import type { PlayerStatRow } from '@/api/stats.api';

/** Cuántos goleadores se listan por competición. */
const TOP_PER_COMPETITION = 20;

/** Oro, plata y bronce para el podio de cada tabla. */
const PODIUM: Record<number, string> = {
  1: 'var(--warning)',
  2: 'var(--textMuted)',
  3: 'var(--accent)',
};

const StatRow: React.FC<{ row: PlayerStatRow; position: number }> = ({ row, position }) => {
  const player = row.rosterEntry?.player;
  const team = row.rosterEntry?.teamRegistration?.team;
  const podium = PODIUM[position];

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.25 }}>
      <Typography
        sx={{
          width: 30,
          textAlign: 'center',
          fontWeight: 800,
          color: podium ?? 'text.secondary',
          fontSize: podium ? 18 : 15,
        }}
      >
        {position}
      </Typography>
      <Avatar
        src={player?.photoUrl ?? undefined}
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'primary.soft',
          color: 'primary.main',
          fontWeight: 700,
          ...(podium ? { border: '2px solid', borderColor: podium } : {}),
        }}
      >
        {player?.firstName?.[0]}
        {player?.lastName?.[0]}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {player?.firstName} {player?.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {team?.name ?? 'Sin equipo'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} sx={{ flexShrink: 0 }}>
        {[
          { value: row.goals, label: 'Goles', strong: true },
          { value: row.assists, label: 'Asist.' },
          { value: row.matchesPlayed, label: 'PJ' },
        ].map((s) => (
          <Box key={s.label} sx={{ textAlign: 'center', minWidth: 40 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                color: s.strong ? 'primary.main' : 'text.primary',
              }}
            >
              {s.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

const PublicStats: React.FC = () => {
  const navigate = useNavigate();
  const scope = usePublicScope();
  const { data: stats = [] } = usePublicStatsQuery(scope.competitionId || undefined, scope.editionId);

  /** Goleadores de cada competición, en el orden en que llegan (goles desc.). */
  const sections = useMemo(
    () =>
      scope.visibleCompetitions.map((competition) => ({
        competition,
        rows: stats.filter(
          (s: PlayerStatRow) => s.rosterEntry?.teamRegistration?.competitionId === competition.id,
        ),
      })),
    [scope.visibleCompetitions, stats],
  );

  const total = sections.reduce((acc, s) => acc + s.rows.length, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.home)}
        sx={{ mb: 1, color: 'text.secondary' }}
      >
        Volver
      </Button>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Estadísticas
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {scope.edition
          ? `Goleadores de ${scope.edition.name}, competición por competición.`
          : 'Goleadores, competición por competición.'}
      </Typography>

      <PublicScopeFilters
        editions={scope.editions}
        editionId={scope.editionId}
        onEditionChange={scope.setEditionId}
        isCurrentEdition={scope.isCurrentEdition}
        competitions={scope.competitions}
        competitionId={scope.competitionId}
        onCompetitionChange={scope.setCompetitionId}
      />

      {total === 0 ? (
        <EmptyState
          icon={<EmojiEventsRounded sx={{ fontSize: 32 }} />}
          title="Todavía no hay estadísticas"
          description="En cuanto se jueguen partidos vas a ver aquí a los goleadores de cada competición."
        />
      ) : (
        <Stack spacing={5}>
          {sections.map(({ competition, rows }) => (
            <Box key={competition.id}>
              <CompetitionHeading
                competition={competition}
                count={`${rows.length} ${rows.length === 1 ? 'jugador' : 'jugadores'}`}
              />
              <Card sx={{ p: { xs: 1.5, md: 3 } }}>
                {rows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    Todavía no hay estadísticas en esta competición.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />}>
                    {rows.slice(0, TOP_PER_COMPETITION).map((row: PlayerStatRow, i: number) => (
                      <StatRow key={row.id} row={row} position={i + 1} />
                    ))}
                  </Stack>
                )}
                {rows.length > TOP_PER_COMPETITION && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Se muestran los {TOP_PER_COMPETITION} primeros de {rows.length}.
                  </Typography>
                )}
              </Card>
            </Box>
          ))}
        </Stack>
      )}

      <AdSlot placement="STATS" sx={{ mt: 4 }} />
    </Container>
  );
};

export default PublicStats;
