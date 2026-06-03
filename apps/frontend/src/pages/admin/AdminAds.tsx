import { Box, Stack, Typography, Button, TextField, FormControl, InputLabel, Select, Chip, MenuItem } from '@mui/material';
import { AddRounded } from '@mui/icons-material';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAdsQuery } from '@/hooks/queries';
import { useCreateAd, useUpdateAd, useDeleteAd } from '@/hooks/mutations';
import type { Ad } from '@/api/ads.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

const AdminAds: React.FC = () => {
  const { data: ads = [], isLoading, refetch, error } = useAdsQuery();
  const toast = useToast();
  const create = useCreateAd();
  const update = useUpdateAd();
  const remove = useDeleteAd();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState({ imageUrl: '', linkUrl: '', placement: 'HOME_BANNER' as Ad['placement'], sortOrder: 0, active: true });
  const [deletingAd, setDeletingAd] = useState<Ad | null>(null);

  const submit = async () => {
    try {
      const payload = { ...form, linkUrl: form.linkUrl || null } as Partial<Ad>;
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync(payload);
      setOpen(false);
      setEditing(null);
      setForm({ imageUrl: '', linkUrl: '', placement: 'HOME_BANNER', sortOrder: 0, active: true });
      toast.success(editing ? 'Anuncio actualizado' : 'Anuncio creado');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const columns: DataTableColumn<Ad>[] = [
    { key: 'image', label: 'Imagen', render: (r) => <Box component="img" src={r.imageUrl} alt="" sx={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 1 }} /> },
    { key: 'placement', label: 'Ubicación', render: (r) => <Chip size="small" label={r.placement} variant="outlined" /> },
    { key: 'order', label: 'Orden', render: (r) => r.sortOrder, hideInMobile: true },
    { key: 'active', label: 'Activo', render: (r) => <Chip size="small" color={r.active ? 'success' : 'default'} label={r.active ? 'Sí' : 'No'} variant="outlined" /> },
  ];
  const actions: DataTableAction<Ad>[] = [
    { label: 'Editar', onClick: (r) => { setEditing(r); setForm({ imageUrl: r.imageUrl, linkUrl: r.linkUrl ?? '', placement: r.placement, sortOrder: r.sortOrder, active: r.active }); setOpen(true); } },
    { label: (r) => r.active ? 'Desactivar' : 'Activar', onClick: (r) => update.mutate({ id: r.id, data: { active: !r.active } }) },
    { label: 'Eliminar', color: 'error', onClick: (r) => setDeletingAd(r) },
  ];

  return (
    <Box>
      <PageHeader
        title="Publicidad"
        subtitle="Banners y anuncios mostrados al público."
        action={<Button variant="contained" startIcon={<AddRounded />} onClick={() => { setEditing(null); setOpen(true); }}>Nuevo anuncio</Button>}
      />
      <DataTable
        columns={columns}
        rows={ads}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        getRowKey={(r) => r.id}
        actions={actions}
        emptyTitle="Aún no hay anuncios"
        emptyDescription="Crea el primer anuncio para empezar."
      />
      <AppDrawer open={open} onClose={() => setOpen(false)} title={editing ? 'Editar anuncio' : 'Nuevo anuncio'}>
        <Stack spacing={2}>
          <ImageUpload value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} label="Subir imagen del anuncio" />
          <TextField label="URL de destino (opcional)" fullWidth value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          <FormControl fullWidth>
            <InputLabel>Ubicación</InputLabel>
            <Select label="Ubicación" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as Ad['placement'] })}>
              <MenuItem value="HOME_BANNER">Banner principal (Home)</MenuItem>
              <MenuItem value="SIDEBAR">Sidebar</MenuItem>
              <MenuItem value="FOOTER">Footer</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Orden" type="number" fullWidth value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={!form.imageUrl || create.isPending || update.isPending}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>

      <ConfirmDialog
        open={!!deletingAd}
        onClose={() => setDeletingAd(null)}
        onConfirm={async () => {
          if (deletingAd) await remove.mutateAsync(deletingAd.id);
          setDeletingAd(null);
          toast.success('Anuncio eliminado');
        }}
        title="¿Eliminar anuncio?"
        message={`Se eliminará el anuncio en "${deletingAd?.placement}".`}
        loading={remove.isPending}
      />
    </Box>
  );
};

export default AdminAds;
