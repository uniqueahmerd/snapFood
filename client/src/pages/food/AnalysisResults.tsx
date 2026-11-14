import { useMemo } from 'react';
import { AlertTriangle, ArrowLeft, Bot, CheckCircle, Image as ImageIcon, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NutritionAnalysis } from '@/types';

interface AnalysisState {
  result: NutritionAnalysis;
  imageUrl: string;
}

const nutrientLabels: Record<string, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbohydrates',
  fat: 'Fat',
  fiber: 'Fiber',
  sodium: 'Sodium',
  sugar: 'Sugar',
  cholesterol: 'Cholesterol',
  calcium: 'Calcium',
  iron: 'Iron',
};

const formatValue = (key: string, value: unknown) => {
  if (typeof value !== 'number') return '—';
  if (key === 'calories') return `${value.toLocaleString()} kcal`;
  if (['sodium', 'calcium', 'iron', 'cholesterol'].includes(key)) return `${value.toLocaleString()} mg`;
  return `${value.toLocaleString()} g`;
};

const AnalysisResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as AnalysisState | undefined;
  const result = state?.result;
  const imageUrl = state?.imageUrl;

  const nutrientEntries = useMemo(() => {
    if (!result?.nutrients) return [];
    return Object.entries(result.nutrients).filter(([, value]) => value !== undefined && value !== null);
  }, [result?.nutrients]);

  if (!result) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-4xl items-center justify-center px-4 py-16 text-center">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-amber-50 p-10">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-600" />
          <h1 className="text-2xl font-bold text-amber-950">No analysis result available</h1>
          <p className="mt-3 text-amber-900">Capture or upload a meal image to receive nutrition insights.</p>
          <button onClick={() => navigate('/camera')} className="mt-6 rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">Start a new scan</button>
        </div>
      </div>
    );
  }

  const riskStyles = {
    low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    high: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/camera")}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to scanner
      </button>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> AI nutrition report
          </div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-3xl capitalize">
            {result.dishName}
          </h1>
          <p className="mt-2 text-slate-500">
            Identified with {Math.round(result.confidence * 100)}% confidence ·{" "}
            {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
        <span
          className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${riskStyles[result.risk_level as keyof typeof riskStyles] ?? riskStyles.low}`}
        >
          {result.risk_level} health risk
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-6">
          <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Analysis of ${result.dishName}`}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 text-slate-400">
                <ImageIcon className="h-10 w-10" />
                <span className="text-sm">Image preview unavailable</span>
              </div>
            )}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Scan evidence
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Food recognition and nutrition analysis were completed by
                SnapFood AI.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Health context</h2>
                <p className="text-sm text-slate-500">
                  {result.healthFlags.length || 0} health signals reviewed
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {result.healthFlags.map((flag, index) => (
                <div
                  key={`${flag.level}-${index}`}
                  className={`rounded-2xl border p-3 text-sm ${flag.level === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : flag.level === "yellow" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}
                >
                  <div className="mb-1 flex items-center gap-2 font-bold">
                    {flag.level === "green" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {flag.level.toLocaleUpperCase()}
                  </div>
                  {flag.message}
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border shadow-sm p-5 border-slate-200 bg-white">
              <p className="text-sm font-semibold text-slate-500">Calories </p>
              {/* <Utensils className="h-5 w-5" /> */}
              <p className="mt-4 text-3xl font-semibold "> {result.nutrients?.calories ?? 0} </p>
              <p className="mt-2 text-sm text-slate-500"> kcal per analyzed serving </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Confidence</p>
              <p className="mt-4 text-3xl font-semibold ">
                {Math.round(result.confidence * 100)}%
              </p>
              <p className="mt-2 text-sm text-slate-500">Model certainty</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
              <p className="text-sm font-medium text-slate-500">Risk score</p>
              <p className="mt-4 text-3xl font-semibold ">
                {typeof result.risk_score === "number"
                  ? result.risk_score
                  : "—"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Normalized assessment
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Nutrition facts
                </p>
                <h2 className="mt-1 text-xl font-semibold ">Per serving</h2>
              </div>
              <Leaf className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {nutrientEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-semibold capitalize text-slate-600">
                    {nutrientLabels[key] ?? key}
                  </span>
                  <span className="font-semibold ">
                    {formatValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <Bot className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">
                Health Advice
              </h2>
            </div>
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {result.advice ||
                "Review your full nutrition profile with a qualified health professional."}
            </p>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-emerald-950">
              Health-friendly alternatives
            </h2>
            <p className="mt-3 text-sm leading-6 text-emerald-900">
              {result.substitute ||
                "No specific substitute was suggested. Consider balanced portions and safer preparation methods."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
