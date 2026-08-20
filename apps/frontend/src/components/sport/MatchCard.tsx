import { Card, Box, Stack, Avatar, Typography, Chip, Tooltip } from '@mui/material';
import {
  ScheduleRounded,
  PlaceRounded,
  MilitaryTechRounded,
  PendingActionsRounded,
  StarRounded,
} from '@mui/icons-material';
import { motion, useReducedMotion } from 'framer-motion';
import { formatDateTimeOrPending } from '@/utils/formatDate';
import { getStatusLabel } from '@/utils/statusLabels';
import type { Match } from '@/api/matches.api';

interface Props {
  match: Match;
  onClick?: () => void;
  /** Muestra la jornada / ronda arriba a la izquierda. */
  showStage?: boolean;
  /**
   * Nombre de la competición. Se muestra cuando la lista mezcla torneos, para
   * que se sepa si el partido es de una división, de la copa o de menores.
   */
  competitionLabel?: string;
  /**
   * Etiqueta de estado. Se apaga cuando la sección que contiene la tarjeta ya lo
   * dice: seis chips "Programado" idénticos bajo el título "Próximos partidos"
   * no distinguen nada, solo repiten.
   */
  showStatus?: boolean;
  /** Versión chica: menos aire, escudos y marcador más contenidos. */
  compact?: boolean;
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

export const MatchCard: React.FC<Props> = ({
  match,
  onClick,
  showStage = true,
  competitionLabel,
  showStatus = true,
  compact = false,
}) => {
  /*
    El bloque CSS de prefers-reduced-motion no alcanza acá: framer-motion anima
    por JS y sigue destellando igual. Hay que preguntarle a la preferencia.
  */
  const reduceMotion = useReducedMotion();
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
      // Una tarjeta que se puede tocar tiene que poder alcanzarse con el teclado
      // y anunciarse como acción; un div con onClick no es ninguna de las dos.
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        position: 'relative',
        p: compact ? 1.5 : { xs: 2, md: 2.5 },
        pl: compact ? 2 : { xs: 2.5, md: 3 },
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
        sx={{ mb: compact ? 1.25 : 2 }}
      >
        {(showStage || competitionLabel) && (
          <Box sx={{ minWidth: 0 }}>
            {competitionLabel && (
              <Typography
                variant="caption"
                sx={{ display: 'block', fontWeight: 800, color: 'primary.main', letterSpacing: 0.3 }}
                noWrap
              >
                {competitionLabel}
              </Typography>
            )}
            {showStage && (
              <Typography
                variant="caption"
                sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', letterSpacing: 0.3 }}
                noWrap
              >
                {stageLabel(match)}
              </Typography>
            )}
          </Box>
        )}
        {match.featured && (
          <Tooltip title="Partido destacado de la jornada" arrow>
            <StarRounded sx={{ fontSize: 18, color: 'var(--accent)', flexShrink: 0 }} />
          </Tooltip>
        )}
        {isLive ? (
          <Box
            component={motion.div}
            animate={reduceMotion ? undefined : { opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1,
              py: 0.35,
              borderRadius: 999,
              bgcolor: 'var(--live)',
              color: 'var(--liveOn)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor' }} />
            EN VIVO
          </Box>
        ) : showStatus ? (
          <Chip
            size="small"
            variant="outlined"
            label={getStatusLabel(match.status)}
            sx={{ height: 22, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
          />
        ) : null}
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Stack alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            alt={match.homeRegistration.team.name}
            src={match.homeRegistration.team.logoUrl ?? undefined}
            sx={{ width: compact ? 34 : 48, height: compact ? 34 : 48, opacity: awayWon ? 0.55 : 1 }}
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
                fontSize: compact ? 22 : { xs: 26, md: 30 },
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
            alt={match.awayRegistration.team.name}
            src={match.awayRegistration.team.logoUrl ?? undefined}
            sx={{ width: compact ? 34 : 48, height: compact ? 34 : 48, opacity: homeWon ? 0.55 : 1 }}
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
          mt: compact ? 1.25 : 2,
          pt: compact ? 1 : 1.5,
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
              {/*
                El ámbar marca lo que falta ("Por programar"); el logro es del
                acento, que hasta ahora no aparecía en ninguna pantalla pública.
              */}
              <MilitaryTechRounded sx={{ fontSize: 17, color: 'var(--accent)' }} />
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
