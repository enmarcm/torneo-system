import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button, Tabs, Tab, Avatar, TextField, MenuItem, Alert } from '@mui/material';
import { AppModal } from '@/components/ui/AppModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowBackRounded, GroupsRounded, SportsSoccerRounded, TableChartRounded } from '@mui/icons-material';
import { useCompetitionQuery, useStandingsQuery, useMatchesQuery } from '@/hooks/queries';
import { useSetRegistrationOutcome } from '@/hooks/mutations';
import { useToast } from '@/hooks/common/useToast';
import { extractErrorMessage } from '@/api/axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { MatchCard } from '@/components/sport/MatchCard';
import { ROUTES } from '@/routes/routes';
import { getStatusLabel } from '@/utils/statusLabels';

type Outcome = 'NONE' | 'PROMOTED' | 'RELEGATED' | 'WITHDRAWN';

/**
 * Mover un equipo de división es una decisión de peso y no se puede deshacer
 * sola: arrastra su inscripción, su plantilla y su historial a otra categoría.
 * Por eso cada cambio pasa por una confirmación explícita que dice qué implica.
 */
const OUTCOME_CONFIRM: Record<
  Exclude<Outcome, 'NONE'>,
  { title: string; consequence: string; color: 'success' | 'error' | 'warning' }
> = {
  PROMOTED: {
    title: 'Confirmar ascenso',
    consequence:
      'El equipo sube de división para la próxima edición. Vas a tener que inscribirlo en la división de arriba cuando la crees.',
    color: 'success',
  },
  RELEGATED: {
    title: 'Confirmar descenso',
    consequence:
      'El equipo baja de división para la próxima edición. Vas a tener que inscribirlo en la división de abajo cuando la crees.',
    color: 'error',
  },
  WITHDRAWN: {
    title: 'Confirmar que no participa',
    consequence:
      'El equipo queda fuera de la próxima edición. No se borra nada: su historial y sus estadísticas se conservan para poder reincorporarlo más adelante.',
    color: 'warning',
  },
};

const AdminCompetitionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const { data: comp, isLoading } = useCompetitionQuery(id!);
  const { data: standings = [] } = useStandingsQuery(id ?? '');
  const { data: matches = [] } = useMatchesQuery(id);
  const setOutcome = useSetRegistrationOutcome();
  const toast = useToast();

  const compTeams = (comp as any)?.registrations ?? [];

  // Movimiento pendiente de confirmar. Nada se guarda hasta que el admin acepta.
  const [pendingMove, setPendingMove] = useState<{
    registrationId: string;
    teamName: string;
    outcome: Outcome;
  } | null>(null);
  const [moveNote, setMoveNote] = useState('');

  const requestOutcome = (registrationId: string, teamName: string, outcome: Outcome) => {
    // Volver a "sin decisión" no mueve a nadie, así que no necesita confirmación.
    if (outcome === 'NONE') {
      void applyOutcome(registrationId, 'NONE');
      return;
    }
    setMoveNote('');
    setPendingMove({ registrationId, teamName, outcome });
  };

  const applyOutcome = async (registrationId: string, outcome: Outcome, note?: string) => {
    try {
      await setOutcome.mutateAsync({ registrationId, outcome, outcomeNote: note || undefined });
      toast.success('Decisión registrada');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const confirmMove = async () => {
    if (!pendingMove) return;
    await applyOutcome(pendingMove.registrationId, pendingMove.outcome, moveNote);
    setPendingMove(null);
    setMoveNote('');
  };

  if (isLoading) return <Typography color="text.secondary">Cargando…</Typography>;
  if (!comp) return <Typography color="text.secondary">Competición no encontrada.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.competitions)} sx={{ mb: 2 }}>
        Volver a competiciones
      </Button>
      <PageHeader
        title={comp.name}
        subtitle={`${comp.category?.name ?? 'Sin categoría'} · ${getStatusLabel(comp.format)}`}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <StatusBadge status={comp.status} />
        {comp.division && <Chip size="small" label={comp.division} variant="outlined" />}
        <Chip size="small" label={`Edad: ${comp.ageMin ?? '—'}-${comp.ageMax ?? '∞'}`} variant="outlined" />
        <Chip size="small" label={`Cupo: ${comp.minPlayers}-${comp.maxPlayers}`} variant="outlined" />
      </Stack>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Equipos" value={comp._count?.registrations ?? 0} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Partidos" value={comp._count?.matches ?? 0} icon={<SportsSoccerRounded />} tint="info" />
        </Grid>
      </Grid>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Tabla" icon={<TableChartRounded />} iconPosition="start" />
        <Tab label="Partidos" icon={<SportsSoccerRounded />} iconPosition="start" />
        <Tab label={`Equipos (${compTeams.length})`} icon={<GroupsRounded />} iconPosition="start" />
      </Tabs>
      {tab === 0 && (
        <>
          {standings.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Sin posiciones aún.</Typography></Card>
          ) : (
            <StandingsTable rows={standings} />
          )}
        </>
      )}
      {tab === 1 && (
        <>
          <Typography variant="h4" sx={{ mb: 2 }}>Partidos</Typography>
          {matches.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Sin partidos aún.</Typography></Card>
          ) : (
            <Stack spacing={1.5}>
              {matches.map((m) => <MatchCard key={m.id} match={m} />)}
            </Stack>
          )}
        </>
      )}
      {tab === 2 && (
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>Equipos registrados</Typography>
          {compTeams.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No hay equipos registrados.</Typography></Card>
          ) : (
            <Grid container spacing={2}>
              {compTeams.map((r: any) => (
                <Grid size={{ xs: 12, md: 6 }} key={r.id}>
                  <Card sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar src={r.team?.logoUrl ?? undefined} sx={{ width: 40, height: 40, bgcolor: 'primary.soft', color: 'primary.main' }}>
                        {r.team?.name?.[0] ?? '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600 }} noWrap>{r.team?.name ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.roster?.length ?? 0} jugadores</Typography>
                      </Box>
                      <StatusBadge status={r.status} />
                    </Stack>

                    {/* El ascenso, el descenso y la baja los decidís vos, no la tabla. */}
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Decisión de fin de temporada"
                      value={r.outcome ?? 'NONE'}
                      onChange={(e) =>
                        requestOutcome(r.id, r.team?.name ?? 'el equipo', e.target.value as Outcome)
                      }
                      sx={{ mt: 2 }}
                    >
                      <MenuItem value="NONE">Sin decisión</MenuItem>
                      <MenuItem value="PROMOTED">Asciende</MenuItem>
                      <MenuItem value="RELEGATED">Desciende</MenuItem>
                      <MenuItem value="WITHDRAWN">No participa</MenuItem>
                    </TextField>
                    {r.outcomeNote && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {r.outcomeNote}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <AppModal
        open={!!pendingMove}
        onClose={() => setPendingMove(null)}
        title={pendingMove ? OUTCOME_CONFIRM[pendingMove.outcome as Exclude<Outcome, 'NONE'>].title : ''}
        subtitle={pendingMove?.teamName}
        maxWidth={480}
      >
        {pendingMove && (
          <Stack spacing={2}>
            <Alert
              severity={OUTCOME_CONFIRM[pendingMove.outcome as Exclude<Outcome, 'NONE'>].color}
              variant="outlined"
            >
              {OUTCOME_CONFIRM[pendingMove.outcome as Exclude<Outcome, 'NONE'>].consequence}
            </Alert>

            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label="Motivo (opcional)"
              placeholder="Ej: descenso deportivo por posición final"
              value={moveNote}
              onChange={(e) => setMoveNote(e.target.value)}
              helperText="Queda guardado junto a la decisión, para poder justificarla después."
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setPendingMove(null)}>Cancelar</Button>
              <Button
                variant="contained"
                color={OUTCOME_CONFIRM[pendingMove.outcome as Exclude<Outcome, 'NONE'>].color}
                onClick={confirmMove}
                disabled={setOutcome.isPending}
              >
                {setOutcome.isPending ? 'Guardando…' : 'Confirmar'}
              </Button>
            </Stack>
          </Stack>
        )}
      </AppModal>
    </Box>
  );
};

export default AdminCompetitionDetail;
