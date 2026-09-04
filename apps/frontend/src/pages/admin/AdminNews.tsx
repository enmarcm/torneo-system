import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AddRounded,
  EditRounded,
  DeleteRounded,
  OpenInNewRounded,
  AutorenewRounded,
  PublicRounded,
  DraftsRounded,
  InsightsRounded,
} from '@mui/icons-material';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { FactSheetView } from '@/components/sport/FactSheetView';
import {
  useNewsAdminQuery,
  useFactSheetPreviewQuery,
  useEditionsQuery,
  useCompetitionsQuery,
  useTeamsQuery,
} from '@/hooks/queries';
import {
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  useRegenerateArticleSheet,
} from '@/hooks/mutations';
import {
  ARTICLE_KIND_LABEL,
  isSheet,
  type Article,
  type ArticleKind,
  type ArticlePayload,
  type ArticleStatus,
  type SheetKind,
} from '@/api/news.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';
import { formatDate } from '@/utils/formatDate';

const KIND_OPTIONS: { value: ArticleKind; help: string }[] = [
  { value: 'NEWS', help: 'Una nota escrita a mano. Sin números automáticos.' },
  { value: 'EDITION_SHEET', help: 'Resumen de un año: torneos, campeones, goles y goleadores.' },
  { value: 'COMPETITION_SHEET', help: 'Un torneo: tabla, campeón, goleadores y tarjetas.' },
  { value: 'TEAM_SHEET', help: 'Un club: campañas año por año, títulos y goleadores.' },
];

interface FormState {
  kind: ArticleKind;
  title: string;
  summary: string;
  body: string;
  coverUrl: string;
  featured: boolean;
  status: ArticleStatus;
  editionId: string;
  competitionId: string;
  teamId: string;
  /** Vacío = toda la historia del club. */
  year: string;
}

const EMPTY_FORM: FormState = {
  kind: 'NEWS',
  title: '',
  summary: '',
  body: '',
  coverUrl: '',
  featured: false,
  status: 'DRAFT',
  editionId: '',
  competitionId: '',
  teamId: '',
  year: '',
};

/** De qué entidad habla cada tipo de ficha. */
const subjectOf = (form: FormState) => {
  switch (form.kind) {
    case 'EDITION_SHEET':
      return form.editionId;
    case 'COMPETITION_SHEET':
      return form.competitionId;
    case 'TEAM_SHEET':
      return form.teamId;
    default:
      return '';
  }
};

const AdminNews: React.FC = () => {
  const { data: articles = [], isLoading, error, refetch } = useNewsAdminQuery();
  const { data: editions = [] } = useEditionsQuery();
  const { data: competitions = [] } = useCompetitionsQuery();
  const { data: teams = [] } = useTeamsQuery();
  const toast = useToast();

  const create = useCreateArticle();
  const update = useUpdateArticle();
  const remove = useDeleteArticle();
  const regenerate = useRegenerateArticleSheet();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Article | null>(null);
  const [kindFilter, setKindFilter] = useState<ArticleKind | ''>('');
  const [search, setSearch] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const subjectId = subjectOf(form);
  const preview = useFactSheetPreviewQuery(
    isSheet(form.kind) ? (form.kind as SheetKind) : undefined,
    subjectId || undefined,
    form.year ? Number(form.year) : null,
  );

  const years = useMemo(
    () => [...new Set(editions.map((e) => e.year))].sort((a, b) => b - a),
    [editions],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (!kindFilter || a.kind === kindFilter) &&
        (!q || a.title.toLowerCase().includes(q)),
    );
  }, [articles, kindFilter, search]);

  const counts = useMemo(() => {
    const acc = { published: 0, draft: 0 };
    for (const a of articles) a.status === 'PUBLISHED' ? (acc.published += 1) : (acc.draft += 1);
    return acc;
  }, [articles]);

  const openNew = (kind: ArticleKind = 'NEWS') => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, kind });
    setOpen(true);
  };

  const openEdit = (a: Article) => {
    setEditing(a);
    setForm({
      kind: a.kind,
      title: a.title,
      summary: a.summary ?? '',
      body: a.body,
      coverUrl: a.coverUrl ?? '',
      featured: a.featured,
      status: a.status,
      editionId: a.editionId ?? '',
      competitionId: a.competitionId ?? '',
      teamId: a.teamId ?? '',
      year: a.year ? String(a.year) : '',
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const payload: ArticlePayload = {
        kind: form.kind,
        status: form.status,
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        body: form.body,
        coverUrl: form.coverUrl || null,
        featured: form.featured,
        // Las entidades que no corresponden al tipo se limpian: una ficha de club
        // que arrastre el torneo de un borrador anterior confunde los filtros.
        editionId: form.kind === 'EDITION_SHEET' ? form.editionId : null,
        competitionId: form.kind === 'COMPETITION_SHEET' ? form.competitionId : null,
        teamId: form.kind === 'TEAM_SHEET' ? form.teamId : null,
        year: form.kind === 'TEAM_SHEET' && form.year ? Number(form.year) : null,
      };
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync(payload);
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success(editing ? 'Publicación actualizada' : 'Publicación creada');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const togglePublish = async (a: Article) => {
    try {
      await update.mutateAsync({
        id: a.id,
        data: { status: a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' },
      });
      toast.success(a.status === 'PUBLISHED' ? 'Vuelta a borrador' : 'Publicada en el sitio');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const refreshSheet = async (a: Article) => {
    try {
      await regenerate.mutateAsync(a.id);
      toast.success('Ficha recalculada con los números de hoy');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const canSubmit = form.title.trim().length >= 4 && (form.kind === 'NEWS' || !!subjectId);

  const ArticleRow: React.FC<{ a: Article }> = ({ a }) => {
    const published = a.status === 'PUBLISHED';
    const subject = a.edition?.name ?? a.competition?.name ?? a.team?.name;
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          p: 1.25,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          opacity: published ? 1 : 0.75,
        }}
      >
        {a.coverUrl ? (
          <Box
            component="img"
            src={a.coverUrl}
            alt=""
            sx={{ width: 84, height: 56, flexShrink: 0, objectFit: 'cover', borderRadius: 1 }}
          />
        ) : (
          <Box
            sx={{
              width: 84,
              height: 56,
              flexShrink: 0,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'action.hover',
              color: 'text.disabled',
            }}
          >
            <InsightsRounded fontSize="small" />
          </Box>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }} useFlexGap flexWrap="wrap">
            <Typography noWrap sx={{ fontWeight: 700 }}>
              {a.title}
            </Typography>
            <Chip
              size="small"
              label={published ? 'Publicada' : 'Borrador'}
              color={published ? 'success' : 'default'}
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
            {a.featured && (
              <Chip size="small" label="Portada" color="warning" sx={{ height: 20, fontSize: 11 }} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {ARTICLE_KIND_LABEL[a.kind]}
            {subject && ` · ${subject}`}
            {a.year && ` · ${a.year}`}
            {a.publishedAt && ` · ${formatDate(a.publishedAt)}`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.25}>
          {published && (
            <Tooltip title="Ver en el sitio">
              <IconButton
                size="small"
                component="a"
                href={`/noticias/${a.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <OpenInNewRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isSheet(a.kind) && (
            <Tooltip title="Recalcular la ficha con los números de hoy">
              <IconButton size="small" onClick={() => refreshSheet(a)} disabled={regenerate.isPending}>
                <AutorenewRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={published ? 'Volver a borrador' : 'Publicar'}>
            <IconButton
              size="small"
              color={published ? 'success' : 'default'}
              onClick={() => togglePublish(a)}
            >
              {published ? <PublicRounded fontSize="small" /> : <DraftsRounded fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => openEdit(a)}>
              <EditRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => setDeleting(a)}>
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
        title="Noticias y fichas"
        subtitle="Las fichas técnicas se arman solas con los números del torneo; vos les ponés el titular y la foto."
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por titular…' }}
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openNew()}>
            Nueva publicación
          </Button>
        }
      />

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
        <Chip
          label={`${counts.published} publicadas`}
          color={counts.published ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Chip label={`${counts.draft} en borrador`} variant="outlined" sx={{ fontWeight: 600 }} />
        <Divider orientation="vertical" flexItem />
        <Chip
          label="Todo"
          color={kindFilter === '' ? 'primary' : 'default'}
          onClick={() => setKindFilter('')}
          sx={{ fontWeight: 600 }}
        />
        {KIND_OPTIONS.map((k) => (
          <Chip
            key={k.value}
            label={ARTICLE_KIND_LABEL[k.value]}
            color={kindFilter === k.value ? 'primary' : 'default'}
            onClick={() => setKindFilter(k.value)}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>

      {/* Atajos: la ficha es lo que más se publica al cerrar una fecha. */}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
        {KIND_OPTIONS.filter((k) => k.value !== 'NEWS').map((k) => (
          <Button
            key={k.value}
            size="small"
            variant="outlined"
            startIcon={<InsightsRounded />}
            onClick={() => openNew(k.value)}
          >
            {ARTICLE_KIND_LABEL[k.value]}
          </Button>
        ))}
      </Stack>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <EmptyState
          title="No se pudieron cargar las publicaciones"
          description="Reintentá en un momento."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={articles.length ? 'Nada con ese filtro' : 'Todavía no hay publicaciones'}
          description={
            articles.length
              ? 'Probá con otro tipo o limpiá la búsqueda.'
              : 'Creá la primera ficha técnica de un torneo o escribí una noticia.'
          }
          actionLabel="Nueva publicación"
          onAction={() => openNew()}
        />
      ) : (
        <Card sx={{ p: 2 }}>
          <Stack spacing={1}>
            {visible.map((a) => (
              <ArticleRow key={a.id} a={a} />
            ))}
          </Stack>
        </Card>
      )}

      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar publicación' : 'Nueva publicación'}
        subtitle="Los números de la ficha se congelan al guardar. Después se pueden recalcular."
        width={720}
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
            select
            label="Tipo de publicación"
            value={form.kind}
            onChange={(e) => set('kind', e.target.value as ArticleKind)}
            helperText={KIND_OPTIONS.find((k) => k.value === form.kind)?.help}
            fullWidth
          >
            {KIND_OPTIONS.map((k) => (
              <MenuItem key={k.value} value={k.value}>
                {ARTICLE_KIND_LABEL[k.value]}
              </MenuItem>
            ))}
          </TextField>

          {form.kind === 'EDITION_SHEET' && (
            <TextField
              select
              label="Edición"
              value={form.editionId}
              onChange={(e) => set('editionId', e.target.value)}
              fullWidth
            >
              {editions.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.name} · {e.year}
                </MenuItem>
              ))}
            </TextField>
          )}

          {form.kind === 'COMPETITION_SHEET' && (
            <TextField
              select
              label="Torneo"
              value={form.competitionId}
              onChange={(e) => set('competitionId', e.target.value)}
              fullWidth
            >
              {competitions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {form.kind === 'TEAM_SHEET' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                label="Equipo"
                value={form.teamId}
                onChange={(e) => set('teamId', e.target.value)}
                fullWidth
              >
                {teams.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Año"
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
                helperText="Vacío = toda su historia"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todos los años</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={String(y)}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}

          <TextField
            label="Titular"
            fullWidth
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            helperText="Es lo que se lee grande en el listado del sitio."
          />

          <TextField
            label="Bajada (opcional)"
            fullWidth
            multiline
            minRows={2}
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            helperText="Dos líneas que resumen la nota. Se muestran en la tarjeta del listado."
          />

          <ImageUpload
            value={form.coverUrl}
            onChange={(v) => set('coverUrl', v)}
            label="Subir portada"
            hint="Se muestra arriba de la nota y en el listado. Horizontal, 1200×675 va bien."
          />

          <TextField
            label="Cuerpo de la nota"
            fullWidth
            multiline
            minRows={6}
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            helperText="Texto libre. Los saltos de línea se respetan tal cual."
          />

          <Divider textAlign="left">
            <Typography variant="caption" color="text.secondary">
              Publicación
            </Typography>
          </Divider>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.status === 'PUBLISHED'}
                  onChange={(e) => set('status', e.target.checked ? 'PUBLISHED' : 'DRAFT')}
                />
              }
              label={form.status === 'PUBLISHED' ? 'Publicada' : 'Borrador'}
            />
            <FormControlLabel
              control={
                <Switch checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              }
              label="Destacar en la portada del apartado"
            />
          </Stack>

          {isSheet(form.kind) && (
            <>
              <Divider textAlign="left">
                <Typography variant="caption" color="text.secondary">
                  Ficha técnica
                </Typography>
              </Divider>

              {!subjectId ? (
                <Alert severity="info">
                  Elegí la entidad y acá abajo aparece la ficha con la que va a salir la nota.
                </Alert>
              ) : preview.isLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Calculando la ficha…
                  </Typography>
                </Stack>
              ) : preview.error ? (
                <Alert severity="error">{extractErrorMessage(preview.error)}</Alert>
              ) : preview.data ? (
                <FactSheetView sheet={preview.data} compact />
              ) : null}
            </>
          )}
        </Stack>
      </AppDrawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove.mutateAsync(deleting.id);
          setDeleting(null);
          toast.success('Publicación eliminada');
        }}
        title="¿Eliminar publicación?"
        message={`Se borra "${deleting?.title ?? ''}" del sitio. No hay vuelta atrás.`}
        loading={remove.isPending}
      />
    </Box>
  );
};

export default AdminNews;
