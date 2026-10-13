import { useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import { PlayerPhotoFields } from '@/components/sport/PlayerPhotoFields';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { SaveButton } from '@/components/ui/SaveButton';
import { useCreateRosterPlayer } from '@/hooks/mutations';
import { useToast } from '@/hooks/common/useToast';
import { extractErrorMessage } from '@/api/axios';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';
import { getCompetitionShortLabel, AGE_GROUP_LABELS } from '@/utils/competitionMeta';
import { canManageRoster } from '@/utils/teamRegistrations';

const EMPTY = { documentType: 'CEDULA' as 'CEDULA' | 'PARTIDA', documentNumber: '', firstName: '', lastName: '', birthDate: '', jerseyNumber: '', photoUrl: '', identityPhotoKey: '' };

export const NewRosterPlayer: React.FC<{
  registrationId?: string;
  registrations?: TeamRegistrationWithRoster[];
  disabled?: boolean;
}> = ({ registrationId, registrations = [], disabled = false }) => {
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [open, setOpen] = useState(false);
  const [pickedRegistrationId, setPickedRegistrationId] = useState('');
  const [form, setForm] = useState(EMPTY);
  const create = useCreateRosterPlayer();
  const toast = useToast();
  const options = registrations.filter(canManageRoster);
  const selectedId = registrationId ?? (options.some((r) => r.id === pickedRegistrationId) ? pickedRegistrationId : options[0]?.id ?? '');
  const set = (key: keyof typeof EMPTY, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const close = () => { if (!create.isPending && !uploadingPhotos) { setOpen(false); setForm(EMPTY); } };
  const save = async () => {
    if (!selectedId) return;
    try {
      await create.mutateAsync({ registrationId: selectedId, data: {
        photoUrl: form.photoUrl, identityPhotoKey: form.identityPhotoKey,
        documentType: form.documentType, documentNumber: form.documentNumber.trim(),
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        birthDate: new Date(form.birthDate).toISOString(),
        jerseyNumber: form.jerseyNumber !== '' ? Number(form.jerseyNumber) : undefined,
      } });
      setOpen(false); setForm(EMPTY);
      toast.success('Jugador agregado a la plantilla del torneo');
    } catch (err) { toast.error(extractErrorMessage(err)); }
  };
  return (
    <>
      <Button variant="contained" startIcon={<AddRounded />} disabled={disabled || (!registrationId && options.length === 0)} onClick={() => setOpen(true)}>Nuevo jugador</Button>
      <AppDrawer open={open} onClose={close} title="Nuevo jugador" subtitle="El jugador queda inscrito directamente en la plantilla de este torneo.">
        <Stack spacing={2}>
          {!registrationId && <TextField select fullWidth label="Torneo" value={selectedId} disabled={create.isPending} onChange={(event) => setPickedRegistrationId(event.target.value)}>
            {options.map((registration) => <MenuItem key={registration.id} value={registration.id}>
              {getCompetitionShortLabel(registration.competition)} · {AGE_GROUP_LABELS[registration.competition.ageGroup]}{registration.competition.edition ? ` · ${registration.competition.edition.name}` : ''}
            </MenuItem>)}
          </TextField>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField select fullWidth label="Tipo de documento" value={form.documentType} onChange={(e) => set('documentType', e.target.value)} disabled={create.isPending}>
              <MenuItem value="CEDULA">Cédula</MenuItem><MenuItem value="PARTIDA">Partida de nacimiento</MenuItem>
            </TextField>
            <TextField required fullWidth label="Número de documento" value={form.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} disabled={create.isPending} />
          </Stack>
          <TextField required fullWidth label="Nombre" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} disabled={create.isPending} />
          <TextField required fullWidth label="Apellido" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} disabled={create.isPending} />
          <TextField required fullWidth type="date" label="Fecha de nacimiento" InputLabelProps={{ shrink: true }} value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} disabled={create.isPending} />
          <TextField fullWidth type="number" label="Dorsal (opcional)" inputProps={{ min: 0, max: 999 }} value={form.jerseyNumber} onChange={(e) => set('jerseyNumber', e.target.value)} disabled={create.isPending} />
          <PlayerPhotoFields photoUrl={form.photoUrl} identityPhotoKey={form.identityPhotoKey} documentType={form.documentType} disabled={create.isPending} onPhotoChange={(value) => set('photoUrl', value)} onIdentityChange={(value) => set('identityPhotoKey', value)} onBusyChange={setUploadingPhotos} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={close} disabled={create.isPending || uploadingPhotos}>Cancelar</Button>
            <SaveButton onClick={save} loading={create.isPending} error={create.isError}
              disabled={uploadingPhotos || !form.photoUrl || !form.identityPhotoKey || !selectedId || form.firstName.trim().length < 2 || form.lastName.trim().length < 2 || form.documentNumber.trim().length < 3 || !form.birthDate}>
              Agregar al torneo
            </SaveButton>
          </Stack>
        </Stack>
      </AppDrawer>
    </>
  );
};
