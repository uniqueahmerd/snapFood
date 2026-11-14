import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { DEFAULT_AUTHENTICATED_ROUTE } from '@/constants';
import { useIsAuthenticated, useIsAdmin, useIsBootstrapping } from '@/store/auth.store';

import { LoadingScreen } from './LoadingScreen';

export interface AdminRouteProps {
  children?: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const isBootstrapping = useIsBootstrapping();

  if (isBootstrapping) {
    return <LoadingScreen label="Checking permissions…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={DEFAULT_AUTHENTICATED_ROUTE} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={DEFAULT_AUTHENTICATED_ROUTE} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
