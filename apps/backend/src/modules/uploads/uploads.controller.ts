import sharp from 'sharp';
import { asyncHandler } from '@/utils/async-handler';
import { ok } from '@/utils/http.util';
import { AppError } from '@/utils/app-error';
import { uploadObject, presignedGet, publicUrl } from '@/lib/minio';
import { env } from '@/config/env';
import { IMAGE_MIME, DOC_MIME, MESSAGES, IMAGE_MAX_SIDE, IMAGE_WEBP_QUALITY } from '@/config/constants';
import { randomUUID } from 'crypto';

export const uploadsController = {
  image: asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new AppError(400, 'Archivo requerido', 'NO_FILE');
    if (!IMAGE_MIME.includes(file.mimetype)) {
      throw new AppError(415, MESSAGES.invalidFileType, 'BAD_TYPE');
    }

    // Las fotos de celular llegan de 3-4 MB para mostrarse en un avatar de 48px.
    // Se reescalan y se pasan a WebP: un logo baja de ~3 MB a unas decenas de KB,
    // que es lo que hace que el portal cargue rápido con datos móviles.
    let buffer = file.buffer;
    let mime = file.mimetype;
    let extension = 'webp';
    try {
      buffer = await sharp(file.buffer)
        .rotate() // respeta la orientación EXIF, si no las fotos salen giradas
        .resize({
          width: IMAGE_MAX_SIDE,
          height: IMAGE_MAX_SIDE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: IMAGE_WEBP_QUALITY })
        .toBuffer();
      mime = 'image/webp';
      extension = 'webp';
    } catch {
      throw new AppError(415, MESSAGES.invalidFileType, 'BAD_IMAGE');
    }

    const name = `${randomUUID()}.${extension}`;
    await uploadObject(env.MINIO_PUBLIC_BUCKET, name, buffer, mime);
    ok(
      res,
      {
        key: name,
        bucket: env.MINIO_PUBLIC_BUCKET,
        url: publicUrl(env.MINIO_PUBLIC_BUCKET, name),
        bytes: buffer.length,
        originalBytes: file.size,
      },
      'Subida',
    );
  }),

  document: asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new AppError(400, 'Archivo requerido', 'NO_FILE');
    if (!DOC_MIME.includes(file.mimetype)) {
      throw new AppError(415, MESSAGES.invalidFileType, 'BAD_TYPE');
    }
    const isPdf = file.mimetype === 'application/pdf';
    const isJpeg = file.mimetype === 'image/jpeg';
    const validSignature = isPdf
      ? file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
      : isJpeg
        ? file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff
        : file.buffer[0] === 0x89 && file.buffer.subarray(1, 4).toString('ascii') === 'PNG';
    if (!validSignature) throw new AppError(415, MESSAGES.invalidFileType, 'BAD_SIGNATURE');
    const name = `${randomUUID()}.${isPdf ? 'pdf' : isJpeg ? 'jpg' : 'png'}`;
    await uploadObject(env.MINIO_PRIVATE_BUCKET, name, file.buffer, file.mimetype);
    ok(res, { key: name, bucket: env.MINIO_PRIVATE_BUCKET }, 'Subida');
  }),

  documentUrl: asyncHandler(async (req, res) => {
    const url = await presignedGet(env.MINIO_PRIVATE_BUCKET, req.params.key);
    ok(res, { url });
  }),
};
