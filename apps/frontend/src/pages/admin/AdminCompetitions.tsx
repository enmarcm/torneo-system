import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button, IconButton, Menu, MenuItem, FormControl, Select, InputLabel, Tooltip, TextField, Divider, ListItemText, Checkbox, OutlinedInput } from '@mui/material';
import { getStatusLabel } from '@/utils/statusLabels';
import { AddRounded, MoreVertRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EntityHeroCard } from '@/components/sport/EntityHeroCard';
import { useEditionsQuery, useCategoriesQuery, useCompetitionsQuery } from '@/hooks/queries';
import { useCreateCompetition, useUpdateCompetition, useSetCompetitionStatus } from '@/hooks/mutations';
import { useGlobalStore } from '@/store/useGlobalStore';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';
import type { Competition } from '@/api/competitions.api';

type CompForm = {
  name: string;
  division: string;
  ageMin: string;
  ageMax: string;
  minPlayers: number;
  maxPlayers: number;
  format: 'LEAGUE' | 'GROUPS_KNOCKOUT';
  kind: Competition['kind'];
  imageUrl: string;
  divisionLevel: string;
  rounds: number;
  twoLeggedStages: Competition['twoLeggedStages'];
  promotionSpots: number;
  relegationSpots: number;
};

const EMPTY_FORM: CompForm = {
  name: '',
  division: '',
  ageMin: '',
  ageMax: '',
  minPlayers: 11,
  maxPlayers: 25,
  format: 'LEAGUE',
  kind: 'SPECIAL',
  imageUrl: '',
  divisionLevel: '',
  rounds: 1,
  twoLeggedStages: [],
  promotionSpots: 0,
  relegationSpots: 0,
};

const KINDS: Array<{ value: Competition['kind']; label: string; hint: string }> = [
  {
    value: 'LEAGUE_DIVISION',
    label: 'División de liga',
    hint: 'Primera, Segunda o Tercera. Se enlazan entre sí por ascenso y descenso.',
  },
  {
    value: 'CUP',
    label: 'Copa de la Liga',
    hint: 'Se nutre de las divisiones: grupos y después eliminatoria.',
  },
  { value: 'YOUTH', label: 'Menores (Sub-X)', hint: 'Torneo independiente por edad.' },
  { value: 'SPECIAL', label: 'Especial (Gremial / Veterano)', hint: 'Torneo independiente.' },
];

const KO_STAGES: Array<{ value: 'R16' | 'QUARTER' | 'SEMI' | 'FINAL'; label: string }> = [
  { value: 'R16', label: 'Octavos' },
  { value: 'QUARTER', label: 'Cuartos' },
  { value: 'SEMI', label: 'Semifinal' },
  { value: 'FINAL', label: 'Final' },
];

/** Campos de estructura del torneo, compartidos por el alta y la edición. */
const StructureFields: React.FC<{
  value: CompForm;
  onChange: (v: CompForm) => void;
}> = ({ value, onChange }) => {
  const set = <K extends keyof CompForm>(key: K, v: CompForm[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <Divider textAlign="left">
        <Typography variant="caption" color="text.secondary">
          Imagen del torneo
        </Typography>
      </Divider>
      <ImageUpload
        value={value.imageUrl}
        onChange={(url) => set('imageUrl', url)}
        label="Subir imagen del torneo"
      />

      <Divider textAlign="left">
        <Typography variant="caption" color="text.secondary">
          Estructura
        </Typography>
      </Divider>

      <FormControl fullWidth size="small">
        <InputLabel>Tipo de torneo</InputLabel>
        <Select
          label="Tipo de torneo"
          value={value.kind}
          onChange={(e) => set('kind', e.target.value as Competition['kind'])}
        >
          {KINDS.map((k) => (
            <MenuItem key={k.value} value={k.value}>
              <ListItemText primary={k.label} secondary={k.hint} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {value.kind === 'LEAGUE_DIVISION' && (
        <TextField
          select
          fullWidth
          size="small"
          label="Nivel de división"
          value={value.divisionLevel}
          onChange={(e) => set('divisionLevel', e.target.value)}
          helperText="1 está por encima de 2, y 2 por encima de 3."
        >
          <MenuItem value="1">1 · Primera</MenuItem>
          <MenuItem value="2">2 · Segunda</MenuItem>
          <MenuItem value="3">3 · Tercera</MenuItem>
        </TextField>
      )}

      {value.format === 'LEAGUE' && (
        <TextField
          select
          fullWidth
          size="small"
          label="Vueltas del todos contra todos"
          value={value.rounds}
          onChange={(e) => set('rounds', Number(e.target.value))}
        >
          <MenuItem value={1}>Una vuelta</MenuItem>
          <MenuItem value={2}>Ida y vuelta</MenuItem>
        </TextField>
      )}

      {value.format === 'GROUPS_KNOCKOUT' && (
        <FormControl fullWidth size="small">
          <InputLabel>Rondas a ida y vuelta</InputLabel>
          <Select
            multiple
            label="Rondas a ida y vuelta"
            value={value.twoLeggedStages}
            input={<OutlinedInput label="Rondas a ida y vuelta" />}
            onChange={(e) =>
              set('twoLeggedStages', e.target.value as Competition['twoLeggedStages'])
            }
            renderValue={(selected) =>
              selected.length === 0
                ? 'Todas a partido único'
                : selected
                    .map((s) => KO_STAGES.find((k) => k.value === s)?.label ?? s)
                    .join(', ')
            }
          >
            {KO_STAGES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                <Checkbox checked={value.twoLeggedStages.includes(s.value)} />
                <ListItemText primary={s.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Plazas de ascenso"
          value={value.promotionSpots}
          onChange={(e) => set('promotionSpots', Number(e.target.value))}
        />
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Plazas de descenso"
          value={value.relegationSpots}
          onChange={(e) => set('relegationSpots', Number(e.target.value))}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Estas plazas solo pintan las zonas en la tabla. El ascenso y el descenso definitivos los
        marcás vos equipo por equipo.
      </Typography>
    </>
  );
};

const AdminCompetitions: React.FC = () => {
  const selectedEditionId = useGlobalStore((s) => s.selectedEditionId);
  const { data: editions = [] } = useEditionsQuery();
  const editionId = selectedEditionId ?? editions[0]?.id;
  const { data: competitions = [], isLoading } = useCompetitionsQuery(editionId);
  const { data: categories = [] } = useCategoriesQuery();
  const toast = useToast();
  const create = useCreateCompetition();
  const update = useUpdateCompetition();
  const setStatus = useSetCompetitionStatus();
  const [open, setOpen] = useState<'create' | 'edit' | null>(null);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; c: Competition } | null>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [deletingComp, setDeletingComp] = useState<Competition | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  const cat = categories.find((c) => c.id === selectedCat);

  const submit = async () => {
    try {
      if (editingComp) {
        await update.mutateAsync({
          id: editingComp.id,
          data: {
            name: editForm.name || undefined,
            division: editForm.division || undefined,
            ageMin: editForm.ageMin ? Number(editForm.ageMin) : null,
            ageMax: editForm.ageMax ? Number(editForm.ageMax) : null,
            minPlayers: Number(editForm.minPlayers) || undefined,
            maxPlayers: Number(editForm.maxPlayers) || undefined,
            format: editForm.format,
            kind: editForm.kind,
            imageUrl: editForm.imageUrl || undefined,
            divisionLevel: editForm.divisionLevel ? Number(editForm.divisionLevel) : null,
            rounds: Number(editForm.rounds) || 1,
            twoLeggedStages: editForm.twoLeggedStages,
            promotionSpots: Number(editForm.promotionSpots) || 0,
            relegationSpots: Number(editForm.relegationSpots) || 0,
          } as Partial<Competition>,
        });
        setOpen(null);
        setEditingComp(null);
        toast.success('Competición actualizada');
      } else {
        if (!editionId || !selectedCat) return;
        await create.mutateAsync({
          editionId,
          categoryId: selectedCat,
          name: form.name || undefined,
          division: form.division || undefined,
          ageMin: form.ageMin ? Number(form.ageMin) : undefined,
          ageMax: form.ageMax ? Number(form.ageMax) : undefined,
          minPlayers: Number(form.minPlayers) || undefined,
          maxPlayers: Number(form.maxPlayers) || undefined,
          format: form.format,
          kind: form.kind,
          imageUrl: form.imageUrl || undefined,
          divisionLevel: form.divisionLevel ? Number(form.divisionLevel) : null,
          rounds: Number(form.rounds) || 1,
          twoLeggedStages: form.twoLeggedStages,
          promotionSpots: Number(form.promotionSpots) || 0,
          relegationSpots: Number(form.relegationSpots) || 0,
        } as Partial<Competition>);
        setOpen(null);
        setEditingComp(null);
        setSelectedCat('');
        setForm({ ...EMPTY_FORM });
        toast.success('Competición creada');
      }
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const onOpenEdit = (c: Competition) => {
    setEditingComp(c);
    setEditForm({
      name: c.name ?? '',
      division: c.division ?? '',
      ageMin: c.ageMin?.toString() ?? '',
      ageMax: c.ageMax?.toString() ?? '',
      minPlayers: c.minPlayers ?? 11,
      maxPlayers: c.maxPlayers ?? 25,
      format: c.format,
      kind: c.kind ?? 'SPECIAL',
      imageUrl: c.imageUrl ?? '',
      divisionLevel: c.divisionLevel?.toString() ?? '',
      rounds: c.rounds ?? 1,
      twoLeggedStages: c.twoLeggedStages ?? [],
      promotionSpots: c.promotionSpots ?? 0,
      relegationSpots: c.relegationSpots ?? 0,
    });
    setOpen('edit');
  };
  const onOpenCreate = () => {
    setEditingComp(null);
    setForm({ ...EMPTY_FORM });
    setOpen('create');
  };

  return (
    <Box>
      <PageHeader
        title="Competiciones"
        subtitle="Instancias de categorías dentro de una edición."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate} disabled={!editionId}>
            Nueva competición
          </Button>
        }
      />

      {!editionId && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Selecciona una edición para ver sus competiciones.</Typography>
        </Card>
      )}

      {editionId && isLoading && <Typography color="text.secondary">Cargando…</Typography>}

      {editionId && !isLoading && (
        <Grid container spacing={2}>
          {competitions.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1 }}>Aún no hay competiciones</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Crea la primera competición para esta edición.
                </Typography>
                <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate}>
                  Crear competición
                </Button>
              </Card>
            </Grid>
          ) : (
            competitions.map((c) => (
              <Grid size={{ xs: 12, md: 6 }} key={c.id}>
                <Card component={motion.div} whileHover={{ y: -2 }} sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.soft', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <EmojiEventsRounded />
                      </Box>
                      <Box>
                        <Typography variant="h4">{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.category?.name}</Typography>
                      </Box>
                    </Stack>
                    <Tooltip title="Ver más opciones">
                      <IconButton size="small" onClick={(e) => setAnchor({ el: e.currentTarget, c })}>
                        <MoreVertRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <StatusBadge status={c.format} />
                    {c.division && <Chip size="small" label={c.division} variant="outlined" />}
                    <StatusBadge status={c.status} />
                  </Stack>
                  <Stack direction="row" spacing={3} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Equipos</Typography>
                      <Typography sx={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans"' }}>{c._count?.registrations ?? 0}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Partidos</Typography>
                      <Typography sx={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans"' }}>{c._count?.matches ?? 0}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Edad</Typography>
                      <Typography sx={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans"' }}>
                        {c.ageMin ?? '—'}-{c.ageMax ?? '∞'}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      <Menu anchorEl={anchor?.el ?? null} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { if (anchor) { onOpenEdit(anchor.c); } setAnchor(null); }}>Editar</MenuItem>
        <MenuItem onClick={() => { if (anchor) { setDeletingComp(anchor.c); } setAnchor(null); }} sx={{ color: 'error.main' }}>Desactivar</MenuItem>
        {(['DRAFT', 'ACTIVE', 'FINISHED'] as const).map((s) => (
          <MenuItem key={s} onClick={() => { if (anchor) setStatus.mutate({ id: anchor.c.id, status: s }); setAnchor(null); }}>
            Cambiar a {getStatusLabel(s)}
          </MenuItem>
        ))}
      </Menu>

      <ConfirmDialog
        open={!!deletingComp}
        onClose={() => setDeletingComp(null)}
        onConfirm={async () => {
          if (deletingComp) await setStatus.mutateAsync({ id: deletingComp.id, status: 'FINISHED' });
          setDeletingComp(null);
          toast.success('Competición finalizada');
        }}
        title="¿Finalizar competición?"
        message={`Se finalizará "${deletingComp?.name}". Ya no se podrán agendar más partidos.`}
        confirmLabel="Finalizar"
        loading={setStatus.isPending}
      />

      <AppDrawer
        open={!!open}
        onClose={() => { setOpen(null); setEditingComp(null); }}
        title={editingComp ? 'Editar competición' : 'Nueva competición'}
        subtitle={editingComp ? 'Actualiza los datos de la competición.' : 'Al elegir categoría, se pre-rellenan los defaults.'}
        width={480}
      >
        {open === 'edit' && editingComp ? (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Formato</InputLabel>
              <Select label="Formato" value={editForm.format} onChange={(e) => setEditForm({ ...editForm, format: e.target.value as 'LEAGUE' | 'GROUPS_KNOCKOUT' })}>
                <MenuItem value="LEAGUE">Liga (todos contra todos)</MenuItem>
                <MenuItem value="GROUPS_KNOCKOUT">Copa (grupos + eliminatoria)</MenuItem>
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Edad mín.</Typography>
                <input type="number" value={editForm.ageMin} onChange={(e) => setEditForm({ ...editForm, ageMin: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Edad máx.</Typography>
                <input type="number" value={editForm.ageMax} onChange={(e) => setEditForm({ ...editForm, ageMax: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Cupo mín.</Typography>
                <input type="number" value={editForm.minPlayers} onChange={(e) => setEditForm({ ...editForm, minPlayers: Number(e.target.value) })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Cupo máx.</Typography>
                <input type="number" value={editForm.maxPlayers} onChange={(e) => setEditForm({ ...editForm, maxPlayers: Number(e.target.value) })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
            </Stack>
            <StructureFields value={editForm} onChange={setEditForm} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => { setOpen(null); setEditingComp(null); }}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                label="Categoría"
                value={selectedCat}
                onChange={(e) => {
                  const id = e.target.value as string;
                  setSelectedCat(id);
                  // Al elegir la categoría se arrastran sus defaults de estructura
                  // (tipo de torneo, formato y nivel de división).
                  const picked = categories.find((c) => c.id === id);
                  if (picked) {
                    setForm((f) => ({
                      ...f,
                      format: picked.defaultFormat,
                      kind: picked.defaultKind ?? f.kind,
                      divisionLevel: picked.defaultDivisionLevel?.toString() ?? '',
                      imageUrl: f.imageUrl || (picked.imageUrl ?? ''),
                    }));
                  }
                }}
              >
                {categories.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
              </Select>
            </FormControl>
            {cat && (
              <EntityHeroCard
                title={cat.name}
                subtitle={cat.description ?? 'Defaults aplicados desde la categoría'}
                chips={<Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 600 }}>{cat.defaultFormat === 'LEAGUE' ? 'Liga' : 'Copa'}</Box>}
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Formato</InputLabel>
              <Select label="Formato" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as 'LEAGUE' | 'GROUPS_KNOCKOUT' })}>
                <MenuItem value="LEAGUE">Liga (todos contra todos)</MenuItem>
                <MenuItem value="GROUPS_KNOCKOUT">Copa (grupos + eliminatoria)</MenuItem>
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Edad mín.</Typography>
                <input type="number" value={form.ageMin} onChange={(e) => setForm({ ...form, ageMin: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Edad máx.</Typography>
                <input type="number" value={form.ageMax} onChange={(e) => setForm({ ...form, ageMax: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Cupo mín.</Typography>
                <input type="number" value={form.minPlayers} onChange={(e) => setForm({ ...form, minPlayers: Number(e.target.value) })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Cupo máx.</Typography>
                <input type="number" value={form.maxPlayers} onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }} />
              </Box>
            </Stack>
            <StructureFields value={form} onChange={setForm} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => { setOpen(null); setEditingComp(null); }}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!selectedCat || create.isPending}>
                {create.isPending ? 'Creando…' : 'Crear competición'}
              </Button>
            </Stack>
          </Stack>
        )}
      </AppDrawer>
    </Box>
  );
};

export default AdminCompetitions;
