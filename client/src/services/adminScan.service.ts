import { api } from './api';

export interface AdminFoodScan {
  id: string;
  dish_name: string;
  confidence: number;
  nutrients: Record<string, unknown>;
  calories: number;
  health_assessment: string;
  recommendations: string;
  health_condition: string | null;
  risk_level: string;
  scanned_at: string;
  user_id: string;
  user_email: string;
  user_name: string;
}

export interface AdminFoodScansResponse {
  items: AdminFoodScan[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export const adminScanService = {
  async getScans(params: { page: number; search: string; lowConfidence: boolean }): Promise<AdminFoodScansResponse> {
    const response = await api.get('/food/admin/scans', {
      params: {
        page: params.page,
        limit: 20,
        search: params.search || undefined,
        lowConfidence: params.lowConfidence || undefined,
      },
    });
    const data = response.data?.data;
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Unable to load food scan records.');
    }
    return data;
  },
};
