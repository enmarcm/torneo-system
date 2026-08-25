import { z } from 'zod';

/**
 * Se entra con nombre de usuario. Se sigue aceptando `email` por si queda una
 * pestaña abierta con la versión anterior del panel: el servidor busca por
 * usuario o por correo indistintamente.
 */
export const loginSchema = z
  .object({
    username: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    password: z.string().min(1),
  })
  .refine((d) => !!(d.username || d.email), {
    message: 'Indicá tu usuario',
    path: ['username'],
  });

export type LoginDto = z.infer<typeof loginSchema>;

/** Lo que el propio usuario puede cambiar de su cuenta. */
export const updateMeSchema = z.object({
  /*
    El delegado carga su correo cuando entra; `null` o cadena vacía lo borra.
    No es credencial de acceso, sirve para poder contactarlo.
  */
  email: z.string().trim().email().nullish().or(z.literal('')),
});

export type UpdateMeDto = z.infer<typeof updateMeSchema>;
