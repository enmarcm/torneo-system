import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SaveButton } from '@/components/ui/SaveButton';
import { useLegalPagesQuery, useSiteSettingsQuery } from '@/hooks/queries';
import {
  useCreateLegalPage,
  useDeleteLegalPage,
  useUpdateLegalPage,
  useUpdateSiteSettings,
} from '@/hooks/mutations';
import { useToast } from '@/hooks/common/useToast';
import { extractErrorMessage } from '@/api/axios';
import { legalPath } from '@/routes/routes';
import type { LegalPage, SiteSettings } from '@/api/site.api';

/* ───────────────────────── Datos de la empresa ───────────────────────── */

type Field = {
  key: keyof SiteSettings;
  label: string;
  helper?: string;
  placeholder?: string;
  multiline?: boolean;
};

const SECTIONS: { title: string; subtitle: string; fields: Field[] }[] = [
  {
    title: 'Identidad',
    subtitle: 'El nombre y la frase que acompañan al logo en el pie del sitio.',
    fields: [
      { key: 'siteName', label: 'Nombre de la liga', helper: 'También se usa en los textos legales.' },
      { key: 'tagline', label: 'Frase del pie', multiline: true },
    ],
  },
  {
    title: 'Datos de la empresa',
    subtitle: 'Quién opera el sitio. La razón social y el documento fiscal salen en el aviso legal y la política de privacidad.',
    fields: [
      { key: 'legalName', label: 'Razón social', helper: 'Si lo dejas vacío se usa el nombre de la liga.' },
      { key: 'taxId', label: 'Documento fiscal (RIF)', placeholder: 'J-00000000-0' },
      { key: 'address', label: 'Dirección o sede' },
    ],
  },
  {
    title: 'Contacto',
    subtitle: 'Lo que se muestra en el pie. Un campo vacío no se muestra.',
    fields: [
      { key: 'phone', label: 'Teléfono' },
      { key: 'email', label: 'Correo de contacto', helper: 'También es el correo que los textos legales dan para solicitudes de datos.' },
      { key: 'schedule', label: 'Horario' },
    ],
  },
  {
    title: 'Redes sociales',
    subtitle: 'Cada una aparece como icono en el pie solo si tiene dirección.',
    fields: [
      { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/…' },
      { key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/…' },
      { key: 'tiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
      { key: 'whatsapp', label: 'WhatsApp', helper: 'Con código de país, ej: +58 412 0000000.' },
    ],
  },
];

const CompanyTab: React.FC = () => {
  const { data, isLoading, error, refetch } = useSiteSettingsQuery();
  const update = useUpdateSiteSettings();
  const toast = useToast();
  const [form, setForm] = useState<SiteSettings | null>(null);

  // Se copia una vez que llega: el formulario edita su propia copia, no la caché.
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const dirty = useMemo(
    () => !!data && !!form && (Object.keys(data) as (keyof SiteSettings)[]).some((k) => data[k] !== form[k]),
    [data, form],
  );

  if (isLoading || !form) return <LoadingState rows={4} />;
  if (error) {
    return (
      <EmptyState
        title="No se pudo cargar la configuración"
        description="Reintenta en un momento."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  const submit = async () => {
    try {
      await update.mutateAsync(form);
      toast.success('Configuración guardada');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Stack spacing={2}>
      {SECTIONS.map((section) => (
        <Card key={section.title} sx={{ p: { xs: 2, md: 3 } }}>
          <Typography sx={{ fontWeight: 800 }}>{section.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {section.subtitle}
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {section.fields.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                helperText={f.helper}
                placeholder={f.placeholder}
                multiline={f.multiline}
                minRows={f.multiline ? 2 : undefined}
                fullWidth
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                sx={f.multiline ? { gridColumn: { md: '1 / -1' } } : undefined}
              />
            ))}
          </Box>
        </Card>
      ))}

      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
        {dirty && (
          <Typography variant="body2" color="text.secondary">
            Hay cambios sin guardar
          </Typography>
        )}
        <SaveButton onClick={submit} loading={update.isPending} error={update.isError} disabled={!dirty || !form.siteName.trim()}>
          Guardar cambios
        </SaveButton>
      </Stack>
    </Stack>
  );
};

/* ───────────────────────── Páginas legales ───────────────────────── */

interface LegalForm {
  slug: string;
  title: string;
  body: string;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
}

const EMPTY_LEGAL: LegalForm = {
  slug: '',
  title: '',
  body: '',
  published: true,
  showInFooter: true,
  sortOrder: 0,
};

/** "Política de Privacidad" → "politica-de-privacidad": el enlace sugerido a partir del título. */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const LegalTab: React.FC = () => {
  const { data: pages = [], isLoading, error, refetch } = useLegalPagesQuery();
  const create = useCreateLegalPage();
  const update = useUpdateLegalPage();
  const remove = useDeleteLegalPage();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LegalPage | null>(null);
  const [form, setForm] = useState<LegalForm>(EMPTY_LEGAL);
  // Mientras el admin no toque el enlace a mano, sigue al título.
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleting, setDeleting] = useState<LegalPage | null>(null);

  const set = <K extends keyof LegalForm>(key: K, value: LegalForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_LEGAL, sortOrder: pages.length + 1 });
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (page: LegalPage) => {
    setEditing(page);
    setForm({
      slug: page.slug,
      title: page.title,
      body: page.body,
      published: page.published,
      showInFooter: page.showInFooter,
      sortOrder: page.sortOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const { slug, ...rest } = form;
      const payload = { ...rest, title: rest.title.trim(), sortOrder: Number(rest.sortOrder) || 0 };
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync({ ...payload, slug });
      setOpen(false);
      toast.success(editing ? 'Página actualizada' : 'Página creada');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const canSubmit = !!form.title.trim() && (!!editing || form.slug.length >= 2);

  if (isLoading) return <LoadingState rows={4} />;
  if (error) {
    return (
      <EmptyState
        title="No se pudieron cargar las páginas legales"
        description="Reintenta en un momento."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info" sx={{ alignItems: 'center' }}>
        Los textos que vienen por defecto son una base redactada según lo que hace el sitio. Antes de
        publicarlos de forma definitiva, conviene que los revise un abogado.
      </Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Las que estén publicadas y marcadas para el pie aparecen como enlaces al final del sitio.
        </Typography>
        <Button variant="contained" startIcon={<AddRounded />} onClick={openNew} sx={{ flexShrink: 0 }}>
          Nueva página
        </Button>
      </Stack>

      {pages.length === 0 ? (
        <EmptyState
          title="No hay páginas legales"
          description="Crea los términos, la política de privacidad y lo que necesite el sitio."
          actionLabel="Nueva página"
          onAction={openNew}
        />
      ) : (
        <Stack spacing={1}>
          {pages.map((p) => (
            <Card key={p.id} sx={{ p: 1.5, opacity: p.published ? 1 : 0.7 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {p.title}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={p.published ? 'success' : 'default'}
                      label={p.published ? 'Publicada' : 'Borrador'}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                    {p.published && p.showInFooter && (
                      <Chip size="small" variant="outlined" label="En el pie" sx={{ height: 20, fontSize: 11 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {legalPath(p.slug)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                  {p.published && (
                    <Tooltip title="Ver en el sitio">
                      <IconButton size="small" component="a" href={legalPath(p.slug)} target="_blank" rel="noreferrer">
                        <OpenInNewRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => openEdit(p)} aria-label={`Editar ${p.title}`}>
                      <EditRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => setDeleting(p)} aria-label={`Eliminar ${p.title}`}>
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar página' : 'Nueva página'}
        subtitle="Texto plano: una línea que empieza con ## es un título de sección, y con - una viñeta."
        width={640}
        footer={
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <SaveButton
              onClick={submit}
              loading={create.isPending || update.isPending}
              error={create.isError || update.isError}
              disabled={!canSubmit}
            >
              {editing ? 'Guardar' : 'Crear'}
            </SaveButton>
          </Stack>
        }
      >
        <Stack spacing={2.5}>
          <TextField
            label="Título"
            fullWidth
            value={form.title}
            onChange={(e) => {
              set('title', e.target.value);
              if (!editing && !slugTouched) set('slug', slugify(e.target.value));
            }}
          />
          <TextField
            label="Enlace"
            fullWidth
            disabled={!!editing}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set('slug', slugify(e.target.value));
            }}
            helperText={
              editing
                ? 'No se puede cambiar: los enlaces ya compartidos dejarían de funcionar.'
                : `Quedará en ${form.slug ? legalPath(form.slug) : '/legal/…'}`
            }
          />
          <TextField
            label="Contenido"
            fullWidth
            multiline
            minRows={14}
            maxRows={28}
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            helperText="Marcadores disponibles: {{siteName}} {{legalName}} {{taxId}} {{address}} {{phone}} {{email}}. Se reemplazan con los datos de la pestaña Datos de la empresa."
            slotProps={{ htmlInput: { style: { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 14 } } }}
          />
          <Stack>
            <FormControlLabel
              control={<Switch checked={form.published} onChange={(e) => set('published', e.target.checked)} />}
              label="Publicada (visible al público)"
            />
            <FormControlLabel
              control={<Switch checked={form.showInFooter} onChange={(e) => set('showInFooter', e.target.checked)} />}
              label="Mostrar enlace en el pie del sitio"
            />
          </Stack>
          <TextField
            label="Orden en el pie"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
            helperText="Los números menores aparecen primero."
            sx={{ maxWidth: 200 }}
          />
        </Stack>
      </AppDrawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success('Página eliminada');
          } catch (e) {
            toast.error(extractErrorMessage(e));
          }
          setDeleting(null);
        }}
        title="¿Eliminar página legal?"
        message={`Se borrará "${deleting?.title ?? ''}" y su enlace dejará de funcionar. Si solo quieres ocultarla, pásala a borrador.`}
        loading={remove.isPending}
        error={remove.isError}
      />
    </Stack>
  );
};

/* ───────────────────────── Pantalla ───────────────────────── */

const AdminSettings: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Configuración"
        subtitle="Los datos de la liga que aparecen en el pie del sitio y los documentos legales."
      />
      <Tabs value={tab} onChange={(_e, v: number) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Datos de la empresa" />
        <Tab label="Páginas legales" />
      </Tabs>
      {tab === 0 ? <CompanyTab /> : <LegalTab />}
    </Box>
  );
};

export default AdminSettings;
