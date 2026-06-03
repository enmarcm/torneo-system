import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from './routes';

type Role = 'ADMIN' | 'TEAM_LEADER';

export const RoleGuard: React.FC<{ allow: Role[] }> = ({ allow }) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (!allow.includes(user.role)) return <Navigate to={ROUTES.login} replace />;
  return <Outlet />;
};

export const PublicOnly: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'ADMIN') return <Navigate to={ROUTES.admin.dashboard} replace />;
  if (user?.role === 'TEAM_LEADER') return <Navigate to={ROUTES.team.home} replace />;
  return <Outlet />;
};
