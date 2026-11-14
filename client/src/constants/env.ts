/**
 * Typed, validated access to the Vite environment. Import `env` rather than
 * touching `import.meta.env` directly so a missing variable fails loudly here
 * instead of producing a request to `undefined/auth/login`.
 */

function required(value: string | undefined, name: string, fallback: string): string {
  if (value && value.trim()) return value.trim().replace(/\/$/, '');
  if (import.meta.env.DEV) {
    console.warn(`[snapfood] ${name} is not set; falling back to "${fallback}".`);
    return fallback;
  }
  throw new Error(`[snapfood] Missing required environment variable: ${name}`);
}

export const env = {
  apiBaseUrl: required(
    import.meta.env.VITE_API_BASE_URL,
    'VITE_API_BASE_URL',
    'http://localhost:5001/api/v1',
  ),

  googleOauthRedirect:
    import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT?.trim() ||
    `${window.location.origin}/auth/google/callback`,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

/** Where the browser is sent to begin Google OAuth. */
export const GOOGLE_OAUTH_URL = `${env.apiBaseUrl}/auth/google`;

