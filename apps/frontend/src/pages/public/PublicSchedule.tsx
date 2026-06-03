import { Box, Container, Grid2 as Grid, Card, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicCompetitionsQuery, usePublicMatchesQuery } from '@/hooks/queries';
import { MatchCard } from '@/components/sport/MatchCard';
import { ROUTES } from '@/routes/routes';
import type { Competition, Match } from '@/api/public.api';

const PublicSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { data: comps = [] } = usePublicCompetitionsQuery();
  const [cid, setCid] = useState('');
  const competitionId: string | undefined = cid || comps[0]?.id;
  const { data: matches = [] } = usePublicMatchesQuery(competitionId);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>Calendario</Typography>
      <FormControl size="small" sx={{ minWidth: 240, mb: 3 }}>
        <InputLabel>Competición</InputLabel>
        <Select label="Competición" value={competitionId ?? ''} onChange={(e) => setCid(e.target.value as string)}>
          {comps.map((c: Competition) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </Select>
      </FormControl>
      {matches.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay partidos para mostrar.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {matches.map((m: Match) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
              <MatchCard match={m} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default PublicSchedule;
