import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Leaf,
  Search,
} from "lucide-react";
import { api } from "@/services/api";
import { EmptyState, SkeletonCard } from "@/components/ui";

interface MealRecord {
  dish_name: string;
  nutrients?: Record<string, unknown>;
  calories: number;
  confidence: number;
  health_assesment?: string;
  recommendations?: string;
  health_condition?: string;
  risk_level: string;
  scanned_at: string;
  created_at: string;
}

const riskStyles: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

const MealHistory = () => {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const numericNutrient = (value: unknown) => {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get("/food/history");
        const payload = response.data;
        const history = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.result)
            ? payload.result
            : [];
        setMeals(history);
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(
          apiError.response?.data?.message ?? "Unable to load meal history.",
        );
      } finally {
        setLoading(false);
      }
    };
    void loadHistory();
  }, []);

  const filteredMeals = meals.filter((meal) =>
    meal.dish_name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-0 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Your nutrition timeline
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            Meal history
          </h1>
          <p className="mt-2 text-slate-500">
            Review previous scans, nutrition, and health guidance.
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute  left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search meals"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} className="h-64" />
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <AlertTriangle className="mb-3 h-6 w-6" />
          {error}
        </div>
      )}
      {!loading && !error && filteredMeals.length === 0 && (
        <EmptyState
          title="No meals found"
          description={
            query
              ? "Try another search or clear the current filter."
              : "Scan your first food image to build your nutrition history."
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredMeals.map((meal) => (
          <article
            key={`${meal.dish_name}-${meal.created_at}`}
            className="group  rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    {meal.health_condition ?? "General health"}
                  </p>
                  <h2 className="mt-2 text-xl font-bold capitalize">
                    {meal.dish_name.replace(/_/g, " ")}
                  </h2>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${riskStyles[meal.risk_level] ?? riskStyles.low}`}
                >
                  {meal.risk_level}
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-2xl font">
                    {meal.calories ?? 0}
                  </p>
                  <p className="text-sm text-slate-500">calories</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="mt-1">
                    {Math.round(meal.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Leaf className="h-4 w-4 text-emerald-600" />
                Nutrition snapshot
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold ">
                    {numericNutrient(meal.nutrients?.protein)}g
                  </p>
                  <p className="text-[11px] text-slate-500">Protein</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold ">
                    {numericNutrient(meal.nutrients?.carbs)}g
                  </p>
                  <p className="text-[11px] text-slate-500">Carbs</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="text-sm font-bold">
                    {numericNutrient(meal.nutrients?.fat)}g
                  </p>
                  <p className="text-[11px] text-slate-500">Fat</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(meal.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                 <p className="flex items-center justify-end gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(meal.scanned_at).toLocaleDateString()}
                  </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default MealHistory;
