import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const joinMatchRoom = (matchId: string) => {
  getSocket().emit('join', `match:${matchId}`);
};

export const leaveMatchRoom = (matchId: string) => {
  getSocket().emit('leave', `match:${matchId}`);
};
