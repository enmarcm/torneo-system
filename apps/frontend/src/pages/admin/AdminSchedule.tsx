import { Box, Grid2 as Grid, Card, Stack, Typography, Button, FormControl, InputLabel, Select, MenuItem, IconButton, TextField, Chip } from '@mui/material';
import { AddRounded, PlayArrowRounded, StopRounded, FiberManualRecordRounded } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { useCompetitionsQuery, useMatchesQuery } from '@/hooks/queries';
import { useCreateMatch, useStartMatch, useFinishMatch, useCreateMatchEvent } from '@/hooks/mutations';
import { formatDateTime } from '@/utils/formatDate';
import type { Match } from '@/api/matches.api';
import { extractErrorMessage } from '@/api/axios';

const AdminSchedule: React.FC = () => {
  const [competitionId, setCompetitionId] = useState('');
  const { data: comps = [] } = useCompetitionsQuery();
  const { data: matches = [], isLoading } = useMatchesQuery(competitionId || undefined);
  const create = useCreateMatch();
  const start = useStartMatch();
  const finish = useFinishMatch();
  const createEvent = useCreateMatchEvent();
  const [open, setOpen] = useState(false);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [form, setForm] = useState({ homeRegistrationId: '', awayRegistrationId: '', scheduledAt: '', matchday: 1, venue: '' });

  const submit = async () => {
    if (!competitionId) return;
    try {
      await create.mutateAsync({
        competitionId,
        homeRegistrationId: form.homeRegistrationId,
        awayRegistrationId: form.awayRegistrationId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        matchday: form.matchday,
        venue: form.venue || undefined,
      } as Partial<Match>);
      setOpen(false);
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  const addGoal = async (match: Match, teamRegId: string) => {
    await createEvent.mutateAsync({ matchId: match.id, data: { type: 'GOAL', minute: 1, teamRegistrationId: teamRegId } });
    const fresh = await import('@/api/matches.api').then((m) => m.matchesApi.get(match.id));
    setLiveMatch(fresh);
  };

  return (
    <Box>
      <PageHeader
        title="Programación"
        subtitle="Crea partidos y controla los marcadores en vivo."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)} disabled={!competitionId}>
            Nuevo partido
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 280 }}>
          <InputLabel>Competición</InputLabel>
          <Select label="Competición" value={competitionId} onChange={(e) => setCompetitionId(e.target.value as string)}>
            {comps.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {liveMatch && (
        <Box sx={{ mb: 3 }}>
          <LiveScoreboard match={liveMatch} size="lg" />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: 'center' }} flexWrap="wrap">
            <Button variant="outlined" startIcon={<FiberManualRecordRounded />} onClick={() => addGoal(liveMatch, liveMatch.homeRegistrationId)}>
              Gol local
            </Button>
            <Button variant="outlined" startIcon={<FiberManualRecordRounded />} onClick={() => addGoal(liveMatch, liveMatch.awayRegistrationId)}>
              Gol visitante
            </Button>
            <Button variant="contained" color="success" startIcon={<StopRounded />} onClick={async () => { await finish.mutateAsync(liveMatch.id); setLiveMatch(null); }}>
              Finalizar
            </Button>
          </Stack>
        </Box>
      )}

      {!competitionId ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Selecciona una competición para ver sus partidos.</Typography>
        </Card>
      ) : isLoading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : (
        <Grid container spacing={2}>
          {matches.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1 }}>Aún no hay partidos</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>Crea el primer partido para esta competición.</Typography>
                <Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)}>Crear partido</Button>
              </Card>
            </Grid>
          ) : (
            matches.map((m) => (
              <Grid size={{ xs: 12, md: 6 }} key={m.id}>
                <Card component={motion.div} whileHover={{ y: -2 }} sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Jornada {m.matchday} · {formatDateTime(m.scheduledAt)}</Typography>
                    <Chip size="small" label={m.status} color={m.status === 'LIVE' ? 'error' : m.status === 'FINISHED' ? 'info' : 'default'} variant="outlined" />
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 2 }}>
                    <Typography sx={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>{m.homeRegistration.team.name}</Typography>
                    <Typography sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans"', fontSize: 28, mx: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {m.status === 'SCHEDULED' ? 'vs' : `${m.homeScore} - ${m.awayScore}`}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>{m.awayRegistration.team.name}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {m.status === 'SCHEDULED' && (
                      <Button size="small" variant="outlined" startIcon={<PlayArrowRounded />} onClick={async () => { const fresh = await start.mutateAsync(m.id); setLiveMatch(fresh); }}>
                        Iniciar
                      </Button>
                    )}
                    {m.status === 'LIVE' && (
                      <Button size="small" variant="contained" color="success" onClick={() => setLiveMatch(m)}>
                        Control en vivo
                      </Button>
                    )}
                    {m.status === 'FINISHED' && (
                      <Chip size="small" label="Finalizado" color="info" variant="outlined" />
                    )}
                  </Stack>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      <AppDrawer open={open} onClose={() => setOpen(false)} title="Nuevo partido">
        <Stack spacing={2}>
          <TextField label="Fecha y hora" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          <TextField label="Jornada" type="number" fullWidth value={form.matchday} onChange={(e) => setForm({ ...form, matchday: Number(e.target.value) })} />
          <TextField label="Sede" fullWidth value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
            * Para esta versión, los IDs de local/visitante se autocompletan con los primeros equipos inscritos. En producción, abre un selector con búsqueda.
          </Typography>
          <TextField label="Home Registration ID" fullWidth value={form.homeRegistrationId} onChange={(e) => setForm({ ...form, homeRegistrationId: e.target.value })} />
          <TextField label="Away Registration ID" fullWidth value={form.awayRegistrationId} onChange={(e) => setForm({ ...form, awayRegistrationId: e.target.value })} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={!form.scheduledAt || !form.homeRegistrationId || !form.awayRegistrationId || create.isPending}>
              {create.isPending ? 'Creando…' : 'Crear partido'}
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>
    </Box>
  );
};

export default AdminSchedule;
