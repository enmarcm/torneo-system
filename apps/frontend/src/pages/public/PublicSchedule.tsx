import { Box, Container, Grid2 as Grid, Card, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Stack } from '@mui/material';
import { ArrowBackRounded, SearchRounded } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicCompetitionsQuery, usePublicMatchesQuery } from '@/hooks/queries';
import { MatchCard } from '@/components/sport/MatchCard';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AppModal } from '@/components/ui/AppModal';
import { ROUTES } from '@/routes/routes';
import { formatDate } from '@/utils/formatDate';
import type { Competition, Match } from '@/api/public.api';

const PublicSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [cid, setCid] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { data: comps = [] } = usePublicCompetitionsQuery();
  const competitionId: string | undefined = cid || comps[0]?.id;
  const { data: matches = [] } = usePublicMatchesQuery(competitionId);

  const filtered = useMemo(() => {
    if (!dateFilter) return matches;
    return matches.filter((m: Match) => formatDate(m.scheduledAt) === dateFilter);
  }, [matches, dateFilter]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>Calendario</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Competición</InputLabel>
          <Select label="Competición" value={competitionId ?? ''} onChange={(e) => setCid(e.target.value as string)}>
            {comps.map((c: Competition) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          type="date"
          size="small"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputProps={{ startAdornment: <SearchRounded sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} /> }}
          sx={{ minWidth: 180 }}
        />
      </Stack>
      {filtered.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay partidos para mostrar.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((m: Match) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
              <MatchCard match={m} onClick={() => setSelectedMatch(m)} />
            </Grid>
          ))}
        </Grid>
      )}

      <AppModal
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={selectedMatch ? `${selectedMatch.homeRegistration.team.name} vs ${selectedMatch.awayRegistration.team.name}` : ''}
        subtitle={selectedMatch ? selectedMatch.venue ?? 'Estadio por confirmar' : undefined}
        maxWidth={640}
      >
        {selectedMatch && <LiveScoreboard match={selectedMatch} size="lg" />}
      </AppModal>
    </Container>
  );
};

export default PublicSchedule;
