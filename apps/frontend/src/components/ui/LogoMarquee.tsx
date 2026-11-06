import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';

/**
 * Segundos que tarda cada logo en cruzar. Fija la velocidad, no la duración:
 * con más logos la tira no se acelera.
 */
const SEGUNDOS_POR_LOGO = 4;

/*
  El corrimiento exacto va por variable CSS porque depende de cuánto mide un
  grupo, que solo se sabe midiendo en pantalla. Al desplazarse justo el ancho de
  un grupo, el siguiente queda calcado en su lugar y el bucle no tiene costura.
*/
const desplazar = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(var(--llf-desplazamiento)); }
`;

const SEPARACION = { xs: 1, md: 2 };

interface Props {
  /** Imágenes de la tira, en orden. Se precargan para poder medirla entera. */
  srcs: string[];
  /** Dibuja el logo `indice`. `copia` es true en las repeticiones del bucle. */
  renderItem: (indice: number, copia: boolean) => React.ReactNode;
  ariaLabel?: string;
  sx?: object;
}

/**
 * Tira de logos que se desplaza sola y en bucle, de lado a lado.
 *
 * Es la misma mecánica que la tira de escudos de la portada: se repite la fila
 * hasta pasar el ancho del marco, se mide un grupo y se corre exactamente ese
 * ancho, de modo que no hay costura. Se frena al pasar el cursor por encima.
 */
export const LogoMarquee: React.FC<Props> = ({ srcs, renderItem, ariaLabel, sx }) => {
  const marcoRef = useRef<HTMLDivElement | null>(null);
  const grupoRef = useRef<HTMLDivElement | null>(null);
  const [repeticiones, setRepeticiones] = useState(2);
  const [anchoGrupo, setAnchoGrupo] = useState(0);
  const [listo, setListo] = useState(false);

  // Sin las imágenes cargadas la fila no tiene ancho que medir.
  const clave = srcs.join('|');
  useEffect(() => {
    let vivos = true;
    Promise.all(
      srcs.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          }),
      ),
    ).then(() => {
      if (vivos) setListo(true);
    });
    // Si un logo tarda una eternidad, la tira no se queda escondida esperándolo.
    const tope = setTimeout(() => {
      if (vivos) setListo(true);
    }, 2500);
    return () => {
      vivos = false;
      clearTimeout(tope);
    };
  }, [clave]);

  useLayoutEffect(() => {
    const medir = () => {
      const marco = marcoRef.current?.getBoundingClientRect().width ?? 0;
      const grupo = grupoRef.current?.getBoundingClientRect().width ?? 0;
      if (marco < 1 || grupo < 1) return;
      // Se ignoran las variaciones de menos de un píxel para que el observador
      // no se realimente solo.
      setAnchoGrupo((prev) => (Math.abs(prev - grupo) > 1 ? grupo : prev));
      setRepeticiones(Math.max(2, Math.ceil(marco / grupo) + 1));
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (marcoRef.current) ro.observe(marcoRef.current);
    if (grupoRef.current) ro.observe(grupoRef.current);
    return () => ro.disconnect();
  }, [srcs.length, listo]);

  return (
    <Box
      ref={marcoRef}
      aria-label={ariaLabel}
      sx={{
        overflow: 'hidden',
        // Los extremos se desvanecen: los logos no se cortan de golpe en el borde.
        maskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
        // Aparece cuando ya están todos: a medio cargar la tira se ve a pedazos.
        opacity: listo ? 1 : 0,
        transition: 'opacity 0.4s ease',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          '--llf-desplazamiento': `-${anchoGrupo}px`,
          animation: anchoGrupo
            ? `${desplazar} ${srcs.length * SEGUNDOS_POR_LOGO}s linear infinite`
            : 'none',
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {Array.from({ length: repeticiones }).map((_, i) => (
          <Box
            // Solo se mide el primero: todos los grupos son idénticos.
            ref={i === 0 ? grupoRef : undefined}
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              columnGap: SEPARACION,
              pr: SEPARACION,
              flexShrink: 0,
            }}
          >
            {srcs.map((_, n) => renderItem(n, i > 0))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
