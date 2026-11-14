import type { BaseEntity } from './api.types';

/**
 * Role values mirror the server enum (`server/src/shared/enums.ts`), which is
 * lower-case:
 *
 *   export enum ROLE { ADMIN = 'admin', USER = 'user' }
 *
 * The spec's admin guard is written as `user.role === 'ADMIN'`, so `isAdmin()`
 * below compares case-insensitively. Always route role checks through it
 * instead of comparing strings inline — that way a casing change on either
 * side cannot silently lock admins out of the admin area.
 */
export const ROLE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const AUTH_PROVIDER = {
  LOCAL: 'local',
  GOOGLE: 'google',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDER)[keyof typeof AUTH_PROVIDER];

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  isVerified: boolean;
  authProvider: AuthProvider;
  role: Role;
  /**\
   * Not yet on the User entity server-side; the Profile screen supports an
   * avatar upload, so treat it as optional until the column lands.
   */
  /** Set by the admin suspend/activate endpoints. Absent means active. */
  isSuspended?: boolean;
}

/** True when the account may access `/admin/*`. Case-insensitive by design. */
export function isAdmin(user: Pick<User, 'role'> | null | undefined): boolean {
  return typeof user?.role === 'string' && user.role.toLowerCase() === ROLE.ADMIN;
}

/* ── Request payloads ─────────────────────────────────────────────────────── */

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

/**
 * The token travels in the URL path, not the body — `authService.resetPassword`
 * splits this object accordingly. Keeping both halves together here means the
 * ResetPassword form submits one value.
 */
export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ResendVerificationPayload {
  email: string;
}

/**
 * Field names mirror the server DTO (`PATCH /user/me/password`) exactly, so the
 * payload can be posted without a translation step. The Settings form labels it
 * "Current password" and adds a confirm field that never leaves the client.
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  currentPassword: string;
}


/* ── Response payloads ───────────────────────────────────────────────────── */

/** `POST /auth/login`, `POST /auth/register` (when auto-logged-in). */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * `POST /auth/refresh-token`. The refreshToken itself travels as an httpOnly
 * cookie and is never visible to JavaScript, so the body carries only the new
 * access token — plus the user, when the backend chooses to include it.
 */
export interface RefreshTokenResponse {
  accessToken: string;
  user?: User;
}
