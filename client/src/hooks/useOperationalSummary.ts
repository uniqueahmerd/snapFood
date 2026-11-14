import { useQuery } from '@tanstack/react-query';
import { operationalService } from '@/services/operational.service';

const OPERATIONAL_QUERY_KEY = ['operational', 'summary'] as const;

export function useOperationalSummary() {
  const query = useQuery({
    queryKey: OPERATIONAL_QUERY_KEY,
    queryFn: operationalService.getSummary,
  });

  return {
    summary: query.data,
    loading: query.isPending,
    error: query.error,
    refetch: () => query.refetch(),
  };
}
