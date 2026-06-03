import { Box, Stack, Typography, Button, Chip, Switch, TextField, FormControlLabel, MenuItem as MuiMenuItem, Avatar } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { DetailField } from '@/components/ui/DetailField';
import { useCategoriesQuery } from '@/hooks/queries';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/mutations';
import type { Category } from '@/api/categories.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

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
  const toast = useToast();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [detailCat, setDetailCat] = useState<Category | null>(null);

  const [imageUrl, setImageUrl] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { defaultFormat: 'LEAGUE', defaultRequiresAdminEligibility: false, defaultMinPlayers: 11, defaultMaxPlayers: 25 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, imageUrl: imageUrl || null, defaultAgeMin: data.defaultAgeMin || null, defaultAgeMax: data.defaultAgeMax || null } as Partial<Category>;
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync(payload);
      setOpen(false);
      setEditing(null);
      reset();
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const onOpenNew = () => { setEditing(null); setImageUrl(''); reset({ defaultFormat: 'LEAGUE', defaultRequiresAdminEligibility: false, defaultMinPlayers: 11, defaultMaxPlayers: 25 }); setOpen(true); };
  const onOpenEdit = (c: Category) => { setEditing(c); setImageUrl(c.imageUrl ?? ''); reset({ ...c, defaultAgeMin: c.defaultAgeMin ?? '', defaultAgeMax: c.defaultAgeMax ?? '' } as FormData); setOpen(true); };

  const columns: DataTableColumn<Category>[] = [
    { key: 'name', label: 'Nombre', render: (r) => (
      <Stack direction="row" spacing={1.5} alignItems="center">
        {r.imageUrl ? <Avatar src={r.imageUrl} sx={{ width: 28, height: 28 }} /> : null}
        <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
      </Stack>
    ) },
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
        onRowClick={(r) => setDetailCat(r)}
        emptyTitle="Aún no hay categorías"
        emptyDescription="Crea la primera categoría para empezar."
      />

      <DetailDrawer open={!!detailCat} onClose={() => setDetailCat(null)} title={detailCat?.name ?? 'Categoría'} subtitle="Detalle de la categoría">
        {detailCat && (
          <>
            {detailCat.imageUrl && <Box component="img" src={detailCat.imageUrl} alt="" sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 2, mb: 2, bgcolor: 'action.hover', p: 1 }} />}
            <DetailField label="Formato" value={detailCat.defaultFormat === 'LEAGUE' ? 'Liga' : 'Copa'} />
            <DetailField label="Rango de edad" value={`${detailCat.defaultAgeMin ?? '—'} – ${detailCat.defaultAgeMax ?? '∞'}`} />
            <DetailField label="Requiere habilitación" value={detailCat.defaultRequiresAdminEligibility ? 'Sí' : 'No'} />
            <DetailField label="Cupo mínimo" value={detailCat.defaultMinPlayers} />
            <DetailField label="Cupo máximo" value={detailCat.defaultMaxPlayers} />
            <DetailField label="Activa" value={detailCat.active ? 'Sí' : 'No'} />
          </>
        )}
      </DetailDrawer>

      <AppDrawer open={open} onClose={() => setOpen(false)} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <TextField label="Nombre" fullWidth {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Descripción" fullWidth multiline rows={2} {...register('description')} />
            <ImageUpload value={imageUrl} onChange={setImageUrl} label="Subir imagen de categoría" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField select label="Formato" fullWidth defaultValue={watch('defaultFormat')} {...register('defaultFormat')}>
                <MuiMenuItem value="LEAGUE">Liga</MuiMenuItem>
                <MuiMenuItem value="GROUPS_KNOCKOUT">Copa (grupos + eliminatoria)</MuiMenuItem>
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField label="Edad mínima" type="number" fullWidth {...register('defaultAgeMin')} error={!!errors.defaultAgeMin} helperText={errors.defaultAgeMin?.message} />
              <TextField label="Edad máxima" type="number" fullWidth {...register('defaultAgeMax')} error={!!errors.defaultAgeMax} helperText={errors.defaultAgeMax?.message} />
            </Stack>
            <FormControlLabel
              control={<Switch checked={!!watch('defaultRequiresAdminEligibility')} onChange={(e) => setValue('defaultRequiresAdminEligibility', e.target.checked)} />}
              label="Requiere habilitación del administrador"
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
          toast.success('Categoría eliminada');
        }}
        title="¿Eliminar categoría?"
        message={`Se eliminará o desactivará "${deleting?.name}". Si tiene competiciones asociadas, se desactivará.`}
        loading={remove.isPending}
      />
    </Box>
  );
};

export default AdminCategories;
