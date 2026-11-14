import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '../services/dashboard.service';
import { useIsAuthenticated } from '../store/auth.store';
import { getErrorMessage } from '../services/api';

const DASHBOARD_QUERY_KEY = ['dashboard', 'overview'] as const;

export function useDashboardData() {
  const isAuthenticated = useIsAuthenticated();
  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardService.getOverview(),
    enabled: isAuthenticated,
  });

  return {
    summary: query.data?.summary ?? null,
    recentScans: query.data?.recentScans ?? [],
    weeklyTrend: query.data?.weeklyTrend ?? [],
    nutritionBreakdown: query.data?.nutritionBreakdown ?? null,
    healthRisk: query.data?.healthRisk ?? [],
    loading: query.isPending,
    error: query.error ? getErrorMessage(query.error) : null,
    loadDashboardData: async () => {
      await query.refetch();
    },
  };
}