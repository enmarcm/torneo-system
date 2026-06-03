import { Box, Grid2 as Grid, Card, Stack, Typography, Switch, IconButton, Menu, MenuItem, Chip, Button, TextField, Tooltip } from '@mui/material';
import { AddRounded, MoreVertRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useEditionsQuery } from '@/hooks/queries';
import { useCreateEdition, useSetEditionStatus, useSetTransfers } from '@/hooks/mutations';
import { formatDate } from '@/utils/formatDate';
import type { Edition } from '@/api/editions.api';
import { extractErrorMessage } from '@/api/axios';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  year: z.coerce.number().int().min(2020).max(2100),
  seasonNumber: z.coerce.number().int().min(1).max(3),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const AdminEditions: React.FC = () => {
  const { data: editions = [], isLoading } = useEditionsQuery();
  const create = useCreateEdition();
  const setStatus = useSetEditionStatus();
  const setTransfers = useSetTransfers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Edition | null>(null);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; ed: Edition } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await create.mutateAsync({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      } as Partial<Edition>);
      setOpen(false);
      reset();
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Ediciones"
        subtitle="Gestiona las temporadas del torneo."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setEditing(null); setOpen(true); }}>
            Nueva edición
          </Button>
        }
      />

      {isLoading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : (
        <Grid container spacing={2}>
          {editions.map((ed) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ed.id}>
              <Card component={motion.div} whileHover={{ y: -2 }} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.soft', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                      <EmojiEventsRounded />
                    </Box>
                    <Box>
                      <Typography variant="h4">{ed.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Temporada {ed.seasonNumber} · {ed.year}</Typography>
                    </Box>
                  </Stack>
                  <Tooltip title="Ver más opciones">
                    <IconButton size="small" onClick={(e) => setAnchor({ el: e.currentTarget, ed })} aria-label="Más opciones">
                      <MoreVertRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 2 }}>
                  <StatusBadge status={ed.status} />
                  <Chip size="small" label={`${formatDate(ed.startDate)} → ${formatDate(ed.endDate)}`} variant="outlined" />
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">Traspasos</Typography>
                  <Switch
                    checked={ed.transfersOpen}
                    onChange={(e) => setTransfers.mutate({ id: ed.id, data: { transfersOpen: e.target.checked } })}
                  />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu anchorEl={anchor?.el ?? null} open={!!anchor} onClose={() => setAnchor(null)}>
        {(['DRAFT', 'ACTIVE', 'FINISHED'] as const).map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              if (anchor) setStatus.mutate({ id: anchor.ed.id, status: s });
              setAnchor(null);
            }}
          >
            Cambiar a {s}
          </MenuItem>
        ))}
      </Menu>

      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar edición' : 'Nueva edición'}
        subtitle="Define la temporada y fechas del torneo."
      >
        <form id="edition-form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <TextField label="Nombre" fullWidth {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <Stack direction="row" spacing={1.5}>
              <TextField label="Año" type="number" fullWidth {...register('year')} error={!!errors.year} helperText={errors.year?.message} />
              <TextField label="Temporada (1-3)" type="number" fullWidth {...register('seasonNumber')} error={!!errors.seasonNumber} helperText={errors.seasonNumber?.message} />
            </Stack>
            <TextField label="Fecha de inicio" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('startDate')} error={!!errors.startDate} helperText={errors.startDate?.message} />
            <TextField label="Fecha de fin" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('endDate')} error={!!errors.endDate} helperText={errors.endDate?.message} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Creando…' : 'Crear edición'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </AppDrawer>
    </Box>
  );
};

export default AdminEditions;
