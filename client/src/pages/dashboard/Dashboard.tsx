import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  Clock,
  Utensils,
} from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

import ExportButton from "@/features/dashboard/ExportButton";
import TTSButton from "@/components/shared/TTSButton";
import { useDashboardData } from "@/hooks/useDashboard";
import { useUser } from "@/store/auth.store";
import { Card, PageHeader, SkeletonCard } from "@/components/ui";

const Dashboard = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("7d");
  const user = useUser();
  const {
    summary,
    recentScans,
    weeklyTrend,
    nutritionBreakdown,
    healthRisk,
    loading,
  } = useDashboardData();
  const weeklyTrendArray = weeklyTrend;

  const caloriesTrendData = {
    labels: weeklyTrendArray.map((w) => w.day),
    datasets: [
      {
        label: "Calories",
        data: weeklyTrendArray.map((w) => Number(w.calories)),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const nutrientBreakdownData = {
    labels: ["Protein", "Carbs", "Fats", "Fiber"],
    datasets: [
      {
        data: nutritionBreakdown
          ? [
              Number(nutritionBreakdown.protein ?? 0),
              Number(nutritionBreakdown.carbs ?? 0),
              Number(nutritionBreakdown.fat ?? 0),
              Number(nutritionBreakdown.fiber ?? 0),
            ]
          : [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const safeHealthRiskData = useMemo(() => {
    return {
      labels: healthRisk.map((week) => new Date(week.week).toLocaleDateString()),
      datasets: [
        {
          label: "High Risk",
          data: healthRisk.map((week) => Number(week.high)),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
        },
        {
          label: "Medium Risk",
          data: healthRisk.map((week) => Number(week.medium)),
          backgroundColor: "rgba(245, 158, 11, 0.8)",
        },
        {
          label: "Low Risk",
          data: healthRisk.map((week) => Number(week.low)),
          backgroundColor: "rgba(34, 197, 94, 0.8)",
        },
      ],
    };
  }, [healthRisk]);
  // const healthRiskData = safeHealthRiskData;
  const stats = [
    {
      label: t("todayCalories"),
      value: summary ? String(summary.todaysCalories) : 0,
      target: summary?.caloriesTarget ? String(summary.caloriesTarget) : undefined,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: t("healthScore"),
      value: summary && summary.healthScore !== null ? `${summary.healthScore}%` : 0,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: t("mealsLogged"),
      value: summary ? String(summary.mealsLogged) : 0,
      trend: summary ? `+${summary.mealsLogged}` : "",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}min ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  


  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Nutrition overview"
        title={t("dashboard")}
        description={`Welcome back, ${user?.firstName ?? "friend"}. Here is your nutritional overview.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
            </select>
            <ExportButton data={recentScans} />
          </div>
        }
      />

      {loading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} interactive className="bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-2xl font-bold tracking-tight ">{stat.value}</p>
                    {stat.target && <p className="text-sm text-slate-400">/ {stat.target}</p>}
                    {stat.trend && <span className="text-xs font-bold text-emerald-600">{stat.trend}</span>}
                  </div>
                </div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </span>
              </div>
            </Card>
          );
        })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("weeklyTrends")}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>
                Daily average: {summary?.todaysCalories || 0} calories
              </span>
            </div>
          </div>
          <Line
            data={caloriesTrendData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
              },
              scales: {
                y: {
                  beginAtZero: false,
                  min: 1500,
                },
              },
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t("nutritionBreakdown")}
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={nutrientBreakdownData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-5/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("recentMeals")}
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {recentScans && recentScans.length ? (
              recentScans.map((scan) => (
                <div
                  key={`${scan.food_name}-${scan.scanned_at}`}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {scan.food_name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(scan.scanned_at)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-medium text-gray-700">
                          {scan.calories} cal
                        </span>
                      </div>
                    </div>
                    <TTSButton
                      text={`${scan.food_name}, ${scan.calories} calories, risk ${scan.risk_level}`}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-col">
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-center font-medium border w-28 ${getRiskColor(
                          scan.risk_level,
                        )}`}
                      >
                        {scan.risk_level}
                      </span>
                      <div className="px-2 py-1 text-center rounded-full text-xs font-medium border text-green-600 bg-green-50">
                        {scan.health_condition}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {scan.confidence
                        ? `${Math.round(scan.confidence * 100)}%`
                        : "--"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No recent meals logged yet.
              </div>
            )}
          </div>

          <Link
            to="/history"
            className="mt-4 flex w-full items-center justify-center rounded-lg border border-green-200 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            View all meals
          </Link>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Health Risk Analysis
            </h3>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Weekly breakdown</span>
            </div>
          </div>
          <Bar
            data={safeHealthRiskData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
              },
              scales: {
                x: { stacked: true },
                y: { stacked: true },
              },
            }}
          />
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Ready to log your next meal?
            </h3>
            <p className="text-green-100">
              Capture a photo or chat with NutriBot for personalized advice.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => (window.location.href = "/camera")}
              className="flex items-center justify-center space-x-2 bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              <Utensils className="h-4 w-4" />
              <span>Open Camera</span>
            </button>
            <button
              onClick={() => (window.location.href = "/nutribot")}
              className="flex items-center justify-center space-x-2 border border-green-300 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-500 transition-colors"
            >
              <span>Chat with NutriBot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
