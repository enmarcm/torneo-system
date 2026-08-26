import { Box, Stack, Tooltip } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useReducedMotion } from 'framer-motion';
import { usePublicTeamsQuery } from '@/hooks/queries';
import type { Team } from '@/api/teams.api';

/**
 * A partir de cuántos escudos la tira pasa a moverse.
 *
 * Con pocos entran todos a la vez y girarlos sería movimiento porque sí: no hay
 * nada que el visitante se esté perdiendo. Con muchos, quedarse quietos
 * significa que los últimos no se ven nunca.
 */
const UMBRAL_CARRUSEL = 8;

/**
 * Segundos que tarda cada escudo en cruzar. Fija la velocidad, no la duración:
 * así una liga de diez equipos y una de treinta se mueven igual de lento, en
 * vez de acelerarse cuando hay más.
 */
const SEGUNDOS_POR_ESCUDO = 3.5;

/* Media vuelta: la lista va duplicada, así que al -50% el ciclo cierra sin salto. */
const desplazar = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;

interface Props {
  /** Alto de cada escudo. Todos van al mismo, como la tira de logos del pie. */
  size?: { xs: number; md: number };
  /**
   * Con `true` la tira se atenúa para fondo oscuro. Sobre la portada los
   * escudos compiten con la foto; bajarles el brillo los deja de acento.
   */
  onDark?: boolean;
  /** Tope de escudos a mostrar. Sin tope se muestran todos los que haya. */
  max?: number;
  sx?: object;
}

/**
 * Tira de escudos de los equipos, en la misma clave que la tira de logos del
 * pie: sin fondo, todos al mismo alto y sin caja alrededor.
 *
 * Se muestran solo los equipos que tienen escudo cargado. Uno sin escudo
 * entraría como un hueco o como una inicial suelta, y la tira dejaría de leerse
 * como una fila de emblemas para parecer una lista a medio cargar.
 *
 * Cuando hay muchos, la fila se desplaza sola y en bucle. Va lenta a propósito:
 * está detrás del contenido de la portada y compite con él, así que tiene que
 * poder ignorarse.
 */
export const TeamCrestStrip: React.FC<Props> = ({
  size = { xs: 30, md: 38 },
  onDark = false,
  max,
  sx,
}) => {
  const { data: teams = [] } = usePublicTeamsQuery();
  const reduceMotion = useReducedMotion();

  const conEscudo = teams.filter((t) => t.logoUrl && t.status === 'ACTIVE');
  const lista = max ? conEscudo.slice(0, max) : conEscudo;

  // Sin escudos cargados no se deja una franja vacía: no se dibuja nada.
  if (lista.length === 0) return null;

  const escudo = (t: Team, key: string, decorativo = false) => (
    <Tooltip key={key} title={t.name} arrow disableInteractive>
      <Box
        component="img"
        src={t.logoUrl ?? undefined}
        // El clon del carrusel es el mismo escudo repetido: nombrarlo dos veces
        // se lo dicta dos veces a quien usa lector de pantalla.
        alt={decorativo ? '' : t.name}
        aria-hidden={decorativo || undefined}
        loading="lazy"
        sx={{
          height: size,
          width: 'auto',
          maxWidth: 88,
          flexShrink: 0,
          // Cada escudo viene con su forma: entra entero, sin recorte, igual
          // que en la tabla de posiciones.
          objectFit: 'contain',
          display: 'block',
          opacity: onDark ? 0.72 : 0.85,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          ...(onDark && { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }),
          '&:hover': { opacity: 1, transform: 'translateY(-2px)' },
        }}
      />
    </Tooltip>
  );

  /*
    Pocos escudos, o movimiento reducido: fila quieta y centrada. La regla de
    `prefers-reduced-motion` del tema ya frena la animación, pero dejaría el
    carrusel congelado en su primer cuadro, mostrando siempre los mismos
    escudos; acá se cambia por una fila que los muestra todos.
  */
  if (lista.length < UMBRAL_CARRUSEL || reduceMotion) {
    return (
      <Stack
        direction="row"
        useFlexGap
        aria-label="Equipos de la liga"
        sx={{
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: { xs: 1.75, md: 2.75 },
          rowGap: 1.25,
          ...sx,
        }}
      >
        {lista.map((t) => escudo(t, t.id))}
      </Stack>
    );
  }

  return (
    <Box
      aria-label="Equipos de la liga"
      sx={{
        overflow: 'hidden',
        /*
          Los extremos se desvanecen: sin esto los escudos aparecen y
          desaparecen de golpe contra el borde, y se ve el corte en vez del
          movimiento.
        */
        maskImage:
          'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          columnGap: { xs: 1.75, md: 2.75 },
          pr: { xs: 1.75, md: 2.75 },
          animation: `${desplazar} ${lista.length * SEGUNDOS_POR_ESCUDO}s linear infinite`,
          // Se frena al pasar por encima, para poder mirar un escudo puntual.
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {lista.map((t) => escudo(t, t.id))}
        {/* La copia es lo que hace el bucle continuo: al llegar al -50% el ojo ya está viendo esta. */}
        {lista.map((t) => escudo(t, `${t.id}-clon`, true))}
      </Box>
    </Box>
  );
};
