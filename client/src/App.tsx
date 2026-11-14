import { Suspense } from 'react';

import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { ToastHost } from './components/ui';
import { useAuthBootstrap } from './hooks/useAuth';
import { AppRoutes } from './router';

function AppLayout() {
  useAuthBootstrap();

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <AppRoutes />
      </Suspense>
      <ToastHost />
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppLayout />;
}

