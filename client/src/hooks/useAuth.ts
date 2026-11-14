import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  DEFAULT_AUTHENTICATED_ROUTE,
  PUBLIC_ROUTES,
  ROUTES,
  isOAuthCallbackPath,
} from "../constants/routes";
import { queryKeys } from "../constants/queryKeys";
import { GOOGLE_OAUTH_URL } from "../constants/env";

import { refreshAccessToken, setAuthFailureHandler } from "../services/api";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResendVerificationPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from "../types/auth.types";
import { notifyError, notifySuccess } from "../utils/notify";
import { userService } from "../services/user.service"

/**
 * Restores the session on app load.
 *
 * SECTION 8/13: the accessToken lives in memory only, so a page refresh always
 * loses it. The refreshToken is an httpOnly cookie, so the only way to find out
 * whether a session exists is to ask the server. This runs exactly once, before
 * the router renders anything that depends on auth.
 *
 * On failure it does *not* redirect imperatively — it just finishes
 * bootstrapping with `isAuthenticated: false` and lets `ProtectedRoute` decide.
 * That is what SECTION 9 asks for while still allowing a signed-out visitor to
 * sit on `/login` or a public page without being bounced.
 */
export function useAuthBootstrap(): { isBootstrapping: boolean } {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const finishBootstrap = useAuthStore((s) => s.finishBootstrap);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React 18 StrictMode mounts effects twice in development. Keep the actual
  // bootstrap promise alive across those effect passes so the first cleanup
  // cannot leave the store stuck in its initial loading state.
  const bootstrapPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Lets the Axios interceptor bounce to /login through the router instead of
    // a full page reload, so the app shell is preserved.
    setAuthFailureHandler(() => {
      queryClient.clear();
      navigate(ROUTES.login, { replace: true });
    });
  }, [navigate, queryClient]);

  useEffect(() => {
    if (!bootstrapPromise.current) {
      bootstrapPromise.current = (async () => {
        try {
          // The OAuth callback route hands the token over directly, so skip the
          // refresh round trip and let that page seed the store.
          if (isOAuthCallbackPath(window.location.pathname)) return;

          // Skip refresh on public routes — the login page doesn't need a token,
          // and attempting to refresh will always fail with 401 anyway.
          const pathname = window.location.pathname;
          const isPublicRoute = PUBLIC_ROUTES.some(
            (pattern) =>
              pathname === pattern ||
              pathname.match(
                new RegExp(`^${pattern.replace(/:\w+/g, "[^/]+")}(?:/|$)`),
              ),
          );

          if (isPublicRoute) return;

          const accessToken = await refreshAccessToken();

          // `/auth/refresh-token` may or may not include the user, so fetch the
          // profile when it does not.
          const existing = useAuthStore.getState().user;
          const user = existing ?? (await userService.me());

          setAuth({ user, accessToken });
          setUser(user);
        } catch {
          // No valid refresh cookie: a normal signed-out visit, not an error
          // worth surfacing.
          clearAuth();
        } finally {
          finishBootstrap();
        }
      })();
    }
  }, [clearAuth, finishBootstrap, setAuth, setUser]);

  return { isBootstrapping };
}

/** `GET /user/me` — keeps the store's user in sync with the server. */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => userService.me(),
    enabled: isAuthenticated,
    // staleTime: STALE_TIME.long,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}

/** `POST /auth/login` */
export function useLogin(options?: { redirectTo?: string }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth({ user, accessToken });
      queryClient.setQueryData(queryKeys.auth.me(), user);
      notifySuccess(`Welcome back, ${user.firstName}.`);
      navigate(options?.redirectTo ?? DEFAULT_AUTHENTICATED_ROUTE, {
        replace: true,
      });
    },
    onError: (error) => notifyError(error, "Could not sign you in."),
  });
}

/**
 * `POST /auth/register`
 *
 * The backend hands back a live session with the 201 — sign-in is not gated
 * behind email verification — and separately sends the verification email. So
 * the new user goes straight to the dashboard, and the server's message (which
 * mentions the email) is what gets toasted.
 */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: ({ user, accessToken, message }) => {
      setAuth({ user, accessToken });
      queryClient.setQueryData(queryKeys.auth.me(), user);
      notifySuccess(
        message ?? "Account created. Check your inbox to verify your email.",
      );
      navigate(DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
    },
    onError: (error) => notifyError(error, "Could not create your account."),
  });
}

/** `POST /auth/logout` */
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    // `authService.logout` swallows network failures, so a lost connection can
    // never leave someone stuck signed in. Settled, not success, for that reason.
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      notifySuccess("Signed out.");
      navigate(ROUTES.login, { replace: true });
    },
  });
}

/** `GET /auth/verify-email/:token` — fires as soon as the page mounts. */
export function useVerifyEmail(token: string | undefined) {
  return useQuery({
    queryKey: ["auth", "verify-email", token] as const,
    queryFn: () => authService.verifyEmail(token as string),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
}

/** `POST /auth/resend-verification` */
export function useResendVerification() {
  return useMutation({
    mutationFn: (payload: ResendVerificationPayload) =>
      authService.resendVerification(payload),
    onSuccess: (message) => notifySuccess(message),
    onError: (error) =>
      notifyError(error, "Could not resend the verification email."),
  });
}

/**
 * `POST /auth/forgot-password`
 *
 * SECTION 11: this screen always reports success. No error toast is raised,
 * because a failure message would reveal whether an address is registered.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authService.forgotPassword(payload),
  });
}

/** `POST /auth/reset-password` */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authService.resetPassword(payload),
    onSuccess: (message) => {
      notifySuccess(message);
      navigate(ROUTES.login, { replace: true });
    },
    onError: (error) =>
      notifyError(error, "That reset link is invalid or has expired."),
  });
}

/** Profile edits from `/profile`. */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      userService.updateProfile(payload),
    onSuccess: (user) => {
      const completeUser = currentUser ? { ...currentUser, ...user as any } : user;
      setUser(completeUser);
      queryClient.setQueryData(queryKeys.auth.me(), completeUser);
      notifySuccess("Profile updated.");
    },
    onError: (error) => notifyError(error, "Could not update your profile."),
  });
}

/** Change password from `/settings`. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      userService.changePassword(payload),
    onSuccess: (message) => notifySuccess(message as any),
    onError: (error) => notifyError(error, "Could not change your password."),
  });
}

/** Danger-zone account deletion from `/settings`. */
export function useDeleteAccount() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: (message) => {
      clearAuth();
      queryClient.clear();
      notifySuccess(message as any);
      navigate(ROUTES.login, { replace: true });
    },
    onError: (error) => notifyError(error, "Could not delete your account."),
  });
}

/**
 * Starts the Google flow with a full page navigation.
 *
 * This must not be an XHR: the browser has to follow the backend's redirect to
 * Google's consent screen, and the httpOnly refresh cookie is set on the way
 * back.
 */
export function startGoogleOAuth(): void {
  window.location.assign(GOOGLE_OAUTH_URL);
}

/**
 * Completes the Google flow (SECTION 9).
 *
 * The backend redirects here with the access token in the query string. The
 * sequence matters:
 *
 *   1. read the token from the URL — `accessToken` (what the server sends) or
 *      `token` (what SECTION 9 documents);
 *   2. put it in the Zustand store, never localStorage;
 *   3. strip it from the address bar with `replaceState`, so it is not left in
 *      history, in a copied link, or in a `Referer` header;
 *   4. fetch the profile with it, since the redirect carries no user object;
 *   5. replace this entry with /dashboard, so Back does not re-enter a
 *      now-spent callback URL.
 *
 * Runs once — a StrictMode double-invoke must not consume the token twice.
 */
export function useOAuthCallback(): { error: string | null } {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken") ?? params.get("token");
    const failure = params.get("error");

    if (failure || !accessToken) {
      clearAuth();
      setError(
        failure
          ? "Google declined the sign-in request."
          : "That sign-in link is missing its token. Please try again.",
      );
      return;
    }

    // Step 2 then step 3: the token is in memory before the URL is rewritten, so
    // there is no window in which it exists nowhere.
    setAccessTokenInStore(accessToken);
    window.history.replaceState({}, "", window.location.pathname);

    let cancelled = false;

    void (async () => {
      try {
        const user = await userService.me();
        if (cancelled) return;

        setAuth({ user, accessToken });
        queryClient.setQueryData(queryKeys.auth.me(), user);
        notifySuccess(`Welcome, ${user.firstName}.`);
        navigate(DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
      } catch {
        if (cancelled) return;
        clearAuth();
        setError("We could not finish signing you in. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, navigate, queryClient, setAuth]);

  return { error };
}

/**
 * Written non-reactively on purpose: this happens inside an effect that is about
 * to rewrite the URL, and going through the store's hook API would add a render
 * between putting the token in memory and taking it out of the address bar.
 */
function setAccessTokenInStore(accessToken: string): void {
  useAuthStore.getState().setAccessToken(accessToken);
}
