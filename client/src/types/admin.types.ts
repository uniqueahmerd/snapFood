import type { PaginationParams } from './api.types';
import type { Role, User } from './auth.types';

/** `GET /admin/stats` */
export interface AdminStats {
  totalUsers: number;
  totalResources: number;
  totalNotes: number;
  totalSnippets: number;
  totalAiMessages: number;
  /** Optional deltas versus the previous period, as percentages. */
  userGrowth?: number;
  contentGrowth?: number;
  /** Daily series powering the growth chart. */
  growth?: AdminGrowthPoint[];
}

export interface AdminGrowthPoint {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  users: number;
  resources: number;
  notes: number;
  snippets: number;
}

/** Account state shown as a badge in the admin user table. */
export type AdminUserStatus = 'active' | 'suspended' | 'unverified';

/** A row in `GET /admin/users`. */
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended';
  isAccountVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  page: number;
  pages: number;
  total: number;
}

/** `GET /admin/users/:id` */
export interface AdminUserDetail extends AdminUser {
  resourceCount: number;
  noteCount: number;
  snippetCount: number;
  aiMessageCount: number;
  spaceCount?: number;
  deckCount?: number;
}

export interface AdminUserQueryParams extends PaginationParams {
  search?: string;
  role?: Role;
  status?: AdminUserStatus;
}

/** A row in `GET /admin/content/public-snippets`. */

export interface ModerationQueryParams extends PaginationParams {
  search?: string;
  language?: string;
}

/** Resolve the badge state for a user row. */
export function getUserStatus(user: Pick<User, 'isVerified' | 'isSuspended'>): AdminUserStatus {
  if (user.isSuspended) return 'suspended';
  if (!user.isVerified) return 'unverified';
  return 'active';
}
