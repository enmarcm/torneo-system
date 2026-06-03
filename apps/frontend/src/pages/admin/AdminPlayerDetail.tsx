import { Box, Grid2 as Grid, Card, Stack, Typography, Chip, Avatar, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBackRounded, PersonRounded, SportsSoccerRounded, VerifiedRounded } from '@mui/icons-material';
import { usePlayerQuery, usePlayerStatsQuery, useMatchesQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { MatchCard } from '@/components/sport/MatchCard';
import { calcAge, formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routes';
import { playersApi } from '@/api/players.api';
import { useQuery } from '@tanstack/react-query';

const AdminPlayerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: player, isLoading } = usePlayerQuery(id!);
  const { data: stats = [] } = usePlayerStatsQuery();
  const { data: matches = [] } = useMatchesQuery();
  const { data: competitions } = useQuery({
    queryKey: ['player-competitions', id],
    queryFn: () => playersApi.competitions(id!),
    enabled: !!id,
  });

  const playerStats = stats.filter((s: any) => s.playerId === id);

  if (isLoading) return <Typography color="text.secondary">Cargando…</Typography>;
  if (!player) return <Typography color="text.secondary">Jugador no encontrado.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(ROUTES.admin.players)} sx={{ mb: 2 }}>
        Volver a jugadores
      </Button>
      <PageHeader
        title={`${player.firstName} ${player.lastName}`}
        subtitle={`${player.documentType === 'CEDULA' ? 'C.I.' : 'P.N.'} ${player.documentNumber} · ${calcAge(player.birthDate)} años`}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <StatusBadge status={player.status} />
        {player.universityDegreeVerified && (
          <Chip size="small" color="success" label="Título verificado" icon={<VerifiedRounded sx={{ fontSize: 14 }} />} variant="outlined" />
        )}
        {player.position && <Chip size="small" label={player.position} variant="outlined" />}
      </Stack>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Estadísticas" value={playerStats.length} icon={<PersonRounded />} tint="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label="Partidos" value={matches.filter((m) =>
            m.homeRegistration.team.id === id || m.awayRegistration.team.id === id
          ).length} icon={<SportsSoccerRounded />} tint="info" />
        </Grid>
      </Grid>
      {competitions && competitions.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Competiciones</Typography>
          <Stack spacing={1}>
            {competitions.map((c: any) => (
              <Card key={c.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => navigate(`/admin/competiciones/${c.id}`)}>
                <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default AdminPlayerDetail;
