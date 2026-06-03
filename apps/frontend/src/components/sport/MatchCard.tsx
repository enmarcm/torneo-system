import { Card, Box, Stack, Avatar, Typography } from '@mui/material';
import { CalendarTodayRounded, PlaceRounded } from '@mui/icons-material';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/utils/formatDate';
import { motion } from 'framer-motion';
import type { Match } from '@/api/matches.api';

interface Props {
  match: Match;
  onClick?: () => void;
}

export const MatchCard: React.FC<Props> = ({ match, onClick }) => (
  <Card
    component={motion.div}
    whileHover={{ y: -2 }}
    onClick={onClick}
    sx={{ p: { xs: 2, md: 2.5 }, cursor: onClick ? 'pointer' : 'default' }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: 'text.secondary' }}>
        <CalendarTodayRounded sx={{ fontSize: 14 }} />
        <Typography variant="caption">{formatDateTime(match.scheduledAt)}</Typography>
      </Stack>
      <StatusBadge status={match.status} />
    </Stack>
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Stack alignItems="center" sx={{ flex: 1 }}>
        <Avatar src={match.homeRegistration.team.logoUrl ?? undefined} sx={{ width: 44, height: 44, mb: 0.5 }}>
          {match.homeRegistration.team.name[0]}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }} noWrap>
          {match.homeRegistration.team.name}
        </Typography>
      </Stack>

      <Box sx={{ textAlign: 'center', minWidth: { xs: 56, md: 80 } }}>
        {match.status === 'SCHEDULED' ? (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>vs</Typography>
        ) : (
          <Typography sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>
            {match.homeScore} - {match.awayScore}
          </Typography>
        )}
      </Box>

      <Stack alignItems="center" sx={{ flex: 1 }}>
        <Avatar src={match.awayRegistration.team.logoUrl ?? undefined} sx={{ width: 44, height: 44, mb: 0.5 }}>
          {match.awayRegistration.team.name[0]}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }} noWrap>
          {match.awayRegistration.team.name}
        </Typography>
      </Stack>
    </Stack>
    {match.venue && (
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5, color: 'text.secondary' }}>
        <PlaceRounded sx={{ fontSize: 14 }} />
        <Typography variant="caption">{match.venue}</Typography>
      </Stack>
    )}
  </Card>
);
