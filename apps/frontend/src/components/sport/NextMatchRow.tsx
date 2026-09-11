import { Box, Typography } from '@mui/material';
import { ArrowForwardRounded } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePublicMatchesQuery } from '@/hooks/queries';
import { formatTime, TZ } from '@/utils/formatDate';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';
import { ROUTES } from '@/routes/routes';
import type { Match } from '@/api/public.api';

interface Props {
  editionId?: string;
}

/**
 * El próximo partido programado, en una fila: día y hora a la izquierda en
 * naranja, equipos y competición a la derecha. Es lo que un vacío del vivo o
 * del calendario muestra en vez de decir solo "no hay nada". Si no hay
 * ninguno programado, no dibuja nada y el vacío queda con su texto.
 */
export const NextMatchRow: React.FC<Props> = ({ editionId }) => {
  const navigate = useNavigate();
  const { data: upcoming = [] } = usePublicMatchesQuery(undefined, 'SCHEDULED', editionId, {
    upcoming: true,
    order: 'asc',
    limit: 1,
  });
  const next = upcoming[0] as Match | undefined;
  if (!next || !next.scheduledAt) return null;

  const d = dayjs(next.scheduledAt).tz(TZ);
  const day = d.format('ddd D').replace('.', '');

  return (
    <Box
      component="button"
      type="button"
      onClick={() => navigate(ROUTES.public.schedule)}
      className="llf-cardlink"
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 1.5,
        alignItems: 'center',
        textAlign: 'left',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        px: 1.5,
        py: 1.25,
        cursor: 'pointer',
        font: 'inherit',
        color: 'text.primary',
      }}
    >
      <Box sx={{ textAlign: 'center', minWidth: 52 }}>
        <Typography
          component="span"
          className="tabular"
          sx={{ display: 'block', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 14, lineHeight: 1.1, color: 'var(--accent)' }}
        >
          {formatTime(next.scheduledAt)}
        </Typography>
        <Typography component="span" sx={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', mt: 0.25 }}>
          {day}
        </Typography>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: 13.5, lineHeight: 1.25 }} noWrap>
          {next.homeRegistration.team.name} vs. {next.awayRegistration.team.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {[next.competition ? getCompetitionShortLabel(next.competition) : null, next.venue].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
      <ArrowForwardRounded className="llf-cardlink-arrow" sx={{ fontSize: 18, color: 'primary.main' }} />
    </Box>
  );
};
