import { useMemo } from 'react';
import { Box, Card, Typography, Avatar, Chip, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { PersonRounded, SportsSoccerRounded, SquareRounded, FlagRounded } from '@mui/icons-material';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamRegistrationsQuery } from '@/hooks/queries';

const TeamPlayers: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;
  const { data: registrations = [], isLoading, error, refetch } = useTeamRegistrationsQuery(teamId ?? undefined);

  const players = useMemo(() => {
    const seen = new Set<string>();
    return registrations.flatMap((reg) =>
      reg.roster.map((e) => ({
        id: e.player.id,
        name: `${e.player.firstName} ${e.player.lastName}`,
        position: e.player.position,
        photoUrl: e.player.photoUrl,
        jerseyNumber: e.jerseyNumber,
        competitionName: reg.competition.name,
        status: e.status,
      })),
    ).filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [registrations]);

  const totalWithStats = useMemo(() =>
    registrations.reduce((sum, r) => sum + r.roster.filter((e) => e.stats).length, 0), [registrations]);

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Box>
      <PageHeader title="Jugadores" subtitle="Todos los jugadores de tu equipo." />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Jugadores" value={players.length} icon={<PersonRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Con estadísticas" value={totalWithStats} icon={<SportsSoccerRounded />} tint="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Inscripciones" value={registrations.length} icon={<SquareRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Inactivos" value={players.filter((p) => p.status === 'INACTIVE').length} icon={<FlagRounded />} tint="warning" />
        </Grid>
      </Grid>

      {players.length === 0 ? (
        <EmptyState title="Sin jugadores" description="Aún no has agregado jugadores a tu equipo." />
      ) : (
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Lista de jugadores</Typography>
          <DataTable
            columns={[
              {
                key: 'player',
                label: 'Jugador',
                render: (row: typeof players[0]) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={row.photoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main', fontWeight: 700, fontSize: 13 }}>
                      {row.name[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.position ?? 'Sin posición'}{row.jerseyNumber ? ` · #${row.jerseyNumber}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                ),
              },
              {
                key: 'competition',
                label: 'Competición',
                render: (row: typeof players[0]) => <Chip label={row.competitionName} size="small" variant="outlined" />,
                hideInMobile: true,
              },
              {
                key: 'status',
                label: 'Estado',
                render: (row: typeof players[0]) => (
                  <Chip label={row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} size="small" color={row.status === 'ACTIVE' ? 'success' : 'default'} />
                ),
              },
            ]}
            rows={players}
            getRowKey={(r) => r.id}
            emptyTitle="Sin jugadores"
            emptyDescription="Agrega jugadores desde la sección Plantillas."
          />
        </Card>
      )}
    </Box>
  );
};

export default TeamPlayers;
