import { z } from 'zod';
import { usernameField } from '@/modules/teams/teams.schema';
import { USER_ROLES } from '@/config/roles';

const roleField = z.enum(USER_ROLES);
const passwordField = z.string().min(12, 'Mínimo 12 caracteres');
/* Vacío o null borran el correo: no es credencial, es un dato de contacto. */
const emailField = z.string().trim().toLowerCase().email().nullish().or(z.literal(''));

export const listUsersSchema = z.object({
  role: roleField.optional(),
  /** Texto libre sobre usuario y correo. */
  q: z.string().trim().optional(),
});

export const createUserSchema = z
  .object({
    username: usernameField,
    password: passwordField,
    email: emailField,
    role: roleField.default('TEAM_LEADER'),
    teamId: z.string().uuid().nullish(),
  })
  .refine((d) => d.role === 'TEAM_LEADER' || !d.teamId, {
    message: 'Solo un líder de equipo puede estar asociado a un club',
    path: ['teamId'],
  });

export const updateUserSchema = z.object({
  username: usernameField.optional(),
  email: emailField,
  role: roleField.optional(),
  teamId: z.string().uuid().nullish(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const updateUserPasswordSchema = z.object({
  password: passwordField,
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
