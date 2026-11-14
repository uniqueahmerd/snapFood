import { api } from './api';
import type {
  AdminUser,
  AdminUserQueryParams,
  AdminUsersResponse,
} from '../types/admin.types';

export const adminService = {
  async getUsers(params: AdminUserQueryParams = {}): Promise<AdminUsersResponse> {
    const response = await api.get('/user/admin/users', { params });
    const data = response.data?.data;
    if (!data) throw new Error('Unable to load users.');
    return data;
  },

  async updateUserStatus(userId: string, status: AdminUser['status']): Promise<void> {
    await api.patch(`/user/admin/users/${userId}/status`, { status });
  },
};
