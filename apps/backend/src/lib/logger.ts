import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '@/config/env';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, '../../logs');

const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.simple());

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
});
