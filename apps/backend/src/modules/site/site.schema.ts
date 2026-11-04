import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);
const url = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Debe empezar con http:// o https://');

export const updateSettingsSchema = z
  .object({
    siteName: text(80).min(1, 'El nombre de la liga no puede quedar vacío'),
    legalName: text(150),
    taxId: text(40),
    tagline: text(200),
    address: text(200),
    phone: text(40),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Correo no válido'),
    schedule: text(200),
    whatsapp: text(40),
    instagramUrl: url,
    facebookUrl: url,
    tiktokUrl: url,
  })
  .partial();

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones (ej: reglamento-del-torneo)');

export const createLegalPageSchema = z.object({
  slug,
  title: z.string().trim().min(1, 'Ponle un título').max(120),
  body: z.string().max(60_000).default(''),
  published: z.boolean().default(true),
  showInFooter: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// El slug no se edita: ya hay enlaces compartidos que dependen de él.
export const updateLegalPageSchema = createLegalPageSchema.omit({ slug: true }).partial();
