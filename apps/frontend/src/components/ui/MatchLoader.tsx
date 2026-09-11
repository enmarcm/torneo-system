import { Box, Typography, useTheme } from '@mui/material';

/*
  Loader de las pantallas de partidos y tablas: una cancha vista desde arriba
  y cuatro reflectores que se encienden en secuencia. Es "La Cancha de Noche"
  literal — el loader cuenta lo mismo que el sistema visual. En claro los conos
  pasan al azul primario, más suaves, para no quemar el papel.
*/

interface Props {
  minHeight?: number | string;
  label?: string;
}

export const MatchLoader: React.FC<Props> = ({ minHeight = 240, label = 'Encendiendo la cancha' }) => {
  const dark = useTheme().palette.mode === 'dark';
  const cone = dark ? 'rgba(255,138,76,0.55)' : 'rgba(3,66,146,0.28)';
  const lamp = dark ? 'var(--accent)' : 'var(--primary)';
  return (
    <Box role="status" aria-label="Cargando" sx={{ minHeight, display: 'grid', placeItems: 'center', py: 4 }}>
      <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1.25 }}>
        <Box
          aria-hidden
          sx={{
            position: 'relative',
            width: 220,
            height: 84,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            // Línea de medio campo y círculo central.
            '&::before': { content: '""', position: 'absolute', left: '50%', top: 14, bottom: 0, width: 1, bgcolor: 'divider' },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 26,
              height: 26,
              m: '-13px 0 0 -13px',
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {[-8, 40, 88, 136].map((left, i) => (
            <Box
              key={left}
              sx={{
                position: 'absolute',
                top: 0,
                left,
                width: 90,
                height: 84,
                opacity: 0,
                background: `radial-gradient(ellipse at 50% 0%, ${cone}, transparent 70%)`,
                animation: 'llfLampOn 2.4s ease-in-out infinite',
                animationDelay: `${i * 300}ms`,
                // La lámpara: una pastilla en el borde superior.
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: 8,
                  height: 4,
                  ml: '-4px',
                  borderRadius: '0 0 4px 4px',
                  bgcolor: lamp,
                },
              }}
            />
          ))}
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};
