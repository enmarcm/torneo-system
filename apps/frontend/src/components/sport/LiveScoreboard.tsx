import { Card, Box, Typography, Avatar, Stack } from '@mui/material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getStatusLabel } from '@/utils/statusLabels';
import { formatTime, formatDateTimeOrPending, UNSCHEDULED_LABEL } from '@/utils/formatDate';
import { getCompetitionShortLabel } from '@/utils/competitionMeta';
import { joinMatchRoom, leaveMatchRoom, getSocket } from '@/lib/socket';
import type { Match, MatchEvent } from '@/api/matches.api';

interface Props {
  match: Match;
  showFeed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LiveScoreboard: React.FC<Props> = ({ match, showFeed = true, size = 'md' }) => {
  const [score, setScore] = useState({ home: match.homeScore, away: match.awayScore });
  const [status, setStatus] = useState(match.status);
  const [events, setEvents] = useState<MatchEvent[]>(match.events ?? []);

  useEffect(() => {
    setScore({ home: match.homeScore, away: match.awayScore });
    setStatus(match.status);
    if (match.events) setEvents(match.events);
  }, [match]);

  useEffect(() => {
    joinMatchRoom(match.id);
    const s = getSocket();
    const onUpdate = (p: { matchId: string; homeScore?: number; awayScore?: number; status?: string }) => {
      if (p.matchId !== match.id) return;
      setScore((cur) => ({ home: p.homeScore ?? cur.home, away: p.awayScore ?? cur.away }));
      if (p.status) setStatus(p.status as Match['status']);
    };
    const onEvent = (p: { matchId: string; type: string; minute: number; playerId?: string }) => {
      if (p.matchId !== match.id) return;
      setEvents((cur) => [
        { id: `tmp-${Date.now()}`, type: p.type as MatchEvent['type'], minute: p.minute, playerId: p.playerId ?? null, teamRegistrationId: '' } as MatchEvent,
        ...cur,
      ]);
    };
    s.on('match:update', onUpdate);
    s.on('match:event', onEvent);
    return () => {
      leaveMatchRoom(match.id);
      s.off('match:update', onUpdate);
      s.off('match:event', onEvent);
    };
  }, [match.id]);

  const reduceMotion = useReducedMotion();
  const isLive = status === 'LIVE';
  /*
    Un partido que todavía no se jugó no tiene marcador. Mostrar "0 : 0" a 64px
    lo hace parecer un empate consumado, y es justo el dato que alguien después
    repite en un grupo de WhatsApp. En su lugar va cuándo y dónde se juega.
  */
  const notPlayedYet = status === 'SCHEDULED' || status === 'POSTPONED';
  const isFinished = status === 'FINISHED';
  const scoreSize = size === 'lg' ? 64 : size === 'md' ? 48 : 32;

  return (
    <Card sx={{ p: 3, overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          {match.competition && (
            <Typography
              variant="caption"
              sx={{ display: 'block', fontWeight: 800, color: 'primary.main' }}
              noWrap
            >
              {getCompetitionShortLabel(match.competition)}
            </Typography>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 600 }}
            noWrap
          >
            {match.venue ?? 'Sede por confirmar'} ·{' '}
            {match.scheduledAt ? formatTime(match.scheduledAt) : UNSCHEDULED_LABEL}
          </Typography>
        </Box>
        {isLive ? (
          <Box
            component={motion.div}
            animate={reduceMotion ? undefined : { opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999, bgcolor: 'var(--live)', color: 'var(--liveOn)', fontSize: 12, fontWeight: 700 }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
            EN VIVO
          </Box>
        ) : (
          <StatusBadge status={status} />
        )}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack alignItems="center" sx={{ flex: 1 }}>
          <Avatar alt={match.homeRegistration.team.name} src={match.homeRegistration.team.logoUrl ?? undefined} sx={{ width: 64, height: 64, mb: 1 }}>
            {match.homeRegistration.team.name[0]}
          </Avatar>
          <Typography sx={{ fontWeight: 600, textAlign: 'center' }}>{match.homeRegistration.team.name}</Typography>
        </Stack>

        <Stack alignItems="center" sx={{ minWidth: 120 }}>
          {/*
            El marcador cambia solo por socket. Sin `aria-live` el cambio ocurre
            en silencio: quien escucha la pantalla nunca se entera del gol.
          */}
          {notPlayedYet ? (
            <Stack alignItems="center" spacing={0.5}>
              <Typography
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: Math.round(scoreSize * 0.42),
                  color: 'text.secondary',
                  lineHeight: 1,
                }}
              >
                VS
              </Typography>
              <Typography variant="body2" align="center" sx={{ fontWeight: 600 }}>
                {formatDateTimeOrPending(match.scheduledAt)}
              </Typography>
              {match.venue && (
                <Typography variant="caption" color="text.secondary" align="center">
                  {match.venue}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography
              aria-live={isLive ? 'polite' : 'off'}
              aria-atomic="true"
              aria-label={`Marcador: ${match.homeRegistration.team.name} ${score.home}, ${match.awayRegistration.team.name} ${score.away}`}
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: scoreSize,
                fontVariantNumeric: 'tabular-nums',
                color: isLive ? 'var(--live)' : 'text.primary',
                lineHeight: 1,
              }}
            >
              {score.home} : {score.away}
            </Typography>
          )}
          {isFinished && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>Final</Typography>}
        </Stack>

        <Stack alignItems="center" sx={{ flex: 1 }}>
          <Avatar alt={match.awayRegistration.team.name} src={match.awayRegistration.team.logoUrl ?? undefined} sx={{ width: 64, height: 64, mb: 1 }}>
            {match.awayRegistration.team.name[0]}
          </Avatar>
          <Typography sx={{ fontWeight: 600, textAlign: 'center' }}>{match.awayRegistration.team.name}</Typography>
        </Stack>
      </Stack>

      {showFeed && events.length > 0 && (
        <Box sx={{ mt: 3, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Eventos
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1, maxHeight: 180, overflow: 'auto' }}>
            <AnimatePresence initial={false}>
              {events.map((e: MatchEvent) => (
                <motion.div
                  key={e.id}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                    <Typography variant="caption" sx={{ width: 36, fontWeight: 700 }}>
                      {e.minute}&apos;
                    </Typography>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: e.type === 'GOAL' ? 'success.light' : e.type === 'RED' ? 'error.light' : 'warning.light',
                        color: e.type === 'GOAL' ? 'success.dark' : e.type === 'RED' ? 'error.dark' : 'warning.dark',
                        fontSize: 12,
                      }}
                    >
                      {e.type === 'GOAL' ? '⚽' : e.type === 'YELLOW' ? '🟨' : e.type === 'RED' ? '🟥' : '•'}
                    </Box>
                    <Typography variant="body2">
                      {getStatusLabel(e.type)}{e.player ? ` · ${e.player.firstName} ${e.player.lastName}` : ''}
                    </Typography>
                  </Stack>
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        </Box>
      )}
    </Card>
  );
};
