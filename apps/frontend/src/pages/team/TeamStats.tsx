import { Box, Card, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { usePlayerStatsQuery } from '@/hooks/queries';

const TeamStats: React.FC = () => {
  const { data: stats = [] } = usePlayerStatsQuery();
  return (
    <Box>
      <PageHeader title="Estadísticas" subtitle="Rendimiento de tus jugadores." />
      <Card sx={{ p: 3 }}>
        {stats.length === 0 ? <Typography color="text.secondary">Aún no hay estadísticas.</Typography> : (
          <Typography>{stats.length} jugadores con estadísticas registradas.</Typography>
        )}
      </Card>
    </Box>
  );
};

export default TeamStats;
