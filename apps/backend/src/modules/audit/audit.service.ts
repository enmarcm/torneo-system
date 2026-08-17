import { prisma } from '@/lib/prisma';
import { PAGINATION } from '@/config/constants';

/**
 * Lectura del registro de auditoría. La escritura la hace el middleware `audit`
 * en cada ruta sensible; acá solo se consulta.
 */
export const auditService = {
  list: async (filters: {
    entity?: string;
    action?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = Math.min(filters.limit ?? PAGINATION.defaultLimit, PAGINATION.maxLimit);
    const where = {
      ...(filters.entity ? { entity: filters.entity } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { rows, total, page, limit };
  },

  /** Entidades y acciones presentes, para armar los filtros del panel. */
  facets: async () => {
    const [entities, actions] = await Promise.all([
      prisma.auditLog.findMany({ distinct: ['entity'], select: { entity: true }, orderBy: { entity: 'asc' } }),
      prisma.auditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } }),
    ]);
    return {
      entities: entities.map((e) => e.entity),
      actions: actions.map((a) => a.action),
    };
  },
};
