import { Box, Stack, Typography, Button, Avatar, Chip, TextField, MenuItem, IconButton } from '@mui/material';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AddRounded, VerifiedRounded } from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { usePlayersQuery } from '@/hooks/queries';
import { useCreatePlayer, useSetPlayerDegree, useSetPlayerStatus } from '@/hooks/mutations';
import type { Player } from '@/api/players.api';
import { calcAge } from '@/utils/formatDate';
import { extractErrorMessage } from '@/api/axios';

const AdminPlayers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const { data: players = [], isLoading, refetch, error } = usePlayersQuery(debouncedSearch);
  const create = useCreatePlayer();
  const setStatus = useSetPlayerStatus();
  const setDegree = useSetPlayerDegree();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ documentType: 'CEDULA' as 'CEDULA' | 'PARTIDA', documentNumber: '', firstName: '', lastName: '', birthDate: '', position: '' });

  const submit = async () => {
    try {
      await create.mutateAsync({
        ...form,
        birthDate: new Date(form.birthDate).toISOString(),
      } as Partial<Player>);
      setOpen(false);
      setForm({ documentType: 'CEDULA', documentNumber: '', firstName: '', lastName: '', birthDate: '', position: '' });
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  const columns: DataTableColumn<Player>[] = [
    {
      key: 'name', label: 'Jugador', render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={r.photoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main' }}>
            {r.firstName[0]}{r.lastName[0]}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{r.position ?? 'Sin posición'}</Typography>
          </Box>
        </Stack>
      ),
    },
    { key: 'doc', label: 'Documento', render: (r) => `${r.documentType === 'CEDULA' ? 'C.I.' : 'P.N.'} ${r.documentNumber}`, hideInMobile: true },
    { key: 'age', label: 'Edad', render: (r) => calcAge(r.birthDate) },
    { key: 'degree', label: 'Título', render: (r) => r.universityDegreeVerified ? <Chip size="small" color="success" label="Verificado" variant="outlined" icon={<VerifiedRounded sx={{ fontSize: 14 }} />} /> : <Chip size="small" label="Sin verificar" variant="outlined" /> },
    { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  ];
  const actions: DataTableAction<Player>[] = [
    { label: (r) => r.universityDegreeVerified ? 'Quitar verificación' : 'Verificar título', onClick: (r) => setDegree.mutate({ id: r.id, data: { universityDegreeVerified: !r.universityDegreeVerified } }) },
    { label: (r) => r.status === 'ACTIVE' ? 'Desactivar' : 'Activar', onClick: (r) => setStatus.mutate({ id: r.id, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }) },
  ];

  return (
    <Box>
      <PageHeader
        title="Jugadores"
        subtitle="Registro único por documento. Un jugador puede estar en varias competiciones."
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por nombre o documento…' }}
        action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)}>Nuevo jugador</Button>}
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

      <AppDrawer open={open} onClose={() => setOpen(false)} title="Nuevo jugador">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5}>
            <TextField select label="Tipo" fullWidth value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as 'CEDULA' | 'PARTIDA' })}>
              <MenuItem value="CEDULA">Cédula</MenuItem>
              <MenuItem value="PARTIDA">Partida de nacimiento</MenuItem>
            </TextField>
            <TextField label="Número" fullWidth value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField label="Nombre" fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Apellido" fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField label="Fecha de nacimiento" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            <TextField label="Posición" fullWidth value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </Stack>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={!form.firstName || !form.lastName || !form.documentNumber || !form.birthDate || create.isPending}>
              {create.isPending ? 'Creando…' : 'Crear jugador'}
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>
    </Box>
  );
};

export default AdminPlayers;
