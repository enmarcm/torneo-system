import {
  Box,
  Container,
  Grid2 as Grid,
  Card,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { usePublicCompetitionsQuery, usePublicMatchesQuery } from '@/hooks/queries';
import { MatchCard } from '@/components/sport/MatchCard';
import { MvpCard } from '@/components/sport/MvpCard';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AppModal } from '@/components/ui/AppModal';
import { ROUTES } from '@/routes/routes';
import { formatDate, UNSCHEDULED_LABEL } from '@/utils/formatDate';
import type { Competition, Match } from '@/api/public.api';

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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [cid, setCid] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: comps = [] } = usePublicCompetitionsQuery();
  const competitionId: string | undefined = cid || comps[0]?.id;
  const { data: matches = [] } = usePublicMatchesQuery(competitionId);

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
        Todos los encuentros de la competición, día por día.
      </Typography>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Competición</InputLabel>
            <Select
              label="Competición"
              value={competitionId ?? ''}
              onChange={(e) => setCid(e.target.value as string)}
            >
              {comps.map((c: Competition) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        </Stack>
      </Card>

      {groups.total === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <EventBusyRounded sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No hay partidos para mostrar.</Typography>
        </Card>
      ) : (
        <Stack spacing={4}>
          {groups.days.map(([day, dayMatches]) => (
            <Box key={day}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {day}
                </Typography>
                <Chip size="small" label={`${dayMatches.length} partidos`} variant="outlined" />
                <Divider sx={{ flex: 1 }} />
              </Stack>
              <Grid container spacing={2}>
                {dayMatches.map((m: Match, i: number) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.24) }}
                    >
                      <MatchCard match={m} onClick={() => setSelectedMatch(m)} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

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
              <Grid container spacing={2}>
                {groups.pending.map((m: Match) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                    <MatchCard match={m} onClick={() => setSelectedMatch(m)} />
                  </Grid>
                ))}
              </Grid>
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
        subtitle={selectedMatch ? selectedMatch.venue ?? 'Sede por confirmar' : undefined}
        maxWidth={640}
      >
        {selectedMatch && (
          <Stack spacing={2}>
            <LiveScoreboard match={selectedMatch} size="lg" />
            <MvpCard match={selectedMatch} />
          </Stack>
        )}
      </AppModal>
    </Container>
  );
};

export default PublicSchedule;
