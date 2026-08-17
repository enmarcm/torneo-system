import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TZ: z.string().default('America/Caracas'),
  DATABASE_URL: z.string().min(1),
  BACKEND_PORT: z.coerce.number().default(4000),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_MAX_MB: z.coerce.number().default(5),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),
  // Endpoint INTERNO: el que usa el backend para conectarse a MinIO.
  // Dentro de Docker es el nombre del servicio ("minio"), que el navegador
  // del usuario no puede resolver.
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().default(9000),
  /**
   * Base PÚBLICA desde la que el navegador descarga los archivos del bucket
   * público (por ejemplo https://assets-torneo.enmarcm.site/public-assets).
   * Va separada del endpoint interno a propósito: si se usara el mismo valor,
   * las imágenes quedarían apuntando a un host interno de Docker y no cargarían.
   * Si se omite, se arma con el endpoint interno (sirve para desarrollo local).
   */
  PUBLIC_ASSETS_BASE_URL: z.string().url().optional(),
  MINIO_USE_SSL: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_PUBLIC_BUCKET: z.string().min(1),
  MINIO_PRIVATE_BUCKET: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ .env inválido:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
