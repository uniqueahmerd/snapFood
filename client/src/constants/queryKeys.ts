import type { AdminUserQueryParams } from "../types/admin.types";

/**
 * React Query cache keys.
 *
 * Every key is a tuple whose first element is the module name, so a whole
 * module can be invalidated with `queryClient.invalidateQueries({ queryKey:
 * queryKeys.resources.all })`. List keys carry their filter object, which
 * means changing a filter is a new cache entry rather than a refetch of the
 * same one.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => ["auth", "me"] as const,
  },

  dashboard: {
    all: ["dashboard"] as const,
    overview: () => ["dashboard", "overview"] as const,
    search: (term: string) => ["dashboard", "search", term] as const,
  },

  camera: {
    all: ["camera"] as const,
  },

  nutribot: {
    all: ["nutribot"] as const,
  },

  diagnostics: {
    all: ["diagnostics"] as const,
  },

  admin: {
    all: ["admin"] as const,
    stats: () => ["admin", "stats"] as const,
    userLists: () => ["admin", "users"] as const,
    users: (params?: AdminUserQueryParams) =>
      ["admin", "users", params ?? {}] as const,
    user: (id: string) => ["admin", "user", id] as const,
  },
} as const;

/** Default cache timings, tuned per data volatility. */
export const STALE_TIME = {
  /** Reference data that rarely changes within a session. */
  long: 10 * 60 * 1000,
  /** Lists the user edits from elsewhere in the app. */
  medium: 60 * 1000,
  /** Anything that should feel live. */
  short: 10 * 1000,
} as const;
