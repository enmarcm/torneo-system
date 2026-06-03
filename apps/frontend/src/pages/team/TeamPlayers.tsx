import { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, Typography, Avatar, Chip, Stack, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { PersonRounded, FlagRounded, AddRounded, EditRounded } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type DataTableAction, type DataTableColumn } from '@/components/ui/DataTable';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { AppModal } from '@/components/ui/AppModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamRegistrationsQuery } from '@/hooks/queries';
import { useCreatePlayer, useUpdatePlayer, useSetPlayerStatus } from '@/hooks/mutations';
import { playersApi } from '@/api/players.api';
import type { Player } from '@/api/players.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  photoUrl: string | null;
  registrations: Array<{
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
    team: { id: string; name: string; logoUrl: string | null };
    competition: { id: string; name: string; category: { id: string; name: string } | null };
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
  position: '',
};

const TeamPlayers: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;
  const { data: registrations = [], isLoading, error, refetch } = useTeamRegistrationsQuery(teamId ?? undefined);
  const toast = useToast();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const setStatus = useSetPlayerStatus();

  // Create drawer
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_FORM);

  // Edit drawer
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { data: editPlayer, isLoading: editLoading } = useQuery({
    queryKey: ['players', editId],
    queryFn: () => playersApi.get(editId!),
    enabled: !!editId,
  });
  const [editForm, setEditForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (editPlayer) {
      setEditForm({
        documentType: editPlayer.documentType,
        documentNumber: editPlayer.documentNumber,
        firstName: editPlayer.firstName,
        lastName: editPlayer.lastName,
        birthDate: dayjs(editPlayer.birthDate).format('YYYY-MM-DD'),
        position: editPlayer.position ?? '',
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
    registrations.forEach((reg) => {
      reg.roster.forEach((e) => {
        if (!map.has(e.player.id)) {
          map.set(e.player.id, {
            id: e.player.id,
            firstName: e.player.firstName,
            lastName: e.player.lastName,
            position: e.player.position,
            photoUrl: e.player.photoUrl,
            registrations: [],
          });
        }
        map.get(e.player.id)!.registrations.push({
          competitionId: reg.competition.id,
          competitionName: reg.competition.name,
          jerseyNumber: e.jerseyNumber,
          entryStatus: e.status,
          stats: e.stats,
        });
      });
    });
    return Array.from(map.values());
  }, [registrations]);

  const inactiveCount = useMemo(
    () => players.filter((p) => p.registrations.every((r) => r.entryStatus === 'INACTIVE')).length,
    [players],
  );

  const handleCreate = async () => {
    try {
      await createPlayer.mutateAsync({
        ...createForm,
        birthDate: new Date(createForm.birthDate).toISOString(),
      } as Partial<Player>);
      setCreateOpen(false);
      setCreateForm(INITIAL_FORM);
      toast.success('Jugador creado');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

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
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.position ?? 'Sin posición'}
            </Typography>
          </Box>
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
    { label: 'Ver detalle', onClick: (r) => openDetail(r.id) },
    { label: 'Editar', icon: <EditRounded />, onClick: (r) => openEdit(r.id) },
    {
      label: (r) => {
        const anyActive = r.registrations.some((reg) => reg.entryStatus === 'ACTIVE');
        return anyActive ? 'Desactivar' : 'Activar';
      },
      onClick: (r) => {
        const anyActive = r.registrations.some((reg) => reg.entryStatus === 'ACTIVE');
        setStatus.mutate({ id: r.id, status: anyActive ? 'INACTIVE' : 'ACTIVE' });
      },
    },
  ];

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Box>
      <PageHeader
        title="Jugadores"
        subtitle="Todos los jugadores registrados en las competiciones de tu equipo."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreateOpen(true)}>
            Nuevo jugador
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Jugadores" value={players.length} icon={<PersonRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inscripciones" value={registrations.length} icon={<FlagRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inactivos" value={inactiveCount} icon={<FlagRounded />} tint="warning" />
        </Grid>
      </Grid>

      {players.length === 0 ? (
        <EmptyState title="Sin jugadores" description="Aún no hay jugadores en las competiciones de tu equipo." />
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

      {/* Create Player Drawer */}
      <AppDrawer
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateForm(INITIAL_FORM); }}
        title="Nuevo jugador"
        subtitle="Registra un nuevo jugador en el sistema."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select label="Tipo de documento" fullWidth
              value={createForm.documentType}
              onChange={(e) => setCreateForm({ ...createForm, documentType: e.target.value as 'CEDULA' | 'PARTIDA' })}
            >
              <MenuItem value="CEDULA">Cédula</MenuItem>
              <MenuItem value="PARTIDA">Partida de nacimiento</MenuItem>
            </TextField>
            <TextField
              label="Número de documento" fullWidth
              value={createForm.documentNumber}
              onChange={(e) => setCreateForm({ ...createForm, documentNumber: e.target.value })}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Nombre" fullWidth
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
            />
            <TextField
              label="Apellido" fullWidth
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Fecha de nacimiento" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={createForm.birthDate}
              onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })}
            />
            <TextField
              label="Posición" fullWidth
              value={createForm.position}
              onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
            />
          </Stack>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => { setCreateOpen(false); setCreateForm(INITIAL_FORM); }}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!createForm.firstName || !createForm.lastName || !createForm.documentNumber || !createForm.birthDate || createPlayer.isPending}
            >
              {createPlayer.isPending ? 'Creando…' : 'Crear jugador'}
            </Button>
          </Stack>
        </Stack>
      </AppDrawer>

      {/* Edit Player Drawer */}
      <AppDrawer
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditId(null); }}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Fecha de nacimiento" type="date" fullWidth
                InputLabelProps={{ shrink: true }}
                value={editForm.birthDate}
                onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
              />
              <TextField
                label="Posición" fullWidth
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => { setEditOpen(false); setEditId(null); }}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleEdit}
                disabled={!editForm.firstName || !editForm.lastName || !editForm.documentNumber || !editForm.birthDate || updatePlayer.isPending}
              >
                {updatePlayer.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
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
                      {detailPlayerInfo.position ?? 'Sin posición'} · {detailPlayerInfo.documentNumber}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            {/* Registrations */}
            <Box>
              <Typography variant="h4" sx={{ mb: 1.5 }}>
                Competiciones ({playerCompetitions.length})
              </Typography>
              {playerCompetitions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Este jugador no está inscrito en ninguna competición.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Competición</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
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
                      {playerCompetitions.map((pc) => (
                        <TableRow key={pc.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {pc.teamRegistration.competition.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {pc.teamRegistration.competition.category?.name ?? '—'}
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
