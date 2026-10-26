import http from 'http';
import { createApp } from '@/app';
import { initSocket } from '@/lib/socket';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

process.on('uncaughtException', (err) => {
  logger.error('Excepción no capturada', { error: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada no manejada', { reason: String(reason) });
});

const server = http.createServer(createApp());
initSocket(server);
server.listen(env.BACKEND_PORT, () => {
  logger.info(`API escuchando en :${env.BACKEND_PORT}`);
});
