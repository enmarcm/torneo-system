import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePublicEditionsQuery, usePublicCompetitionsQuery } from '@/hooks/queries';
import { sortCompetitions } from '@/utils/competitionMeta';
import type { Edition } from '@/api/editions.api';
import type { Competition } from '@/api/competitions.api';

export const ALL_COMPETITIONS = '';

/**
 * Contexto común de las pantallas públicas: en qué edición estamos y qué
 * competición se está mirando. Por defecto arranca en la edición en curso, que
 * es lo que espera ver quien entra sin elegir nada.
 */
export const usePublicScope = () => {
  const { data: editions = [], isLoading: editionsLoading } = usePublicEditionsQuery();

  /*
    La elección vive en la URL y no en el estado del componente. El producto se
    distribuye pegando enlaces: si la competición elegida no viaja en el enlace,
    no existe forma de mandarle a alguien la tabla de Primera, que es justo el
    gesto con el que se cierra una discusión.
  */
  const [params, setParams] = useSearchParams();
  const pickedEditionId = params.get('e') ?? '';
  const pickedCompetitionId = params.get('c') ?? ALL_COMPETITIONS;

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setEditionId = useCallback((id: string) => setParam('e', id), [setParam]);
  const setCompetitionId = useCallback((id: string) => setParam('c', id), [setParam]);

  const currentEdition: Edition | undefined = useMemo(
    () => editions.find((e: Edition) => e.status === 'ACTIVE') ?? editions[0],
    [editions],
  );
  const edition: Edition | undefined =
    editions.find((e: Edition) => e.id === pickedEditionId) ?? currentEdition;

  const { data: rawCompetitions = [], isLoading: competitionsLoading } = usePublicCompetitionsQuery(
    edition?.id,
  );
  const competitions = useMemo(
    () => sortCompetitions(rawCompetitions as Competition[]),
    [rawCompetitions],
  );

  // Al cambiar de edición la competición elegida deja de existir: se vuelve a "todas".
  const competitionId = competitions.some((c) => c.id === pickedCompetitionId)
    ? pickedCompetitionId
    : ALL_COMPETITIONS;
  const competition = competitions.find((c) => c.id === competitionId);

  return {
    editions,
    edition,
    editionId: edition?.id ?? '',
    isCurrentEdition: !!edition && edition.id === currentEdition?.id,
    setEditionId,
    competitions,
    competition,
    competitionId,
    setCompetitionId,
    /** Competiciones que hay que pintar según el filtro elegido. */
    visibleCompetitions: competition ? [competition] : competitions,
    isLoading: editionsLoading || competitionsLoading,
  };
};
