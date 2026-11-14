import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LOGIN_ROUTE } from '@/constants';
import { useIsAuthenticated, useIsBootstrapping } from '@/store/auth.store';

import { LoadingScreen } from './LoadingScreen';

export interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isBootstrapping = useIsBootstrapping();
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingScreen label="Restoring your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={LOGIN_ROUTE} replace state={{ from: location }} />;
  }

  return <>{children ?? <Outlet />}</>;
}
