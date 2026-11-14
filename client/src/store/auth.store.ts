import { create } from 'zustand';

import { isAdmin as isAdminRole, type User } from '../types/auth.types';

/**
 * Auth state.
 *
 * The accessToken lives here — in memory — and
 * nowhere else. It is never written to localStorage or sessionStorage, and the
 * refreshToken is an httpOnly cookie that JavaScript never reads. That means a
 * page refresh loses the access token by design; `useAuthBootstrap` recovers
 * the session by calling `POST /auth/refresh-token` on app load.
 *
 * Deliberately NOT wrapped in `persist`.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /**
   * True from app start until the initial refresh attempt settles. Guards
   * against ProtectedRoute bouncing a signed-in user to /login during the
   * one-tick window before the token is restored.
   */
  isBootstrapping: boolean;
}

interface AuthActions {
  /** Sign-in / OAuth-callback success: token and user together. */
  setAuth: (payload: { user: User; accessToken: string }) => void;
  /** Silent refresh: rotate the token, keep the user. */
  setAccessToken: (accessToken: string) => void;
  /** Profile updates and `/auth/me` hydration. */
  setUser: (user: User) => void;
  /** Sign-out and any unrecoverable auth failure. */
  clearAuth: () => void;
  /** Called once the bootstrap refresh has resolved either way. */
  finishBootstrap: () => void;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isBootstrapping: true,
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...initialState,

  setAuth: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isBootstrapping: false,
    }),

  setAccessToken: (accessToken) =>
    set((state) => ({
      accessToken,
      isAuthenticated: Boolean(accessToken) && Boolean(state.user ?? true),
    })),

  setUser: (user) => set({ user }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
    }),

  finishBootstrap: () => set({ isBootstrapping: false }),
}));

/* ── Non-reactive access, for the Axios interceptors ─────────────────────── */

export const authStore = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (token: string) => useAuthStore.getState().setAccessToken(token),
  getUser: () => useAuthStore.getState().user,
  setUser: (user: User) => useAuthStore.getState().setUser(user),
  clear: () => useAuthStore.getState().clearAuth(),
};

/* ── Selectors ───────────────────────────────────────────────────────────── */

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsBootstrapping = () => useAuthStore((s) => s.isBootstrapping);
export const useIsAdmin = () => useAuthStore((s) => isAdminRole(s.user));
