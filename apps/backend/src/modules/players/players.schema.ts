import { z } from 'zod';

export const createPlayerSchema = z.object({
  documentType: z.enum(['CEDULA', 'PARTIDA']),
  documentNumber: z.string().min(3),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.coerce.date(),
  // `.nullish()` en los campos que admiten NULL en la base.
  position: z.string().nullish(),
  photoUrl: z.string().nullish(),
});
export const updatePlayerSchema = createPlayerSchema.partial();
export const playerStatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) });
export const degreeSchema = z.object({
  universityDegreeVerified: z.boolean(),
  degreeDocUrl: z.string().optional(),
});

export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;
