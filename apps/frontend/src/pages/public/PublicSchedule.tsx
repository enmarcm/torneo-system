import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  TextField,
  Stack,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';
import { ArrowBackRounded, EventBusyRounded, PendingActionsRounded } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePublicMatchesQuery, usePublicMatchQuery } from '@/hooks/queries';
import { usePublicScope, ALL_COMPETITIONS } from '@/hooks/common/usePublicScope';
import { PublicScopeFilters } from '@/components/sport/PublicScopeFilters';
import { CompetitionTags } from '@/components/sport/CompetitionTags';
import { MatchCard } from '@/components/sport/MatchCard';
import { MvpCard } from '@/components/sport/MvpCard';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AppModal } from '@/components/ui/AppModal';
import { AdSlot } from '@/components/ui/AdSlot';
import { ROUTES } from '@/routes/routes';
import { formatDate, UNSCHEDULED_LABEL } from '@/utils/formatDate';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';
import type { Match } from '@/api/public.api';

type Filter = 'ALL' | 'LIVE' | 'SCHEDULED' | 'FINISHED';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'LIVE', label: 'En vivo' },
  { value: 'SCHEDULED', label: 'Próximos' },
  { value: 'FINISHED', label: 'Finalizados' },
];

const matchesFilter = (m: Match, f: Filter) => {
  if (f === 'ALL') return true;
  if (f === 'SCHEDULED') return m.status === 'SCHEDULED' || m.status === 'POSTPONED';
  return m.status === f;
};

const PublicSchedule: React.FC = () => {
  const navigate = useNavigate();
  const scope = usePublicScope();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: matches = [] } = usePublicMatchesQuery(
    scope.competitionId || undefined,
    undefined,
    scope.editionId || undefined,
  );

  // Con "todas las competiciones" el día mezcla torneos, así que cada tarjeta
  // lleva de cuál viene.
  const showCompetition = scope.competitionId === ALL_COMPETITIONS;
  // Sin el detalle, el modal muestra el partido sin sus goles ni tarjetas.
  const detailQuery = usePublicMatchQuery(selectedMatch?.id);
  const detailedMatch: Match | null = detailQuery.data ?? selectedMatch;

  const competitionLabel = (m: Match) =>
    showCompetition && m.competition ? getCompetitionShortLabel(m.competition) : undefined;

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<Filter, number>>(
        (acc, f) => {
          acc[f.value] = matches.filter((m: Match) => matchesFilter(m, f.value)).length;
          return acc;
        },
        { ALL: 0, LIVE: 0, SCHEDULED: 0, FINISHED: 0 },
      ),
    [matches],
  );

  /**
   * Se agrupa por día. Los partidos ya sorteados pero sin fecha asignada van a
   * un grupo aparte al final, para que se vean como pendientes de programación.
   */
  const groups = useMemo(() => {
    const filtered = matches.filter((m: Match) => {
      if (!matchesFilter(m, filter)) return false;
      if (!dateFilter) return true;
      return m.scheduledAt ? formatDate(m.scheduledAt) === formatDate(dateFilter) : false;
    });

    const byDay = new Map<string, Match[]>();
    const pending: Match[] = [];
    for (const m of filtered) {
      if (!m.scheduledAt) {
        pending.push(m);
        continue;
      }
      const key = formatDate(m.scheduledAt);
      byDay.set(key, [...(byDay.get(key) ?? []), m]);
    }

    const days = [...byDay.entries()].sort((a, b) => {
      const toIso = (d: string) => d.split('-').reverse().join('-');
      return toIso(a[0]).localeCompare(toIso(b[0]));
    });

    return { days, pending, total: filtered.length };
  }, [matches, filter, dateFilter]);

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
        Calendario
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Todos los encuentros de la edición, día por día. Toca un partido para ver el detalle.
      </Typography>

      <PublicScopeFilters
        editions={scope.editions}
        editionId={scope.editionId}
        onEditionChange={scope.setEditionId}
        isCurrentEdition={scope.isCurrentEdition}
        competitions={scope.competitions}
        competitionId={scope.competitionId}
        onCompetitionChange={scope.setCompetitionId}
      >
        <TextField
          type="date"
          size="small"
          label="Día"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        />
        {dateFilter && (
          <Button size="small" onClick={() => setDateFilter('')} sx={{ color: 'text.secondary' }}>
            Limpiar día
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Tabs
          value={filter}
          onChange={(_, v: Filter) => setFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, textTransform: 'none' } }}
        >
          {FILTERS.map((f) => (
            <Tab
              key={f.value}
              value={f.value}
              label={
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <span>{f.label}</span>
                  <Chip
                    size="small"
                    label={counts[f.value]}
                    sx={{ height: 18, fontSize: 11, fontWeight: 700 }}
                    color={f.value === 'LIVE' && counts.LIVE > 0 ? 'error' : 'default'}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </PublicScopeFilters>

      {scope.competition && (
        <Box sx={{ mb: 3 }}>
          <CompetitionTags competition={scope.competition} />
        </Box>
      )}

      {groups.total === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <EventBusyRounded sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No hay partidos para mostrar.</Typography>
        </Card>
      ) : (
        /*
          Una columna por día en vez de una rejilla de tres. El calendario se
          lee de arriba abajo siguiendo la hora, y en tres columnas el orden
          cronológico se rompía: el cuarto partido del día quedaba debajo del
          primero y no al lado del tercero. El ancho se acota al de lectura;
          estirado a toda la pantalla, el nombre local y el visitante quedan a
          medio metro uno del otro.
        */
        <Stack spacing={4} sx={{ maxWidth: 860, mx: 'auto' }}>
          {groups.days.map(([day, dayMatches]) => (
            <Box key={day}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {day}
                </Typography>
                <Chip size="small" label={`${dayMatches.length} partidos`} variant="outlined" />
                <Divider sx={{ flex: 1 }} />
              </Stack>
              <Stack spacing={1.5}>
                {dayMatches.map((m: Match, i: number) => (
                  <Box
                    key={m.id}
                    component={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.24) }}
                  >
                    <MatchCard
                      match={m}
                      compact
                      competitionLabel={competitionLabel(m)}
                      onClick={() => setSelectedMatch(m)}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}

          <AdSlot placement="MATCH_LIST" />

          {groups.pending.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <PendingActionsRounded sx={{ color: 'warning.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {UNSCHEDULED_LABEL}
                </Typography>
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`${groups.pending.length} partidos`}
                />
                <Divider sx={{ flex: 1 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Ya está definido el cruce; falta confirmar día y hora.
              </Typography>
              <Stack spacing={1.5}>
                {groups.pending.map((m: Match) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    compact
                    competitionLabel={competitionLabel(m)}
                    onClick={() => setSelectedMatch(m)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      <AppModal
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={
          selectedMatch
            ? `${selectedMatch.homeRegistration.team.name} vs ${selectedMatch.awayRegistration.team.name}`
            : ''
        }
        subtitle={
          selectedMatch
            ? [
                selectedMatch.competition ? getCompetitionShortLabel(selectedMatch.competition) : null,
                selectedMatch.venue ?? 'Sede por confirmar',
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        maxWidth={640}
      >
        {detailedMatch && (
          <Stack spacing={2}>
            {detailedMatch.competition && (
              <CompetitionTags competition={detailedMatch.competition} />
            )}
            <LiveScoreboard match={detailedMatch} size="lg" />
            <MvpCard match={detailedMatch} />
            <AdSlot placement="MATCH_DETAIL" />
          </Stack>
        )}
      </AppModal>
    </Container>
  );
};

export default PublicSchedule;
