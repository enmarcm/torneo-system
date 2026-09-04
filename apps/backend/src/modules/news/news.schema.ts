import { z } from 'zod';

export const ARTICLE_KINDS = ['NEWS', 'EDITION_SHEET', 'COMPETITION_SHEET', 'TEAM_SHEET'] as const;
export const ARTICLE_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export type ArticleKindValue = (typeof ARTICLE_KINDS)[number];

/** Qué entidad tiene que venir cargada según el tipo de publicación. */
export const SUBJECT_FIELD: Record<ArticleKindValue, 'editionId' | 'competitionId' | 'teamId' | null> = {
  NEWS: null,
  EDITION_SHEET: 'editionId',
  COMPETITION_SHEET: 'competitionId',
  TEAM_SHEET: 'teamId',
};

const base = z.object({
  kind: z.enum(ARTICLE_KINDS).default('NEWS'),
  title: z.string().trim().min(4, 'El titular es muy corto').max(140),
  summary: z.string().trim().max(300).nullish(),
  body: z.string().max(20000).default(''),
  // `.nullish()` en lo que admite NULL: el formulario manda null para limpiarlo.
  coverUrl: z.string().nullish(),
  featured: z.boolean().default(false),
  status: z.enum(ARTICLE_STATUSES).default('DRAFT'),
  editionId: z.string().uuid().nullish(),
  competitionId: z.string().uuid().nullish(),
  teamId: z.string().uuid().nullish(),
  /** Solo para la ficha de un club: acota la ficha a un año. */
  year: z.number().int().min(1900).max(2200).nullish(),
});

export const createArticleSchema = base.refine(
  (d) => {
    const field = SUBJECT_FIELD[d.kind];
    return !field || !!d[field];
  },
  {
    message: 'Elegí de qué edición, torneo o equipo es la ficha',
    path: ['kind'],
  },
);

export const updateArticleSchema = base.partial();

export const articleStatusSchema = z.object({ status: z.enum(ARTICLE_STATUSES) });

export type CreateArticleDto = z.infer<typeof createArticleSchema>;
export type UpdateArticleDto = z.infer<typeof updateArticleSchema>;
