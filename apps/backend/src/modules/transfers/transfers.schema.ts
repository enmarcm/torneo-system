import { z } from 'zod';

export const createTransferSchema = z.object({
  playerId: z.string().uuid(),
  editionId: z.string().uuid(),
  fromRegistrationId: z.string().uuid().optional(),
  toRegistrationId: z.string().uuid(),
});
export const transferStatusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });
