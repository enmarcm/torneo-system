import { Box, Card, Stack, Typography, Button, Chip, IconButton, Menu, MenuItem, Switch, TextField, FormControlLabel } from '@mui/material';
import { AddRounded, MoreVertRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCategoriesQuery } from '@/hooks/queries';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/mutations';
import type { Category } from '@/api/categories.api';
import { extractErrorMessage } from '@/api/axios';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  defaultFormat: z.enum(['LEAGUE', 'GROUPS_KNOCKOUT']),
  defaultAgeMin: z.coerce.number().int().optional().or(z.literal('').transform(() => undefined)),
  defaultAgeMax: z.coerce.number().int().optional().or(z.literal('').transform(() => undefined)),
  defaultRequiresAdminEligibility: z.boolean(),
  defaultMinPlayers: z.coerce.number().int().min(1),
  defaultMaxPlayers: z.coerce.number().int().min(1),
});
type FormData = z.infer<typeof schema>;

const AdminCategories: React.FC = () => {
  const { data: categories = [], isLoading, error, refetch } = useCategoriesQuery();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { defaultFormat: 'LEAGUE', defaultRequiresAdminEligibility: false, defaultMinPlayers: 11, defaultMaxPlayers: 25 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, defaultAgeMin: data.defaultAgeMin || null, defaultAgeMax: data.defaultAgeMax || null } as Partial<Category>;
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync(payload);
      setOpen(false);
      setEditing(null);
      reset();
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  const onOpenNew = () => { setEditing(null); reset({ defaultFormat: 'LEAGUE', defaultRequiresAdminEligibility: false, defaultMinPlayers: 11, defaultMaxPlayers: 25 }); setOpen(true); };
  const onOpenEdit = (c: Category) => { setEditing(c); reset({ ...c, defaultAgeMin: c.defaultAgeMin ?? '', defaultAgeMax: c.defaultAgeMax ?? '' } as FormData); setOpen(true); };

  const columns: DataTableColumn<Category>[] = [
    { key: 'name', label: 'Nombre', render: (r) => <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography> },
    { key: 'format', label: 'Formato', render: (r) => <Chip size="small" label={r.defaultFormat === 'LEAGUE' ? 'Liga' : 'Copa'} variant="outlined" /> },
    { key: 'age', label: 'Rango de edad', render: (r) => `${r.defaultAgeMin ?? '—'} – ${r.defaultAgeMax ?? '∞'}`, hideInMobile: true },
    { key: 'elig', label: 'Habilitación', render: (r) => r.defaultRequiresAdminEligibility ? <Chip size="small" color="warning" label="Sí" variant="outlined" /> : <Chip size="small" label="No" variant="outlined" />, hideInMobile: true },
    { key: 'cupo', label: 'Cupo (min-max)', render: (r) => `${r.defaultMinPlayers}-${r.defaultMaxPlayers}`, hideInMobile: true },
    { key: 'active', label: 'Activa', render: (r) => <Switch size="small" checked={r.active} onChange={() => update.mutate({ id: r.id, data: { active: !r.active } })} /> },
  ];
  const actions: DataTableAction<Category>[] = [
    { label: 'Editar', onClick: onOpenEdit },
    { label: 'Eliminar', color: 'error', onClick: (r) => setDeleting(r) },
  ];

  return (
    <Box>
      <PageHeader
        title="Categorías"
        subtitle="Catálogo de categorías del torneo."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenNew}>Nueva categoría</Button>
        }
      />
      <DataTable
        columns={columns}
        rows={categories}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        getRowKey={(r) => r.id}
        actions={actions}
        emptyTitle="Aún no hay categorías"
        emptyDescription="Crea la primera categoría para empezar."
      />

      <AppDrawer open={open} onClose={() => setOpen(false)} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <TextField label="Nombre" fullWidth {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Descripción" fullWidth multiline rows={2} {...register('description')} />
            <Stack direction="row" spacing={1.5}>
              <TextField select label="Formato" fullWidth defaultValue={watch('defaultFormat')} {...register('defaultFormat')}>
                <MenuItem value="LEAGUE">Liga</MenuItem>
                <MenuItem value="GROUPS_KNOCKOUT">Copa (grupos + eliminatoria)</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <TextField label="Edad mínima" type="number" fullWidth {...register('defaultAgeMin')} error={!!errors.defaultAgeMin} helperText={errors.defaultAgeMin?.message} />
              <TextField label="Edad máxima" type="number" fullWidth {...register('defaultAgeMax')} error={!!errors.defaultAgeMax} helperText={errors.defaultAgeMax?.message} />
            </Stack>
            <FormControlLabel
              control={<Switch checked={!!watch('defaultRequiresAdminEligibility')} onChange={(e) => setValue('defaultRequiresAdminEligibility', e.target.checked)} />}
              label="Requiere habilitación del administrador"
            />
            <Stack direction="row" spacing={1.5}>
              <TextField label="Cupo mínimo" type="number" fullWidth {...register('defaultMinPlayers')} />
              <TextField label="Cupo máximo" type="number" fullWidth {...register('defaultMaxPlayers')} />
            </Stack>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={create.isPending || update.isPending}>
                {editing ? 'Guardar cambios' : 'Crear categoría'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </AppDrawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove.mutateAsync(deleting.id);
          setDeleting(null);
        }}
        title="¿Eliminar categoría?"
        message={`Se eliminará o desactivará "${deleting?.name}". Si tiene competiciones asociadas, se desactivará.`}
        loading={remove.isPending}
      />
    </Box>
  );
};

export default AdminCategories;
