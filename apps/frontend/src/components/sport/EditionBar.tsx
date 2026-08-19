import { Box, Stack, Typography } from '@mui/material';
import { EmojiEventsRounded } from '@mui/icons-material';

interface Props {
  name: string;
  seasonNumber: number;
  liveCount: number;
}

/**
 * Franja de contexto de la home pública: en qué edición estamos y cuántos
 * partidos hay en vivo, en una sola línea.
 *
 * Reemplaza al hero grande porque eran tres datos ocupando el alto de una
 * tarjeta entera: lo primero que ve el visitante tienen que ser los partidos,
 * no el nombre de la temporada.
 */
export const EditionBar: React.FC<Props> = ({ name, seasonNumber, liveCount }) => {
  const isLive = liveCount > 0;

  return (
    <Box
      sx={{
        borderRadius: 2,
        px: { xs: 2, md: 2.5 },
        py: 1.25,
        minHeight: 56,
        color: '#fff',
        background: 'var(--heroGradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: 'wrap',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
        <EmojiEventsRounded sx={{ fontSize: 20, opacity: 0.9, flexShrink: 0 }} />
        <Typography
          component="h1"
          noWrap
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: { xs: 16, md: 18 },
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            whiteSpace: 'nowrap',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          · Temporada {seasonNumber}
        </Typography>
      </Stack>

      {/* En rojo solo cuando hay algo que mirar: un "0 EN VIVO" en rojo miente. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          bgcolor: isLive ? 'var(--live)' : 'rgba(255,255,255,0.12)',
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#fff',
            ...(isLive ? { animation: 'pulse 1.4s infinite' } : { opacity: 0.5 }),
          }}
        />
        <Box component="span">{liveCount} EN VIVO</Box>
      </Stack>
    </Box>
  );
};
