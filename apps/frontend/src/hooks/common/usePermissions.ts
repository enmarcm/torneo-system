import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { permissionsFor, type Permissions } from '@/utils/roles';

/** Qué puede hacer quien está logueado. Se usa para esconder lo que el backend rechazaría. */
export const usePermissions = (): Permissions => {
  const role = useAuthStore((s) => s.user?.role);
  return useMemo(() => permissionsFor(role), [role]);
};
