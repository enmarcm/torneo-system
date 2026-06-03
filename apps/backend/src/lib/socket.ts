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
