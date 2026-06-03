import { Box, Grid2 as Grid, Card, Stack, Typography, Button, FormControl, InputLabel, Select, MenuItem, IconButton, TextField, Menu, Tooltip } from '@mui/material';
import { AddRounded, PlayArrowRounded, StopRounded, FiberManualRecordRounded, ChevronLeftRounded, ChevronRightRounded, MoreVertRounded } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { useCompetitionsQuery, useMatchesQuery } from '@/hooks/queries';
import { useCreateMatch, useUpdateMatch, useDeleteMatch, useStartMatch, useFinishMatch, useCreateMatchEvent } from '@/hooks/mutations';
import { formatDateTime } from '@/utils/formatDate';
import type { Match } from '@/api/matches.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

const AdminSchedule: React.FC = () => {
  const today = dayjs().format('YYYY-MM-DD');
  const [competitionId, setCompetitionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: comps = [] } = useCompetitionsQuery();
  const { data: matches = [], isLoading } = useMatchesQuery(competitionId || undefined);
  const toast = useToast();
  const create = useCreateMatch();
  const update = useUpdateMatch();
  const remove = useDeleteMatch();
  const start = useStartMatch();
  const finish = useFinishMatch();
  const createEvent = useCreateMatchEvent();
  const [open, setOpen] = useState<'create' | 'edit' | null>(null);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; m: Match } | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);
  const [form, setForm] = useState({ homeRegistrationId: '', awayRegistrationId: '', scheduledAt: '', matchday: 1, venue: '' });
  const [editForm, setEditForm] = useState({ scheduledAt: '', matchday: 1, venue: '', status: 'SCHEDULED' as Match['status'] });

  const filteredMatches = matches.filter((m) =>
    dayjs(m.scheduledAt).format('YYYY-MM-DD') === selectedDate,
  );

  const onOpenEdit = (m: Match) => {
    setEditingMatch(m);
    setEditForm({
      scheduledAt: dayjs(m.scheduledAt).format('YYYY-MM-DDTHH:mm'),
      matchday: m.matchday,
      venue: m.venue ?? '',
      status: m.status,
    });
    setOpen('edit');
  };
  const onOpenCreate = () => {
    setEditingMatch(null);
    setOpen('create');
  };

  const submit = async () => {
    if (!competitionId) return;
    try {
      if (editingMatch) {
        await update.mutateAsync({
          id: editingMatch.id,
          data: {
            scheduledAt: new Date(editForm.scheduledAt).toISOString(),
            matchday: editForm.matchday,
            venue: editForm.venue || null,
            status: editForm.status,
          } as Partial<Match>,
        });
        setOpen(null);
        setEditingMatch(null);
        toast.success('Partido actualizado');
      } else {
        await create.mutateAsync({
          competitionId,
          homeRegistrationId: form.homeRegistrationId,
          awayRegistrationId: form.awayRegistrationId,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          matchday: form.matchday,
          venue: form.venue || undefined,
        } as Partial<Match>);
        setOpen(null);
        toast.success('Partido creado');
      }
    } catch (e) {
      toast.error(extractErrorMessage(e));
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
        subtitle="Partidos agendados por día."
        action={
            <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate} disabled={!competitionId}>
              Nuevo partido
            </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        <FormControl sx={{ minWidth: 280 }}>
          <InputLabel>Competición</InputLabel>
          <Select label="Competición" value={competitionId} onChange={(e) => setCompetitionId(e.target.value as string)}>
            {comps.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))}>
            <ChevronLeftRounded />
          </IconButton>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputProps={{ sx: { borderRadius: 2 } }}
            sx={{ minWidth: 180 }}
          />
          <IconButton size="small" onClick={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))}>
            <ChevronRightRounded />
          </IconButton>
          <Button size="small" variant="outlined" onClick={() => setSelectedDate(today)} sx={{ flexShrink: 0 }}>
            Hoy
          </Button>
        </Stack>
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
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Partidos del {dayjs(selectedDate).format('DD/MM/YYYY')}
            {selectedDate === today && ' (Hoy)'}
          </Typography>
          {filteredMatches.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 1 }}>Sin partidos en esta fecha</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>No hay partidos programados para este día.</Typography>
              <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate}>Crear partido</Button>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {filteredMatches.map((m) => (
                <Grid size={{ xs: 12, md: 6 }} key={m.id}>
                  <Card component={motion.div} whileHover={{ y: -2 }} sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Jornada {m.matchday}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StatusBadge status={m.status} />
                        <Tooltip title="Más opciones">
                          <IconButton size="small" onClick={(e) => setAnchor({ el: e.currentTarget, m })}>
                            <MoreVertRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 2 }}>
                      <Typography sx={{ fontWeight: 600, flex: 1, textAlign: 'center', cursor: 'pointer', fontSize: { xs: 13, md: 14 } }} onClick={() => window.open(`/admin/partidos/${m.id}`, '_self')}>
                        {m.homeRegistration.team.name}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans"', fontSize: { xs: 22, md: 28 }, mx: { xs: 1, md: 2 }, fontVariantNumeric: 'tabular-nums' }}>
                        {m.status === 'SCHEDULED' ? 'vs' : `${m.homeScore} - ${m.awayScore}`}
                      </Typography>
                    <Typography sx={{ fontWeight: 600, flex: 1, textAlign: 'center', cursor: 'pointer', fontSize: { xs: 13, md: 14 } }} onClick={() => window.open(`/admin/partidos/${m.id}`, '_self')}>
                        {m.awayRegistration.team.name}
                      </Typography>
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
                        <Button size="small" variant="outlined" onClick={() => window.open(`/admin/partidos/${m.id}`, '_self')}>
                          Ver detalle
                        </Button>
                      )}
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <Menu anchorEl={anchor?.el ?? null} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { if (anchor) { onOpenEdit(anchor.m); } setAnchor(null); }}>Editar</MenuItem>
        <MenuItem onClick={() => { if (anchor) { setDeletingMatch(anchor.m); } setAnchor(null); }} sx={{ color: 'error.main' }}>Eliminar</MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!deletingMatch}
        onClose={() => setDeletingMatch(null)}
        onConfirm={async () => {
          if (deletingMatch) await remove.mutateAsync(deletingMatch.id);
          setDeletingMatch(null);
          toast.success('Partido eliminado');
        }}
        title="¿Eliminar partido?"
        message={`Se eliminará el partido "${deletingMatch?.homeRegistration.team.name} vs ${deletingMatch?.awayRegistration.team.name}" de la jornada ${deletingMatch?.matchday}.`}
        loading={remove.isPending}
      />

      <AppDrawer open={!!open} onClose={() => { setOpen(null); setEditingMatch(null); }} title={editingMatch ? 'Editar partido' : 'Nuevo partido'}>
        {editingMatch ? (
          <Stack spacing={2}>
            <TextField label="Fecha y hora" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={editForm.scheduledAt} onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })} />
            <TextField label="Jornada" type="number" fullWidth value={editForm.matchday} onChange={(e) => setEditForm({ ...editForm, matchday: Number(e.target.value) })} />
            <TextField label="Sede" fullWidth value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Match['status'] })}>
                <MenuItem value="SCHEDULED">Programado</MenuItem>
                <MenuItem value="LIVE">En vivo</MenuItem>
                <MenuItem value="FINISHED">Finalizado</MenuItem>
                <MenuItem value="POSTPONED">Aplazado</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => { setOpen(null); setEditingMatch(null); }}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!editForm.scheduledAt || update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField label="Fecha y hora" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            <TextField label="Jornada" type="number" fullWidth value={form.matchday} onChange={(e) => setForm({ ...form, matchday: Number(e.target.value) })} />
            <TextField label="Sede" fullWidth value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <TextField label="Home Registration ID" fullWidth value={form.homeRegistrationId} onChange={(e) => setForm({ ...form, homeRegistrationId: e.target.value })} />
            <TextField label="Away Registration ID" fullWidth value={form.awayRegistrationId} onChange={(e) => setForm({ ...form, awayRegistrationId: e.target.value })} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setOpen(null)}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!form.scheduledAt || !form.homeRegistrationId || !form.awayRegistrationId || create.isPending}>
                {create.isPending ? 'Creando…' : 'Crear partido'}
              </Button>
            </Stack>
          </Stack>
        )}
      </AppDrawer>
    </Box>
  );
};

export default AdminSchedule;
