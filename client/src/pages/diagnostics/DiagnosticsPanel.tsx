import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react';
import { useOperationalSummary } from '@/hooks/useOperationalSummary';
import { Button, Card, PageHeader, SkeletonCard } from '@/components/ui';

const DiagnosticsPanel = () => {
  const { summary, loading, error, refetch } = useOperationalSummary();
  const [lastRun, setLastRun] = useState<string | null>(null);

  useEffect(() => {
    if (summary) setLastRun(summary.generatedAt);
  }, [summary]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="System health"
        title="Diagnostics"
        description="Results produced by the backend health service"
        action={
          <Button variant="primary" leftIcon={RefreshCw} onClick={refetch} isLoading={loading}>
            Run diagnostics
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Unable to load diagnostics.'}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : summary ? (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Database</p>
                  <p className="mt-1 text-2xl font-bold capitalize text-slate-950">{summary.database.status}</p>
                </div>
                <Database className="h-7 w-7 text-blue-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Models</p>
                  <p className="mt-1 text-2xl font-bold">{summary.models.fileCount}</p>
                </div>
                <Server className="h-7 w-7 text-emerald-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Disk reporting</p>
                  <p className="mt-1 text-2xl font-bold">Disabled</p>
                </div>
                <HardDrive className="h-7 w-7 text-orange-600" />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-5 text-lg font-semibold text-slate-950">Diagnostic checks</h2>
              <div className="space-y-3">
                {summary.diagnosticChecks.map((check) => (
                  <div key={check.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className={check.status === 'healthy' ? 'text-emerald-600' : check.status === 'warning' ? 'text-amber-600' : check.status === 'disabled' ? 'text-slate-400' : 'text-red-600'}>
                        {check.status === 'healthy' ? <CheckCircle className="h-5 w-5" /> : check.status === 'disabled' ? <HardDrive className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">{check.name}</p>
                          <span className="text-xs capitalize text-slate-500">{check.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{check.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-5 text-lg font-semibold text-slate-950">System metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><Activity className="h-4 w-4" /> Health score</span>
                  <strong>{summary.healthScore}%</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><HardDrive className="h-4 w-4" /> Disk usage reporting</span>
                  <strong>Disabled</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><Database className="h-4 w-4" /> Total scans</span>
                  <strong>{summary.totalScans.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <span className="flex items-center gap-2 text-sm text-slate-600"><AlertTriangle className="h-4 w-4" /> Latest scan</span>
                  <strong>{summary.latestScanAt ? new Date(summary.latestScanAt).toLocaleString() : 'Unavailable'}</strong>
                </div>
              </div>
            </Card>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Last executed: {lastRun ? new Date(lastRun).toLocaleString() : 'Recently'}
          </p>
        </>
      ) : (
        <Card className="p-8 text-center text-slate-500">No diagnostics data is available.</Card>
      )}
    </div>
  );
};

export default DiagnosticsPanel;
