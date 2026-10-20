import { useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import { PlayerPhotoFields } from '@/components/sport/PlayerPhotoFields';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { SaveButton } from '@/components/ui/SaveButton';
import { useAddRoster, useCreateRosterPlayer } from '@/hooks/mutations';
import { useToast } from '@/hooks/common/useToast';
import { extractErrorMessage } from '@/api/axios';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';
import { canManageRoster } from '@/utils/teamRegistrations';
import { PlayerTournamentSelect } from './PlayerTournamentSelect';
import { playerTournamentBlockedReason, registerPlayerInTournaments } from '@/utils/playerTournamentRegistrations';

const EMPTY = { documentType: 'CEDULA' as 'CEDULA' | 'PARTIDA', documentNumber: '', firstName: '', lastName: '', birthDate: '', jerseyNumber: '', photoUrl: '', identityPhotoKey: '' };

export const NewRosterPlayer: React.FC<{
  registrationId?: string;
  registrations?: TeamRegistrationWithRoster[];
  disabled?: boolean;
}> = ({ registrationId, registrations = [], disabled = false }) => {
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [open, setOpen] = useState(false);
  const [pickedRegistrationIds, setPickedRegistrationIds] = useState<string[]>([]);
  const [createdPlayerId, setCreatedPlayerId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [failures, setFailures] = useState<Array<{ name: string; message: string }>>([]);
  const [form, setForm] = useState(EMPTY);
  const create = useCreateRosterPlayer();
  const add = useAddRoster();
  const toast = useToast();
  const options = registrations.filter(canManageRoster);
  const selectedIds = registrationId ? [registrationId] : pickedRegistrationIds;
  const selectedBlocked = !registrationId && selectedIds.some((id) => {
    const registration = registrations.find((entry) => entry.id === id);
    return !registration || !!playerTournamentBlockedReason(registration, createdPlayerId);
  });
  const busy = saving || create.isPending || add.isPending;
  const formLocked = busy || !!createdPlayerId;
  const set = (key: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const dismiss = (reason?: 'backdropClick' | 'escapeKeyDown' | 'closeButton') => {
    if (reason !== 'backdropClick' && !busy && !uploadingPhotos) setOpen(false);
  };
  const close = () => { if (!busy && !uploadingPhotos) { setOpen(false); setForm(EMPTY); setPickedRegistrationIds([]); setCreatedPlayerId(undefined); setFailures([]); } };
  const save = async () => {
    if (!selectedIds.length || busy || selectedBlocked) return;
    setSaving(true);
    setFailures([]);
    try {
      const data = {
        photoUrl: form.photoUrl, identityPhotoKey: form.identityPhotoKey,
        documentType: form.documentType, documentNumber: form.documentNumber.trim(),
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        birthDate: new Date(form.birthDate).toISOString(),
        jerseyNumber: form.jerseyNumber !== '' ? Number(form.jerseyNumber) : undefined,
      };
      const result = await registerPlayerInTournaments(selectedIds, createdPlayerId,
        (id) => create.mutateAsync({ registrationId: id, data }),
        (id, playerId) => add.mutateAsync({ registrationId: id, data: { playerId, jerseyNumber: data.jerseyNumber } }));
      setCreatedPlayerId(result.playerId);
      if (result.succeeded.length) toast.success(`Jugador agregado a ${result.succeeded.length} ${result.succeeded.length === 1 ? 'torneo' : 'torneos'}`);
      if (!result.failed.length) {
        setOpen(false); setForm(EMPTY); setPickedRegistrationIds([]); setCreatedPlayerId(undefined);
      } else {
        setPickedRegistrationIds(result.failed.map(({ id }) => id));
        setFailures(result.failed.map(({ id, error }) => ({ name: registrations.find((entry) => entry.id === id)?.competition.name ?? 'Torneo', message: extractErrorMessage(error) })));
      }
    } catch (err) { toast.error(extractErrorMessage(err)); }
    finally { setSaving(false); }
  };
  return (
    <>
      <Button variant="contained" startIcon={<AddRounded />} disabled={disabled || (!registrationId && options.length === 0)} onClick={() => setOpen(true)}>Nuevo jugador</Button>
      <AppDrawer open={open} onClose={dismiss} title={createdPlayerId ? 'Completar inscripciones' : 'Nuevo jugador'} subtitle="Selecciona los torneos de destino. El jugador conserva una sola ficha y una plantilla independiente en cada torneo." width={560}>
        <Stack spacing={2}>
          {!registrationId && <PlayerTournamentSelect registrations={registrations} value={selectedIds} onChange={(ids) => { setPickedRegistrationIds(ids); setFailures([]); }} playerId={createdPlayerId} disabled={busy} />}
          {!!failures.length && <Alert severity="error">
            {createdPlayerId && <Typography variant="body2" sx={{ fontWeight: 600 }}>El jugador ya fue creado. Se conservaron los torneos completados; puedes reintentar los pendientes.</Typography>}
            {failures.map((failure, index) => <Typography key={index} variant="body2">{failure.name}: {failure.message}</Typography>)}
          </Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField select fullWidth label="Tipo de documento" value={form.documentType} onChange={(e) => set('documentType', e.target.value)} disabled={formLocked}>
              <MenuItem value="CEDULA">Cédula</MenuItem><MenuItem value="PARTIDA">Partida de nacimiento</MenuItem>
            </TextField>
            <TextField required fullWidth label="Número de documento" value={form.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} disabled={formLocked} />
          </Stack>
          <TextField required fullWidth label="Nombre" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} disabled={formLocked} />
          <TextField required fullWidth label="Apellido" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} disabled={formLocked} />
          <TextField required fullWidth type="date" label="Fecha de nacimiento" InputLabelProps={{ shrink: true }} value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} disabled={formLocked} />
          <TextField fullWidth type="number" label="Dorsal (opcional)" inputProps={{ min: 0, max: 999 }} value={form.jerseyNumber} onChange={(e) => set('jerseyNumber', e.target.value)} disabled={formLocked} />
          <PlayerPhotoFields photoUrl={form.photoUrl} identityPhotoKey={form.identityPhotoKey} documentType={form.documentType} disabled={formLocked} onPhotoChange={(value) => set('photoUrl', value)} onIdentityChange={(value) => set('identityPhotoKey', value)} onBusyChange={setUploadingPhotos} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={close} disabled={busy || uploadingPhotos}>Cancelar</Button>
            <SaveButton onClick={save} loading={busy} error={!!failures.length} busyLabel="Inscribiendo…"
              disabled={uploadingPhotos || !form.photoUrl || !form.identityPhotoKey || !selectedIds.length || selectedBlocked || form.firstName.trim().length < 2 || form.lastName.trim().length < 2 || form.documentNumber.trim().length < 3 || !form.birthDate}>
              Agregar a {selectedIds.length} {selectedIds.length === 1 ? 'torneo' : 'torneos'}
            </SaveButton>
          </Stack>
        </Stack>
      </AppDrawer>
    </>
  );
};
