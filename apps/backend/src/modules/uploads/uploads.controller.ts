import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { AppError } from '@/utils/app-error';
import { prisma } from '@/lib/prisma';
import { uploadObject, presignedGet } from '@/lib/minio';
import { env } from '@/config/env';
import { IMAGE_MIME, DOC_MIME, MESSAGES } from '@/config/constants';
import { randomUUID } from 'crypto';

const ext = (name: string) => name.split('.').pop() || 'bin';

export const uploadsController = {
  image: asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new AppError(400, 'Archivo requerido', 'NO_FILE');
    if (!IMAGE_MIME.includes(file.mimetype)) {
      throw new AppError(415, MESSAGES.invalidFileType, 'BAD_TYPE');
    }
    const name = `${randomUUID()}.${ext(file.originalname)}`;
    await uploadObject(env.MINIO_PUBLIC_BUCKET, name, file.buffer, file.mimetype);
    ok(
      res,
      { key: name, bucket: env.MINIO_PUBLIC_BUCKET, url: `${env.MINIO_USE_SSL ? 'https' : 'http'}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_PUBLIC_BUCKET}/${name}` },
      'Subida',
    );
  }),

  document: asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new AppError(400, 'Archivo requerido', 'NO_FILE');
    if (!DOC_MIME.includes(file.mimetype)) {
      throw new AppError(415, MESSAGES.invalidFileType, 'BAD_TYPE');
    }
    const name = `${randomUUID()}.${ext(file.originalname)}`;
    await uploadObject(env.MINIO_PRIVATE_BUCKET, name, file.buffer, file.mimetype);
    await prisma.document.create({
      data: { key: name, bucket: env.MINIO_PRIVATE_BUCKET, userId: req.user?.id ?? null },
    });
    ok(res, { key: name, bucket: env.MINIO_PRIVATE_BUCKET }, 'Subida');
  }),

  documentUrl: asyncHandler(async (req, res) => {
    const doc = await prisma.document.findUnique({ where: { key: req.params.key } });
    if (!doc) throw new AppError(404, 'Documento no encontrado', 'NOT_FOUND');
    if (doc.userId && doc.userId !== req.user?.id) {
      throw new AppError(403, 'No autorizado', 'FORBIDDEN');
    }
    const url = await presignedGet(env.MINIO_PRIVATE_BUCKET, req.params.key);
    ok(res, { url });
  }),
};
