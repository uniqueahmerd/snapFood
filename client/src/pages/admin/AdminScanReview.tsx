import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button, Card, SkeletonCard } from '@/components/ui';
import { adminScanService, type AdminFoodScan } from '@/services/adminScan.service';

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function formatNutrient(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function ScanDetails({ scan }: { scan: AdminFoodScan }) {
  return (
    <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nutrition results</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {Object.entries(scan.nutrients ?? {}).map(([name, value]) => (
            <div key={name} className="rounded-md bg-white px-2 py-1">
              <dt className="text-xs capitalize text-slate-500">{name.replace(/_/g, ' ')}</dt>
              <dd className="font-medium text-slate-800">{formatNutrient(value)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-slate-600">Calories: {scan.calories}</p>
      </div>
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Health assessment</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{scan.health_assessment || 'No assessment recorded.'}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{scan.recommendations || 'No recommendations recorded.'}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminScanReview({ initialSearch = '' }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const scans = useQuery({
    queryKey: ['admin', 'scans', search, lowConfidence, page],
    queryFn: () => adminScanService.getScans({ page, search, lowConfidence }),
    refetchInterval: 30000,
  });

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setExpandedScan(null);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">Food scan review</h2>
        <p className="text-sm text-slate-500">Inspect saved predictions, confidence, nutrition, and health guidance. Low confidence is a review signal, not verified ground truth.</p>
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search food or user"
            aria-label="Search food scans by food or user"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={lowConfidence}
            onChange={(event) => {
              setLowConfidence(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-emerald-700"
          />
          Low confidence only (50% or less)
        </label>
      </div>

      {scans.isPending ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}</div>
      ) : scans.isError ? (
        <div role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Unable to load food scans. Check the backend connection and administrator access.
        </div>
      ) : scans.data.items.length ? (
        <div className="space-y-3">
          {scans.data.items.map((scan) => {
            const isExpanded = expandedScan === scan.id;
            return (
              <article key={scan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold capitalize text-slate-900">{scan.dish_name.replace(/_/g, ' ')}</h3>
                    <p className="mt-1 truncate text-sm text-slate-500">{scan.user_name} · {scan.user_email}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(scan.scanned_at).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scan.confidence <= 0.5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {formatConfidence(scan.confidence)} confidence
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs capitalize text-slate-600">{scan.risk_level} risk</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Hide' : 'View'} details for ${scan.dish_name}`}
                      leftIcon={isExpanded ? ChevronUp : ChevronDown}
                      onClick={() => setExpandedScan(isExpanded ? null : scan.id)}
                    >
                      {isExpanded ? 'Hide details' : 'Review'}
                    </Button>
                  </div>
                </div>
                {isExpanded && <ScanDetails scan={scan} />}
              </article>
            );
          })}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
            <span>{scans.data.total.toLocaleString()} scans · page {scans.data.page} of {scans.data.pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page >= scans.data.pages} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No saved scans match these filters. Failed and unrecognized analyses are not stored as scan records.</p>
      )}
    </Card>
  );
}
