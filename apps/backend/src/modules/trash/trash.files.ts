import { prisma } from '@/lib/prisma';
import { minioClient } from '@/lib/minio';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import type { Snapshot } from './trash.collectors';

type Item = { payload: unknown };

/** Clave del objeto dentro del bucket público a partir de su URL, o null si no es de ese bucket. */
export const publicKeyFromUrl = (url?: string | null) => {
  const marker = `/${env.MINIO_PUBLIC_BUCKET}/`;
  const at = url ? url.indexOf(marker) : -1;
  return url && at >= 0 ? decodeURIComponent(url.slice(at + marker.length).split('?')[0]) : null;
};

/** Archivos que cuelgan de los jugadores fotografiados en la papelera. */
const filesOf = (items: Item[]) => {
  const identity = new Set<string>();
  const photos = new Set<string>();
  for (const { payload } of items) {
    for (const row of (payload as Snapshot | null)?.rows?.player ?? []) {
      if (typeof row.identityPhotoKey === 'string' && row.identityPhotoKey) identity.add(row.identityPhotoKey);
      const photo = publicKeyFromUrl(row.photoUrl as string | null);
      if (photo) photos.add(photo);
    }
  }
  return { identity: [...identity], photos: [...photos] };
};

/**
 * Borra de MinIO las fotos (y el documento de identidad) de los jugadores que
 * ya no se pueden restaurar. Se llama cuando el elemento sale de la papelera:
 * antes de eso las fotos tienen que seguir ahí, o restaurar dejaría fichas sin
 * imagen.
 *
 * Un archivo que otro jugador vivo todavía usa se respeta. Es mejor esfuerzo:
 * un fallo de MinIO no debe impedir vaciar la papelera, solo queda en el log.
 */
export const discardTrashFiles = async (items: Item[]) => {
  const { identity, photos } = filesOf(items);
  if (!identity.length && !photos.length) return;

  const [liveIdentity, livePhotos] = await Promise.all([
    prisma.player.findMany({ where: { identityPhotoKey: { in: identity } }, select: { identityPhotoKey: true } }),
    prisma.player.findMany({ where: { photoUrl: { not: null } }, select: { photoUrl: true } }),
  ]);
  const keepIdentity = new Set(liveIdentity.map((p) => p.identityPhotoKey));
  const keepPhotos = new Set(livePhotos.map((p) => publicKeyFromUrl(p.photoUrl)));

  const remove = async (bucket: string, keys: string[]) => {
    if (!keys.length) return;
    try {
      await minioClient.removeObjects(bucket, keys);
    } catch (err) {
      logger.warn(`No se pudieron borrar archivos de ${bucket}: ${(err as Error).message}`);
    }
  };
  await remove(env.MINIO_PRIVATE_BUCKET, identity.filter((k) => !keepIdentity.has(k)));
  await remove(env.MINIO_PUBLIC_BUCKET, photos.filter((k) => !keepPhotos.has(k)));
};
