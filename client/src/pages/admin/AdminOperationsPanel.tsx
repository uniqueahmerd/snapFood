import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Brain, CheckCircle, RefreshCw, RotateCcw, Trash2, Upload, XCircle } from 'lucide-react';

import { Button, Card, SkeletonCard } from '@/components/ui';
import { useModelLifecycle } from '@/hooks/useModelLifecycle';
import { modelService, type ModelArchitecture } from '@/services/model.service';
import { operationalService } from '@/services/operational.service';
import type { OperationalStatus } from '@/types/operational.types';
import { notifyError, notifySuccess } from '@/utils/notify';

type OperationsView = 'monitoring' | 'models';

const statusStyles: Record<OperationalStatus, string> = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  disabled: 'border-slate-200 bg-slate-50 text-slate-500',
};

const formatBytes = (bytes: number | null | undefined) => {
  if (bytes == null) return 'Unavailable';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

function HealthCard({ name, status, details }: { name: string; status: OperationalStatus; details: string }) {
  const StatusIcon = status === 'healthy' ? CheckCircle : XCircle;
  return (
    <div className={`rounded-lg border p-4 ${statusStyles[status]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{name}</p>
        <StatusIcon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-2 text-sm font-medium capitalize">{status}</p>
      <p className="mt-1 text-xs opacity-80">{details}</p>
    </div>
  );
}

function AuditTrail({ autoRefresh }: { autoRefresh: boolean }) {
  const audit = useQuery({
    queryKey: ['system', 'audit'],
    queryFn: () => operationalService.getAudit(50),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">Admin action history</h3>
          <p className="text-xs text-slate-500">Successful and failed model and user operations.</p>
        </div>
        <Button size="sm" variant="ghost" leftIcon={RefreshCw} onClick={() => void audit.refetch()} isLoading={audit.isFetching}>
          Refresh
        </Button>
      </div>
      {audit.isPending ? (
        <SkeletonCard className="h-20" />
      ) : audit.data?.length ? (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {audit.data.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{entry.action} <span className="font-normal text-slate-500">· {entry.target}</span></p>
                <p className="truncate text-xs text-slate-500">Admin {entry.actorId}{entry.details ? ` · ${entry.details}` : ''}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                <span className={entry.outcome === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{entry.outcome}</span>
                <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No admin actions have been recorded yet.</p>
      )}
      {audit.isError && <p role="alert" className="mt-2 text-sm text-rose-700">Could not load the admin action history.</p>}
    </section>
  );
}

function ModelVersionHistory({ modelName }: { modelName: string }) {
  const queryClient = useQueryClient();
  const versions = useQuery({
    queryKey: ['models', 'versions', modelName],
    queryFn: () => modelService.getVersions(modelName),
  });

  const refreshAfterChange = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['models', 'lifecycle'] }),
      queryClient.invalidateQueries({ queryKey: ['models', 'versions', modelName] }),
      queryClient.invalidateQueries({ queryKey: ['system', 'audit'] }),
    ]);
  };

  const rollback = useMutation({
    mutationFn: (versionId: string) => modelService.rollback(modelName, versionId),
    onSuccess: async () => {
      await refreshAfterChange();
      notifySuccess(`Model "${modelName}" was rolled back.`);
    },
    onError: (error) => notifyError(error, `Could not roll back model "${modelName}".`),
  });

  const removeVersion = useMutation({
    mutationFn: (versionId: string) => modelService.deleteVersion(modelName, versionId),
    onSuccess: async () => {
      await refreshAfterChange();
      notifySuccess('Model version deleted.');
    },
    onError: (error) => notifyError(error, 'Could not delete this model version.'),
  });

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous versions</p>
        <Button size="sm" variant="ghost" leftIcon={RefreshCw} onClick={() => void versions.refetch()} isLoading={versions.isFetching}>Refresh</Button>
      </div>
      {versions.data?.length ? (
        <div className="space-y-2">
          {versions.data.map((version) => (
            <div key={version.id} className="flex flex-col gap-2 rounded-md bg-slate-50 p-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-xs">
                <p className="font-mono text-slate-800">{version.id}</p>
                <p className="text-slate-500">{formatBytes(version.size_bytes)} · {new Date(version.updated_at).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" leftIcon={RotateCcw} disabled={rollback.isPending || removeVersion.isPending} isLoading={rollback.isPending && rollback.variables === version.id} onClick={() => rollback.mutate(version.id)}>
                  Roll back
                </Button>
                <Button size="sm" variant="danger" leftIcon={Trash2} disabled={rollback.isPending || removeVersion.isPending} isLoading={removeVersion.isPending && removeVersion.variables === version.id} onClick={() => {
                  if (window.confirm(`Permanently delete version ${version.id}?`)) removeVersion.mutate(version.id);
                }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : versions.isPending ? (
        <p className="text-xs text-slate-500">Loading versions...</p>
      ) : (
        <p className="text-xs text-slate-500">No previous artifact versions are available.</p>
      )}
      {versions.isError && <p role="alert" className="mt-2 text-xs text-rose-700">Could not load model versions.</p>}
    </div>
  );
}

export default function AdminOperationsPanel({ view }: { view: OperationsView }) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logLevel, setLogLevel] = useState('all');
  const [logSource, setLogSource] = useState('all');
  const [modelName, setModelName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [architecture, setArchitecture] = useState<ModelArchitecture>('keras_classifier');
  const [labelsInput, setLabelsInput] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const modelLifecycle = useModelLifecycle();
  const queryClient = useQueryClient();

  const registerModel = useMutation({
    mutationFn: modelService.register,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['models', 'lifecycle'] }),
        queryClient.invalidateQueries({ queryKey: ['system', 'audit'] }),
      ]);
      setModelName('');
      setDisplayName('');
      setLabelsInput('');
      setModelFile(null);
      notifySuccess('New model registered and validated.');
    },
    onError: (error) => notifyError(error, 'Could not register the new model.'),
  });

  const monitor = useQuery({
    queryKey: ['system', 'monitor', logLevel, logSource],
    queryFn: async () => {
      const [health, logs] = await Promise.all([
        operationalService.getSystemHealth(),
        operationalService.getLogs(100, logLevel, logSource),
      ]);
      return { health, logs };
    },
    enabled: view === 'monitoring',
    refetchInterval: autoRefresh ? 10000 : false,
  });

  if (view === 'monitoring') {
    const health = monitor.data?.health;
    return (
      <>
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-emerald-700" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">System monitoring</h2>
                <p className="text-sm text-slate-500">Backend, database, and AI service health with recent logs.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
                Auto-refresh
              </label>
              <Button size="sm" variant="secondary" leftIcon={RefreshCw} onClick={() => void monitor.refetch()} isLoading={monitor.isFetching}>
                Refresh now
              </Button>
            </div>
          </div>

          {monitor.isPending ? (
            <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((item) => <SkeletonCard key={item} />)}</div>
          ) : health ? (
            <div className="grid gap-3 md:grid-cols-3">
              <HealthCard name="Backend" status={health.backend.status} details={health.backend.details} />
              <HealthCard name="Database" status={health.database.status} details={health.database.details} />
              <HealthCard name="AI service" status={health.ai.status} details={`${health.ai.details}${health.ai.version ? ` · v${health.ai.version}` : ''}`} />
            </div>
          ) : (
            <p role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">Monitoring data is unavailable. Check the backend and AI service connections.</p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">Service logs</h3>
                <p className="text-xs text-slate-500">Live polling refreshes the latest retained entries.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Source
                  <select value={logSource} onChange={(event) => setLogSource(event.target.value)} className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800">
                    <option value="all">Backend + AI</option>
                    <option value="backend">Backend</option>
                    <option value="ai">AI service</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Level
                  <select value={logLevel} onChange={(event) => setLogLevel(event.target.value)} className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800">
                    <option value="all">All levels</option>
                    <option value="error">Errors</option>
                    <option value="warning">Warnings</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </label>
              </div>
            </div>
            {monitor.data?.logs.logs.length ? (
              <div className="max-h-[32rem] space-y-2 overflow-y-auto">
                {monitor.data.logs.logs.map((entry, index) => (
                  <div key={`${entry.timestamp}-${entry.source}-${index}`} className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm sm:grid-cols-[auto_auto_1fr_auto] sm:items-start">
                    <span className={`w-fit rounded border px-2 py-0.5 text-xs font-semibold capitalize ${entry.level === 'error' ? statusStyles.error : entry.level === 'warning' ? statusStyles.warning : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{entry.level}</span>
                    <span className="w-fit rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">{entry.source ?? 'backend'}</span>
                    <p className="min-w-0 break-words text-slate-700">{entry.message}</p>
                    <time className="text-xs text-slate-500" dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No matching logs are available.</p>
            )}
            {monitor.data?.logs.unavailableSources?.includes('ai') && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                AI logs are unavailable. Set the same <code>AI_ADMIN_TOKEN</code> in the backend and AI service environments.
              </p>
            )}
            {monitor.isError && <p role="alert" className="mt-3 text-sm text-rose-700">Could not load monitoring data.</p>}
          </div>
        </Card>
        <AuditTrail autoRefresh={autoRefresh} />
      </>
    );
  }

  const activeModel = modelLifecycle.status?.models.find((model) => model.active);
  const registrationEnabled = modelLifecycle.status?.registration_enabled === true;
  const submitModelRegistration = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const labels = labelsInput.split(/[\n,]/).map((label) => label.trim()).filter(Boolean);
    if (!modelFile) {
      notifyError('Choose a model artifact first.');
      return;
    }
    if (modelFile.size > 200 * 1024 * 1024) {
      notifyError('Model artifacts must be 200 MB or smaller.');
      return;
    }
    registerModel.mutate({ modelName: modelName.trim(), displayName: displayName.trim(), architecture, labels, file: modelFile });
  };

  return (
    <>
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <Brain className="h-6 w-6 text-emerald-700" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Model management</h2>
            <p className="text-sm text-slate-500">Review registered models, upload artifacts, and select the runtime model.</p>
          </div>
        </div>

        <form onSubmit={submitModelRegistration} className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-start gap-3">
            <Upload className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="font-semibold text-slate-950">Register a new model</h3>
              <p className="text-sm text-slate-500">Upload an artifact with labels. The AI service validates compatibility before adding it to the registry.</p>
            </div>
          </div>
          {!registrationEnabled && (
            <p role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              New model registration is unavailable. Configure the same <code>AI_ADMIN_TOKEN</code> in the backend and AI service, then restart both services.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Model ID
              <input required minLength={2} maxLength={49} pattern="[a-z][a-z0-9_-]{1,48}" value={modelName} onChange={(event) => setModelName(event.target.value)} placeholder="e.g. suya-specialist-v1" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
            </label>
            <label className="text-xs font-semibold text-slate-600">Display name
              <input required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Suya Specialist" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
            </label>
            <label className="text-xs font-semibold text-slate-600">Supported model format
              <select value={architecture} onChange={(event) => { setArchitecture(event.target.value as ModelArchitecture); setModelFile(null); }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900">
                <option value="keras_classifier">Keras classifier (.keras)</option>
                <option value="efficientnetv2_s_multilabel">EfficientNetV2-S multilabel (.pth)</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Model artifact
              <input required type="file" accept={architecture === 'keras_classifier' ? '.keras' : '.pth'} onChange={(event) => setModelFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-normal text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs" />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Class labels
              <textarea required rows={3} value={labelsInput} onChange={(event) => setLabelsInput(event.target.value)} placeholder="One label per line or comma-separated" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Supported contracts: Keras classifier with output count matching labels, or EfficientNetV2-S checkpoint with matching label vocabulary. Maximum artifact size: 200 MB.</p>
            <Button type="submit" variant="primary" leftIcon={Upload} isLoading={registerModel.isPending} disabled={!modelFile || !registrationEnabled}>Validate and register</Button>
          </div>
        </form>

        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Currently selected for app analysis</p>
          <p className="mt-1 text-xl font-bold text-emerald-950">{activeModel?.display_name ?? activeModel?.name ?? 'Loading model state...'}</p>
          {activeModel && <p className="mt-1 text-sm text-emerald-800">{activeModel.name} · {activeModel.task} · {activeModel.classes} classes</p>}
        </div>

        {modelLifecycle.loading ? (
          <div className="space-y-3">{[0, 1].map((item) => <SkeletonCard key={item} />)}</div>
        ) : modelLifecycle.status?.models.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {modelLifecycle.status.models.map((model) => (
              <article key={model.name} className={`rounded-lg border p-4 ${model.active ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{model.display_name || model.name}</h3>
                      {model.active && <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">Active</span>}
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-500">{model.name}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div><dt className="text-slate-500">Task</dt><dd className="font-medium capitalize text-slate-800">{model.task}</dd></div>
                      <div><dt className="text-slate-500">Labels</dt><dd className="font-medium text-slate-800">{model.classes}</dd></div>
                      <div className="col-span-2"><dt className="text-slate-500">Expected artifact</dt><dd className="break-all font-mono text-slate-800">{model.artifact?.filename ?? 'Not specified'}</dd></div>
                      <div><dt className="text-slate-500">Artifact status</dt><dd className={model.artifact?.available ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{model.artifact?.available ? 'Available' : 'Missing'}</dd></div>
                      <div><dt className="text-slate-500">Artifact size</dt><dd className="font-medium text-slate-800">{formatBytes(model.artifact?.size_bytes)}</dd></div>
                      <div className="col-span-2"><dt className="text-slate-500">Updated</dt><dd className="font-medium text-slate-800">{model.artifact?.updated_at ? new Date(model.artifact.updated_at).toLocaleString() : 'Unavailable'}</dd></div>
                    </dl>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant={model.active ? 'ghost' : 'secondary'} disabled={model.active || modelLifecycle.activate.isPending || !model.artifact?.available} onClick={() => modelLifecycle.activate.mutate(model.name)}>
                      {model.active ? 'Selected' : 'Select model'}
                    </Button>
                  </div>
                </div>
                <ModelVersionHistory modelName={model.name} />
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Model status is unavailable. Check the AI service connection.</p>
        )}
        {modelLifecycle.error && <p role="alert" className="mt-3 text-sm text-rose-700">Could not load model status.</p>}
      </Card>
      <AuditTrail autoRefresh={false} />
    </>
  );
}