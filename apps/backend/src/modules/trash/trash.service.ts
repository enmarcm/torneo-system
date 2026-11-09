import { Prisma, type TrashKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { MESSAGES, PAGINATION } from '@/config/constants';
import { CASCADE_TX } from '@/utils/cascade.util';
import { COLLECTORS, RESTORE_ORDER, createBag, type Snapshot } from './trash.collectors';

type Tx = Prisma.TransactionClient;

/** Días que un elemento espera en la papelera antes de borrarse de verdad. */
export const TRASH_RETENTION_DAYS = 30;

/** Filas por lote al restaurar: createMany y los `in` tienen tope de parámetros. */
const BATCH = 2000;

const chunk = <T>(items: T[], size = BATCH) => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Fila de la papelera sin el payload: es pesado y lleva hashes de contraseña. */
const LIST_SELECT = {
  id: true,
  kind: true,
  entityId: true,
  label: true,
  detail: true,
  summary: true,
  deletedById: true,
  deletedByName: true,
  expiresAt: true,
  createdAt: true,
} satisfies Prisma.TrashItemSelect;

/** Un Json nullable no admite `null` plano al insertar: hay que decir que es NULL de base. */
const prepareRow = (table: string, row: Record<string, unknown>) => {
  if (table === 'article' && row.snapshot === null) return { ...row, snapshot: Prisma.DbNull };
  return row;
};

/** Traduce los fallos de integridad al motivo real por el que no se puede restaurar. */
const explainRestoreError = (err: unknown): never => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      throw new AppError(
        409,
        'No se puede restaurar: ya existe otro registro con los mismos datos únicos (usuario, documento, enlace o inscripción). Cámbialo o elimínalo y vuelve a intentar',
        'RESTORE_CONFLICT',
      );
    }
    if (err.code === 'P2003') {
      throw new AppError(
        409,
        'No se puede restaurar: depende de algo que ya no existe (una edición, competición, equipo o jugador). Restaura primero eso desde la papelera',
        'RESTORE_MISSING_PARENT',
      );
    }
  }
  throw err;
};

export const trashService = {
  /**
   * Fotografía lo que está por borrarse. Se llama dentro de la misma transacción
   * que el borrado, antes de él: si el borrado falla, la foto también se descarta.
   */
  stash: async (tx: Tx, kind: TrashKind, entityId: string, actorId?: string | null) => {
    const bag = createBag();
    const collected = await COLLECTORS[kind](tx, bag, entityId);
    if (!collected) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');

    const snapshot = bag.snapshot();
    const summary: Record<string, number> = {};
    for (const [table, rows] of Object.entries(snapshot.rows)) summary[table] = rows.length;

    const actor = actorId
      ? await tx.user.findUnique({ where: { id: actorId }, select: { username: true } })
      : null;

    await tx.trashItem.create({
      data: {
        kind,
        entityId,
        label: collected.label,
        detail: collected.detail ?? null,
        summary,
        payload: snapshot as unknown as Prisma.InputJsonValue,
        deletedById: actorId ?? null,
        deletedByName: actor?.username ?? null,
        expiresAt: new Date(Date.now() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  },

  /** Borra con papelera: foto + borrado dentro de una sola transacción. */
  withTrash: <T>(
    kind: TrashKind,
    entityId: string,
    actorId: string | null | undefined,
    purge: (tx: Tx) => Promise<T>,
  ) =>
    prisma.$transaction(async (tx) => {
      await trashService.stash(tx, kind, entityId, actorId);
      return purge(tx);
    }, CASCADE_TX),

  list: async (filters: { kind?: TrashKind; search?: string; page?: number; limit?: number }) => {
    // Lo vencido se limpia al consultar: no hay tarea programada que lo haga.
    await prisma.trashItem.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = Math.min(filters.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit);
    const where: Prisma.TrashItemWhereInput = {
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.search
        ? {
            OR: [
              { label: { contains: filters.search, mode: 'insensitive' } },
              { detail: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total, byKind] = await Promise.all([
      prisma.trashItem.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trashItem.count({ where }),
      prisma.trashItem.groupBy({ by: ['kind'], _count: { _all: true } }),
    ]);

    return {
      rows,
      total,
      page,
      limit,
      counts: Object.fromEntries(byKind.map((g) => [g.kind, g._count._all])),
    };
  },

  get: async (id: string) => {
    const item = await prisma.trashItem.findUnique({ where: { id }, select: LIST_SELECT });
    if (!item) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return item;
  },

  /** Repone las filas con sus ids originales y reengancha lo que había quedado suelto. */
  restore: async (id: string) => {
    const item = await prisma.trashItem.findUnique({ where: { id } });
    if (!item) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    const { rows, relinks } = item.payload as unknown as Snapshot;

    try {
      await prisma.$transaction(async (tx) => {
        const db = tx as unknown as Record<
          string,
          {
            createMany: (a: { data: unknown[] }) => Promise<unknown>;
            updateMany: (a: { where: unknown; data: unknown }) => Promise<unknown>;
          }
        >;

        for (const table of RESTORE_ORDER) {
          const tableRows = rows[table];
          if (!tableRows?.length) continue;
          for (const part of chunk(tableRows)) {
            await db[table].createMany({ data: part.map((r) => prepareRow(table, r)) });
          }
        }

        // Si la fila a reenganchar ya no existe, updateMany simplemente no toca nada.
        for (const link of relinks) {
          for (const part of chunk(link.ids)) {
            await db[link.table].updateMany({ where: { id: { in: part } }, data: link.data });
          }
        }

        await tx.trashItem.delete({ where: { id } });
      }, CASCADE_TX);
    } catch (err) {
      explainRestoreError(err);
    }

    return { id, kind: item.kind, entityId: item.entityId, label: item.label };
  },

  /** Eliminación definitiva de un elemento de la papelera. Ya no hay vuelta atrás. */
  purge: async (id: string) => {
    const res = await prisma.trashItem.deleteMany({ where: { id } });
    if (res.count === 0) throw new AppError(404, MESSAGES.notFound, 'NOT_FOUND');
    return { id };
  },

  empty: async (kind?: TrashKind) => {
    const res = await prisma.trashItem.deleteMany({ where: kind ? { kind } : {} });
    return { deleted: res.count };
  },
};
