import { z } from 'zod';

/**
 * Nombre de usuario del delegado. Letras, números, punto, guion y guion bajo:
 * es lo que se escribe para entrar, así que nada de espacios ni acentos.
 */
export const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Mínimo 3 caracteres')
  .max(32, 'Máximo 32 caracteres')
  .regex(/^[a-z0-9._-]+$/, 'Solo letras sin acentos, números, punto, guion y guion bajo');

export const createTeamSchema = z.object({
  name: z.string().min(2),
  // `.nullish()`: el formulario manda null cuando se quita el logo.
  logoUrl: z.string().nullish(),
  /*
    El delegado entra con usuario y contraseña. El correo lo carga él mismo
    desde su panel: pedirlo acá obligaba al administrador a conseguirlo antes
    de poder crear el equipo.
  */
  leaderUsername: usernameField,
  leaderPassword: z.string().min(12),
});
export const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().nullish(),
});
export const teamStatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) });
export const registerTeamSchema = z.object({ competitionId: z.string().uuid() });
