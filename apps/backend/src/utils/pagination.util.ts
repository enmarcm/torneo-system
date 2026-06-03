import { PAGINATION } from '@/config/constants';

export const parsePagination = (q: Record<string, unknown>) => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(PAGINATION.maxLimit, Number(q.limit) || PAGINATION.defaultLimit);
  return { page, limit, skip: (page - 1) * limit, take: limit };
};
