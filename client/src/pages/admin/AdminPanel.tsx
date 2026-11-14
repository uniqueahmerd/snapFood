import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Brain,
  Pause,
  Play,
  RefreshCw,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, PageHeader, SkeletonCard } from '@/components/ui';
import { useOperationalSummary } from '@/hooks/useOperationalSummary';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useModelLifecycle } from '@/hooks/useModelLifecycle';
import { operationalService } from '@/services/operational.service';
import AdminOperationsPanel from './AdminOperationsPanel';
import AdminScanReview from './AdminScanReview';

const formatBytes = (bytes: number | null) => {
  if (bytes === null) return 'Unavailable';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const AdminPanel = () => {
  const { t } = useTranslation();
  const { summary, loading, error, refetch } = useOperationalSummary();
  const [search, setSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [scanSearchUser, setScanSearchUser] = useState('');
  const [activeView, setActiveView] = useState<'overview' | 'monitoring' | 'models' | 'users' | 'scans'>('overview');
  const { users, page, pages, total, loading: usersLoading, error: usersError, updateStatus } = useAdminUsers({ search, page: usersPage });
  const modelLifecycle = useModelLifecycle();
  const [lastRefetched, setLastRefetched] = useState<string | null>(null);

  const systemMonitor = useQuery({
    queryKey: ['system', 'monitor'],
    queryFn: async () => {
      const [health, logs] = await Promise.all([
        operationalService.getSystemHealth(),
        operationalService.getLogs(8),
      ]);
      return { health, logs };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (summary) setLastRefetched(summary.generatedAt);
  }, [summary]);

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Total Users', value: summary.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600' },
      { label: 'Active Users', value: summary.activeUsers.toLocaleString(), icon: Users, color: 'text-blue-600' },
      { label: 'Total Scans', value: summary.totalScans.toLocaleString(), icon: Activity, color: 'text-purple-600' },
      { label: 'New Users Today', value: summary.newUsersToday?.toLocaleString() ?? 'Unavailable', icon: Users, color: 'text-emerald-600' },
    ];
  }, [summary]);

  const runDiagnostics = async () => {
    await refetch();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Protected operations"
        title={t('admin')}
        description="User growth, food scan activity, service health, and protected administration"
        action={
          <Button variant="primary" leftIcon={RefreshCw} onClick={runDiagnostics} isLoading={loading}>
            Refresh diagnostics
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Unable to load operational data.'}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
        {(['overview', 'monitoring', 'models', 'scans', 'users'] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${activeView === view ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {view === 'users' ? `Users (${users.length})` : view === 'monitoring' ? 'Monitoring' : view === 'models' ? 'Models' : view === 'scans' ? 'Food scans' : 'Overview'}
          </button>
        ))}
      </div>

      {activeView === 'users' ? (
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">User administration</h2>
              <p className="text-sm text-slate-500">Search and control account availability.</p>
            </div>
            <label className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setUsersPage(1);
                }}
                placeholder="Search by email"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>
          {usersError && <p className="mb-4 text-sm text-red-600">Unable to load users.</p>}
          {usersLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}</div>
          ) : users.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No users match this search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="pb-3 font-semibold">User</th><th className="pb-3 font-semibold">Role</th><th className="pb-3 font-semibold">Status</th><th className="pb-3 font-semibold">Verified</th><th className="pb-3 font-semibold">Joined</th><th className="pb-3 font-semibold text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-4"><p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p><p className="text-xs text-slate-500">{user.email}</p></td>
                      <td className="py-4 capitalize text-slate-600">{user.role}</td>
                      <td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{user.status}</span></td>
                      <td className="py-4 text-slate-600">{user.isAccountVerified ? 'Yes' : 'No'}</td>
                      <td className="py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setScanSearchUser(user.email);
                            setActiveView('scans');
                          }}>
                            View scans
                          </Button>
                          {user.role === 'user' ? (
                            <Button
                              size="sm"
                              variant={user.status === 'active' ? 'danger' : 'secondary'}
                              leftIcon={user.status === 'active' ? Pause : Play}
                              isLoading={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ userId: user.id, status: user.status === 'active' ? 'suspended' : 'active' })}
                            >
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                          ) : <span className="self-center text-xs text-slate-400">Protected</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!usersLoading && users.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-600">
              <span>{total.toLocaleString()} accounts · page {page} of {pages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setUsersPage((current) => current - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setUsersPage((current) => current + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : activeView === 'scans' ? (
        <AdminScanReview initialSearch={scanSearchUser} />
      ) : activeView === 'monitoring' || activeView === 'models' ? (
        <AdminOperationsPanel view={activeView} />
      ) : loading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : summary ? (
        <>
          {summary.analyticsAvailable === false && (
            <div role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Some overview analytics are unavailable because the backend has not been updated yet. Update and restart the backend to load registration and scan trends.
            </div>
          )}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} interactive className="shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-950">{stat.value}</p>
                  </div>
                  <span className={`grid h-11 w-11 place-items-center rounded-xl bg-slate-50 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'New registrations · 7 days', points: summary.registrationTrend ?? [], color: 'bg-blue-500' },
              { title: 'Food scans · 7 days', points: summary.scanTrend ?? [], color: 'bg-emerald-500' },
            ].map((trend) => {
              const peak = Math.max(1, ...trend.points.map((point) => point.count));
              return (
                <Card key={trend.title} className="p-5 sm:col-span-1 xl:col-span-2">
                  <h2 className="mb-4 font-semibold text-slate-950">{trend.title}</h2>
                  <div className="flex h-28 items-end gap-2">
                    {trend.points.map((point) => (
                      <div key={point.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${point.date}: ${point.count}`}>
                        <span className="text-xs text-slate-500">{point.count}</span>
                        <div className={`w-full rounded-t ${trend.color}`} style={{ height: `${Math.max(4, (point.count / peak) * 76)}px` }} />
                        <span className="text-[10px] text-slate-500">{new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            <Card className="p-5 sm:col-span-1 xl:col-span-2">
              <h2 className="mb-3 font-semibold text-slate-950">Most recognized foods</h2>
              {summary.popularFoods?.length ? (
                <div className="space-y-3">
                  {summary.popularFoods.map((food) => (
                    <div key={food.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate capitalize text-slate-700">{food.name.replace(/_/g, ' ')}</span>
                      <span className="shrink-0 text-slate-500">{food.count.toLocaleString()} scans</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No food scans are available yet.</p>}
            </Card>
            <Card className="p-5 sm:col-span-2 xl:col-span-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-950">Recent administrative events</h2>
                <span className="text-xs text-slate-500">Audit trail</span>
              </div>
              {summary.recentAdminActions?.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {summary.recentAdminActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-slate-700">{action.action} · {action.target}</span>
                      <span className={`shrink-0 text-xs font-semibold ${action.outcome === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{action.outcome}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No administrative actions have been recorded yet.</p>}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Monitoring</h2>
                  <p className="text-sm text-slate-500">Live backend and AI health checks.</p>
                </div>
                <Activity className="h-6 w-6 text-blue-600" />
              </div>

              {systemMonitor.isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}</div>
              ) : systemMonitor.data ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Backend</p>
                      <p className="mt-2 text-lg font-bold capitalize text-slate-900">{systemMonitor.data.health.backend.status}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Database</p>
                      <p className="mt-2 text-lg font-bold capitalize text-slate-900">{systemMonitor.data.health.database.status}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">AI</p>
                      <p className="mt-2 text-lg font-bold capitalize text-slate-900">{systemMonitor.data.health.ai.status}</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent alerts</p>
                    {systemMonitor.data.health.alerts.length ? systemMonitor.data.health.alerts.map((alert, index) => (
                      <div key={`${alert.source}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                        <div>
                          <p className="font-semibold capitalize text-slate-800">{alert.level}</p>
                          <p className="text-slate-600">{alert.message}</p>
                        </div>
                        <span className="text-slate-400">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )) : <p className="text-sm text-slate-500">No active alerts in the recent log feed.</p>}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent backend logs</p>
                    {systemMonitor.data.logs.logs.length ? systemMonitor.data.logs.logs.map((log, index) => (
                      <div key={`${log.timestamp}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="font-semibold capitalize text-slate-800">{log.level}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="line-clamp-2">{log.message}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No logs have been written yet.</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-600">Unable to load system monitoring data.</p>
              )}
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Model inventory</h2>
                  <p className="text-sm text-slate-500">Files discovered on the backend server.</p>
                </div>
                <Brain className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-3">
                {summary.models.files.length ? summary.models.files.map((file) => (
                  <div key={file.path} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">Updated {new Date(file.updatedAt).toLocaleString()}</p>
                    </div>
                    <span className="shrink-0 text-sm text-slate-600">{formatBytes(file.sizeBytes)}</span>
                  </div>
                )) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No model files were discovered.</p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="font-semibold text-slate-950">Model lifecycle</h3>
                <p className="mb-4 text-sm text-slate-500">Select a registered model for app analysis. Add new artifacts from the Models tab.</p>
                <div className="space-y-3">
                  {modelLifecycle.status?.models?.map((model) => (
                    <div key={model.name} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{model.display_name || model.name}</p>
                          <p className="text-xs text-slate-500">{model.task} · {model.classes} classes {model.active ? "· active" : ""}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={model.active ? 'ghost' : 'secondary'}
                            disabled={model.active || modelLifecycle.activate.isPending}
                            onClick={() => modelLifecycle.activate.mutate(model.name)}
                          >
                            {model.active ? 'Active' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {modelLifecycle.error && <p className="mt-3 text-sm text-red-600">Unable to load model lifecycle data.</p>}
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-emerald-600" />
                <div>
                  <h2 className="font-semibold text-slate-950">Deployment health</h2>
                  <p className="text-sm text-slate-500">Health score: {summary.healthScore}%</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Updated {lastRefetched ? new Date(lastRefetched).toLocaleString() : 'recently'}</p>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center text-slate-500">No operational summary is available.</Card>
      )}
    </div>
  );
};

export default AdminPanel;
