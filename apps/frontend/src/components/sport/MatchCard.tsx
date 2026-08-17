import { Card, Box, Stack, Avatar, Typography, Chip, Tooltip } from '@mui/material';
import {
  ScheduleRounded,
  PlaceRounded,
  MilitaryTechRounded,
  PendingActionsRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDateTimeOrPending } from '@/utils/formatDate';
import { getStatusLabel } from '@/utils/statusLabels';
import type { Match } from '@/api/matches.api';

interface Props {
  match: Match;
  onClick?: () => void;
  /** Muestra la jornada / ronda arriba a la izquierda. */
  showStage?: boolean;
}

/** Franja de color a la izquierda, según en qué estado está el partido. */
const accentFor = (status: Match['status']) => {
  if (status === 'LIVE') return 'var(--live)';
  if (status === 'FINISHED') return 'var(--success)';
  if (status === 'POSTPONED') return 'var(--warning)';
  return 'var(--border)';
};

const stageLabel = (match: Match) => {
  if (match.stage === 'LEAGUE') return `Jornada ${match.matchday}`;
  if (match.stage === 'GROUP') return `Grupos · J${match.matchday}`;
  const base = getStatusLabel(match.stage);
  if (match.leg === 1) return `${base} · Ida`;
  if (match.leg === 2) return `${base} · Vuelta`;
  return base;
};

export const MatchCard: React.FC<Props> = ({ match, onClick, showStage = true }) => {
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  const isPending = !match.scheduledAt;
  const homeWon = isFinished && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.awayScore > match.homeScore;

  return (
    <Card
      component={motion.div}
      whileHover={onClick ? { y: -3 } : undefined}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      sx={{
        position: 'relative',
        p: { xs: 2, md: 2.5 },
        pl: { xs: 2.5, md: 3 },
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: accentFor(match.status),
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{ mb: 2 }}
      >
        {showStage && (
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.3 }}
            noWrap
          >
            {stageLabel(match)}
          </Typography>
        )}
        {isLive ? (
          <Box
            component={motion.div}
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1,
              py: 0.35,
              borderRadius: 999,
              bgcolor: 'var(--live)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#fff' }} />
            EN VIVO
          </Box>
        ) : (
          <Chip
            size="small"
            variant="outlined"
            label={getStatusLabel(match.status)}
            sx={{ height: 22, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
          />
        )}
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Stack alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            src={match.homeRegistration.team.logoUrl ?? undefined}
            sx={{ width: 48, height: 48, opacity: awayWon ? 0.55 : 1 }}
          >
            {match.homeRegistration.team.name[0]}
          </Avatar>
          <Typography
            variant="body2"
            align="center"
            sx={{ fontWeight: homeWon ? 800 : 600, width: '100%' }}
            noWrap
          >
            {match.homeRegistration.team.name}
          </Typography>
        </Stack>

        <Box sx={{ textAlign: 'center', minWidth: { xs: 68, md: 88 }, flexShrink: 0 }}>
          {match.status === 'SCHEDULED' || match.status === 'POSTPONED' ? (
            <Typography
              sx={{ fontWeight: 800, fontSize: 18, color: 'text.disabled', letterSpacing: 1 }}
            >
              VS
            </Typography>
          ) : (
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: { xs: 26, md: 30 },
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
                color: isLive ? 'var(--live)' : 'text.primary',
              }}
            >
              {match.homeScore}<Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>:</Box>{match.awayScore}
            </Typography>
          )}
        </Box>

        <Stack alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            src={match.awayRegistration.team.logoUrl ?? undefined}
            sx={{ width: 48, height: 48, opacity: homeWon ? 0.55 : 1 }}
          >
            {match.awayRegistration.team.name[0]}
          </Avatar>
          <Typography
            variant="body2"
            align="center"
            sx={{ fontWeight: awayWon ? 800 : 600, width: '100%' }}
            noWrap
          >
            {match.awayRegistration.team.name}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          mt: 2,
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          color: 'text.secondary',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.6} sx={{ minWidth: 0 }}>
          {isPending ? (
            <PendingActionsRounded sx={{ fontSize: 15, color: 'warning.main' }} />
          ) : (
            <ScheduleRounded sx={{ fontSize: 15 }} />
          )}
          <Typography
            variant="caption"
            noWrap
            sx={{ fontWeight: isPending ? 700 : 500, color: isPending ? 'warning.main' : 'inherit' }}
          >
            {formatDateTimeOrPending(match.scheduledAt)}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          {match.mvpPlayer && (
            <Tooltip
              title={`MVP: ${match.mvpPlayer.firstName} ${match.mvpPlayer.lastName}`}
              arrow
            >
              <MilitaryTechRounded sx={{ fontSize: 17, color: 'warning.main' }} />
            </Tooltip>
          )}
          {match.venue && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
              <PlaceRounded sx={{ fontSize: 15 }} />
              <Typography variant="caption" noWrap>
                {match.venue}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};
