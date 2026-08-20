import { Box, Grid2 as Grid, Card, Stack, Typography, Button, FormControl, InputLabel, Select, MenuItem, IconButton, TextField, Menu, Tooltip, Tabs, Tab, Chip, FormControlLabel, Checkbox, Avatar, FormHelperText } from '@mui/material';
import { AddRounded, PlayArrowRounded, StopRounded, SportsSoccerRounded, StyleRounded, ChevronLeftRounded, ChevronRightRounded, MoreVertRounded, CasinoRounded } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LiveScoreboard } from '@/components/sport/LiveScoreboard';
import { AppDrawer } from '@/components/ui/AppDrawer';
import { AppModal } from '@/components/ui/AppModal';
import { useCompetitionsQuery, useMatchesQuery, usePublicRegistrationsQuery, useRosterQuery } from '@/hooks/queries';
import { useCreateMatch, useUpdateMatch, useDeleteMatch, useStartMatch, useFinishMatch, useCreateMatchEvent, useDrawLeagueFixture, useDrawGroupStage } from '@/hooks/mutations';
import { MatchCard } from '@/components/sport/MatchCard';
import { formatDateTime } from '@/utils/formatDate';
import type { Match } from '@/api/matches.api';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';

/*
  La liga juega siempre en la misma cancha, así que la sede se escribía a mano
  igual en cada partido. Va precargada; el campo sigue siendo editable porque
  una fecha puede mudarse y el administrador manda sobre el dato.
*/
const DEFAULT_VENUE = 'Colegio de Abogados';

const AdminSchedule: React.FC = () => {
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const [competitionId, setCompetitionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: comps = [] } = useCompetitionsQuery();
  const { data: matches = [], isLoading } = useMatchesQuery(competitionId || undefined);
  const toast = useToast();
  const create = useCreateMatch();
  const update = useUpdateMatch();
  const remove = useDeleteMatch();
  const start = useStartMatch();
  const finish = useFinishMatch();
  const createEvent = useCreateMatchEvent();
  const drawLeague = useDrawLeagueFixture();
  const drawGroups = useDrawGroupStage();
  const [view, setView] = useState<'day' | 'pending'>('day');
  const [open, setOpen] = useState<'create' | 'edit' | null>(null);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  /*
    Qué se está por cargar y a qué equipo. El jugador se elige después, en el
    diálogo: un gol sin autor no alimenta la tabla de goleadores, que junto con
    la de tarjetas es la única estadística que la liga lleva.
  */
  const [eventFor, setEventFor] = useState<{
    type: 'GOAL' | 'YELLOW' | 'RED';
    regId: string;
    teamName: string;
  } | null>(null);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; m: Match } | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);
  const [form, setForm] = useState({ homeRegistrationId: '', awayRegistrationId: '', scheduledAt: '', matchday: 1, venue: DEFAULT_VENUE, featured: false });
  const [editForm, setEditForm] = useState({ scheduledAt: '', matchday: 1, venue: '', status: 'SCHEDULED' as Match['status'], featured: false });

  /* Equipos inscritos en la competición elegida: es lo que se puede cruzar. */
  const { data: registrations = [] } = usePublicRegistrationsQuery(
    undefined,
    competitionId || undefined,
  );

  const filteredMatches = matches.filter(
    (m) => m.scheduledAt && dayjs(m.scheduledAt).format('YYYY-MM-DD') === selectedDate,
  );
  // Salidos del sorteo: el cruce está definido pero falta ponerles día y hora.
  const pendingMatches = matches.filter((m) => !m.scheduledAt);
  const selectedComp = comps.find((c) => c.id === competitionId);

  /*
    Cruces que ya existen en la competición, guardados con dirección
    (`local>visitante`). Sirven para no volver a crear un partido que ya está.
  */
  const existingPairs = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) set.add(`${m.homeRegistrationId}>${m.awayRegistrationId}`);
    return set;
  }, [matches]);

  /*
    A dos rondas, la vuelta es un partido legítimo y distinto de la ida; a una
    sola, el cruce es el mismo se juegue donde se juegue y no se repite.
  */
  const allowsReturnLeg = (selectedComp?.rounds ?? 1) > 1;

  const rivalTaken = (homeId: string, awayId: string) =>
    existingPairs.has(`${homeId}>${awayId}`) ||
    (!allowsReturnLeg && existingPairs.has(`${awayId}>${homeId}`));

  /*
    El visitante se acota al local elegido: fuera él mismo y fuera todo rival
    con el que ese cruce ya esté armado. Es lo que evita el partido duplicado
    sin obligar al administrador a acordarse del fixture entero.
  */
  const awayOptions = useMemo(() => {
    const home = form.homeRegistrationId;
    if (!home) return registrations;
    return registrations.filter((r) => r.id !== home && !rivalTaken(home, r.id));
  }, [registrations, form.homeRegistrationId, existingPairs, allowsReturnLeg]);

  const { data: eventRoster = [] } = useRosterQuery(eventFor?.regId ?? '');
  const eventRosterActive = eventRoster.filter((r) => r.status === 'ACTIVE');

  const hiddenRivals =
    form.homeRegistrationId > '' ? registrations.length - 1 - awayOptions.length : 0;

  const onOpenEdit = (m: Match) => {
    setEditingMatch(m);
    setEditForm({
      // Un partido recién sorteado no trae fecha: se arranca con el día que esté
      // seleccionado en el calendario para no dejar el campo vacío.
      scheduledAt: m.scheduledAt
        ? dayjs(m.scheduledAt).format('YYYY-MM-DDTHH:mm')
        : `${selectedDate}T15:00`,
      matchday: m.matchday,
      // Un partido salido del sorteo viene sin sede: se precarga la de siempre.
      venue: m.venue || DEFAULT_VENUE,
      featured: m.featured ?? false,
      status: m.status,
    });
    setOpen('edit');
  };

  const runDraw = async (kind: 'league' | 'groups') => {
    if (!competitionId) return;
    try {
      if (kind === 'league') {
        const res = await drawLeague.mutateAsync(competitionId);
        toast.success(
          res.kept > 0
            ? `Sorteo listo: ${res.matches} partidos nuevos. Se respetaron ${res.kept} que ya tenían fecha.`
            : `Sorteo listo: ${res.matches} partidos`,
        );
      } else {
        const res = await drawGroups.mutateAsync(competitionId);
        toast.success(`Sorteo listo: ${res.groups} grupos y ${res.matches} partidos`);
      }
      setView('pending');
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };
  const onOpenCreate = () => {
    setEditingMatch(null);
    /*
      El cruce anterior no sirve para el siguiente partido —y encima puede haber
      quedado oculto por existir ya—, pero la fecha, la jornada y la sede sí: se
      programa una jornada entera de corrido.
    */
    setForm((f) => ({
      ...f,
      homeRegistrationId: '',
      awayRegistrationId: '',
      featured: false,
      venue: f.venue || DEFAULT_VENUE,
    }));
    setOpen('create');
  };

  const submit = async () => {
    if (!competitionId) return;
    try {
      if (editingMatch) {
        await update.mutateAsync({
          id: editingMatch.id,
          data: {
            scheduledAt: new Date(editForm.scheduledAt).toISOString(),
            matchday: editForm.matchday,
            venue: editForm.venue || null,
            status: editForm.status,
            featured: editForm.featured,
          } as Partial<Match>,
        });
        setOpen(null);
        setEditingMatch(null);
        toast.success('Partido actualizado');
      } else {
        await create.mutateAsync({
          competitionId,
          homeRegistrationId: form.homeRegistrationId,
          awayRegistrationId: form.awayRegistrationId,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          matchday: form.matchday,
          venue: form.venue || undefined,
          featured: form.featured,
        } as Partial<Match>);
        setOpen(null);
        // Listo para el siguiente de la misma jornada, sin el cruce ya usado.
        setForm((f) => ({
          ...f,
          homeRegistrationId: '',
          awayRegistrationId: '',
          featured: false,
        }));
        toast.success('Partido creado');
      }
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  /*
    Se manda `minute: 0` porque el esquema lo exige, pero la liga no lleva el
    minuto de cada jugada y no se muestra en ningún lado: inventar un número
    sería peor que no tenerlo.
  */
  const registerEvent = async (playerId?: string) => {
    if (!liveMatch || !eventFor) return;
    try {
      await createEvent.mutateAsync({
        matchId: liveMatch.id,
        data: {
          type: eventFor.type,
          minute: 0,
          teamRegistrationId: eventFor.regId,
          ...(playerId ? { playerId } : {}),
        },
      });
      const fresh = await import('@/api/matches.api').then((m) => m.matchesApi.get(liveMatch.id));
      setLiveMatch(fresh);
      setEventFor(null);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Programación"
        subtitle="Sorteá los cruces y después asignales día y hora."
        action={
          <Stack direction="row" spacing={1}>
            {selectedComp && (
              <Button
                variant="outlined"
                startIcon={<CasinoRounded />}
                onClick={() =>
                  runDraw(selectedComp.format === 'GROUPS_KNOCKOUT' ? 'groups' : 'league')
                }
                disabled={drawLeague.isPending || drawGroups.isPending}
              >
                {selectedComp.format === 'GROUPS_KNOCKOUT' ? 'Sortear grupos' : 'Sortear calendario'}
              </Button>
            )}
            <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate} disabled={!competitionId}>
              Nuevo partido
            </Button>
          </Stack>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
        <FormControl sx={{ minWidth: 280 }}>
          <InputLabel>Competición</InputLabel>
          <Select label="Competición" value={competitionId} onChange={(e) => setCompetitionId(e.target.value as string)}>
            {/* Las divisiones comparten nombre: sin la división, todas dicen lo mismo. */}
              {comps.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {getCompetitionShortLabel(c)}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))}>
            <ChevronLeftRounded />
          </IconButton>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputProps={{ sx: { borderRadius: 2 } }}
            sx={{ minWidth: 180 }}
          />
          <IconButton size="small" onClick={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))}>
            <ChevronRightRounded />
          </IconButton>
          <Button size="small" variant="outlined" onClick={() => setSelectedDate(today)} sx={{ flexShrink: 0 }}>
            Hoy
          </Button>
        </Stack>
      </Stack>

      {liveMatch && (
        <Box sx={{ mb: 3 }}>
          <LiveScoreboard match={liveMatch} size="lg" />
          {/*
            Un renglón por equipo. Antes eran dos botones sueltos de "gol local"
            y "gol visitante", sin jugador y sin manera de cargar una tarjeta:
            la tabla de goleadores y la de tarjetas no podían llenarse nunca.
          */}
          <Stack spacing={1} sx={{ mt: 2, maxWidth: 520, mx: 'auto' }}>
            {[
              { regId: liveMatch.homeRegistrationId, name: liveMatch.homeRegistration.team.name },
              { regId: liveMatch.awayRegistrationId, name: liveMatch.awayRegistration.team.name },
            ].map((side) => (
              <Stack
                key={side.regId}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ p: 1, borderRadius: 2, bgcolor: 'var(--surface2)' }}
              >
                <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 14, minWidth: 0 }} noWrap>
                  {side.name}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SportsSoccerRounded />}
                  onClick={() => setEventFor({ type: 'GOAL', regId: side.regId, teamName: side.name })}
                >
                  Gol
                </Button>
                <Tooltip title="Tarjeta amarilla">
                  <IconButton
                    size="small"
                    aria-label={`Tarjeta amarilla para ${side.name}`}
                    onClick={() => setEventFor({ type: 'YELLOW', regId: side.regId, teamName: side.name })}
                    sx={{ color: 'var(--warning)' }}
                  >
                    <StyleRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tarjeta roja">
                  <IconButton
                    size="small"
                    aria-label={`Tarjeta roja para ${side.name}`}
                    onClick={() => setEventFor({ type: 'RED', regId: side.regId, teamName: side.name })}
                    sx={{ color: 'var(--danger)' }}
                  >
                    <StyleRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
            <Button
              variant="contained"
              color="success"
              startIcon={<StopRounded />}
              onClick={async () => {
                await finish.mutateAsync(liveMatch.id);
                setLiveMatch(null);
              }}
            >
              Finalizar partido
            </Button>
          </Stack>
        </Box>
      )}

      {competitionId && (
        <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ mb: 2 }}>
          <Tab value="day" label="Por día" sx={{ textTransform: 'none' }} />
          <Tab
            value="pending"
            sx={{ textTransform: 'none' }}
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <span>Por programar</span>
                {pendingMatches.length > 0 && (
                  <Chip
                    size="small"
                    color="warning"
                    label={pendingMatches.length}
                    sx={{ height: 18, fontSize: 11, fontWeight: 700 }}
                  />
                )}
              </Stack>
            }
          />
        </Tabs>
      )}

      {!competitionId ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Selecciona una competición para ver sus partidos.</Typography>
        </Card>
      ) : isLoading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : view === 'pending' ? (
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Partidos sin día ni hora
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Salieron del sorteo con el cruce ya definido. Hacé clic en cualquiera para asignarle
            fecha, hora y sede.
          </Typography>
          {pendingMatches.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No queda ningún partido pendiente de programar.
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {pendingMatches.map((m) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                  <MatchCard match={m} onClick={() => onOpenEdit(m)} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Partidos del {dayjs(selectedDate).format('DD/MM/YYYY')}
            {selectedDate === today && ' (Hoy)'}
          </Typography>
          {filteredMatches.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 1 }}>Sin partidos en esta fecha</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>No hay partidos programados para este día.</Typography>
              <Button variant="contained" startIcon={<AddRounded />} onClick={onOpenCreate}>Crear partido</Button>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {filteredMatches.map((m) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                  {/*
                    La misma ficha que ve el público: escudos, hora, sede y
                    jornada. La de antes era propia de esta pantalla y mostraba
                    solo los nombres, así que programar era trabajar a ciegas
                    sobre el dato que uno mismo acababa de cargar.
                  */}
                  <Stack spacing={1}>
                    <MatchCard match={m} onClick={() => navigate(`/admin/partidos/${m.id}`)} />
                    {/*
                      Las acciones van fuera de la ficha: meterlas adentro
                      obligaba a anidar una tarjeta dentro de otra.
                    */}
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                      {m.status === 'SCHEDULED' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlayArrowRounded />}
                          onClick={async () => {
                            const fresh = await start.mutateAsync(m.id);
                            setLiveMatch(fresh);
                          }}
                        >
                          Iniciar
                        </Button>
                      )}
                      {m.status === 'LIVE' && (
                        <Button size="small" variant="contained" color="success" onClick={() => setLiveMatch(m)}>
                          Control en vivo
                        </Button>
                      )}
                      {m.status === 'FINISHED' && (
                        <Button size="small" variant="outlined" onClick={() => navigate(`/admin/partidos/${m.id}`)}>
                          Ver detalle
                        </Button>
                      )}
                      <Tooltip title="Más opciones">
                        <IconButton size="small" onClick={(e) => setAnchor({ el: e.currentTarget, m })}>
                          <MoreVertRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <AppModal
        open={!!eventFor}
        onClose={() => setEventFor(null)}
        title={
          eventFor?.type === 'GOAL'
            ? '¿Quién marcó?'
            : eventFor?.type === 'YELLOW'
              ? '¿Quién vio la amarilla?'
              : '¿Quién vio la roja?'
        }
        subtitle={eventFor?.teamName}
        maxWidth={460}
      >
        <Stack spacing={0.5}>
          {eventRosterActive.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Este equipo todavía no tiene plantilla cargada para esta competición.
            </Typography>
          ) : (
            eventRosterActive.map((r) => (
              <Button
                key={r.id}
                onClick={() => registerEvent(r.playerId)}
                disabled={createEvent.isPending}
                sx={{ justifyContent: 'flex-start', px: 1.25, py: 1, color: 'text.primary' }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%', minWidth: 0 }}>
                  <Avatar src={r.player.photoUrl ?? undefined} sx={{ width: 32, height: 32, fontSize: 13 }}>
                    {r.player.firstName[0]}
                  </Avatar>
                  <Typography sx={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 14 }} noWrap>
                    {r.player.firstName} {r.player.lastName}
                  </Typography>
                  {r.jerseyNumber != null && (
                    <Chip
                      size="small"
                      label={r.jerseyNumber}
                      sx={{ height: 20, minWidth: 28, fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                    />
                  )}
                </Stack>
              </Button>
            ))
          )}

          {/*
            Solo para el gol: el marcador tiene que poder moverse aunque nadie
            sepa todavía quién lo hizo. Una tarjeta siempre es de alguien, y sin
            jugador no suma a la tabla, así que ahí no se ofrece la salida.
          */}
          {eventFor?.type === 'GOAL' && (
            <Button
              onClick={() => registerEvent()}
              disabled={createEvent.isPending}
              sx={{ mt: 1, color: 'text.secondary' }}
            >
              Sumar el gol sin definir el autor
            </Button>
          )}
        </Stack>
      </AppModal>

      <Menu anchorEl={anchor?.el ?? null} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { if (anchor) { onOpenEdit(anchor.m); } setAnchor(null); }}>Editar</MenuItem>
        <MenuItem onClick={() => { if (anchor) { setDeletingMatch(anchor.m); } setAnchor(null); }} sx={{ color: 'error.main' }}>Eliminar</MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!deletingMatch}
        onClose={() => setDeletingMatch(null)}
        onConfirm={async () => {
          if (deletingMatch) await remove.mutateAsync(deletingMatch.id);
          setDeletingMatch(null);
          toast.success('Partido eliminado');
        }}
        title="¿Eliminar partido?"
        message={`Se eliminará el partido "${deletingMatch?.homeRegistration.team.name} vs ${deletingMatch?.awayRegistration.team.name}" de la jornada ${deletingMatch?.matchday}.`}
        loading={remove.isPending}
      />

      <AppDrawer open={!!open} onClose={() => { setOpen(null); setEditingMatch(null); }} title={editingMatch ? 'Editar partido' : 'Nuevo partido'}>
        {editingMatch ? (
          <Stack spacing={2}>
            <TextField label="Fecha y hora" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={editForm.scheduledAt} onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })} />
            <TextField label="Jornada" type="number" fullWidth value={editForm.matchday} onChange={(e) => setEditForm({ ...editForm, matchday: Number(e.target.value) })} />
            <TextField label="Sede" fullWidth value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Match['status'] })}>
                <MenuItem value="SCHEDULED">Programado</MenuItem>
                <MenuItem value="LIVE">En vivo</MenuItem>
                <MenuItem value="FINISHED">Finalizado</MenuItem>
                <MenuItem value="POSTPONED">Aplazado</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editForm.featured}
                  onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Destacar este partido
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aparece en "Destacados" de la portada, arriba del resto del fixture.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => { setOpen(null); setEditingMatch(null); }}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!editForm.scheduledAt || update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField label="Fecha y hora" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            <TextField label="Jornada" type="number" fullWidth value={form.matchday} onChange={(e) => setForm({ ...form, matchday: Number(e.target.value) })} />
            <TextField label="Sede" fullWidth value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Equipo 1</InputLabel>
              <Select
                label="Equipo 1"
                value={form.homeRegistrationId}
                /* Cambiar de local invalida al visitante elegido: se limpia. */
                onChange={(e) =>
                  setForm({
                    ...form,
                    homeRegistrationId: e.target.value as string,
                    awayRegistrationId: '',
                  })
                }
              >
                {registrations.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Avatar src={r.team.logoUrl ?? undefined} sx={{ width: 24, height: 24, fontSize: 11 }}>
                        {r.team.name[0]}
                      </Avatar>
                      <span>{r.team.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {registrations.length === 0 && (
                <FormHelperText>Esta competición todavía no tiene equipos inscritos.</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth disabled={!form.homeRegistrationId}>
              <InputLabel>Equipo 2</InputLabel>
              <Select
                label="Equipo 2"
                value={form.awayRegistrationId}
                onChange={(e) => setForm({ ...form, awayRegistrationId: e.target.value as string })}
              >
                {awayOptions.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Avatar src={r.team.logoUrl ?? undefined} sx={{ width: 24, height: 24, fontSize: 11 }}>
                        {r.team.name[0]}
                      </Avatar>
                      <span>{r.team.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {/*
                Si se esconden rivales hay que decirlo: una lista más corta sin
                explicación se lee como un equipo que falta, no como un cruce
                que ya existe.
              */}
              {!form.homeRegistrationId ? (
                <FormHelperText>Elegí primero el equipo 1.</FormHelperText>
              ) : awayOptions.length === 0 ? (
                <FormHelperText>
                  Ese equipo ya tiene armado el cruce con todos los demás.
                </FormHelperText>
              ) : hiddenRivals > 0 ? (
                <FormHelperText>
                  {hiddenRivals === 1
                    ? 'Se ocultó 1 rival: ese cruce ya está programado.'
                    : `Se ocultaron ${hiddenRivals} rivales: esos cruces ya están programados.`}
                </FormHelperText>
              ) : null}
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Destacar este partido
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aparece en "Destacados" de la portada, arriba del resto del fixture.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setOpen(null)}>Cancelar</Button>
              <Button variant="contained" onClick={submit} disabled={!form.scheduledAt || !form.homeRegistrationId || !form.awayRegistrationId || create.isPending}>
                {create.isPending ? 'Creando…' : 'Crear partido'}
              </Button>
            </Stack>
          </Stack>
        )}
      </AppDrawer>
    </Box>
  );
};

export default AdminSchedule;
