import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '@/config/env';

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });
  io.on('connection', (socket) => {
    socket.on('join', (room: string) => socket.join(room));
    socket.on('leave', (room: string) => socket.leave(room));
  });
  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
};

/**
 * Sala global de partidos.
 *
 * Las novedades de un partido viajaban solo a `match:{id}`, así que únicamente
 * las veía quien tenía ese partido abierto. Las pantallas que muestran varios a
 * la vez —la portada, el calendario, la de en vivo— quedaban con el marcador
 * congelado desde que cargaron. Cada novedad se emite ahora también acá, para
 * que un oyente único pueda seguir todos los partidos sin entrar a ninguno.
 */
export const MATCHES_ROOM = 'matches';

interface MatchUpdate {
  matchId: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
}

/** Marcador o estado de un partido, a quien lo mira de cerca y a quien mira la lista. */
export const emitMatchUpdate = (payload: MatchUpdate) => {
  const server = getIo();
  server.to(`match:${payload.matchId}`).emit('match:update', payload);
  server.to(MATCHES_ROOM).emit('match:update', payload);
};

/**
 * El fixture cambió: se creó, se borró, se programó o se sorteó un partido.
 *
 * No lleva datos porque la novedad no es de un partido concreto sino de qué
 * partidos existen y en qué lista cae cada uno — de hoy, destacados, próximos.
 * Parchear filas no alcanza: quien escucha tiene que volver a preguntar.
 *
 * Sin esto, cargar un partido desde administración no se veía en la portada
 * hasta que alguien recargaba la página.
 */
export const emitMatchListChanged = () => {
  // Silencioso si todavía no hay socket: es aviso, no parte del resultado.
  if (!io) return;
  io.to(MATCHES_ROOM).emit('match:list');
};

/**
 * Gol o tarjeta. Mismo doble destino que el marcador.
 *
 * Viaja el nombre del jugador y no solo su id: quien mira el partido en vivo
 * ve el gol en el momento en que se carga, y con el id suelto la línea decía
 * "Gol" a secas hasta que la pantalla volviera a pedir el detalle.
 */
export const emitMatchEvent = (payload: {
  matchId: string;
  type: string;
  minute: number;
  playerId?: string | null;
  playerName?: string | null;
  teamRegistrationId: string;
}) => {
  const server = getIo();
  server.to(`match:${payload.matchId}`).emit('match:event', payload);
  server.to(MATCHES_ROOM).emit('match:event', payload);
};
