/**
 * Every route path in the app. Never hard-code a path string in a component —
 * import from here so renames are a single-file change.
 *
 * Functions build paths for parameterised routes; the `*_PATTERN` strings are
 * what `<Route path>` receives.
 */

export const ROUTES = {
  /* ── Public / auth ─────────────────────────────────────────────────────── */
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  /**
   * The token is a path segment, not a query param: the reset email links to
   * `${CLIENT_URL}/reset-password/${resetToken}`, so this has to match or an
   * otherwise valid link lands on the 404 page.
   */
  resetPassword: (token: string) => `/reset-password/${token}`,
  verifyEmail: (token: string) => `/verify-email/${token}`,

  /**
   * SECTION 9 documents `/auth/google/callback?token=`. The running backend
   * redirects to `${CLIENT_URL}/oauth/callback?accessToken=` instead, so both
   * paths are registered and the callback page accepts either query param —
   * whichever the server sends, the sign-in completes.
   */
  googleCallback: '/auth/google/callback',
  oauthCallback: '/oauth/callback',

  /* ── App ───────────────────────────────────────────────────────────────── */
  dashboard: '/dashboard',
  camera: "/camera",
  results: '/results',
  history: '/history',
  nutribot: "/nutribot",
  diagnostics: "/diagnostics",
  profile: '/profile',
  settings: '/settings',
  previewLanding: "/preview-landing",

  /* ── Admin ─────────────────────────────────────────────────────────────── */
  admin: '/admin',
  // adminUsers: '/admin/users',
  // adminUser: (id: string) => `/admin/users/${id}`,
  // adminModeration: '/admin/moderation',

  notFound: '/404',
} as const;

/** Patterns handed to React Router's `<Route path>`. */
export const ROUTE_PATTERNS = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/:token',
  verifyEmail: '/verify-email/:token',
  googleCallback: '/auth/google/callback',
  oauthCallback: '/oauth/callback',
  dashboard: '/dashboard',
  camera: "/camera",
  results: '/results',
  history: '/history',
  nutribot: "/nutribot",
  diagnostics: "/diagnostics",
  profile: '/profile',
  settings: '/settings',
  previewLanding: "/preview-landing",
  admin: "/admin",
} as const;

/** Where a freshly authenticated user lands. */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.dashboard;

/** Where the interceptor sends an unauthenticated user. */
export const LOGIN_ROUTE = ROUTES.login;

/** Routes reachable without a session. Used by the refresh bootstrap. */
export const PUBLIC_ROUTES: readonly string[] = [
  ROUTE_PATTERNS.login,
  ROUTE_PATTERNS.register,
  ROUTE_PATTERNS.forgotPassword,
  ROUTE_PATTERNS.resetPassword,
  ROUTE_PATTERNS.verifyEmail,
  ROUTE_PATTERNS.googleCallback,
  ROUTE_PATTERNS.oauthCallback,
  ROUTE_PATTERNS.previewLanding
];

/**
 * True when the current location is an OAuth landing page. The bootstrap refresh
 * is skipped there: the callback page has the access token in its query string
 * already, and a competing `POST /auth/refresh-token` would race it.
 */
export function isOAuthCallbackPath(pathname: string): boolean {
  return pathname === ROUTES.googleCallback || pathname === ROUTES.oauthCallback;
}
