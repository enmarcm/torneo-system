import { useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Divider,
} from '@mui/material';
import {
  AddRounded,
  DeleteOutlineRounded,
  VerifiedRounded,
  VerifiedOutlined,
  RestoreRounded,
  HistoryRounded,
} from '@mui/icons-material';
import { usePlayersQuery, useRosterQuery, usePreviousRosterQuery } from '@/hooks/queries';
import {
  useAddRoster,
  useUpdateRoster,
  useRemoveRoster,
  useSetEligibility,
  useImportPreviousRoster,
} from '@/hooks/mutations';
import { useToast } from '@/hooks/common/useToast';
import { extractErrorMessage } from '@/api/axios';
import { RosterSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  registrationId: string;
  /** Cupo máximo de la competición, para avisar antes de que el servidor rechace. */
  maxPlayers?: number;
  /** Con `false` se ocultan los controles de habilitación, que son solo del admin. */
  canApproveEligibility?: boolean;
}

/**
 * Plantilla de un equipo en una competición: quién está inscrito, con qué dorsal
 * y si está habilitado. La usa el panel del administrador, que hasta ahora solo
 * podía ver cuántos jugadores había sin poder tocar la lista.
 */
export const RosterEditor: React.FC<Props> = ({
  registrationId,
  maxPlayers,
  canApproveEligibility = true,
}) => {
  const { data: roster = [], isLoading } = useRosterQuery(registrationId);
  const [search, setSearch] = useState('');
  /* Lo que quedó afuera en la última importación, para poder resolverlo a mano. */
  const [skipped, setSkipped] = useState<Array<{ name: string; reason: string }> | null>(null);
  const { data: candidates = [] } = usePlayersQuery(search.trim() || undefined);
  const add = useAddRoster();
  const update = useUpdateRoster();
  const remove = useRemoveRoster();
  const setEligibility = useSetEligibility();
  const importPrevious = useImportPreviousRoster();
  const { data: previous } = usePreviousRosterQuery(registrationId);
  const toast = useToast();

  const active = roster.filter((r) => r.status === 'ACTIVE');
  const inactive = roster.filter((r) => r.status !== 'ACTIVE');
  const full = maxPlayers != null && active.length >= maxPlayers;

  /* Un jugador que ya está en la plantilla no se vuelve a ofrecer. */
  const inRoster = useMemo(() => new Set(roster.map((r) => r.playerId)), [roster]);
  const results = useMemo(
    () => candidates.filter((p) => !inRoster.has(p.id)).slice(0, 8),
    [candidates, inRoster],
  );

  const addPlayer = async (playerId: string) => {
    try {
      await add.mutateAsync({ registrationId, data: { playerId } });
      setSearch('');
      toast.success('Jugador agregado a la plantilla');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const setJersey = async (id: string, value: string) => {
    const n = Number(value);
    if (!value || Number.isNaN(n)) return;
    try {
      await update.mutateAsync({ id, data: { jerseyNumber: n } });
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const drop = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Jugador dado de baja de la plantilla');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const restore = async (id: string) => {
    try {
      await update.mutateAsync({ id, data: { status: 'ACTIVE' } });
      toast.success('Jugador reincorporado');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  /*
    Traer la plantilla del torneo anterior. Es un botón y no algo automático:
    quién juega el torneo que viene es una decisión del equipo, no un arrastre
    del anterior. Lo que no entra (edad, cupo, ya cargado) se dice, no se
    descarta en silencio.
  */
  const bringPrevious = async () => {
    try {
      const res = await importPrevious.mutateAsync(registrationId);
      if (res.added.length === 0) {
        toast.error('No se pudo traer a nadie. Revisá los motivos en la lista.');
      } else {
        toast.success(
          `${res.added.length} ${res.added.length === 1 ? 'jugador traído' : 'jugadores traídos'}` +
            (res.skipped.length > 0 ? ` · ${res.skipped.length} sin traer` : ''),
        );
      }
      if (res.skipped.length > 0) setSkipped(res.skipped);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  if (isLoading) return <RosterSkeleton rows={4} />;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {active.length} {active.length === 1 ? 'jugador' : 'jugadores'} en plantilla
        {maxPlayers != null ? ` · cupo ${maxPlayers}` : ''}
      </Typography>

      {/*
        Solo se ofrece cuando hay algo real para traer: un botón que no puede
        hacer nada es peor que no tenerlo.
      */}
      {previous && previous.importable > 0 && !full && (
        <Alert
          severity="info"
          icon={<HistoryRounded />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={bringPrevious}
              disabled={importPrevious.isPending}
            >
              {importPrevious.isPending ? 'Trayendo…' : 'Traer'}
            </Button>
          }
        >
          Este equipo jugó {previous.source.competitionName}
          {previous.source.editionName ? ` · ${previous.source.editionName}` : ''} con{' '}
          {previous.players.length}{' '}
          {previous.players.length === 1 ? 'jugador' : 'jugadores'}. Podés traer{' '}
          {previous.importable} de una vez y después quitar a los que no siguen.
        </Alert>
      )}

      {skipped && skipped.length > 0 && (
        <Alert severity="warning" onClose={() => setSkipped(null)}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            No se trajeron {skipped.length}:
          </Typography>
          {skipped.map((sk) => (
            <Typography key={sk.name} variant="caption" sx={{ display: 'block' }}>
              {sk.name} — {sk.reason}
            </Typography>
          ))}
        </Alert>
      )}

      {full && (
        <Alert severity="warning">
          La plantilla llegó al cupo de la competición. Para agregar a alguien más, primero dá de
          baja a otro jugador.
        </Alert>
      )}

      {/*
        Se busca por cédula o por nombre: el documento es lo único que no se
        repite entre homónimos, y es como la liga identifica al jugador.
      */}
      <TextField
        size="small"
        fullWidth
        label="Agregar jugador"
        placeholder="Buscá por cédula o nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={full}
      />

      {search.trim().length > 0 && (
        <Stack spacing={0.5}>
          {results.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              Sin jugadores para esa búsqueda. Si es nuevo, registralo primero en Jugadores.
            </Typography>
          ) : (
            results.map((p) => (
              <Stack
                key={p.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ p: 1, borderRadius: 2, '&:hover': { bgcolor: 'background.default' } }}
              >
                <Avatar src={p.photoUrl ?? undefined} sx={{ width: 30, height: 30, fontSize: 12 }}>
                  {p.firstName[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                    {p.firstName} {p.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.documentType === 'CEDULA' ? 'C.I.' : 'P.N.'} {p.documentNumber}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<AddRounded />}
                  onClick={() => addPlayer(p.id)}
                  disabled={add.isPending || full}
                >
                  Agregar
                </Button>
              </Stack>
            ))
          )}
        </Stack>
      )}

      <Divider />

      {active.length === 0 ? (
        <EmptyState
          variant="bench"
          compact
          seats={5}
          filled={0}
          title="Esta plantilla todavía no tiene jugadores"
          description="Sumá jugadores desde el buscador de arriba; cada uno ocupa un asiento."
        />
      ) : (
        <Stack spacing={0.5}>
          {active.map((r) => (
            <Stack
              key={r.id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <Avatar
                src={r.player.photoUrl ?? undefined}
                sx={{ width: 32, height: 32, fontSize: 13 }}
              >
                {r.player.firstName[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                  {r.player.firstName} {r.player.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  C.I. {r.player.documentNumber}
                </Typography>
              </Box>
              <TextField
                size="small"
                type="number"
                label="Dorsal"
                defaultValue={r.jerseyNumber ?? ''}
                onBlur={(e) => setJersey(r.id, e.target.value)}
                sx={{ width: 90 }}
                InputLabelProps={{ shrink: true }}
              />
              {canApproveEligibility ? (
                <Tooltip title={r.eligibilityApproved ? 'Habilitado' : 'Sin habilitar'}>
                  <IconButton
                    size="small"
                    color={r.eligibilityApproved ? 'success' : 'default'}
                    onClick={() =>
                      setEligibility.mutate({ id: r.id, approved: !r.eligibilityApproved })
                    }
                  >
                    {r.eligibilityApproved ? (
                      <VerifiedRounded fontSize="small" />
                    ) : (
                      <VerifiedOutlined fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              ) : (
                <Chip
                  size="small"
                  variant="outlined"
                  color={r.eligibilityApproved ? 'success' : 'default'}
                  label={r.eligibilityApproved ? 'Habilitado' : 'Sin habilitar'}
                />
              )}
              <Tooltip title="Dar de baja de esta plantilla">
                <IconButton size="small" color="error" onClick={() => drop(r.id)}>
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}

      {/*
        Los dados de baja no se borran: quedan a la vista para poder
        reincorporarlos, y porque sus goles y tarjetas siguen contando.
      */}
      {inactive.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            Dados de baja ({inactive.length})
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {inactive.map((r) => (
              <Stack
                key={r.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ p: 1, borderRadius: 2, opacity: 0.6 }}
              >
                <Typography sx={{ flex: 1, fontSize: 14 }} noWrap>
                  {r.player.firstName} {r.player.lastName}
                </Typography>
                <Button size="small" startIcon={<RestoreRounded />} onClick={() => restore(r.id)}>
                  Reincorporar
                </Button>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};
