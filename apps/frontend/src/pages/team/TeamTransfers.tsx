import { Box, Card, Stack, Typography, Chip, Button, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useEditionsQuery, useTransfersQuery } from '@/hooks/queries';
import { useCreateTransfer } from '@/hooks/mutations';
import { formatDateTime } from '@/utils/formatDate';
import { extractErrorMessage } from '@/api/axios';

const TeamTransfers: React.FC = () => {
  const { data: editions = [] } = useEditionsQuery();
  const { data: transfers = [] } = useTransfersQuery();
  const [editionId, setEditionId] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ playerId: '', fromRegistrationId: '', toRegistrationId: '' });
  const create = useCreateTransfer();

  const active = editions.find((e) => e.id === editionId);
  const open_ = active?.transfersOpen;

  const submit = async () => {
    try {
      await create.mutateAsync({
        playerId: form.playerId,
        editionId,
        fromRegistrationId: form.fromRegistrationId || undefined,
        toRegistrationId: form.toRegistrationId,
      });
      setOpen(false);
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Traspasos"
        subtitle="Solicita o gestiona traspasos en la edición actual."
        action={
          <Button variant="contained" disabled={!open_} onClick={() => setOpen(true)}>
            Solicitar traspaso
          </Button>
        }
      />
      <Card sx={{ p: 3, mb: 2 }}>
        <FormControl sx={{ minWidth: 280 }} size="small">
          <InputLabel>Edición</InputLabel>
          <Select label="Edición" value={editionId} onChange={(e) => setEditionId(e.target.value as string)}>
            {editions.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Card>
      {!open_ && (
        <Card sx={{ p: 3, textAlign: 'center', borderColor: 'warning.light' }}>
          <Typography variant="h4" sx={{ mb: 1 }}>Los traspasos están cerrados</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Te avisaremos cuando se abran en la edición activa.
          </Typography>
          <Chip label="Cerrado" color="warning" />
        </Card>
      )}
      <Card sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Historial</Typography>
        {transfers.length === 0 ? <Typography color="text.secondary">Sin traspasos todavía.</Typography> : (
          <Stack spacing={1.5}>
            {transfers.map((t) => (
              <Stack key={t.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'background.default' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>{formatDateTime(t.createdAt)}</Typography>
                <Typography sx={{ fontWeight: 600 }}>{t.player.firstName} {t.player.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{t.fromRegistration?.team.name ?? '—'} → {t.toRegistration.team.name}</Typography>
                <Box sx={{ flex: 1 }} />
                <Chip size="small" label={t.status} color={t.status === 'APPROVED' ? 'success' : t.status === 'REJECTED' ? 'error' : 'warning'} variant="outlined" />
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      {open && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1300, p: 2 }} onClick={() => setOpen(false)}>
          <Card sx={{ width: '100%', maxWidth: 460, p: 3 }} onClick={(e) => e.stopPropagation()}>
            <Typography variant="h3" sx={{ mb: 2 }}>Solicitar traspaso</Typography>
            <Stack spacing={2}>
              <TextField label="Player ID" fullWidth value={form.playerId} onChange={(e) => setForm({ ...form, playerId: e.target.value })} />
              <TextField label="From Registration ID (opcional)" fullWidth value={form.fromRegistrationId} onChange={(e) => setForm({ ...form, fromRegistrationId: e.target.value })} />
              <TextField label="To Registration ID" fullWidth value={form.toRegistrationId} onChange={(e) => setForm({ ...form, toRegistrationId: e.target.value })} />
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="contained" onClick={submit} disabled={!form.playerId || !form.toRegistrationId || create.isPending}>
                  {create.isPending ? 'Enviando…' : 'Enviar solicitud'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default TeamTransfers;
