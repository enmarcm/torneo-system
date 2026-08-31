import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from './routes';
import type { UserRole } from '@/utils/roles';

/**
 * A dónde cae cada perfil al entrar. El community manager y el anotador no ven
 * el dashboard —está lleno de números que no manejan—, así que arrancan en la
 * pantalla que sí es suya.
 */
export const homeRouteFor = (role?: UserRole | null): string => {
  switch (role) {
    case 'ADMIN':
      return ROUTES.admin.dashboard;
    case 'COMMUNITY_MANAGER':
      return ROUTES.admin.ads;
    case 'SCOREKEEPER':
      return ROUTES.admin.schedule;
    case 'TEAM_LEADER':
      return ROUTES.team.home;
    default:
      return ROUTES.login;
  }
};

export const RoleGuard: React.FC<{ allow: UserRole[] }> = ({ allow }) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to={ROUTES.login} replace />;
  /*
    Con sesión abierta pero sin permiso, mandarlo al login lo dejaba mirando una
    pantalla de la que el guard de "solo deslogueados" lo rebotaba de vuelta.
    Va a su propia portada.
  */
  if (!allow.includes(user.role)) return <Navigate to={homeRouteFor(user.role)} replace />;
  return <Outlet />;
};

export const PublicOnly: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to={homeRouteFor(user.role)} replace />;
  return <Outlet />;
};
