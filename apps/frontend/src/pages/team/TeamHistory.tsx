import { Box, Grid2 as Grid, Card, Stack, Typography, Chip } from '@mui/material';
import { EmojiEventsRounded, ChevronRightRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEditionsQuery } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/routes/routes';

const TeamHistory: React.FC = () => {
  const navigate = useNavigate();
  const { data: editions = [] } = useEditionsQuery();

  return (
    <Box>
      <PageHeader title="Historial" subtitle="Todas las ediciones del torneo. Haz clic para ver detalles." />
      {editions.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 1 }}>Sin ediciones</Typography>
          <Typography color="text.secondary">Aún no hay ediciones registradas.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {editions.map((ed) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ed.id}>
              <Card
                sx={{ p: 3, cursor: 'pointer', transition: '0.15s', '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' } }}
                onClick={() => navigate(ROUTES.team.historyDetail.replace(':id', ed.id))}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.soft', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <EmojiEventsRounded />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4">{ed.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Temporada {ed.seasonNumber} · {ed.year}</Typography>
                  </Box>
                  <ChevronRightRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <StatusBadge status={ed.status} />
                  <Chip size="small" label={`${formatDate(ed.startDate)} → ${formatDate(ed.endDate)}`} variant="outlined" />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Traspasos</Typography>
                    <Typography sx={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans"' }}>
                      {ed.transfersOpen ? 'Abiertos' : 'Cerrados'}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TeamHistory;
