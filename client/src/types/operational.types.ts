export type OperationalStatus = 'healthy' | 'warning' | 'error' | 'disabled';

export interface OperationalResource {
  name: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface OperationalCheck {
  id: string;
  name: string;
  status: OperationalStatus;
  checkedAt: string;
  details: string;
}

export interface SystemLogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  meta?: Record<string, unknown>;
}

export interface SystemLogSnapshot {
  logs: SystemLogEntry[];
  total: number;
  limit: number;
  unavailableSources?: string[];
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  target: string;
  outcome: 'success' | 'failure';
  details?: string;
}

export interface SystemHealthResponse {
  generatedAt: string;
  status: OperationalStatus;
  backend: {
    status: OperationalStatus;
    details: string;
  };
  database: {
    status: OperationalStatus;
    details: string;
  };
  ai: {
    status: OperationalStatus;
    details: string;
    version: string | null;
    modelCount: number;
  };
  alerts: Array<{ level: string; message: string; source: string; timestamp: string }>;
}

export interface OperationalSummary {
  generatedAt: string;
  totalUsers: number;
  activeUsers: number;
  newUsersToday?: number;
  totalScans: number;
  latestScanAt: string | null;
  healthScore: number;
  registrationTrend?: Array<{ date: string; count: number }>;
  scanTrend?: Array<{ date: string; count: number }>;
  popularFoods?: Array<{ name: string; count: number; averageConfidence: number }>;
  recentAdminActions?: AdminAuditEntry[];
  analyticsAvailable?: boolean;
  database: {
    status: OperationalStatus;
    checkedAt: string;
    details: string;
  };
  models: {
    status: OperationalStatus;
    checkedAt: string;
    fileCount: number;
    files: OperationalResource[];
  };
  storage: {
    status: OperationalStatus;
    checkedAt: string;
  };
  diagnosticChecks: OperationalCheck[];
}
