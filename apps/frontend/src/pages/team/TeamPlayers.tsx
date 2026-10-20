import { useState, useMemo, useEffect } from 'react';
import { SaveButton } from '@/components/ui/SaveButton';
import {
  Box, Card, Typography, Avatar, Chip, Stack, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  PersonRounded,
  FlagRounded,
  AddRounded,
  EditRounded,
  VisibilityRounded,
  PowerSettingsNewRounded,
  PlaylistAddRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { PlayerPhotoFields } from '@/components/sport/PlayerPhotoFields';
import { NewRosterPlayer } from '@/components/sport/NewRosterPlayer';
import { AssignPlayerTournaments } from '@/components/sport/AssignPlayerTournaments';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type DataTableAction, type DataTableColumn } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { AppModal } from '@/components/ui/AppModal';
import { LoadingState, RosterSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamRegistrationsQuery } from '@/hooks/queries';
import { useUpdatePlayer, useUpdateRoster } from '@/hooks/mutations';
import { getCompetitionAgeGroup } from '@/utils/competitionMeta';
import { canManageRoster } from '@/utils/teamRegistrations';
import { playersApi } from '@/api/players.api';
import type { Player } from '@/api/players.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  registrations: Array<{
    rosterEntryId: string;
    editable: boolean;
    competitionId: string;
    competitionName: string;
    jerseyNumber: number | null;
    entryStatus: string;
    stats: {
      matchesPlayed: number;
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      minutesPlayed: number;
    } | null;
  }>;
}

interface PlayerCompetition {
  id: string;
  teamRegistration: {
    id: string;
    team: { id: string; name: string; logoUrl: string | null };
    competition: { id: string; name: string; };
  };
  jerseyNumber: number | null;
  status: string;
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  } | null;
}

const INITIAL_FORM = {
  documentType: 'CEDULA' as 'CEDULA' | 'PARTIDA',
  documentNumber: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  photoUrl: '',
  identityPhotoKey: '',
};

const TeamPlayers: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;
  const { data: registrations = [], isLoading, error, refetch } = useTeamRegistrationsQuery(teamId ?? undefined, true);
  const toast = useToast();
  const updatePlayer = useUpdatePlayer();
  const updateRoster = useUpdateRoster();
  const [assigningPlayer, setAssigningPlayer] = useState<PlayerRow | null>(null);
  const [pickedAgeGroup, setAgeGroup] = useState<'ADULT' | 'YOUTH' | null>(null);
  const ageGroup = pickedAgeGroup ?? (registrations.some((r) => getCompetitionAgeGroup(r.competition) === 'ADULT') ? 'ADULT' : 'YOUTH');
  const sectionRegistrations = useMemo(() => registrations.filter((r) => getCompetitionAgeGroup(r.competition) === ageGroup), [registrations, ageGroup]);

  // Edit drawer
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { data: editPlayer, isLoading: editLoading } = useQuery({
    queryKey: ['players', editId],
    queryFn: () => playersApi.get(editId!),
    enabled: !!editId,
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (editPlayer) {
      setEditForm({
        documentType: editPlayer.documentType,
        documentNumber: editPlayer.documentNumber,
        firstName: editPlayer.firstName,
        lastName: editPlayer.lastName,
        birthDate: dayjs(editPlayer.birthDate).format('YYYY-MM-DD'),
        photoUrl: editPlayer.photoUrl ?? '',
        identityPhotoKey: editPlayer.identityPhotoKey ?? '',
      });
    }
  }, [editPlayer]);

  // Detail modal
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: playerCompetitions = [], isLoading: detailLoading } = useQuery<PlayerCompetition[]>({
    queryKey: ['players', detailPlayerId, 'competitions'],
    queryFn: () => playersApi.competitions(detailPlayerId!) as Promise<PlayerCompetition[]>,
    enabled: !!detailPlayerId,
  });
  const sectionPlayerCompetitions = playerCompetitions.filter((entry) => sectionRegistrations.some((r) => r.id === entry.teamRegistration.id));

  const detailPlayerInfo = useMemo(() => {
    if (!detailPlayerId) return null;
    for (const reg of registrations) {
      for (const e of reg.roster) {
        if (e.player.id === detailPlayerId) {
          return e.player;
        }
      }
    }
    return null;
  }, [detailPlayerId, registrations]);

  const players = useMemo(() => {
    const map = new Map<string, PlayerRow>();
    sectionRegistrations.forEach((reg) => {
      reg.roster.forEach((e) => {
        if (!map.has(e.player.id)) {
          map.set(e.player.id, {
            id: e.player.id,
            firstName: e.player.firstName,
            lastName: e.player.lastName,
            photoUrl: e.player.photoUrl,
            registrations: [],
          });
        }
        map.get(e.player.id)!.registrations.push({
          rosterEntryId: e.id,
          editable: canManageRoster(reg),
          competitionId: reg.competition.id,
          competitionName: reg.competition.name,
          jerseyNumber: e.jerseyNumber,
          entryStatus: e.status,
          stats: e.stats,
        });
      });
    });
    return Array.from(map.values());
  }, [sectionRegistrations]);

  const inactiveCount = useMemo(
    () => players.filter((p) => p.registrations.every((r) => r.entryStatus === 'INACTIVE')).length,
    [players],
  );

  const handleEdit = async () => {
    if (!editId) return;
    try {
      await updatePlayer.mutateAsync({
        id: editId,
        data: {
          ...editForm,
          birthDate: new Date(editForm.birthDate).toISOString(),
        } as Partial<Player>,
      });
      setEditOpen(false);
      setEditId(null);
      toast.success('Jugador actualizado');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const openEdit = (playerId: string) => {
    setEditId(playerId);
    setEditOpen(true);
  };

  const openDetail = (playerId: string) => {
    setDetailPlayerId(playerId);
    setDetailOpen(true);
  };

  const columns: DataTableColumn<PlayerRow>[] = [
    {
      key: 'player',
      label: 'Jugador',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.photoUrl ?? undefined}
            sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700, fontSize: 13 }}
          >
            {row.firstName[0]?.toUpperCase()}
          </Avatar>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
            {row.firstName} {row.lastName}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'competitions',
      label: 'Competiciones',
      render: (row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {row.registrations.map((r) => (
            <Chip key={r.competitionId} label={r.competitionName} size="small" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => {
        const anyActive = row.registrations.some((r) => r.entryStatus === 'ACTIVE');
        return <StatusBadge status={anyActive ? 'ACTIVE' : 'INACTIVE'} />;
      },
    },
  ];

  const actions: DataTableAction<PlayerRow>[] = [
    { label: 'Ver detalle', icon: <VisibilityRounded fontSize="small" />, onClick: (r) => openDetail(r.id) },
    { label: 'Editar', icon: <EditRounded fontSize="small" />, onClick: (r) => openEdit(r.id) },
    { label: 'Inscribir en torneos', icon: <PlaylistAddRounded fontSize="small" />, onClick: setAssigningPlayer },
    {
      label: (r) => {
        const anyActive = r.registrations.some((reg) => reg.entryStatus === 'ACTIVE');
        return anyActive ? 'Dar de baja en este apartado' : 'Reincorporar en este apartado';
      },
      icon: <PowerSettingsNewRounded fontSize="small" />,
      color: 'error',
      onClick: async (r) => {
        const anyActive = r.registrations.some((reg) => reg.entryStatus === 'ACTIVE');
        const status = anyActive ? 'INACTIVE' as const : 'ACTIVE' as const;
        const entries = r.registrations.filter((entry) => entry.editable && entry.entryStatus !== status);
        if (!entries.length) { toast.error('Esta plantilla es histórica o está cerrada. Solo puedes consultarla.'); return; }
        try {
          await Promise.all(entries.map((entry) => updateRoster.mutateAsync({ id: entry.rosterEntryId, data: { status } })));
          toast.success(status === 'ACTIVE' ? 'Jugador reincorporado en este apartado' : 'Jugador dado de baja solo en este apartado');
        } catch (err) { toast.error(extractErrorMessage(err)); }
      },
    },
  ];

  if (isLoading) return <RosterSkeleton rows={6} />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Box>
      <PageHeader
        title="Jugadores"
        subtitle="Adultos y Menores tienen plantillas independientes. Las bajas de un apartado no afectan al otro."
        action={<NewRosterPlayer key={ageGroup} registrations={sectionRegistrations} />}
      />

      <Tabs value={ageGroup} onChange={(_, next) => { setAgeGroup(next); setDetailOpen(false); setDetailPlayerId(null); }} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 3 }} aria-label="Plantillas de jugadores">
        <Tab value="ADULT" label="Adultos" />
        <Tab value="YOUTH" label="Menores" />
      </Tabs>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Jugadores" value={players.length} icon={<PersonRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inscripciones" value={sectionRegistrations.length} icon={<FlagRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inactivos" value={inactiveCount} icon={<FlagRounded />} tint="warning" />
        </Grid>
      </Grid>

      {players.length === 0 ? (
        <EmptyState
          variant="bench"
          seats={5}
          filled={0}
          title="Tu plantilla está vacía"
          description="El administrador inscribe a tu equipo en los torneos. Desde Mis torneos puedes agregar jugadores a cada plantilla."
          actionLabel="Ir a mis torneos"
          actionIcon={<AddRounded />}
          onAction={() => navigate(ROUTES.team.squads)}
        />
      ) : (
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Lista de jugadores
          </Typography>
          <DataTable
            columns={columns}
            rows={players}
            getRowKey={(r) => r.id}
            actions={actions}
            emptyTitle="Sin jugadores"
            emptyDescription="Agrega jugadores desde la sección Plantillas."
          />
        </Card>
      )}

      {assigningPlayer && teamId && <AssignPlayerTournaments player={assigningPlayer} teamId={teamId} onClose={() => setAssigningPlayer(null)} />}
      {/* Edit Player Drawer */}
      <AppDrawer
        open={editOpen}
        onClose={() => { if (!uploadingPhotos && !updatePlayer.isPending) { setEditOpen(false); setEditId(null); } }}
        title="Editar jugador"
        subtitle={editPlayer ? `${editPlayer.firstName} ${editPlayer.lastName}` : 'Cargando…'}
      >
        {editLoading ? (
          <LoadingState rows={3} />
        ) : (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select label="Tipo de documento" fullWidth
                value={editForm.documentType}
                onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value as 'CEDULA' | 'PARTIDA' })}
              >
                <MenuItem value="CEDULA">Cédula</MenuItem>
                <MenuItem value="PARTIDA">Partida de nacimiento</MenuItem>
              </TextField>
              <TextField
                label="Número de documento" fullWidth
                value={editForm.documentNumber}
                onChange={(e) => setEditForm({ ...editForm, documentNumber: e.target.value })}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Nombre" fullWidth
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
              <TextField
                label="Apellido" fullWidth
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </Stack>
            <TextField
              label="Fecha de nacimiento" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={editForm.birthDate}
              onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
            />
            <PlayerPhotoFields photoUrl={editForm.photoUrl} identityPhotoKey={editForm.identityPhotoKey} documentType={editForm.documentType} disabled={updatePlayer.isPending} onPhotoChange={(value) => setEditForm((current) => ({ ...current, photoUrl: value }))} onIdentityChange={(value) => setEditForm((current) => ({ ...current, identityPhotoKey: value }))} onBusyChange={setUploadingPhotos} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button disabled={uploadingPhotos || updatePlayer.isPending} onClick={() => { setEditOpen(false); setEditId(null); }}>Cancelar</Button>
              <SaveButton
               
                onClick={handleEdit}
                loading={updatePlayer.isPending} error={updatePlayer.isError} disabled={uploadingPhotos || !editForm.photoUrl || !editForm.identityPhotoKey || !editForm.firstName || !editForm.lastName || !editForm.documentNumber || !editForm.birthDate}
              >
                {updatePlayer.isPending ? 'Guardando…' : 'Guardar cambios'}
              </SaveButton>
            </Stack>
          </Stack>
        )}
      </AppDrawer>

      {/* Player Detail Modal */}
      <AppModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailPlayerId(null); }}
        title={detailPlayerInfo ? `${detailPlayerInfo.firstName} ${detailPlayerInfo.lastName}` : 'Jugador'}
        subtitle="Información completa y competiciones en las que participa."
        maxWidth={640}
      >
        {detailLoading ? (
          <LoadingState rows={4} />
        ) : (
          <Stack spacing={3}>
            {/* Player info card */}
            {detailPlayerInfo && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar
                    src={detailPlayerInfo.photoUrl ?? undefined}
                    sx={{ width: 56, height: 56, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700, fontSize: 20 }}
                  >
                    {detailPlayerInfo.firstName[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {detailPlayerInfo.firstName} {detailPlayerInfo.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailPlayerInfo.documentNumber}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            {/* Registrations */}
            <Box>
              <Typography variant="h4" sx={{ mb: 1.5 }}>
                Competiciones ({sectionPlayerCompetitions.length})
              </Typography>
              {sectionPlayerCompetitions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Este jugador no está inscrito en ninguna competición.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Competición</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>PJ</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>G</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>A</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>TA</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>TR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sectionPlayerCompetitions.map((pc) => (
                        <TableRow key={pc.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {pc.teamRegistration.competition.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {pc.teamRegistration.team.logoUrl && (
                                <Avatar
                                  src={pc.teamRegistration.team.logoUrl}
                                  sx={{ width: 20, height: 20 }}
                                />
                              )}
                              <Typography variant="body2">{pc.teamRegistration.team.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={pc.jerseyNumber ?? '—'} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pc.status as 'ACTIVE' | 'INACTIVE'} />
                          </TableCell>
                          <TableCell>{pc.stats?.matchesPlayed ?? 0}</TableCell>
                          <TableCell>{pc.stats?.goals ?? 0}</TableCell>
                          <TableCell>{pc.stats?.assists ?? 0}</TableCell>
                          <TableCell>{pc.stats?.yellowCards ?? 0}</TableCell>
                          <TableCell>{pc.stats?.redCards ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Stack>
        )}
      </AppModal>
    </Box>
  );
};

export default TeamPlayers;
