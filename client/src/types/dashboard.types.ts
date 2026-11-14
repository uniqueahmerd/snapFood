import type { DashboardScan } from './index';

export interface DashboardSummary {
  todaysCalories: number | string;
  averageCalories: number;
  caloriesTarget: number | null;
  healthScore: number | null;
  mealsLogged: number;
}

export interface HealthRiskWeek {
  week: string;
  high: number | string;
  medium: number | string;
  low: number | string;
}

export interface WeeklyTrend {
  day: string;
  calories: number;
}

export interface NutritionBreakdown {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DashboardData {
  summary: DashboardSummary | null;
  recentScans: DashboardScan[];
  weeklyTrend: WeeklyTrend[];
  nutritionBreakdown: NutritionBreakdown | null;
  healthRisk: HealthRiskWeek[];
}