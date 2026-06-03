import { Box, Card, Typography, Stack, Avatar, Chip } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { usePlayerStatsQuery } from '@/hooks/queries';
import { ErrorState } from '@/components/ui/ErrorState';
import { SportsSoccerRounded, EmojiEventsRounded } from '@mui/icons-material';

const AdminStats: React.FC = () => {
  const { data: stats = [], isLoading, error, refetch } = usePlayerStatsQuery();

  return (
    <Box>
      <PageHeader title="Estadísticas" subtitle="Goleadores, asistentes y tarjetas por temporada." />
      {error ? <ErrorState onRetry={refetch} /> : isLoading ? <Typography color="text.secondary">Cargando…</Typography> : (
        <Stack spacing={2}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <SportsSoccerRounded color="primary" />
              <Typography variant="h4">Goleadores</Typography>
            </Stack>
            {stats.length === 0 ? (
              <Typography color="text.secondary">Aún no hay estadísticas. Finaliza partidos para empezar a contar.</Typography>
            ) : (
              <Stack spacing={1}>
                {stats.slice(0, 20).map((s: any, i: number) => (
                  <Stack key={s.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1, borderRadius: 2, '&:hover': { bgcolor: 'background.default' } }}>
                    <Typography sx={{ width: 28, fontWeight: 800, fontFamily: '"Plus Jakarta Sans"' }}>{i + 1}</Typography>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.soft', color: 'primary.main' }}>
                      {s.rosterEntry?.player?.firstName?.[0]}{s.rosterEntry?.player?.lastName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }} noWrap>
                        {s.rosterEntry?.player?.firstName} {s.rosterEntry?.player?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{s.rosterEntry?.teamRegistration?.team?.name}</Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Stack alignItems="center" sx={{ minWidth: 56 }}>
                        <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.goals}</Typography>
                        <Typography variant="caption" color="text.secondary">Goles</Typography>
                      </Stack>
                      <Stack alignItems="center" sx={{ minWidth: 56 }}>
                        <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.assists}</Typography>
                        <Typography variant="caption" color="text.secondary">Asist.</Typography>
                      </Stack>
                      <Stack alignItems="center" sx={{ minWidth: 56 }}>
                        <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.matchesPlayed}</Typography>
                        <Typography variant="caption" color="text.secondary">PJ</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default AdminStats;
