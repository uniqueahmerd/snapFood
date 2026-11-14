import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';

export interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 lg:pl-72">
      <Sidebar />
      <main id="main" className="min-w-0 flex-1 pt-10 lg:pt-0">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

export function AdminLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <Sidebar />
      <main id="main" className="min-w-0 flex-1 pt-14 lg:pl-72 lg:pt-0">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
