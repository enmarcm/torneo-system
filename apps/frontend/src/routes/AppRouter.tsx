import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ROUTES } from './routes';
import { RoleGuard, PublicOnly } from './RoleGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TeamLayout } from '@/components/layout/TeamLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';

const Loading = () => (
  <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
    <CircularProgress />
  </Box>
);

// Public
const PublicHome = lazy(() => import('@/pages/public/PublicHome'));
const PublicCompetitions = lazy(() => import('@/pages/public/PublicCompetitions'));
const PublicSchedule = lazy(() => import('@/pages/public/PublicSchedule'));
const PublicLive = lazy(() => import('@/pages/public/PublicLive'));
const PublicStats = lazy(() => import('@/pages/public/PublicStats'));
const PublicTeams = lazy(() => import('@/pages/public/PublicTeams'));

// Auth
const Login = lazy(() => import('@/pages/auth/Login'));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminEditions = lazy(() => import('@/pages/admin/AdminEditions'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminCompetitions = lazy(() => import('@/pages/admin/AdminCompetitions'));
const AdminTeams = lazy(() => import('@/pages/admin/AdminTeams'));
const AdminPlayers = lazy(() => import('@/pages/admin/AdminPlayers'));
const AdminSchedule = lazy(() => import('@/pages/admin/AdminSchedule'));
const AdminStats = lazy(() => import('@/pages/admin/AdminStats'));
const AdminAds = lazy(() => import('@/pages/admin/AdminAds'));
const AdminAudit = lazy(() => import('@/pages/admin/AdminAudit'));

// Team
const TeamHome = lazy(() => import('@/pages/team/TeamHome'));
const TeamSquads = lazy(() => import('@/pages/team/TeamSquads'));
const TeamStats = lazy(() => import('@/pages/team/TeamStats'));
const TeamTransfers = lazy(() => import('@/pages/team/TeamTransfers'));

export const AppRouter: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      {/* Auth (only logged-out) */}
      <Route element={<PublicOnly />}>
        <Route path={ROUTES.login} element={<Login />} />
      </Route>

      {/* Admin */}
      <Route element={<RoleGuard allow={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.admin.dashboard} element={<AdminDashboard />} />
          <Route path={ROUTES.admin.editions} element={<AdminEditions />} />
          <Route path={ROUTES.admin.categories} element={<AdminCategories />} />
          <Route path={ROUTES.admin.competitions} element={<AdminCompetitions />} />
          <Route path={ROUTES.admin.teams} element={<AdminTeams />} />
          <Route path={ROUTES.admin.players} element={<AdminPlayers />} />
          <Route path={ROUTES.admin.schedule} element={<AdminSchedule />} />
          <Route path={ROUTES.admin.stats} element={<AdminStats />} />
          <Route path={ROUTES.admin.ads} element={<AdminAds />} />
          <Route path={ROUTES.admin.audit} element={<AdminAudit />} />
        </Route>
      </Route>

      {/* Team leader */}
      <Route element={<RoleGuard allow={['TEAM_LEADER']} />}>
        <Route element={<TeamLayout />}>
          <Route path={ROUTES.team.home} element={<TeamHome />} />
          <Route path={ROUTES.team.squads} element={<TeamSquads />} />
          <Route path={ROUTES.team.stats} element={<TeamStats />} />
          <Route path={ROUTES.team.transfers} element={<TeamTransfers />} />
        </Route>
      </Route>

      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.public.home} element={<PublicHome />} />
        <Route path={ROUTES.public.competitions} element={<PublicCompetitions />} />
        <Route path={ROUTES.public.schedule} element={<PublicSchedule />} />
        <Route path={ROUTES.public.live} element={<PublicLive />} />
        <Route path={ROUTES.public.stats} element={<PublicStats />} />
        <Route path={ROUTES.public.teams} element={<PublicTeams />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.public.home} replace />} />
    </Routes>
  </Suspense>
);
