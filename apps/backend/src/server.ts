import http from 'http';
import { createApp } from '@/app';
import { initSocket } from '@/lib/socket';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

const server = http.createServer(createApp());
initSocket(server);
server.listen(env.BACKEND_PORT, () => {
  logger.info(`API escuchando en :${env.BACKEND_PORT}`);
});
