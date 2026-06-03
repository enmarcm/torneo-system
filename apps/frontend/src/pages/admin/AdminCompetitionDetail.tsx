import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Button, Tabs, Tab, Avatar } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowBackRounded, EmojiEventsRounded, GroupsRounded, SportsSoccerRounded, TableChartRounded } from '@mui/icons-material';
import { useCompetitionQuery, useStandingsQuery, useMatchesQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { StandingsTable } from '@/components/sport/StandingsTable';
import { MatchCard } from '@/components/sport/MatchCard';
import { ROUTES } from '@/routes/routes';
import { getStatusLabel } from '@/utils/statusLabels';

const AdminCompetitionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const { data: comp, isLoading } = useCompetitionQuery(id!);
  const { data: standings = [] } = useStandingsQuery(id ?? '');
  const { data: matches = [] } = useMatchesQuery(id);

  const compTeams = (comp as any)?.registrations ?? [];

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
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>{r.team?.name ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.roster?.length ?? 0} jugadores</Typography>
                      </Box>
                      <StatusBadge status={r.status} />
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AdminCompetitionDetail;
