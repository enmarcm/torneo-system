import { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  Button,
  Chip,
  Avatar,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  BlockRounded,
  LockOpenRounded,
  GppMaybeRounded,
  HistoryRounded,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppModal } from '@/components/ui/AppModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useTeamBlocksQuery,
  useTeamsQuery,
  useCompetitionsQuery,
  type Team,
  type Competition,
  type TeamBlock,
} from '@/hooks/queries';
import { useBlockTeam, useLiftTeamBlock } from '@/hooks/mutations';
import { extractErrorMessage } from '@/api/axios';
import { formatDateTime } from '@/utils/formatDate';
import { getStatusLabel } from '@/utils/statusLabels';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';

const AdminTeamBlocks: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [open, setOpen] = useState(false);
  const [toLift, setToLift] = useState<TeamBlock | null>(null);
  const [liftReason, setLiftReason] = useState('');

  const [form, setForm] = useState<{
    teamId: string;
    scope: 'CLUB' | 'COMPETITION';
    competitionId: string;
    reason: string;
  }>({ teamId: '', scope: 'CLUB', competitionId: '', reason: '' });

  const { data: blocks = [], isLoading } = useTeamBlocksQuery({
    active: tab === 'active' ? true : undefined,
  });
  const { data: teams = [] } = useTeamsQuery();
  const { data: competitions = [] } = useCompetitionsQuery();

  const blockTeam = useBlockTeam();
  const liftBlock = useLiftTeamBlock();

  const submit = async () => {
    try {
      await blockTeam.mutateAsync({
        teamId: form.teamId,
        scope: form.scope,
        competitionId: form.scope === 'COMPETITION' ? form.competitionId : undefined,
        reason: form.reason,
      });
      enqueueSnackbar('Equipo bloqueado', { variant: 'success' });
      setOpen(false);
      setForm({ teamId: '', scope: 'CLUB', competitionId: '', reason: '' });
    } catch (err) {
      enqueueSnackbar(extractErrorMessage(err), { variant: 'error' });
    }
  };

  const confirmLift = async () => {
    if (!toLift) return;
    try {
      await liftBlock.mutateAsync({ id: toLift.id, liftReason: liftReason || undefined });
      enqueueSnackbar('Bloqueo levantado, el equipo vuelve a estar habilitado', {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar(extractErrorMessage(err), { variant: 'error' });
    } finally {
      setToLift(null);
      setLiftReason('');
    }
  };

  const canSubmit =
    !!form.teamId &&
    form.reason.trim().length >= 3 &&
    (form.scope === 'CLUB' || !!form.competitionId);

  return (
    <Box>
      <PageHeader
        title="Bloqueo de equipos"
        subtitle="Los equipos nunca se eliminan: se bloquean y conservan todo su historial para poder reincorporarlos."
        action={
          <Button variant="contained" startIcon={<BlockRounded />} onClick={() => setOpen(true)}>
            Bloquear equipo
          </Button>
        }
      />

      <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
        Un <strong>bloqueo de club</strong> deja al equipo fuera de todo y su líder no puede iniciar
        sesión. Un <strong>bloqueo por competición</strong> solo lo saca de ese torneo: como un club
        puede tener equipos en varias categorías a la vez, el resto sigue jugando normalmente.
      </Alert>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="active" label="Bloqueos activos" sx={{ textTransform: 'none' }} />
        <Tab
          value="history"
          label="Historial completo"
          icon={<HistoryRounded sx={{ fontSize: 16 }} />}
          iconPosition="start"
          sx={{ textTransform: 'none' }}
        />
      </Tabs>

      {isLoading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : blocks.length === 0 ? (
        <EmptyState
          icon={<GppMaybeRounded />}
          title={tab === 'active' ? 'Sin bloqueos activos' : 'Sin registros de bloqueo'}
          description="Cuando bloquees un equipo aparecerá acá con su motivo y su historial."
        />
      ) : (
        <Stack spacing={1.5}>
          {blocks.map((b: TeamBlock) => (
            <Card key={b.id} sx={{ p: 2.5, opacity: b.active ? 1 : 0.72 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ md: 'center' }}
              >
                <Avatar src={b.team.logoUrl ?? undefined} sx={{ width: 44, height: 44 }}>
                  {b.team.name[0]}
                </Avatar>

                <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ fontWeight: 700 }}>{b.team.name}</Typography>
                    <Chip
                      size="small"
                      color={b.scope === 'CLUB' ? 'error' : 'warning'}
                      variant="outlined"
                      label={getStatusLabel(b.scope)}
                    />
                    {b.competition && (
                      <Chip size="small" variant="outlined" label={b.competition.name} />
                    )}
                    {!b.active && <Chip size="small" color="success" label="Levantado" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {b.reason}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Bloqueado el {formatDateTime(b.createdAt)}
                    {b.blockedBy ? ` por ${b.blockedBy.email}` : ''}
                    {b.liftedAt
                      ? ` · Levantado el ${formatDateTime(b.liftedAt)}${
                          b.liftedBy ? ` por ${b.liftedBy.email}` : ''
                        }`
                      : ''}
                  </Typography>
                  {b.liftReason && (
                    <Typography variant="caption" color="text.secondary">
                      Motivo al levantar: {b.liftReason}
                    </Typography>
                  )}
                </Stack>

                {b.active && (
                  <Tooltip title="Levantar el bloqueo y rehabilitar al equipo">
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<LockOpenRounded />}
                      onClick={() => setToLift(b)}
                    >
                      Levantar
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title="Bloquear equipo"
        subtitle="El equipo no se elimina: queda bloqueado y se puede rehabilitar cuando quieras."
        maxWidth={520}
      >
        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Equipo"
            value={form.teamId}
            onChange={(e) => setForm({ ...form, teamId: e.target.value })}
          >
            {teams.map((t: Team) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label="Alcance del bloqueo"
            value={form.scope}
            onChange={(e) =>
              setForm({ ...form, scope: e.target.value as 'CLUB' | 'COMPETITION' })
            }
            helperText={
              form.scope === 'CLUB'
                ? 'Queda fuera de todas las competiciones y su líder no podrá iniciar sesión.'
                : 'Solo queda fuera de la competición elegida; sus otros equipos siguen jugando.'
            }
          >
            <MenuItem value="CLUB">Club completo</MenuItem>
            <MenuItem value="COMPETITION">Solo una competición</MenuItem>
          </TextField>

          {form.scope === 'COMPETITION' && (
            <TextField
              select
              fullWidth
              size="small"
              label="Competición"
              value={form.competitionId}
              onChange={(e) => setForm({ ...form, competitionId: e.target.value })}
            >
              {competitions.map((c: Competition) => (
                <MenuItem key={c.id} value={c.id}>
                  {getCompetitionShortLabel(c)}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            label="Motivo"
            placeholder="Ej: agresión al árbitro en la fecha 7"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            helperText="Queda registrado en el historial junto a quién lo aplicó."
          />

          <Divider />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color="error"
              onClick={submit}
              disabled={!canSubmit || blockTeam.isPending}
            >
              Bloquear
            </Button>
          </Stack>
        </Stack>
      </AppModal>

      <AppModal
        open={!!toLift}
        onClose={() => {
          setToLift(null);
          setLiftReason('');
        }}
        title="Levantar bloqueo"
        subtitle={`${toLift?.team.name ?? ''} volverá a estar habilitado. El registro del bloqueo se conserva en el historial.`}
        maxWidth={440}
      >
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Motivo (opcional)"
            placeholder="Ej: sanción cumplida"
            value={liftReason}
            onChange={(e) => setLiftReason(e.target.value)}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              onClick={() => {
                setToLift(null);
                setLiftReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={confirmLift}
              disabled={liftBlock.isPending}
            >
              Levantar bloqueo
            </Button>
          </Stack>
        </Stack>
      </AppModal>
    </Box>
  );
};

export default AdminTeamBlocks;
