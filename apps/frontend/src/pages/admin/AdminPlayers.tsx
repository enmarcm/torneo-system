import { Box, Stack, Typography, Button, Avatar, Chip, TextField, MenuItem } from '@mui/material';
import { PlayerPhotoFields } from '@/components/sport/PlayerPhotoFields';
import { SaveButton } from '@/components/ui/SaveButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AddRounded, EditRounded, VerifiedRounded, VerifiedOutlined, PowerSettingsNewRounded, DeleteForeverRounded } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePlayersQuery } from '@/hooks/queries';
import { useCreatePlayer, useUpdatePlayer, useSetPlayerDegree, useSetPlayerStatus, useDeletePlayer } from '@/hooks/mutations';
import type { Player } from '@/api/players.api';
import { calcAge } from '@/utils/formatDate';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

const AdminPlayers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const { data: players = [], isLoading, refetch, error } = usePlayersQuery(debouncedSearch);
  const toast = useToast();
  const create = useCreatePlayer();
  const update = useUpdatePlayer();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const setStatus = useSetPlayerStatus();
  const setDegree = useSetPlayerDegree();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ documentType: 'CEDULA' as 'CEDULA' | 'PARTIDA', documentNumber: '', firstName: '', lastName: '', birthDate: '', photoUrl: '', identityPhotoKey: '' });
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [purgingPlayer, setPurgingPlayer] = useState<Player | null>(null);
  const deletePlayer = useDeletePlayer();

  const submit = async () => {
    try {
      const data = { ...form, birthDate: new Date(form.birthDate).toISOString() };
      if (editingId) await update.mutateAsync({ id: editingId, data });
      else await create.mutateAsync(data);
      setOpen(false);
      setForm({ documentType: 'CEDULA', documentNumber: '', firstName: '', lastName: '', birthDate: '', photoUrl: '', identityPhotoKey: '' });
      setEditingId(null);
      toast.success(editingId ? 'Jugador actualizado' : 'Jugador creado correctamente');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const columns: DataTableColumn<Player>[] = [
    {
      key: 'name', label: 'Jugador', render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={r.photoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main' }}>
            {r.firstName[0]}{r.lastName[0]}
          </Avatar>
          <Typography sx={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</Typography>
        </Stack>
      ),
    },
    { key: 'doc', label: 'Documento', render: (r) => `${r.documentType === 'CEDULA' ? 'C.I.' : 'P.N.'} ${r.documentNumber}`, hideInMobile: true },
    { key: 'age', label: 'Edad', render: (r) => calcAge(r.birthDate) },
    { key: 'degree', label: 'Título', render: (r) => r.universityDegreeVerified ? <Chip size="small" color="success" label="Verificado" variant="outlined" icon={<VerifiedRounded sx={{ fontSize: 14 }} />} /> : <Chip size="small" label="Sin verificar" variant="outlined" /> },
    { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  ];
  const actions: DataTableAction<Player>[] = [
    { label: 'Editar jugador y fotos', icon: <EditRounded fontSize="small" />, onClick: (player) => {
      setEditingId(player.id); setForm({ documentType: player.documentType, documentNumber: player.documentNumber, firstName: player.firstName, lastName: player.lastName, birthDate: player.birthDate.slice(0, 10), photoUrl: player.photoUrl ?? '', identityPhotoKey: player.identityPhotoKey ?? '' }); setOpen(true);
    } },
    {
      label: (r) => (r.universityDegreeVerified ? 'Quitar verificación' : 'Verificar título'),
      icon: (r) =>
        r.universityDegreeVerified ? (
          <VerifiedRounded fontSize="small" />
        ) : (
          <VerifiedOutlined fontSize="small" />
        ),
      // Verde cuando ya está verificado; neutro cuando todavía no.
      color: (r) => (r.universityDegreeVerified ? 'success' : 'inherit'),
      onClick: (r) => setDegree.mutate({ id: r.id, data: { universityDegreeVerified: !r.universityDegreeVerified } }),
    },
    {
      label: (r) => (r.status === 'ACTIVE' ? 'Desactivar' : 'Activar'),
      icon: <PowerSettingsNewRounded fontSize="small" />,
      // Rojo si la acción va a desactivar, verde si va a reactivar.
      color: (r) => (r.status === 'ACTIVE' ? 'error' : 'success'),
      onClick: (r) => (r.status === 'ACTIVE'
        ? setDeletingPlayer(r)
        : setStatus.mutate({ id: r.id, status: 'ACTIVE' })),
    },
    {
      label: 'Eliminar definitivamente',
      icon: <DeleteForeverRounded fontSize="small" />,
      color: 'error',
      onClick: (r) => setPurgingPlayer(r),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Jugadores"
        subtitle="Registro único por documento. Un jugador puede estar en varias competiciones."
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por nombre o documento…' }}
        action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => { setEditingId(null); setForm({ documentType: 'CEDULA', documentNumber: '', firstName: '', lastName: '', birthDate: '', photoUrl: '', identityPhotoKey: '' }); setOpen(true); }}>Nuevo jugador</Button>}
      />
      <DataTable
        columns={columns}
        rows={players}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        getRowKey={(r) => r.id}
        actions={actions}
        emptyTitle="Aún no hay jugadores"
        emptyDescription="Crea el primer jugador para empezar."
      />

      <AppDrawer open={open} onClose={() => { if (!uploadingPhotos && !create.isPending && !update.isPending) setOpen(false); }} title={editingId ? 'Editar jugador' : 'Nuevo jugador'}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField select label="Tipo" fullWidth value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as 'CEDULA' | 'PARTIDA' })}>
              <MenuItem value="CEDULA">Cédula</MenuItem>
              <MenuItem value="PARTIDA">Partida de nacimiento</MenuItem>
            </TextField>
            <TextField label="Número" fullWidth value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField label="Nombre" fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Apellido" fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Stack>
          <TextField label="Fecha de nacimiento" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <PlayerPhotoFields photoUrl={form.photoUrl} identityPhotoKey={form.identityPhotoKey} documentType={form.documentType} disabled={create.isPending || update.isPending} onPhotoChange={(value) => setForm((current) => ({ ...current, photoUrl: value }))} onIdentityChange={(value) => setForm((current) => ({ ...current, identityPhotoKey: value }))} onBusyChange={setUploadingPhotos} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button disabled={uploadingPhotos || create.isPending || update.isPending} onClick={() => setOpen(false)}>Cancelar</Button>
            <SaveButton onClick={submit} loading={create.isPending || update.isPending} error={create.isError || update.isError} disabled={uploadingPhotos || !form.photoUrl || !form.identityPhotoKey || !form.firstName || !form.lastName || !form.documentNumber || !form.birthDate}>
              {editingId ? 'Guardar cambios' : 'Crear jugador'}
            </SaveButton>
          </Stack>
        </Stack>
      </AppDrawer>

      <ConfirmDialog
        open={!!deletingPlayer}
        onClose={() => setDeletingPlayer(null)}
        onConfirm={async () => {
          if (deletingPlayer) await setStatus.mutateAsync({ id: deletingPlayer.id, status: 'INACTIVE' });
          setDeletingPlayer(null);
          toast.success('Jugador desactivado');
        }}
        title="¿Desactivar jugador?"
        message={`Se desactivará a "${deletingPlayer?.firstName} ${deletingPlayer?.lastName}". No podrá participar en competiciones.`}
        confirmLabel="Desactivar"
        loading={setStatus.isPending}
      />
      {/* Borrado definitivo: arrastra todo lo que el jugador dejó registrado. */}
      <ConfirmDialog
        open={!!purgingPlayer}
        onClose={() => setPurgingPlayer(null)}
        onConfirm={async () => {
          if (!purgingPlayer) return;
          try {
            await deletePlayer.mutateAsync(purgingPlayer.id);
            toast.success('Jugador eliminado definitivamente');
            setPurgingPlayer(null);
          } catch (e) {
            toast.error(extractErrorMessage(e));
          }
        }}
        title="¿Eliminar definitivamente?"
        message={`Se borrará a "${purgingPlayer?.firstName ?? ''} ${purgingPlayer?.lastName ?? ''}" junto con sus plantillas, goles y tarjetas. No hay vuelta atrás: si solo querés que deje de jugar, desactivalo.`}
        confirmLabel="Eliminar definitivamente"
        loading={deletePlayer.isPending}
      />
    </Box>
  );
};

export default AdminPlayers;
