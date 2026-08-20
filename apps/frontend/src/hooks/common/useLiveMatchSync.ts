import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import type { Match } from '@/api/matches.api';

interface MatchUpdate {
  matchId: string;
  status?: Match['status'];
  homeScore?: number;
  awayScore?: number;
}

/** Sala global del backend: por acá pasan las novedades de todos los partidos. */
const MATCHES_ROOM = 'matches';

/**
 * Mantiene el marcador al día en cualquier pantalla que liste partidos.
 *
 * Antes, el único oyente del socket vivía dentro del marcador grande, así que
 * una tarjeta de la portada mostraba el resultado del momento en que cargó la
 * página y no se movía nunca más. Peor: al abrir el detalle se veía el marcador
 * real y al cerrarlo la tarjeta de atrás seguía mintiendo, porque las novedades
 * nunca entraban al caché.
 *
 * Este oyente escribe directamente sobre las consultas `['public','matches']`
 * que haya en memoria, así la lista y el detalle leen siempre el mismo número.
 * Se monta una sola vez, en el layout público.
 */
export const useLiveMatchSync = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', MATCHES_ROOM);

    const onUpdate = (payload: MatchUpdate) => {
      if (!payload?.matchId) return;

      qc.setQueriesData<Match[]>({ queryKey: ['public', 'matches'] }, (matches) => {
        if (!matches) return matches;
        let touched = false;
        const next = matches.map((m) => {
          if (m.id !== payload.matchId) return m;
          touched = true;
          return {
            ...m,
            status: payload.status ?? m.status,
            homeScore: payload.homeScore ?? m.homeScore,
            awayScore: payload.awayScore ?? m.awayScore,
          };
        });
        // Sin coincidencias se devuelve el arreglo original: reemplazarlo por una
        // copia idéntica volvería a renderizar la lista entera por nada.
        return touched ? next : matches;
      });

      /*
        Un partido que arranca o termina cambia de lista, y eso no se resuelve
        parcheando filas: hay que volver a preguntar. Se invalida en vez de
        reescribir para que cada consulta traiga los partidos que le tocan.
      */
      if (payload.status === 'LIVE' || payload.status === 'FINISHED') {
        void qc.invalidateQueries({ queryKey: ['public', 'matches'] });
      }
    };

    /*
      El fixture cambió: se creó, se borró, se programó o se sorteó un partido.
      Acá no hay fila que parchear —lo que cambió es qué partidos existen y en
      qué lista cae cada uno— así que se vuelve a preguntar. Sin esto, cargar un
      partido desde administración no se veía en la portada hasta que alguien
      recargaba la página.
    */
    const onListChanged = () => {
      void qc.invalidateQueries({ queryKey: ['public', 'matches'] });
      void qc.invalidateQueries({ queryKey: ['matches'] });
    };

    socket.on('match:update', onUpdate);
    socket.on('match:list', onListChanged);
    return () => {
      socket.emit('leave', MATCHES_ROOM);
      socket.off('match:update', onUpdate);
      socket.off('match:list', onListChanged);
    };
  }, [qc]);
};
