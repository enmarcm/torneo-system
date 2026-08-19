import {
  Box,
  Card,
  Stack,
  Typography,
  Button,
  TextField,
  Chip,
  Checkbox,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  AddRounded,
  EditRounded,
  DeleteRounded,
  PowerSettingsNewRounded,
  OpenInNewRounded,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAdsQuery } from '@/hooks/queries';
import { useCreateAd, useUpdateAd, useDeleteAd } from '@/hooks/mutations';
import { AD_PLACEMENTS, getPlacementLabel } from '@/utils/adPlacements';
import type { Ad, AdPlacement } from '@/api/ads.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

type AdState = 'ACTIVE' | 'PAUSED' | 'SCHEDULED' | 'EXPIRED';

const STATE_META: Record<AdState, { label: string; color: 'success' | 'default' | 'info' | 'warning' }> = {
  ACTIVE: { label: 'Publicado', color: 'success' },
  PAUSED: { label: 'Apagado', color: 'default' },
  SCHEDULED: { label: 'Programado', color: 'info' },
  EXPIRED: { label: 'Vencido', color: 'warning' },
};

/**
 * Estado real de un anuncio, que no es solo el interruptor: uno encendido pero
 * con fecha de inicio futura todavía no se ve, y uno vencido dejó de verse sin
 * que nadie lo apagara. El panel tiene que decir cuál de las tres cosas pasa.
 */
const adState = (ad: Ad): AdState => {
  if (!ad.active) return 'PAUSED';
  const now = Date.now();
  if (ad.startDate && new Date(ad.startDate).getTime() > now) return 'SCHEDULED';
  if (ad.endDate && new Date(ad.endDate).getTime() < now) return 'EXPIRED';
  return 'ACTIVE';
};

/** `2026-08-19T00:00:00.000Z` → `2026-08-19`, que es lo que espera un input date. */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

interface FormState {
  title: string;
  imageUrl: string;
  linkUrl: string;
  placements: AdPlacement[];
  sortOrder: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  imageUrl: '',
  linkUrl: '',
  placements: [],
  sortOrder: 0,
  active: true,
  startDate: '',
  endDate: '',
};

const AdminAds: React.FC = () => {
  const { data: ads = [], isLoading, error, refetch } = useAdsQuery();
  const toast = useToast();
  const create = useCreateAd();
  const update = useUpdateAd();
  const remove = useDeleteAd();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deletingAd, setDeletingAd] = useState<Ad | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const togglePlacement = (value: AdPlacement) =>
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(value)
        ? f.placements.filter((p) => p !== value)
        : [...f.placements, value],
    }));

  // Un anuncio puede ocupar varias ranuras, así que aparece en cada grupo al que pertenece.
  const byPlacement = useMemo(() => {
    const map = new Map<AdPlacement, Ad[]>();
    for (const meta of AD_PLACEMENTS) map.set(meta.value, []);
    for (const ad of ads) {
      for (const p of ad.placements) map.get(p)?.push(ad);
    }
    return map;
  }, [ads]);

  const counts = useMemo(() => {
    const acc: Record<AdState, number> = { ACTIVE: 0, PAUSED: 0, SCHEDULED: 0, EXPIRED: 0 };
    for (const ad of ads) acc[adState(ad)] += 1;
    return acc;
  }, [ads]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (ad: Ad) => {
    setEditing(ad);
    setForm({
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl ?? '',
      placements: ad.placements,
      sortOrder: ad.sortOrder,
      active: ad.active,
      startDate: toDateInput(ad.startDate),
      endDate: toDateInput(ad.endDate),
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const payload: Partial<Ad> = {
        title: form.title.trim(),
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl.trim() || null,
        placements: form.placements,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync(payload);
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success(editing ? 'Anuncio actualizado' : 'Anuncio creado');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const canSubmit = !!form.imageUrl && !!form.title.trim() && form.placements.length > 0;

  /*
    La medida sugerida depende de dónde se va a mostrar, así que se arma con lo
    que el administrador ya eligió en vez de repetir un número fijo.
  */
  const uploadHint = useMemo(() => {
    const chosen = AD_PLACEMENTS.filter((m) => form.placements.includes(m.value));
    if (chosen.length === 0) return '1200 × 240 px (horizontal)';
    const sizes = [...new Set(chosen.map((m) => m.hint))];
    if (sizes.length === 1) return sizes[0];
    return `${sizes[0]} — ojo, las otras ubicaciones elegidas piden ${sizes.slice(1).join(' y ')}`;
  }, [form.placements]);

  const AdRow: React.FC<{ ad: Ad }> = ({ ad }) => {
    const state = STATE_META[adState(ad)];
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          p: 1,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          opacity: ad.active ? 1 : 0.65,
        }}
      >
        <Box
          component="img"
          src={ad.imageUrl}
          alt=""
          sx={{
            width: 96,
            height: 48,
            flexShrink: 0,
            objectFit: 'contain',
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
            <Typography noWrap sx={{ fontWeight: 700 }}>
              {ad.title || 'Sin nombre'}
            </Typography>
            <Chip size="small" label={state.label} color={state.color} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            Orden {ad.sortOrder}
            {ad.placements.length > 1 &&
              ` · También en ${ad.placements.length - 1} ubicación${ad.placements.length > 2 ? 'es' : ''} más`}
            {ad.linkUrl && ' · Con enlace'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.25}>
          {ad.linkUrl && (
            <Tooltip title="Abrir destino">
              <IconButton size="small" component="a" href={ad.linkUrl} target="_blank" rel="noreferrer">
                <OpenInNewRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={ad.active ? 'Apagar' : 'Encender'}>
            <IconButton
              size="small"
              color={ad.active ? 'success' : 'default'}
              onClick={() => update.mutate({ id: ad.id, data: { active: !ad.active } })}
            >
              <PowerSettingsNewRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => openEdit(ad)}>
              <EditRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => setDeletingAd(ad)}>
              <DeleteRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Publicidad"
        subtitle="Cada ubicación es una ranura del sitio público. Un anuncio puede ocupar varias."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={openNew}>
            Nuevo anuncio
          </Button>
        }
      />

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
        {(Object.keys(STATE_META) as AdState[]).map((s) => (
          <Chip
            key={s}
            label={`${counts[s]} ${STATE_META[s].label.toLowerCase()}`}
            color={counts[s] > 0 ? STATE_META[s].color : 'default'}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <EmptyState
          title="No se pudo cargar la publicidad"
          description="Reintentá en un momento."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      ) : (
        <Stack spacing={2}>
          {AD_PLACEMENTS.map((meta) => {
            const list = byPlacement.get(meta.value) ?? [];
            return (
              <Card key={meta.value} sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: list.length ? 1.5 : 0 }}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 800 }}>{meta.label}</Typography>
                      <Chip
                        size="small"
                        label={list.length}
                        color={list.length ? 'primary' : 'default'}
                        sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {meta.where} · {meta.hint}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddRounded />}
                    onClick={() => {
                      setEditing(null);
                      setForm({ ...EMPTY_FORM, placements: [meta.value] });
                      setOpen(true);
                    }}
                  >
                    Agregar acá
                  </Button>
                </Stack>

                {list.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                    Sin anuncios: esta ranura no se dibuja en el sitio.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {list.map((ad) => (
                      <AdRow key={ad.id} ad={ad} />
                    ))}
                  </Stack>
                )}
              </Card>
            );
          })}
        </Stack>
      )}

      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar anuncio' : 'Nuevo anuncio'}
        subtitle="La imagen se muestra tal cual: subila ya recortada a la medida sugerida."
        width={520}
        footer={
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={submit}
              disabled={!canSubmit || create.isPending || update.isPending}
            >
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2.5}>
          <TextField
            label="Nombre del anuncio"
            helperText="Solo para reconocerlo en este panel. No se muestra al público."
            fullWidth
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />

          <ImageUpload
            value={form.imageUrl}
            onChange={(v) => set('imageUrl', v)}
            label="Subir imagen del anuncio"
            hint={uploadHint}
          />

          <TextField
            label="Enlace de destino (opcional)"
            placeholder="https://…"
            fullWidth
            value={form.linkUrl}
            onChange={(e) => set('linkUrl', e.target.value)}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              ¿Dónde se muestra?
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Podés elegir varias. La misma imagen se reutiliza en cada ranura.
            </Typography>
            <Stack
              spacing={0.5}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}
            >
              {AD_PLACEMENTS.map((meta) => (
                <FormControlLabel
                  key={meta.value}
                  sx={{ alignItems: 'flex-start', m: 0, py: 0.5 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.placements.includes(meta.value)}
                      onChange={() => togglePlacement(meta.value)}
                      sx={{ pt: 0.25 }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {meta.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {meta.where} · {meta.hint}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Stack>
          </Box>

          <Divider textAlign="left">
            <Typography variant="caption" color="text.secondary">
              Publicación
            </Typography>
          </Divider>

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Desde"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
            <TextField
              label="Hasta"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            Vacías = se muestra siempre que esté encendido.
          </Typography>

          <TextField
            label="Orden"
            type="number"
            fullWidth
            helperText="Menor primero. Define la rotación dentro de la ranura."
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
          />

          <FormControlLabel
            control={<Switch checked={form.active} onChange={(e) => set('active', e.target.checked)} />}
            label={form.active ? 'Encendido' : 'Apagado'}
          />
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
        message={`Se borrará "${deletingAd?.title || 'sin nombre'}" de ${
          deletingAd?.placements.map(getPlacementLabel).join(', ') || 'todas sus ubicaciones'
        }. No hay vuelta atrás.`}
        loading={remove.isPending}
      />
    </Box>
  );
};

export default AdminAds;
