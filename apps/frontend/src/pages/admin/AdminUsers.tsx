import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  Avatar,
  Switch,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AddRounded,
  EditRounded,
  DeleteRounded,
  KeyRounded,
  VisibilityRounded,
  VisibilityOffRounded,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTeamsQuery, useUsersQuery } from '@/hooks/queries';
import {
  useCreateUser,
  useDeleteUser,
  useSetUserPassword,
  useSetUserStatus,
  useUpdateUser,
} from '@/hooks/mutations';
import type { ManagedUser } from '@/api/users.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, USER_ROLES, type UserRole } from '@/utils/roles';

const ROLE_COLOR: Record<UserRole, 'primary' | 'secondary' | 'warning' | 'default'> = {
  ADMIN: 'primary',
  COMMUNITY_MANAGER: 'secondary',
  SCOREKEEPER: 'warning',
  TEAM_LEADER: 'default',
};

type FormState = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  teamId: string;
};

const EMPTY_FORM: FormState = {
  username: '',
  email: '',
  password: '',
  role: 'COMMUNITY_MANAGER',
  teamId: '',
};

const AdminUsers: React.FC = () => {
  const me = useAuthStore((s) => s.user);
  const toast = useToast();
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading, error, refetch } = useUsersQuery(
    roleFilter ? { role: roleFilter } : undefined,
  );
  const { data: teams = [] } = useTeamsQuery();

  const create = useCreateUser();
  const update = useUpdateUser();
  const setPassword = useSetUserPassword();
  const setStatus = useSetUserStatus();
  const remove = useDeleteUser();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [passwordFor, setPasswordFor] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  /*
    El filtro por texto se resuelve en pantalla: la lista de cuentas de una liga
    entra de sobra en memoria y así el buscador responde mientras se escribe.
  */
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.team?.name ?? '').toLowerCase().includes(q),
    );
  }, [users, search]);

  /* Un club tiene un solo delegado: los que ya tienen no se ofrecen de nuevo. */
  const assignableTeams = useMemo(
    () =>
      teams.filter(
        (t) => !t.leader || (editing?.role === 'TEAM_LEADER' && editing.teamId === t.id),
      ),
    [teams, editing],
  );

  const onOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const onOpenEdit = (u: ManagedUser) => {
    setEditing(u);
    setForm({
      username: u.username,
      email: u.email ?? '',
      password: '',
      role: u.role,
      teamId: u.teamId ?? '',
    });
    setFormError(null);
    setOpen(true);
  };

  const submit = async () => {
    setFormError(null);
    try {
      const teamId = form.role === 'TEAM_LEADER' ? form.teamId || null : null;
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          data: {
            username: form.username.trim().toLowerCase(),
            email: form.email.trim() || null,
            role: form.role,
            teamId,
          },
        });
        toast.success('Usuario actualizado');
      } else {
        await create.mutateAsync({
          username: form.username.trim().toLowerCase(),
          password: form.password,
          email: form.email.trim() || null,
          role: form.role,
          teamId,
        });
        toast.success('Usuario creado');
      }
      setOpen(false);
      setEditing(null);
    } catch (e) {
      setFormError(extractErrorMessage(e));
    }
  };

  const submitPassword = async () => {
    if (!passwordFor) return;
    try {
      await setPassword.mutateAsync({ id: passwordFor.id, password: newPassword });
      toast.success(`Contraseña nueva para ${passwordFor.username}`);
      setPasswordFor(null);
      setNewPassword('');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const toggleStatus = async (u: ManagedUser) => {
    try {
      await setStatus.mutateAsync({
        id: u.id,
        status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const columns: DataTableColumn<ManagedUser>[] = [
    {
      key: 'username',
      label: 'Usuario',
      render: (u) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={u.team?.logoUrl ?? undefined}
            sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: 'primary.main' }}
          >
            {u.username[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }} noWrap>
              {u.username}
              {u.id === me?.id && (
                <Chip size="small" label="Vos" sx={{ ml: 1, height: 18, fontSize: 10 }} />
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {u.email ?? 'Sin correo cargado'}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (u) => (
        <Tooltip title={ROLE_DESCRIPTIONS[u.role]} arrow>
          <Chip
            size="small"
            variant="outlined"
            color={ROLE_COLOR[u.role]}
            label={ROLE_LABELS[u.role]}
          />
        </Tooltip>
      ),
    },
    {
      key: 'team',
      label: 'Equipo',
      hideInMobile: true,
      render: (u) => (
        <Typography variant="body2" color={u.team ? 'text.primary' : 'text.secondary'}>
          {u.team?.name ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Activo',
      render: (u) => (
        <Tooltip
          title={
            u.id === me?.id
              ? 'No podés desactivar tu propia cuenta'
              : u.status === 'ACTIVE'
                ? 'Desactivar: deja de poder iniciar sesión'
                : 'Activar'
          }
          arrow
        >
          <span>
            <Switch
              size="small"
              checked={u.status === 'ACTIVE'}
              disabled={u.id === me?.id || setStatus.isPending}
              onChange={() => toggleStatus(u)}
            />
          </span>
        </Tooltip>
      ),
    },
  ];

  const actions: DataTableAction<ManagedUser>[] = [
    { label: 'Editar', icon: <EditRounded fontSize="small" />, onClick: onOpenEdit },
    {
      label: 'Cambiar contraseña',
      icon: <KeyRounded fontSize="small" />,
      onClick: (u) => {
        setNewPassword('');
        setPasswordFor(u);
      },
    },
    {
      label: 'Eliminar',
      icon: <DeleteRounded fontSize="small" />,
      color: 'error',
      onClick: (u) => setDeleting(u),
    },
  ];

  const saving = create.isPending || update.isPending;

  return (
    <Box>
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas del sistema y qué puede hacer cada una."
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por usuario, correo o equipo',
        }}
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenNew}>
            Nuevo usuario
          </Button>
        }
      />

      <TextField
        select
        size="small"
        label="Rol"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
        sx={{ minWidth: 240, mb: 2 }}
      >
        <MenuItem value="">Todos los roles</MenuItem>
        {USER_ROLES.map((r) => (
          <MenuItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </MenuItem>
        ))}
      </TextField>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        getRowKey={(u) => u.id}
        actions={actions}
        emptyTitle="No hay usuarios con ese filtro"
        emptyDescription="Creá una cuenta o cambiá el rol que estás mirando."
      />

      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar ${editing.username}` : 'Nuevo usuario'}
        subtitle={ROLE_DESCRIPTIONS[form.role]}
      >
        <Stack spacing={2}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Usuario"
            fullWidth
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            helperText="Con esto entra al sistema. Solo letras sin acentos, números, punto, guion y guion bajo."
          />
          <TextField
            label="Correo (opcional)"
            fullWidth
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            helperText="Dato de contacto, no sirve como credencial obligatoria."
          />
          {!editing && (
            <TextField
              label="Contraseña"
              fullWidth
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="Mínimo 6 caracteres."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((v) => !v)} edge="end" size="small">
                      {showPwd ? <VisibilityOffRounded /> : <VisibilityRounded />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          <TextField
            select
            label="Rol"
            fullWidth
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole, teamId: '' })}
            disabled={!!editing && editing.id === me?.id}
            helperText={
              editing && editing.id === me?.id
                ? 'No podés cambiarte el rol a vos mismo.'
                : ROLE_DESCRIPTIONS[form.role]
            }
          >
            {USER_ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </TextField>
          {form.role === 'TEAM_LEADER' && (
            <TextField
              select
              label="Equipo"
              fullWidth
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              helperText="Un club tiene un solo delegado: los que ya tienen no aparecen en la lista."
            >
              <MenuItem value="">Sin equipo por ahora</MenuItem>
              {assignableTeams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={saving}>
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>

      <AppDrawer
        open={!!passwordFor}
        onClose={() => setPasswordFor(null)}
        title="Cambiar contraseña"
        subtitle={passwordFor?.username}
      >
        <Stack spacing={2}>
          <Alert severity="info">
            La contraseña anterior deja de servir en cuanto guardes. Pasásela vos a la persona.
          </Alert>
          <TextField
            label="Contraseña nueva"
            fullWidth
            type={showPwd ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Mínimo 6 caracteres."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd((v) => !v)} edge="end" size="small">
                    {showPwd ? <VisibilityOffRounded /> : <VisibilityRounded />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setPasswordFor(null)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={submitPassword}
              disabled={newPassword.length < 6 || setPassword.isPending}
            >
              Guardar contraseña
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success('Usuario eliminado');
          } catch (e) {
            toast.error(extractErrorMessage(e));
          } finally {
            setDeleting(null);
          }
        }}
        title="¿Eliminar usuario?"
        message={`Se borra la cuenta "${deleting?.username}". Lo que haya firmado en la auditoría queda sin autor. No hay vuelta atrás.`}
        loading={remove.isPending}
      />
    </Box>
  );
};

export default AdminUsers;
