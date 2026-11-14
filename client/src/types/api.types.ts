/**
 * Response envelopes. These mirror SECTION 7 of the API contract exactly:
 *
 *   success    { success: true, data: { ... }, message?: string }
 *   error      { success: false, message: string }
 *   paginated  { success: true, data: { items: [], total, page, limit, totalPages } }
 *
 * Do not change these shapes — the backend owns the contract.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** The `data` payload of a paginated endpoint. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Query params accepted by every paginated list endpoint. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export type SortOrder = 'ASC' | 'DESC';

/** Fields common to every TypeORM entity (see server `base.entity.ts`). */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalised error thrown by the services layer. Components and mutation
 * handlers should catch this rather than raw AxiosError.
 */
export interface NormalisedApiError {
  message: string;
  status?: number;
  /** Field-level errors, when the backend supplies them. */
  fields?: Record<string, string>;
}
