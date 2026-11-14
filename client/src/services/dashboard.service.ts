import { api } from './api';
import type { DashboardData } from '../types/dashboard.types';

export const dashboardService = {
  async getOverview(): Promise<DashboardData> {
    const [summary, recentScans, weeklyTrend, nutritionBreakdown, healthRisk] =
      await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/recent-scans'),
        api.get('/dashboard/weekly-trend'),
        api.get('/dashboard/nutrition-breakdown'),
        api.get('/dashboard/health-risk'),
      ]);

    return {
      summary: summary.data,
      recentScans: recentScans.data,
      weeklyTrend: weeklyTrend.data,
      nutritionBreakdown: nutritionBreakdown.data,
      healthRisk: healthRisk.data,
    };
  },
};