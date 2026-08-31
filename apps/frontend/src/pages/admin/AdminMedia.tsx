import {
  Box,
  Card,
  Grid2 as Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  Avatar,
  Button,
  Chip,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCategoriesQuery, useCompetitionsQuery, useTeamsQuery } from '@/hooks/queries';
import { useUpdateCategory, useUpdateCompetition, useUpdateTeam } from '@/hooks/mutations';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';

type Kind = 'categories' | 'competitions' | 'teams';

/** Lo mínimo que la grilla necesita de cada cosa, venga de donde venga. */
type MediaItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  caption?: string;
};

/*
  Un solo lugar para las imágenes del sitio. El community manager no entra a las
  fichas de categoría, competición ni equipo — ahí se define el torneo — pero sí
  es quien las viste, así que la imagen se edita desde acá.
*/
const HINTS: Record<Kind, string> = {
  categories: '512 × 512 px (cuadrado)',
  competitions: '512 × 512 px (cuadrado)',
  teams: '512 × 512 px (cuadrado, fondo transparente para el escudo)',
};

const AdminMedia: React.FC = () => {
  const toast = useToast();
  const [tab, setTab] = useState<Kind>('categories');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [draftUrl, setDraftUrl] = useState('');

  const categories = useCategoriesQuery();
  const competitions = useCompetitionsQuery();
  const teams = useTeamsQuery();

  const updateCategory = useUpdateCategory();
  const updateCompetition = useUpdateCompetition();
  const updateTeam = useUpdateTeam();

  const source = tab === 'categories' ? categories : tab === 'competitions' ? competitions : teams;

  const items: MediaItem[] = useMemo(() => {
    if (tab === 'categories') {
      return (categories.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl ?? null,
        caption: c.active ? undefined : 'Inactiva',
      }));
    }
    if (tab === 'competitions') {
      return (competitions.data ?? []).map((c) => ({
        id: c.id,
        name: getCompetitionShortLabel(c),
        imageUrl: c.imageUrl ?? null,
        caption: c.category?.name,
      }));
    }
    return (teams.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      imageUrl: t.logoUrl ?? null,
      caption: t.status === 'ACTIVE' ? undefined : 'Inactivo',
    }));
  }, [tab, categories.data, competitions.data, teams.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const saving = updateCategory.isPending || updateCompetition.isPending || updateTeam.isPending;

  const save = async () => {
    if (!editing) return;
    /* El campo se llama distinto en cada entidad, pero el trabajo es el mismo. */
    const url = draftUrl || null;
    try {
      if (tab === 'categories') {
        await updateCategory.mutateAsync({ id: editing.id, data: { imageUrl: url } });
      } else if (tab === 'competitions') {
        await updateCompetition.mutateAsync({ id: editing.id, data: { imageUrl: url } });
      } else {
        await updateTeam.mutateAsync({ id: editing.id, data: { logoUrl: url } });
      }
      toast.success(url ? 'Imagen actualizada' : 'Imagen quitada');
      setEditing(null);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Imágenes"
        subtitle="Las fotos y escudos que ve el público. Elegí qué querés vestir y subí la imagen."
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por nombre' }}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v as Kind);
          setSearch('');
        }}
        sx={{ mb: 3 }}
      >
        <Tab value="categories" label="Categorías" sx={{ textTransform: 'none' }} />
        <Tab value="competitions" label="Competiciones" sx={{ textTransform: 'none' }} />
        <Tab value="teams" label="Equipos" sx={{ textTransform: 'none' }} />
      </Tabs>

      {source.isLoading ? (
        <LoadingState rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No hay nada que vestir acá"
          description="Cambiá de pestaña o probá con otro nombre."
        />
      ) : (
        <Grid container spacing={2}>
          {rows.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
              <Card
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Avatar
                  src={item.imageUrl ?? undefined}
                  variant="rounded"
                  sx={{ width: 88, height: 88, bgcolor: 'var(--surface2)', fontSize: 28 }}
                >
                  {item.name[0]?.toUpperCase()}
                </Avatar>
                <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap title={item.name}>
                    {item.name}
                  </Typography>
                  {item.caption && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.caption}
                    </Typography>
                  )}
                  {!item.imageUrl && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label="Sin imagen"
                      sx={{ alignSelf: 'center', height: 20, fontSize: 11 }}
                    />
                  )}
                </Stack>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setEditing(item);
                    setDraftUrl(item.imageUrl ?? '');
                  }}
                >
                  {item.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AppDrawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ''}
        subtitle="La imagen se recorta para llenar su caja."
      >
        <Stack spacing={2}>
          <ImageUpload
            value={draftUrl}
            onChange={setDraftUrl}
            label="Subir imagen"
            hint={HINTS[tab]}
          />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setEditing(null)}>Cancelar</Button>
            <Button variant="contained" onClick={save} disabled={saving}>
              Guardar
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>
    </Box>
  );
};

export default AdminMedia;
