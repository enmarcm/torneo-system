import { prisma } from '@/lib/prisma';
import { Prisma, type ArticleKind } from '@prisma/client';
import { AppError } from '@/utils/app-error';
import { MESSAGES } from '@/config/constants';
import { factSheetsService, type SheetKind } from '@/modules/fact-sheets/fact-sheets.service';
import { SUBJECT_FIELD, type CreateArticleDto, type UpdateArticleDto } from './news.schema';

/** Datos de la entidad de la que habla la nota, para pintar la tarjeta del listado. */
const SUBJECT_INCLUDE = {
  edition: { select: { id: true, name: true, year: true } },
  competition: { select: { id: true, name: true, imageUrl: true } },
  team: { select: { id: true, name: true, logoUrl: true } },
} as const;

/** `Copa de Verano 2026` → `copa-de-verano-2026`. */
const slugify = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'nota';

/**
 * El slug va en la URL pública, así que no puede repetirse. Dos notas con el
 * mismo titular —"Resumen de la fecha"— son de lo más normal, y la segunda se
 * lleva un sufijo en vez de un error en la cara del redactor.
 */
const uniqueSlug = async (title: string) => {
  const base = slugify(title);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const taken = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  return `${base}-${Date.now()}`;
};

type SubjectSource = {
  kind?: string | null;
  editionId?: string | null;
  competitionId?: string | null;
  teamId?: string | null;
  year?: number | null;
};

/**
 * Arma la ficha técnica si la publicación es de las que la llevan. Una noticia
 * suelta no tiene ficha y devuelve null.
 */
const buildSheet = async (source: SubjectSource) => {
  const kind = source.kind as SheetKind | 'NEWS' | undefined;
  if (!kind || kind === 'NEWS') return null;
  const field = SUBJECT_FIELD[kind];
  const entityId = field ? source[field] : null;
  if (!entityId) throw new AppError(422, 'Falta la entidad de la ficha', 'SHEET_SUBJECT_REQUIRED');
  return factSheetsService.build(kind, entityId, source.year ?? null);
};

const sheetFields = (sheet: Awaited<ReturnType<typeof buildSheet>>) =>
  sheet
    ? {
        snapshot: sheet as unknown as Prisma.InputJsonValue,
        snapshotAt: new Date(),
      }
    : { snapshot: Prisma.DbNull, snapshotAt: null };

/** Solo lo que ya salió: publicado y con fecha de publicación cumplida. */
const publishedWhere = (): Prisma.ArticleWhereInput => ({
  status: 'PUBLISHED',
  publishedAt: { lte: new Date() },
});

export interface NewsFilters {
  kind?: string;
  editionId?: string;
  competitionId?: string;
  teamId?: string;
  year?: number;
  limit?: number;
}

const buildWhere = (filters: NewsFilters): Prisma.ArticleWhereInput => ({
  ...(filters.kind ? { kind: filters.kind as ArticleKind } : {}),
  ...(filters.editionId ? { editionId: filters.editionId } : {}),
  ...(filters.competitionId ? { competitionId: filters.competitionId } : {}),
  ...(filters.teamId ? { teamId: filters.teamId } : {}),
  ...(filters.year ? { year: filters.year } : {}),
});

export const newsService = {
  /** Lo que ve el visitante: solo publicaciones vivas, la destacada primero. */
  listPublic: (filters: NewsFilters = {}) =>
    prisma.article.findMany({
      where: { ...publishedWhere(), ...buildWhere(filters) },
      include: SUBJECT_INCLUDE,
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: Math.min(filters.limit ?? 30, 60),
    }),

  getPublicBySlug: async (slug: string) => {
    const article = await prisma.article.findFirst({
      where: { slug, ...publishedWhere() },
      include: SUBJECT_INCLUDE,
    });
    if (!article) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return article;
  },

  /** Panel: también los borradores y lo programado. */
  listAll: (filters: NewsFilters = {}) =>
    prisma.article.findMany({
      where: buildWhere(filters),
      include: { ...SUBJECT_INCLUDE, author: { select: { id: true, username: true } } },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    }),

  get: async (id: string) => {
    const article = await prisma.article.findUnique({ where: { id }, include: SUBJECT_INCLUDE });
    if (!article) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return article;
  },

  create: async (data: CreateArticleDto, authorId?: string | null) => {
    const sheet = await buildSheet(data);
    return prisma.article.create({
      data: {
        kind: data.kind,
        status: data.status,
        title: data.title,
        slug: await uniqueSlug(data.title),
        summary: data.summary ?? null,
        body: data.body ?? '',
        coverUrl: data.coverUrl ?? null,
        featured: data.featured ?? false,
        editionId: data.editionId ?? null,
        competitionId: data.competitionId ?? null,
        teamId: data.teamId ?? null,
        year: data.year ?? null,
        authorId: authorId ?? null,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        ...sheetFields(sheet),
      },
      include: SUBJECT_INCLUDE,
    });
  },

  update: async (id: string, data: UpdateArticleDto) => {
    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    /*
      Si cambia de quién habla la ficha, los números viejos ya no describen nada:
      se recalculan en el mismo guardado. El slug, en cambio, no se toca aunque
      cambie el titular — los enlaces compartidos tienen que seguir abriendo.
    */
    const subjectChanged =
      (data.kind !== undefined && data.kind !== current.kind) ||
      (data.editionId !== undefined && data.editionId !== current.editionId) ||
      (data.competitionId !== undefined && data.competitionId !== current.competitionId) ||
      (data.teamId !== undefined && data.teamId !== current.teamId) ||
      (data.year !== undefined && data.year !== current.year);

    const merged: SubjectSource = {
      kind: data.kind ?? current.kind,
      editionId: data.editionId ?? current.editionId,
      competitionId: data.competitionId ?? current.competitionId,
      teamId: data.teamId ?? current.teamId,
      year: data.year ?? current.year,
    };

    // Al publicar por primera vez queda sellada la fecha de salida.
    const publishing = data.status === 'PUBLISHED' && !current.publishedAt;

    return prisma.article.update({
      where: { id },
      data: {
        ...(data.kind !== undefined ? { kind: data.kind } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.summary !== undefined ? { summary: data.summary ?? null } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl ?? null } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.editionId !== undefined ? { editionId: data.editionId ?? null } : {}),
        ...(data.competitionId !== undefined ? { competitionId: data.competitionId ?? null } : {}),
        ...(data.teamId !== undefined ? { teamId: data.teamId ?? null } : {}),
        ...(data.year !== undefined ? { year: data.year ?? null } : {}),
        ...(publishing ? { publishedAt: new Date() } : {}),
        ...(subjectChanged ? sheetFields(await buildSheet(merged)) : {}),
      },
      include: SUBJECT_INCLUDE,
    });
  },

  /** Vuelve a calcular la ficha con los números de hoy. */
  regenerate: async (id: string) => {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    if (article.kind === 'NEWS') {
      throw new AppError(422, 'Una noticia suelta no tiene ficha para regenerar', 'NOT_A_SHEET');
    }
    const sheet = await buildSheet(article);
    return prisma.article.update({
      where: { id },
      data: sheetFields(sheet),
      include: SUBJECT_INCLUDE,
    });
  },

  remove: (id: string) => prisma.article.delete({ where: { id } }),
};
