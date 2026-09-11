import { Box } from '@mui/material';
import { useLayoutEffect, useState, type DependencyList, type RefObject } from 'react';

interface Props {
  /** La lista que contiene los ítems; tiene que ser `position: relative`. */
  containerRef: RefObject<HTMLElement | null>;
  /** Cuando cambia algo de esto se vuelve a medir (ruta, plegado, filtro de roles). */
  deps: DependencyList;
}

const H = 22;

/**
 * Un solo indicador naranja de 3px que viaja entre los ítems de un menú en
 * vez de apagarse en uno y prenderse en otro. Se apoya en el ítem marcado
 * con `data-nav-active="true"`, así cada menú sigue decidiendo por su cuenta
 * qué está activo y este solo lo mide.
 */
export const RailIndicator: React.FC<Props> = ({ containerRef, deps }) => {
  const [top, setTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = containerRef.current?.querySelector<HTMLElement>('[data-nav-active="true"]');
      setTop(el ? el.offsetTop + (el.offsetHeight - H) / 2 : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (top === null) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        left: 0,
        top,
        width: 3,
        height: H,
        borderRadius: 3,
        bgcolor: 'var(--accent)',
        transition: 'top 0.28s cubic-bezier(.2,.8,.2,1)',
        pointerEvents: 'none',
      }}
    />
  );
};
