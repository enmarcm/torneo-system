import { Box, Card, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Button, TextField, Chip, Avatar } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamsQuery, usePlayersQuery, useCompetitionsQuery } from '@/hooks/queries';
import { useAddRoster } from '@/hooks/mutations';
import { PageHeader } from '@/components/ui/PageHeader';
import { calcAge } from '@/utils/formatDate';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

const TeamSquads: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { data: teams = [] } = useTeamsQuery();
  const { data: players = [] } = usePlayersQuery();
  const { data: comps = [] } = useCompetitionsQuery();
  const team = teams.find((t) => t.id === user?.teamId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ registrationId: '', playerId: '', jerseyNumber: '' });
  const toast = useToast();
  const add = useAddRoster();

  const submit = async () => {
    try {
      await add.mutateAsync({
        registrationId: form.registrationId,
        data: { playerId: form.playerId, jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : undefined },
      });
      setOpen(false);
      setForm({ registrationId: '', playerId: '', jerseyNumber: '' });
      toast.success('Jugador agregado a la plantilla');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Plantillas"
        subtitle={`Gestiona la plantilla de ${team?.name ?? 'tu equipo'}`}
        action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)}>Agregar jugador</Button>}
      />
      <Card sx={{ p: 3 }}>
        {team ? (
          <Typography color="text.secondary">
            Tus inscripciones aparecerán aquí. Selecciona una inscripción y agrega jugadores respetando edad y cupo.
          </Typography>
        ) : (
          <Typography color="text.secondary">No tienes equipo asignado.</Typography>
        )}
      </Card>

      {open && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1300, p: 2 }} onClick={() => setOpen(false)}>
          <Card sx={{ width: '100%', maxWidth: 460, p: 3 }} onClick={(e) => e.stopPropagation()}>
            <Typography variant="h3" sx={{ mb: 2 }}>Agregar jugador a la plantilla</Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Competición</InputLabel>
                <Select label="Competición" value={form.registrationId} onChange={(e) => setForm({ ...form, registrationId: e.target.value as string })}>
                  {comps.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Jugador</InputLabel>
                <Select label="Jugador" value={form.playerId} onChange={(e) => setForm({ ...form, playerId: e.target.value as string })}>
                  {players.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({calcAge(p.birthDate)} años)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Número de camiseta (opcional)" type="number" fullWidth value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} />
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="contained" onClick={submit} disabled={!form.registrationId || !form.playerId || add.isPending}>
                  {add.isPending ? 'Agregando…' : 'Agregar'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default TeamSquads;
