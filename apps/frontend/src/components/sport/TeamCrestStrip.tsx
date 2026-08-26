import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/*
  El corrimiento exacto va por variable CSS porque depende de cuánto mide un
  grupo, que solo se sabe midiendo en pantalla. Al desplazarse justo el ancho de
  un grupo, el siguiente queda calcado en su lugar y el bucle no tiene costura.
*/
const desplazar = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(var(--llf-desplazamiento)); }
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
 * Cuando hay muchos, la fila se desplaza sola y en bucle, de lado a lado de la
 * pantalla. Va lenta a propósito: está detrás del contenido de la portada y
 * compite con él, así que tiene que poder ignorarse.
 */
export const TeamCrestStrip: React.FC<Props> = ({
  size = { xs: 30, md: 38 },
  onDark = false,
  max,
  sx,
}) => {
  const { data: teams = [] } = usePublicTeamsQuery();
  const reduceMotion = useReducedMotion();

  const marcoRef = useRef<HTMLDivElement | null>(null);
  const grupoRef = useRef<HTMLDivElement | null>(null);
  /*
    Cuántas veces se repite la lista. Con una sola copia duplicada, si los
    escudos no llegaban a llenar el ancho de la pantalla quedaba un vacío a la
    derecha y la tira parecía arrancar desde el medio. Se repite hasta pasar el
    ancho del marco, y va una copia de más para cubrir el tramo que se corre.
  */
  const [repeticiones, setRepeticiones] = useState(2);
  const [anchoGrupo, setAnchoGrupo] = useState(0);

  const conEscudo = teams.filter((t) => t.logoUrl && t.status === 'ACTIVE');
  const lista = max ? conEscudo.slice(0, max) : conEscudo;
  const gira = lista.length >= UMBRAL_CARRUSEL && !reduceMotion;

  /*
    Los escudos vienen del bucket a tamaño completo y acá se ven a 38px: si
    llegan tarde, la tira aparece a pedazos. Se precargan para poder mostrarla
    entera de una vez, y de paso para poder medirla: sin las imágenes cargadas,
    la fila no tiene ancho que medir.
  */
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (lista.length === 0) return;
    let vivos = true;
    Promise.all(
      lista.map(
        (t) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = t.logoUrl as string;
          }),
      ),
    ).then(() => {
      if (vivos) setListo(true);
    });
    /*
      Red de seguridad: si un escudo tarda una eternidad, la tira no se queda
      escondida esperándolo. Se muestra igual y ese entra cuando llegue.
    */
    const tope = setTimeout(() => {
      if (vivos) setListo(true);
    }, 2500);
    return () => {
      vivos = false;
      clearTimeout(tope);
    };
    // La lista cambia de identidad en cada render; lo que importa es qué escudos son.
  }, [lista.map((t) => t.id).join(',')]);

  /*
    Se mide después de pintar y se vuelve a medir cuando algo cambia de ancho.

    Hay que observar el grupo y no solo el marco: mientras los escudos no
    cargaron miden cero de ancho —van con alto fijo y ancho automático—, así que
    la primera medición daba un grupo vacío, la cuenta de copias se descartaba y
    la tira quedaba con dos copias y sin moverse. El grupo cambia de ancho justo
    cuando las imágenes entran, y ahí se vuelve a medir.
  */
  useLayoutEffect(() => {
    if (!gira) return;
    const medir = () => {
      const marco = marcoRef.current?.getBoundingClientRect().width ?? 0;
      const grupo = grupoRef.current?.getBoundingClientRect().width ?? 0;
      if (marco < 1 || grupo < 1) return;
      // Se ignoran las variaciones de menos de un píxel: si no, cada medición
      // dispara otra y el observador se realimenta solo.
      setAnchoGrupo((prev) => (Math.abs(prev - grupo) > 1 ? grupo : prev));
      setRepeticiones(Math.max(2, Math.ceil(marco / grupo) + 1));
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (marcoRef.current) ro.observe(marcoRef.current);
    if (grupoRef.current) ro.observe(grupoRef.current);
    return () => ro.disconnect();
  }, [gira, lista.length, listo]);


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
        loading="eager"
        decoding="async"
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
  if (!gira) {
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
          opacity: listo ? 1 : 0,
          transition: 'opacity 0.4s ease',
          ...sx,
        }}
      >
        {lista.map((t) => escudo(t, t.id))}
      </Stack>
    );
  }

  const grupos = Array.from({ length: repeticiones });

  return (
    <Box
      ref={marcoRef}
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
        // Aparece cuando ya están todas: a medio cargar la tira se ve a pedazos.
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
            ? `${desplazar} ${lista.length * SEGUNDOS_POR_ESCUDO}s linear infinite`
            : 'none',
          // Se frena al pasar por encima, para poder mirar un escudo puntual.
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {grupos.map((_, i) => (
          <Box
            // Solo se mide el primero: todos los grupos son idénticos.
            ref={i === 0 ? grupoRef : undefined}
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              columnGap: { xs: 1.75, md: 2.75 },
              pr: { xs: 1.75, md: 2.75 },
              flexShrink: 0,
            }}
          >
            {lista.map((t) => escudo(t, `${t.id}-${i}`, i > 0))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
