import { Box, Card, Stack, Typography, Button, Avatar, IconButton, Menu, MenuItem, TextField, FormControl, InputLabel, Select, Chip, InputAdornment } from '@mui/material';
import { AddRounded, MoreVertRounded, GroupsRounded, SearchRounded } from '@mui/icons-material';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { DetailField } from '@/components/ui/DetailField';
import { DetailSection } from '@/components/ui/DetailSection';
import { LoadingState } from '@/components/ui/LoadingState';
import { useTeamsQuery, useTeamQuery, useCompetitionsQuery, useCategoriesQuery } from '@/hooks/queries';
import { useCreateTeam, useUpdateTeam, useSetTeamStatus, useRegisterTeam } from '@/hooks/mutations';
import type { Team } from '@/api/teams.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

const AdminTeams: React.FC = () => {
  const { data: teams = [], isLoading, refetch, error } = useTeamsQuery();
  const { data: competitions = [] } = useCompetitionsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const toast = useToast();
  const create = useCreateTeam();
  const update = useUpdateTeam();
  const setStatus = useSetTeamStatus();
  const register = useRegisterTeam();
  const [open, setOpen] = useState<'create' | 'edit' | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; t: Team } | null>(null);
  const [regOpen, setRegOpen] = useState<{ team: Team; competitionId: string } | null>(null);
  const [form, setForm] = useState({ name: '', leaderEmail: '', leaderPassword: '', logoUrl: '' });
  const [editForm, setEditForm] = useState({ name: '', logoUrl: '' });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const { data: detailTeam, isLoading: detailLoading } = useTeamQuery(detailId ?? '');

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterCategory) {
        const hasCat = competitions.some(
          (c) => c.categoryId === filterCategory && t._count?.registrations && t._count.registrations > 0,
        );
        if (!hasCat) return false;
      }
      return true;
    });
  }, [teams, search, filterStatus, filterCategory, competitions]);

  const submit = async () => {
    try {
      if (editingTeam) {
        await update.mutateAsync({ id: editingTeam.id, data: { name: editForm.name, logoUrl: editForm.logoUrl || null } as Partial<Team> });
        setOpen(null);
        setEditingTeam(null);
        toast.success('Equipo actualizado');
      } else {
        await create.mutateAsync({ name: form.name, logoUrl: form.logoUrl || null, leaderEmail: form.leaderEmail, leaderPassword: form.leaderPassword } as never);
        setOpen(null);
        setForm({ name: '', leaderEmail: '', leaderPassword: '', logoUrl: '' });
        toast.success('Equipo creado correctamente');
      }
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const onOpenEdit = (t: Team) => {
    setEditingTeam(t);
    setEditForm({ name: t.name, logoUrl: t.logoUrl ?? '' });
    setOpen('edit');
  };
  const onOpenCreate = () => {
    setEditingTeam(null);
    setForm({ name: '', leaderEmail: '', leaderPassword: '', logoUrl: '' });
    setOpen('create');
  };

  const columns: DataTableColumn<Team>[] = [
    {
      key: 'name', label: 'Equipo', render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={r.logoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700 }}>
            {r.name[0]}
          </Avatar>
          <Typography sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => window.open(`/admin/equipos/${r.id}`, '_self')}>
            {r.name}
          </Typography>
        </Stack>
      ),
    },
    { key: 'leader', label: 'Líder', render: (r) => r.leader?.email ?? '—', hideInMobile: true },
    { key: 'regs', label: 'Inscripciones', render: (r) => r._count?.registrations ?? 0 },
    { key: 'active', label: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  ];
  const actions: DataTableAction<Team>[] = [
    { label: 'Ver detalle', onClick: (t) => { window.open(`/admin/equipos/${t.id}`, '_self'); } },
    { label: 'Editar', onClick: (t) => onOpenEdit(t) },
    { label: 'Inscribir en competición', onClick: (t) => setRegOpen({ team: t, competitionId: competitions[0]?.id ?? '' }) },
    { label: (t) => t.status === 'ACTIVE' ? 'Desactivar' : 'Activar', onClick: (t) => t.status === 'ACTIVE' ? setDeletingTeam(t) : setStatus.mutate({ id: t.id, status: 'ACTIVE' }) },
  ];

  return (
    <Box>
      <PageHeader
        title="Equipos"
        subtitle="Clubes inscritos en el sistema."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate}>Nuevo equipo</Button>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Buscar equipo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as string)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ACTIVE">Activo</MenuItem>
            <MenuItem value="INACTIVE">Inactivo</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Categoría</InputLabel>
          <Select label="Categoría" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as string)}>
            <MenuItem value="">Todas</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      <DataTable
        columns={columns}
        rows={filteredTeams}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        getRowKey={(r) => r.id}
        actions={actions}
        onRowClick={(r) => setDetailId(r.id)}
        emptyTitle="Aún no hay equipos"
        emptyDescription="Crea el primer equipo para empezar."
      />

      <DetailDrawer open={!!detailId} onClose={() => setDetailId(null)} title={detailTeam?.name ?? 'Equipo'} subtitle={detailTeam?.leader?.email}>
        {detailLoading ? <LoadingState rows={3} /> : detailTeam && (
          <>
            <DetailField label="Estado" value={detailTeam.status} />
            <DetailField label="Líder" value={detailTeam.leader?.email ?? '—'} />
            <DetailSection title="Inscripciones">
              {(detailTeam as any).registrations?.length > 0 ? (detailTeam as any).registrations.map((r: any) => (
                <DetailField key={r.id} label={r.competition?.name ?? 'Competición'} value={`${r.roster?.length ?? 0} jugadores`} />
              )) : <Typography variant="body2" color="text.secondary">Sin inscripciones</Typography>}
            </DetailSection>
          </>
        )}
      </DetailDrawer>

      <AppDrawer open={!!open} onClose={() => { setOpen(null); setEditingTeam(null); }} title={editingTeam ? 'Editar equipo' : 'Nuevo equipo'} subtitle={editingTeam ? 'Actualiza los datos del equipo.' : 'Crea el equipo y su líder (recibirá estas credenciales).'}>
        {open === 'edit' && editingTeam ? (
          <Stack spacing={2}>
            <TextField label="Nombre del equipo" fullWidth value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <ImageUpload value={editForm.logoUrl} onChange={(v) => setEditForm({ ...editForm, logoUrl: v })} label="Subir logo del equipo" />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => { setOpen(null); setEditingTeam(null); }}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!editForm.name || update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField label="Nombre del equipo" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <ImageUpload value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} label="Subir logo del equipo" />
            <TextField label="Correo del líder" type="email" fullWidth value={form.leaderEmail} onChange={(e) => setForm({ ...form, leaderEmail: e.target.value })} />
            <TextField label="Contraseña del líder" type="text" fullWidth value={form.leaderPassword} onChange={(e) => setForm({ ...form, leaderPassword: e.target.value })} helperText="El líder deberá cambiarla al primer ingreso." />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => { setOpen(null); setEditingTeam(null); }}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!form.name || !form.leaderEmail || !form.leaderPassword || create.isPending}>
                {create.isPending ? 'Creando…' : 'Crear equipo'}
              </Button>
            </Stack>
          </Stack>
        )}
      </AppDrawer>

      <AppDrawer open={!!regOpen} onClose={() => setRegOpen(null)} title={`Inscribir a ${regOpen?.team.name ?? ''}`}>
        {regOpen && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Competición</InputLabel>
              <Select label="Competición" value={regOpen.competitionId} onChange={(e) => setRegOpen({ ...regOpen, competitionId: e.target.value as string })}>
                {competitions.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setRegOpen(null)}>Cancelar</Button>
              <Button variant="contained" disabled={!regOpen.competitionId || register.isPending} onClick={async () => {
                try {
                  await register.mutateAsync({ id: regOpen.team.id, competitionId: regOpen.competitionId });
                  setRegOpen(null);
                  toast.success('Equipo inscrito en la competición');
                } catch (e) {
                  toast.error(extractErrorMessage(e));
                }
              }}>
                Inscribir
              </Button>
            </Stack>
          </Stack>
        )}
      </AppDrawer>

      <ConfirmDialog
        open={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onConfirm={async () => {
          if (deletingTeam) await setStatus.mutateAsync({ id: deletingTeam.id, status: 'INACTIVE' });
          setDeletingTeam(null);
          toast.success('Equipo desactivado');
        }}
        title="¿Desactivar equipo?"
        message={`Se desactivará "${deletingTeam?.name}". El equipo dejará de participar en competiciones activas.`}
        confirmLabel="Desactivar"
        loading={setStatus.isPending}
      />
    </Box>
  );
};

export default AdminTeams;
