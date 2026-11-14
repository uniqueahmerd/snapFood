import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import type { AdminUserQueryParams } from '@/types/admin.types';
import { queryKeys } from '@/constants/queryKeys';
import { notifyError, notifySuccess } from '@/utils/notify';

export function useAdminUsers(params: AdminUserQueryParams = {}) {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminService.getUsers(params),
  });

  const updateStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) =>
      adminService.updateUserStatus(userId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: ['system', 'audit'] });
      notifySuccess(status === 'active' ? 'User activated.' : 'User suspended.');
    },
    onError: (error, { status }) => {
      notifyError(
        error,
        status === 'active' ? 'Could not activate this user.' : 'Could not suspend this user.',
      );
    },
  });

  return {
    users: usersQuery.data?.items ?? [],
    page: usersQuery.data?.page ?? 1,
    pages: usersQuery.data?.pages ?? 1,
    total: usersQuery.data?.total ?? 0,
    loading: usersQuery.isPending,
    error: usersQuery.error,
    refetch: () => usersQuery.refetch(),
    updateStatus,
  };
}
