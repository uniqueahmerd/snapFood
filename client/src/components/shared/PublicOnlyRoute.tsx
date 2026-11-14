import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { DEFAULT_AUTHENTICATED_ROUTE } from '@/constants';
import { useIsAuthenticated, useIsBootstrapping } from '@/store/auth.store';

import { LoadingScreen } from './LoadingScreen';

export interface PublicOnlyRouteProps {
  children?: ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isBootstrapping = useIsBootstrapping();

  if (isBootstrapping) {
    return <LoadingScreen label="Checking session…" />;
  }

  if (isAuthenticated) {
    return <Navigate to={DEFAULT_AUTHENTICATED_ROUTE} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
