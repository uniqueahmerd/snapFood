import { api } from './api';
import type { AdminAuditEntry, OperationalSummary, SystemHealthResponse, SystemLogSnapshot } from '../types/operational.types';

export const operationalService = {
  async getSummary(): Promise<OperationalSummary> {
    const response = await api.get('/system/operational-summary');
    const payload = response.data?.data;
    if (!payload || typeof payload !== 'object') {
      throw new Error('The operational summary is unavailable.');
    }

    const hasAnalytics = [
      'newUsersToday',
      'registrationTrend',
      'scanTrend',
      'popularFoods',
      'recentAdminActions',
    ].every((key) => Object.prototype.hasOwnProperty.call(payload, key));

    return {
      ...payload,
      newUsersToday: typeof payload.newUsersToday === 'number' ? payload.newUsersToday : undefined,
      registrationTrend: Array.isArray(payload.registrationTrend) ? payload.registrationTrend : [],
      scanTrend: Array.isArray(payload.scanTrend) ? payload.scanTrend : [],
      popularFoods: Array.isArray(payload.popularFoods) ? payload.popularFoods : [],
      recentAdminActions: Array.isArray(payload.recentAdminActions) ? payload.recentAdminActions : [],
      analyticsAvailable: hasAnalytics,
    };
  },

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const response = await api.get('/system/health');
    const data = response.data?.data;
    if (!data) {
      throw new Error('The system health snapshot is unavailable.');
    }
    return data;
  },

  async getLogs(limit = 25, level = 'all', source = 'all'): Promise<SystemLogSnapshot> {
    const response = await api.get('/system/logs', { params: { limit, level, source } });
    const data = response.data?.data;
    if (!data) {
      throw new Error('The backend log feed is unavailable.');
    }
    return data;
  },

  async getAudit(limit = 50): Promise<AdminAuditEntry[]> {
    const response = await api.get('/system/audit', { params: { limit } });
    const data = response.data?.data;
    if (!Array.isArray(data)) {
      throw new Error('The admin audit feed is unavailable.');
    }
    return data;
  },
};
