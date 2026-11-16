import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';

/**
 * Error de documento repetido. "Desactivar" no libera la cédula (la ficha sigue
 * ahí y el documento es único), así que se dice quién la tiene y qué hacer, en
 * vez de un 409 mudo que parece un borrado que no funcionó.
 */
export const duplicatePlayerError = (existing: { firstName: string; lastName: string; status: string }) => {
  const who = `${existing.firstName} ${existing.lastName}`;
  return existing.status === 'INACTIVE'
    ? new AppError(
        409,
        `Ese documento ya pertenece a ${who}, que está desactivado. Búscalo en Jugadores y reactívalo, o elimínalo definitivamente para volver a registrarlo.`,
        'DUPLICATE_INACTIVE',
      )
    : new AppError(409, `${MESSAGES.duplicatePlayer}: ${who}`, 'DUPLICATE');
};
