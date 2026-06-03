import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button, IconButton, Menu, MenuItem, FormControl, Select, InputLabel, Tooltip } from '@mui/material';
import { AddRounded, MoreVertRounded, EmojiEventsRounded } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { EntityHeroCard } from '@/components/sport/EntityHeroCard';
import { useEditionsQuery, useCategoriesQuery, useCompetitionsQuery } from '@/hooks/queries';
import { useCreateCompetition, useSetCompetitionStatus } from '@/hooks/mutations';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useForm } from 'react-hook-form';
import { extractErrorMessage } from '@/api/axios';
import type { Competition } from '@/api/competitions.api';

const AdminCompetitions: React.FC = () => {
  const selectedEditionId = useGlobalStore((s) => s.selectedEditionId);
  const { data: editions = [] } = useEditionsQuery();
  const editionId = selectedEditionId ?? editions[0]?.id;
  const { data: competitions = [], isLoading } = useCompetitionsQuery(editionId);
  const { data: categories = [] } = useCategoriesQuery();
  const create = useCreateCompetition();
  const setStatus = useSetCompetitionStatus();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; c: Competition } | null>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [form, setForm] = useState({ name: '', division: '', ageMin: '', ageMax: '', minPlayers: 11, maxPlayers: 25, format: 'LEAGUE' as 'LEAGUE' | 'GROUPS_KNOCKOUT' });

  const cat = categories.find((c) => c.id === selectedCat);

  const submit = async () => {
    if (!editionId || !selectedCat) return;
    try {
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
      } as Partial<Competition>);
      setOpen(false);
      setSelectedCat('');
      setForm({ name: '', division: '', ageMin: '', ageMax: '', minPlayers: 11, maxPlayers: 25, format: 'LEAGUE' });
    } catch (e) {
      alert(extractErrorMessage(e));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Competiciones"
        subtitle="Instancias de categorías dentro de una edición."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)} disabled={!editionId}>
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
                <Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)}>
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
        {(['DRAFT', 'ACTIVE', 'FINISHED'] as const).map((s) => (
          <MenuItem key={s} onClick={() => { if (anchor) setStatus.mutate({ id: anchor.c.id, status: s }); setAnchor(null); }}>
            Cambiar a {s}
          </MenuItem>
        ))}
      </Menu>

      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva competición"
        subtitle="Al elegir categoría, se pre-rellenan los defaults."
        width={480}
      >
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Categoría</InputLabel>
            <Select label="Categoría" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value as string)}>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {cat && (
            <EntityHeroCard
              title={cat.name}
              subtitle={cat.description ?? 'Defaults aplicados desde la categoría'}
              chips={
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 600 }}>
                  {cat.defaultFormat === 'LEAGUE' ? 'Liga' : 'Copa'}
                </Box>
              }
            />
          )}
          <FormControl fullWidth>
            <InputLabel>Formato</InputLabel>
            <Select label="Formato" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as 'LEAGUE' | 'GROUPS_KNOCKOUT' })}>
              <MenuItem value="LEAGUE">Liga (todos contra todos)</MenuItem>
              <MenuItem value="GROUPS_KNOCKOUT">Copa (grupos + eliminatoria)</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Edad mín.</Typography>
              <input
                type="number"
                value={form.ageMin}
                onChange={(e) => setForm({ ...form, ageMin: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Edad máx.</Typography>
              <input
                type="number"
                value={form.ageMax}
                onChange={(e) => setForm({ ...form, ageMax: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Cupo mín.</Typography>
              <input
                type="number"
                value={form.minPlayers}
                onChange={(e) => setForm({ ...form, minPlayers: Number(e.target.value) })}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Cupo máx.</Typography>
              <input
                type="number"
                value={form.maxPlayers}
                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }}
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={!selectedCat || create.isPending}>
              {create.isPending ? 'Creando…' : 'Crear competición'}
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>
    </Box>
  );
};

export default AdminCompetitions;
