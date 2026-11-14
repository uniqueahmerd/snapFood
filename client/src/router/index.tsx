import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout, AppLayout, AuthLayout } from '@/components/layout';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from '@/components/shared';
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTE_PATTERNS } from '@/constants';

const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyOTP = lazy(() => import('@/pages/auth/VerifyResetOTP'));
const OAuthCallback = lazy(() => import('@/pages/auth/OAuthCallback'));
const LandingPagePreview = lazy(() => import('@/pages/public/LandingPagePreview'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Camera = lazy(() => import('@/pages/food/Camera'));
const AnalysisResults = lazy(() => import('@/pages/food/AnalysisResults'));
const MealHistory = lazy(() => import('@/pages/food/MealHistory'));
const NutriBot = lazy(() => import('@/pages/ai/NutriBot'));
const DiagnosticsPanel = lazy(() => import('@/pages/diagnostics/DiagnosticsPanel'));
const Profile = lazy(() => import('@/pages/settings/Profile'));
const Settings = lazy(() => import('@/pages/settings/Settings'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTE_PATTERNS.login} element={<Login />} />
          <Route path={ROUTE_PATTERNS.register} element={<Register />} />
          <Route path={ROUTE_PATTERNS.forgotPassword} element={<ForgotPassword />} />
          <Route path={ROUTE_PATTERNS.resetPassword} element={<ResetPassword />} />
        </Route>
        <Route path={ROUTE_PATTERNS.previewLanding} element={<LandingPagePreview />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path={ROUTE_PATTERNS.verifyEmail} element={<VerifyOTP />} />
        <Route path={ROUTE_PATTERNS.oauthCallback} element={<OAuthCallback />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTE_PATTERNS.dashboard} element={<Dashboard />} />
          <Route path={ROUTE_PATTERNS.camera} element={<Camera />} />
          <Route path={ROUTE_PATTERNS.results} element={<AnalysisResults />} />
          <Route path={ROUTE_PATTERNS.history} element={<MealHistory />} />
          <Route path={ROUTE_PATTERNS.nutribot} element={<NutriBot />} />
          <Route path={ROUTE_PATTERNS.profile} element={<Profile />} />
          <Route path={ROUTE_PATTERNS.settings} element={<Settings />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTE_PATTERNS.admin} element={<AdminPanel />} />
          <Route path={ROUTE_PATTERNS.diagnostics} element={<DiagnosticsPanel />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={DEFAULT_AUTHENTICATED_ROUTE} replace />} />
      <Route path="*" element={<div className="flex min-h-screen items-center justify-center text-lg font-medium text-gray-700">Page not found</div>} />
    </Routes>
  );
}
