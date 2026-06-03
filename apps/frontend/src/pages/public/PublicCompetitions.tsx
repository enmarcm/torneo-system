import { Box, Container, Grid2 as Grid, Card, Stack, Typography, Chip, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicEditionsQuery, usePublicCompetitionsQuery, usePublicStandingsQuery } from '@/hooks/queries';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { ROUTES } from '@/routes/routes';
import type { Edition, Competition } from '@/api/public.api';

const PublicCompetitions: React.FC = () => {
  const navigate = useNavigate();
  const { data: editions = [] } = usePublicEditionsQuery();
  const [editionId, setEditionId] = useState('');
  const eid: string | undefined = editionId || editions[0]?.id;
  const { data: comps = [] } = usePublicCompetitionsQuery(eid);
  const [compId, setCompId] = useState('');
  const cid: string | undefined = compId || comps[0]?.id;
  const { data: standings = [], isLoading } = usePublicStandingsQuery(cid ?? '');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.public.home)} sx={{ mb: 1, color: 'text.secondary' }}>Volver</Button>
      <Typography variant="h2" sx={{ mb: 3 }}>Competiciones</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Edición</InputLabel>
          <Select label="Edición" value={eid ?? ''} onChange={(e) => setEditionId(e.target.value as string)}>
            {editions.map((e: Edition) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Competición</InputLabel>
          <Select label="Competición" value={cid ?? ''} onChange={(e) => setCompId(e.target.value as string)}>
            {comps.map((c: Competition) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      {isLoading ? <Typography>Cargando…</Typography> : <StandingsTable rows={standings} />}
    </Container>
  );
};

export default PublicCompetitions;
