import { AppError } from '@/utils/app-error';
import { minioClient } from '@/lib/minio';
import { env } from '@/config/env';

export const validatePlayerPhotos = async (player: { photoUrl?: string | null; identityPhotoKey?: string | null }) => {
  if (!player.photoUrl?.trim() || !player.identityPhotoKey?.trim()) {
    throw new AppError(422, 'La foto del jugador y la foto del documento son obligatorias', 'PLAYER_PHOTOS_REQUIRED');
  }
  try { await minioClient.statObject(env.MINIO_PRIVATE_BUCKET, player.identityPhotoKey); }
  catch { throw new AppError(422, 'La foto del documento no está disponible. Vuelve a subirla', 'IDENTITY_PHOTO_MISSING'); }
};

export const assertIdentityPhotoOwner = (user: { id: string; role: string }, key?: string | null, currentKey?: string | null) => {
  if (key && key !== currentKey && user.role !== 'ADMIN' && !key.startsWith(`identity/${user.id}/`)) {
    throw new AppError(403, 'No puedes usar el documento de otro usuario', 'FORBIDDEN');
  }
};
