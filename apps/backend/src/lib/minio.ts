import { Client } from 'minio';
import { env } from '@/config/env';

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD,
});

export const uploadObject = async (
  bucket: string,
  name: string,
  buffer: Buffer,
  mime: string,
) => {
  await minioClient.putObject(bucket, name, buffer, buffer.length, { 'Content-Type': mime });
  return name;
};

export const presignedGet = (bucket: string, name: string) =>
  minioClient.presignedGetObject(bucket, name, 60 * 60);

/**
 * URL pública de un objeto del bucket abierto.
 *
 * Usa PUBLIC_ASSETS_BASE_URL cuando está definida. NO se puede armar con
 * MINIO_ENDPOINT: en Docker ese valor es el nombre del servicio ("minio"), que
 * solo resuelve dentro de la red de contenedores — el navegador del usuario
 * recibiría http://minio:9000/... y la imagen no cargaría nunca.
 *
 * El fallback al endpoint interno existe solo para desarrollo local, donde
 * MINIO_ENDPOINT suele ser "localhost" y sí es alcanzable desde el navegador.
 */
export const publicUrl = (bucket: string, key: string) => {
  if (env.PUBLIC_ASSETS_BASE_URL) {
    return `${env.PUBLIC_ASSETS_BASE_URL.replace(/\/+$/, '')}/${bucket}/${key}`;
  }
  const proto = env.MINIO_USE_SSL ? 'https' : 'http';
  return `${proto}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucket}/${key}`;
};
