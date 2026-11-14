import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { modelService } from '@/services/model.service';
import { notifyError, notifySuccess } from '@/utils/notify';

const MODEL_LIFECYCLE_QUERY_KEY = ['models', 'lifecycle'] as const;

export function useModelLifecycle() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: MODEL_LIFECYCLE_QUERY_KEY,
    queryFn: modelService.getStatus,
  });

  const activate = useMutation({
    mutationFn: modelService.activate,
    onSuccess: (_, modelName) => {
      void query.refetch();
      void queryClient.invalidateQueries({ queryKey: ['system', 'audit'] });
      notifySuccess(`Activated model "${modelName}".`);
    },
    onError: (error, modelName) => {
      notifyError(error, `Could not activate model "${modelName}".`);
    },
  });

  return {
    status: query.data,
    loading: query.isPending,
    error: query.error,
    activate,
    refetch: () => query.refetch(),
  };
}
