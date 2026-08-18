import { Chip, Divider, Stack, Typography } from '@mui/material';
import { CompetitionTags } from './CompetitionTags';
import type { CompetitionLike } from '@/utils/competitionMeta';

interface Props {
  competition: CompetitionLike;
  /** Texto del contador de la derecha (equipos, goleadores, partidos…). */
  count?: string;
}

/** Cabecera de una sección agrupada por competición. */
export const CompetitionHeading: React.FC<Props> = ({ competition, count }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    spacing={1.5}
    sx={{ mb: 2 }}
  >
    <Typography variant="h4" sx={{ fontWeight: 800 }}>
      {competition.name}
    </Typography>
    <CompetitionTags competition={competition} />
    <Divider sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
    {count && <Chip size="small" variant="outlined" label={count} />}
  </Stack>
);
