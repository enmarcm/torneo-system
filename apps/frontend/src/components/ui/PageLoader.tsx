import { Box } from '@mui/material';
import { JomaBall } from './JomaBall';

/*
  Loader principal del sitio: el balón de la liga rueda de un lado al otro de
  una línea y, arriba, las letras L · L · F se encienden como reflectores en
  el instante en que el balón pasa debajo de cada una. Ida y vuelta duran 3.4 s;
  las letras están calculadas sobre ese ciclo (ver keyframes llfLetter* en el
  tema), así el encendido y el paso del balón nunca se desfasan.

  El giro del balón acompaña al desplazamiento (460° en 176 px para un balón
  de 44 px), así rueda de verdad en vez de patinar.
*/

interface Props {
  /** Alto mínimo del bloque; el loader queda centrado adentro. */
  minHeight?: number | string;
}

const LETTER = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontWeight: 800,
  fontStyle: 'italic',
  fontSize: 44,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  width: 60,
  textAlign: 'center' as const,
  color: 'text.primary',
};

export const PageLoader: React.FC<Props> = ({ minHeight = '60vh' }) => (
  <Box role="status" aria-label="Cargando" sx={{ minHeight, display: 'grid', placeItems: 'center', py: 6 }}>
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }} aria-hidden>
        <Box sx={{ ...LETTER, animation: 'llfLetter1 3.4s linear infinite' }}>L</Box>
        <Box sx={{ ...LETTER, animation: 'llfLetter2 3.4s linear infinite' }}>L</Box>
        <Box sx={{ ...LETTER, animation: 'llfLetter3 3.4s linear infinite' }}>F</Box>
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'relative',
          width: 220,
          height: 64,
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 6,
            height: 2,
            borderRadius: 2,
            bgcolor: 'divider',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 8,
            width: 44,
            height: 44,
            ml: '-22px',
            animation: 'llfRollX 1.7s cubic-bezier(.45,0,.55,1) infinite alternate',
          }}
        >
          <JomaBall
            style={{
              width: 44,
              height: 44,
              display: 'block',
              filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.35))',
              animation: 'llfRollR 1.7s cubic-bezier(.45,0,.55,1) infinite alternate',
            }}
          />
        </Box>
      </Box>
    </Box>
  </Box>
);
