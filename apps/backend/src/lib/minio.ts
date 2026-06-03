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

export const publicUrl = (bucket: string, key: string) => {
  const proto = env.MINIO_USE_SSL ? 'https' : 'http';
  return `${proto}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucket}/${key}`;
};
