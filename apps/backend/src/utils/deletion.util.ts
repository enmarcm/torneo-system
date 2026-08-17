import { AppError } from '@/utils/app-error';

export interface Blocker {
  label: string;
  count: number;
}

/**
 * Regla única de borrado definitivo para todo el sistema.
 *
 * Solo se puede eliminar de verdad lo que NO tiene historial colgando. Si algo
 * ya jugó, se inscribió o dejó registro, se corta con un 409 que dice
 * exactamente qué lo está reteniendo, y se sugiere desactivar en su lugar.
 *
 * El motivo es que un borrado en cascada acá no destruye una fila: destruye
 * partidos, estadísticas y tablas históricas de terceros.
 */
export const assertDeletable = (entity: string, blockers: Blocker[]) => {
  const holding = blockers.filter((b) => b.count > 0);
  if (holding.length === 0) return;

  const detail = holding.map((b) => `${b.count} ${b.label}`).join(', ');
  throw new AppError(
    409,
    `No se puede eliminar definitivamente: ${entity} todavía tiene ${detail}. ` +
      'Desactivalo para conservar el historial.',
    'HAS_DEPENDENCIES',
  );
};
