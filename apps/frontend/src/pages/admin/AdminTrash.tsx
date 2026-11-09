import { useState } from 'react';
import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import RestoreFromTrashRounded from '@mui/icons-material/RestoreFromTrashRounded';
import DeleteForeverRounded from '@mui/icons-material/DeleteForeverRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/hooks/common/useToast';
import { useDebouncedValue } from '@/hooks/common/useDebouncedValue';
import { trashApi, type TrashItem, type TrashKind } from '@/api/trash.api';
import { extractErrorMessage } from '@/utils/apiErrors';
import { formatDate, formatDateTime } from '@/utils/formatDate';

const KIND_LABEL: Record<TrashKind, string> = {
  EDITION: 'Edición',
  COMPETITION: 'Competición',
  TEAM: 'Equipo',
  PLAYER: 'Jugador',
  USER: 'Usuario',
  MATCH: 'Partido',
  MATCH_EVENT: 'Evento de partido',
  AD: 'Anuncio',
  ARTICLE: 'Noticia',
  LEGAL_PAGE: 'Página legal',
};

const KINDS = Object.keys(KIND_LABEL) as TrashKind[];

/** Tabla del propio elemento: no se cuenta como "lo que se llevó". */
const SELF_TABLE: Record<TrashKind, string> = {
  EDITION: 'edition',
  COMPETITION: 'competition',
  TEAM: 'team',
  PLAYER: 'player',
  USER: 'user',
  MATCH: 'match',
  MATCH_EVENT: 'matchEvent',
  AD: 'advertisement',
  ARTICLE: 'article',
  LEGAL_PAGE: 'legalPage',
};

/** Cada tabla tal como la lee el administrador. */
const TABLE_LABEL: Record<string, string> = {
  edition: 'Ediciones',
  leagueSystem: 'Ligas',
  competition: 'Competiciones',
  competitionGroup: 'Grupos',
  team: 'Equipos',
  user: 'Cuentas',
  player: 'Jugadores',
  teamRegistration: 'Inscripciones',
  knockoutTie: 'Llaves',
  rosterEntry: 'Fichajes en plantillas',
  playerSeasonStats: 'Estadísticas',
  match: 'Partidos',
  matchEvent: 'Eventos',
  matchAttendance: 'Asistencias',
  transfer: 'Traspasos',
  teamBlock: 'Bloqueos',
  advertisement: 'Anuncios',
  article: 'Noticias',
  legalPage: 'Páginas',
};

/** Lo que arrastró además del elemento en sí: "Partidos 12 · Fichajes en plantillas 40". */
const dragged = (item: TrashItem) =>
  Object.entries(item.summary)
    .filter(([table]) => table !== SELF_TABLE[item.kind] && TABLE_LABEL[table])
    .map(([table, n]) => `${TABLE_LABEL[table]} ${n}`);

const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

const AdminTrash: React.FC = () => {
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<TrashKind | undefined>();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [purging, setPurging] = useState<TrashItem | null>(null);
  const [emptying, setEmptying] = useState(false);

  const query = useQuery({
    queryKey: ['trash', kind ?? 'all', debounced],
    queryFn: () => trashApi.list({ kind, search: debounced || undefined }),
    // Se borra desde muchas pantallas: al entrar siempre se pide de nuevo.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const restore = useMutation({
    mutationFn: (item: TrashItem) => trashApi.restore(item.id),
    // Lo restaurado reaparece en listados de cualquier sección: se refresca todo.
    onSuccess: async (_d, item) => {
      await qc.invalidateQueries();
      toast.success(`${KIND_LABEL[item.kind]} restaurado: ${item.label}`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const purge = useMutation({
    mutationFn: (item: TrashItem) => trashApi.purge(item.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['trash'] });
      setPurging(null);
      toast.success('Eliminado definitivamente');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const empty = useMutation({
    mutationFn: () => trashApi.empty(kind),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['trash'] });
      setEmptying(false);
      toast.success('Papelera vaciada');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const items = query.data?.items ?? [];
  const counts = query.data?.counts ?? {};
  const totalAll = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const scope = kind ? `de tipo ${KIND_LABEL[kind].toLowerCase()}` : 'de la papelera';

  return (
    <Box>
      <PageHeader
        title="Papelera"
        subtitle="Lo que se elimina queda aquí 30 días con todo lo que arrastró. Restaurarlo lo deja como estaba."
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar en la papelera…' }}
        action={
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteForeverRounded />}
            disabled={items.length === 0}
            onClick={() => setEmptying(true)}
          >
            Vaciar
          </Button>
        }
      />

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label={`Todo (${totalAll})`}
          color={kind ? 'default' : 'primary'}
          variant={kind ? 'outlined' : 'filled'}
          onClick={() => setKind(undefined)}
        />
        {KINDS.filter((k) => counts[k]).map((k) => (
          <Chip
            key={k}
            label={`${KIND_LABEL[k]} (${counts[k]})`}
            color={kind === k ? 'primary' : 'default'}
            variant={kind === k ? 'filled' : 'outlined'}
            onClick={() => setKind(k)}
          />
        ))}
      </Stack>

      <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <EmptyState
            variant="inbox"
            title={debounced || kind ? 'Nada coincide' : 'La papelera está vacía'}
            description={
              debounced || kind
                ? 'Prueba con otro filtro o búsqueda.'
                : 'Cuando elimines una edición, equipo, jugador, partido o noticia, aparecerá aquí para poder recuperarlo.'
            }
          />
        ) : (
          <Stack spacing={1}>
            {items.map((item) => {
              const extra = dragged(item);
              const busy = restore.isPending && restore.variables?.id === item.id;
              return (
                <Stack
                  key={item.id}
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={{ xs: 1.5, md: 2 }}
                  alignItems={{ md: 'center' }}
                  sx={{ p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'background.default' } }}
                >
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                      <Chip size="small" variant="outlined" color="primary" label={KIND_LABEL[item.kind]} />
                      <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    {item.detail && (
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {item.detail}
                      </Typography>
                    )}
                    {extra.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Se llevó: {extra.join(' · ')}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Eliminado el {formatDateTime(item.createdAt)}
                      {item.deletedByName ? ` por ${item.deletedByName}` : ''} · se borra del todo el{' '}
                      {formatDate(item.expiresAt)} ({daysLeft(item.expiresAt)} d)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <Button
                      variant="contained"
                      startIcon={<RestoreFromTrashRounded />}
                      disabled={restore.isPending}
                      onClick={() => restore.mutate(item)}
                    >
                      {busy ? 'Restaurando…' : 'Restaurar'}
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteForeverRounded />}
                      disabled={restore.isPending}
                      onClick={() => setPurging(item)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Card>

      <ConfirmDialog
        open={!!purging}
        onClose={() => setPurging(null)}
        onConfirm={() => purging && purge.mutate(purging)}
        title="Eliminar definitivamente"
        message={`«${purging?.label ?? ''}» se borra para siempre y ya no se podrá restaurar.`}
        confirmLabel="Eliminar para siempre"
        loading={purge.isPending}
        error={purge.isError}
      />
      <ConfirmDialog
        open={emptying}
        onClose={() => setEmptying(false)}
        onConfirm={() => empty.mutate()}
        title="Vaciar"
        message={`Se borran para siempre ${kind ? (counts[kind] ?? 0) : totalAll} elemento(s) ${scope}. Ya no se podrán restaurar.`}
        confirmLabel="Vaciar"
        loading={empty.isPending}
        error={empty.isError}
      />
    </Box>
  );
};

export default AdminTrash;
