import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Camera,
  History,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Shield,
  Utensils,
  UserRound,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants';
import { useLogout } from '@/hooks/useAuth';
import { useIsAdmin, useUser } from '@/store/auth.store';

type NavigationItem = {
  to: string;
  icon: typeof BarChart3;
  labelKey: string;
};

const navigation: NavigationItem[] = [
  { to: ROUTES.dashboard, icon: BarChart3, labelKey: 'dashboard' },
  { to: ROUTES.camera, icon: Camera, labelKey: 'camera' },
  { to: ROUTES.history, icon: History, labelKey: 'mealHistory' },
  { to: ROUTES.nutribot, icon: MessageCircle, labelKey: 'nutribot' },
  { to: ROUTES.profile, icon: UserRound, labelKey: 'profile' },
  { to: ROUTES.settings, icon: Settings, labelKey: 'settings' },
];

const adminNavigation: NavigationItem[] = [
  { to: ROUTES.admin, icon: Shield, labelKey: 'admin' },
  { to: ROUTES.diagnostics, icon: Activity, labelKey: 'diagnostics' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const logoutMutation = useLogout();
  const user = useUser();
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  const closeSidebar = () => setOpen(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate(ROUTES.login, { replace: true });
  };

  const renderLink = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to;

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={closeSidebar}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-slate-100  ${
          isActive
             ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-gray-50"
          : 'text-'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span>{t(item.labelKey)}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <Link to={ROUTES.dashboard} className="flex items-center gap-2" onClick={closeSidebar}>
          <Utensils className="h-6 w-6 text-emerald-600" />
          <span className="text-lg font-bold text-slate-950">SnapFood</span>
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <Link to={ROUTES.dashboard} className="flex items-center gap-3" onClick={closeSidebar}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white">
              <Utensils className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">SnapFood</span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Primary navigation">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <div className="mt-3 space-y-1">{navigation.map(renderLink)}</div>

          {isAdmin ? (
            <>
              <p className="mt-8 px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Administration</p>
              <div className="mt-3 space-y-1">{adminNavigation.map(renderLink)}</div>
            </>
          ) : null}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">
              {user?.firstName?.charAt(0).toUpperCase() ?? 'U'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{user?.firstName ?? 'SnapFood user'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email ?? 'Signed in securely'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
