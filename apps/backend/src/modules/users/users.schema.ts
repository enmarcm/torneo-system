import { z } from 'zod';
import { usernameField } from '@/modules/teams/teams.schema';

export const createUserSchema = z.object({
  username: usernameField,
  password: z.string().min(6),
  teamId: z.string().uuid().optional(),
});
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
