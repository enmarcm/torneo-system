import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Divider, Button, Avatar, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { GroupsRounded, SportsSoccerRounded, BarChartRounded, EditRounded } from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamsQuery, useTeamHistoryQuery, useTeamStatsQuery } from '@/hooks/queries';
import { useUpdateTeam } from '@/hooks/mutations';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EntityHeroCard } from '@/components/sport/EntityHeroCard';
import { MatchCard } from '@/components/sport/MatchCard';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { extractErrorMessage } from '@/api/axios';
import { useToast } from '@/hooks/common/useToast';

const TeamHome: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const teamId = user?.teamId;
  const { data: teams = [] } = useTeamsQuery();
  const team = teams.find((t) => t.id === teamId);
  const updateTeam = useUpdateTeam();
  const toast = useToast();
  const [logoOpen, setLogoOpen] = useState(false);
  const { data: history = [] } = useTeamHistoryQuery(teamId ?? undefined);
  const { data: stats } = useTeamStatsQuery(teamId ?? undefined);

  const upcoming = history.filter((m) => m.status === 'SCHEDULED' || m.status === 'POSTPONED').slice(0, 4);
  const wins = stats?.wins ?? 0;
  const draws = stats?.draws ?? 0;
  const losses = stats?.losses ?? 0;
  const pending = upcoming.length;

  return (
    <Box>
      <PageHeader title="Inicio" subtitle={`Bienvenido, ${user?.email}`} />
      {team && (
        <Box sx={{ mb: 2 }}>
          <EntityHeroCard
            title={team.name}
            subtitle="Tu equipo"
            chips={
              <Stack direction="row" spacing={1} alignItems="center">
                {team.logoUrl && <Avatar src={team.logoUrl} sx={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.5)' }} />}
                <Chip size="small" label={team.status} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} />
              </Stack>
            }
            right={
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditRounded />}
                onClick={() => setLogoOpen(true)}
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Cambiar logo
              </Button>
            }
          />
        </Box>
      )}
      <Dialog open={logoOpen} onClose={() => setLogoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar logo del equipo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ImageUpload value={team?.logoUrl ?? ''} onChange={async (url) => {
              if (!team) return;
              try {
                await updateTeam.mutateAsync({ id: team.id, data: { logoUrl: url || null } as any });
                toast.success('Logo actualizado');
                setLogoOpen(false);
              } catch (e) {
                toast.error(extractErrorMessage(e));
              }
            }} label="Seleccionar imagen" />
            <Button onClick={() => setLogoOpen(false)} fullWidth>Cancelar</Button>
          </Stack>
        </DialogContent>
      </Dialog>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Inscripciones" value={team?._count?.registrations ?? 0} icon={<GroupsRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <StatCard label="Partidos" value={stats?.totalPlayed ?? 0} icon={<SportsSoccerRounded />} tint="info" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Card sx={{ p: { xs: 2, md: 3 }, height: '100%', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(3, 66, 146, 0.08)',
                  color: '#034292',
                  '& svg': { fontSize: 24 },
                }}
              >
                <BarChartRounded />
              </Box>
            </Box>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: 14,
                color: 'text.secondary',
                mb: 1.5,
              }}
            >
              Rendimiento
            </Typography>
            <Stack direction="row" spacing={0.5} divider={<Divider orientation="vertical" flexItem />}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'success.main' }}>{wins}</Typography>
                <Typography variant="caption" color="text.secondary">V</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'warning.main' }}>{draws}</Typography>
                <Typography variant="caption" color="text.secondary">E</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'error.main' }}>{losses}</Typography>
                <Typography variant="caption" color="text.secondary">D</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: 'info.main' }}>{pending}</Typography>
                <Typography variant="caption" color="text.secondary">P</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Tus próximos partidos</Typography>
        {upcoming.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Aún no tienes partidos asignados.</Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {upcoming.map((m) => (
              <Grid size={{ xs: 12, md: 6 }} key={m.id}>
                <MatchCard match={m} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default TeamHome;
