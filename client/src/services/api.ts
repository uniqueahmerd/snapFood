import axios, { type AxiosError, type AxiosResponse } from 'axios';

import { env } from '../constants/env';
import { authStore } from '../store/auth.store';
import type {
  ApiFailure,
  ApiResponse,
  ApiSuccess,
  NormalisedApiError,
} from '../types/api.types';
import {RefreshTokenResponse} from "../types/auth.types"

/* ── Request config extensions ───────────────────────────────────────────── */

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Set once a request has already been replayed after a token refresh. */
    _retry?: boolean;
    /**
     * Opt a request out of the 401-refresh dance. Used by login, register and
     * the refresh call itself, where a 401 means "bad credentials", not
     * "expired token".
     */
    _skipAuthRefresh?: boolean;
  }
}

/**
 * The single Axios instance for the whole app. Nothing outside
 * `src/services/**` should import axios — components call service functions.
 *
 * `withCredentials` is required: the refreshToken is an httpOnly cookie set by
 * the backend, and this is the only way the browser will send it back. The
 * cookie is never read or written from JavaScript.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

/**
 * A bare client for the refresh call itself. Using a separate instance means
 * the response interceptor below can never recurse into itself when the
 * refresh endpoint is the thing returning 401.
 */
const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

/* ── Auth-failure handling ───────────────────────────────────────────────── */

type AuthFailureHandler = () => void;

let onAuthFailure: AuthFailureHandler | null = null;

/**
 * Registered by the router shell so an unrecoverable auth failure can navigate
 * to /login through React Router instead of a full page reload. Falls back to
 * a hard redirect when no handler is registered (e.g. a failure that happens
 * before the app mounts).
 */
export function setAuthFailureHandler(handler: AuthFailureHandler | null): void {
  onAuthFailure = handler;
}

function handleAuthFailure(): void {
  authStore.clear();
  if (onAuthFailure) {
    onAuthFailure();
    return;
  }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}

/* ── Request interceptor ─────────────────────────────────────────────────── */

api.interceptors.request.use((config) => {
  const token = authStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser build the multipart boundary for file uploads.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (config.data !== undefined && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

/* ── Single-flight token refresh ─────────────────────────────────────────── */

let refreshPromise: Promise<string> | null = null;

/**
 * Calls `POST /auth/refresh-token` at most once, no matter how many requests
 * fail with 401 simultaneously. Every caller awaits the same promise and then
 * replays with the rotated token.
 */
export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<unknown>('/auth/refresh-token')
      .then((response) => {
        // The backend answers `{ success: 'true', result: { accessToken } }`;
        // SECTION 7 documents `{ success: true, data: { accessToken } }`. Both
        // are accepted — see `unwrapKeys`.
        const payload = unwrapKeys<RefreshTokenResponse>(response, ['data', 'result']);

        if (!payload?.accessToken) {
          throw createApiError('Session refresh failed', response.status);
        }

        const { accessToken, user } = payload;
        authStore.setAccessToken(accessToken);
        if (user) authStore.setUser(user);
        return accessToken;
      })
      .finally(() => {
        // Allow a later 401 to trigger a fresh attempt.
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/* ── Response interceptor ────────────────────────────────────────────────── */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config;
    const status = error.response?.status;

    if (status !== 401 || !config || config._retry || config._skipAuthRefresh) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      const token = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    } catch (refreshError) {
      handleAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);

/* ── Envelope handling ───────────────────────────────────────────────────── */

/**
 * SECTION 7 documents `{ success: true, data }`, and most of the backend does
 * exactly that. The auth and user controllers do not: they return the payload
 * under an ad-hoc key (`user`, `User`, `userData`, `result`) beside `success`,
 * and `POST /auth/refresh-token` sends `success` as the *string* `'true'`.
 *
 * SECTION 13 is the tiebreaker — "match the backend response format exactly" —
 * so these two helpers accept both. Every deviation is spelled out at the call
 * site via the `keys` list rather than hidden inside a parser.
 */
function isOk(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const { success } = body as { success?: unknown };
  return success === true || success === 'true';
}

/**
 * Reads the payload from the first key present, in the order given. Always
 * include `'data'` so a controller that is later normalised to the SECTION 7
 * envelope keeps working without a code change.
 */
export function unwrapKeys<T>(response: AxiosResponse<unknown>, keys: readonly string[]): T {
  const body = response.data;

  if (!body || typeof body !== 'object') {
    return body as T;
  }

  if ('success' in body && !isOk(body)) {
    throw createApiError(
      (body as { message?: string }).message || 'Request failed',
      response.status,
    );
  }

  const record = body as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key] as T;
  }

  // No wrapper key matched: the controller returned the payload at the top
  // level (auth login puts `accessToken` there), so hand back the whole body.
  return body as T;
}

/**
 * Unwraps `{ success: true, data }` and turns `{ success: false, message }`
 * into a thrown `NormalisedApiError`, so services can `return unwrap(...)` and
 * callers only ever see the payload.
 */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;

  if (body && typeof body === 'object' && 'success' in body) {
    if (isOk(body)) return (body as ApiSuccess<T>).data;
    throw createApiError((body as ApiFailure).message || 'Request failed', response.status);
  }

  // Tolerate an endpoint that returns a bare payload rather than the envelope.
  return body as unknown as T;
}

/**
 * For endpoints whose useful output is the message rather than a payload
 * (logout, forgot-password, resend-verification).
 */
export function unwrapMessage(
  response: AxiosResponse<ApiResponse<unknown>>,
  fallback = 'Done',
): string {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body) {
    if (isOk(body)) return body.message ?? fallback;
    throw createApiError(body.message || 'Request failed', response.status);
  }
  return fallback;
}

export function createApiError(
  message: string,
  status?: number,
  fields?: Record<string, string>,
): NormalisedApiError & Error {
  const error = new Error(message) as NormalisedApiError & Error;
  error.status = status;
  error.fields = fields;
  return error;
}

/** Extracts a user-presentable message from anything that can be thrown. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the SnapFood server. Check your connection and try again.';
    }
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

/** HTTP status of a failure, when there was a response. */
export function getErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) return error.response?.status;
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

