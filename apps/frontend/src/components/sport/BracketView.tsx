import { Box, Card, Stack, Typography, Avatar, Chip } from '@mui/material';
import { EmojiEventsRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getStatusLabel } from '@/utils/statusLabels';
import type { BracketRound, KnockoutTie, TieSide } from '@/api/knockout.api';

interface Props {
  rounds: BracketRound[];
  onTieClick?: (tie: KnockoutTie) => void;
}

/** Marcador global de la llave: suma de ida y vuelta. */
const aggregate = (tie: KnockoutTie) => {
  if (!tie.homeRegistrationId || tie.matches.length === 0) return null;
  let home = 0;
  let away = 0;
  let anyPlayed = false;
  for (const m of tie.matches) {
    if (m.status !== 'FINISHED') continue;
    anyPlayed = true;
    if (m.homeRegistrationId === tie.homeRegistrationId) {
      home += m.homeScore;
      away += m.awayScore;
    } else {
      home += m.awayScore;
      away += m.homeScore;
    }
  }
  return anyPlayed ? { home, away } : null;
};

const TeamRow: React.FC<{
  side: TieSide | null;
  score: number | null;
  isWinner: boolean;
  decided: boolean;
}> = ({ side, score, isWinner, decided }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      py: 0.75,
      px: 1,
      borderRadius: 1,
      bgcolor: isWinner ? 'success.soft' : 'transparent',
      opacity: decided && !isWinner ? 0.55 : 1,
      minWidth: 0,
    }}
  >
    {side ? (
      <>
        <Avatar src={side.team.logoUrl ?? undefined} sx={{ width: 24, height: 24, fontSize: 11 }}>
          {side.team.name[0]}
        </Avatar>
        <Typography
          variant="body2"
          sx={{ flex: 1, fontWeight: isWinner ? 800 : 500, minWidth: 0 }}
          noWrap
        >
          {side.team.name}
        </Typography>
      </>
    ) : (
      <>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '1px dashed',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" color="text.disabled" sx={{ flex: 1 }} noWrap>
          Por definir
        </Typography>
      </>
    )}
    <Typography
      sx={{
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 18,
        textAlign: 'right',
        color: score === null ? 'text.disabled' : 'text.primary',
      }}
    >
      {score ?? '–'}
    </Typography>
  </Stack>
);

/**
 * Cuadro de eliminatoria en columnas: una por ronda, de octavos a la final.
 * En pantallas chicas se desplaza en horizontal en vez de romper el layout.
 */
export const BracketView: React.FC<Props> = ({ rounds, onTieClick }) => {
  if (rounds.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <EmojiEventsRounded sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">
          Todavía no se generó el cuadro de eliminatoria.
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto', pb: 1 }}>
      <Stack direction="row" spacing={2} sx={{ minWidth: 'min-content' }}>
        {rounds.map((round) => (
          <Stack key={round.stage} spacing={1.5} sx={{ minWidth: 250 }}>
            <Typography
              variant="caption"
              align="center"
              sx={{ fontWeight: 800, letterSpacing: 0.6, color: 'text.secondary' }}
            >
              {getStatusLabel(round.stage).toUpperCase()}
            </Typography>

            <Stack
              spacing={1.5}
              sx={{ height: '100%', justifyContent: 'space-around', flex: 1 }}
            >
              {round.ties.map((tie, i) => {
                const agg = aggregate(tie);
                const decided = !!tie.winnerRegistrationId;
                return (
                  <Card
                    key={tie.id}
                    component={motion.div}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                    whileHover={onTieClick ? { y: -2 } : undefined}
                    onClick={onTieClick ? () => onTieClick(tie) : undefined}
                    sx={{ p: 1, cursor: onTieClick ? 'pointer' : 'default' }}
                  >
                    <TeamRow
                      side={tie.homeRegistration}
                      score={agg ? agg.home : null}
                      isWinner={tie.winnerRegistrationId === tie.homeRegistrationId && decided}
                      decided={decided}
                    />
                    <TeamRow
                      side={tie.awayRegistration}
                      score={agg ? agg.away : null}
                      isWinner={tie.winnerRegistrationId === tie.awayRegistrationId && decided}
                      decided={decided}
                    />
                    {tie.twoLegged && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label="Ida y vuelta"
                        sx={{ height: 18, fontSize: 10, mt: 0.5, ml: 1 }}
                      />
                    )}
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
