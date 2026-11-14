import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { STALE_TIME } from '../constants/queryKeys';

/**
 * The single React Query client.
 *
 * SECTION 10 puts all server state in here, so these defaults set the tone for
 * the whole app:
 *
 *  · `retry` never repeats a 4xx. A 401 is handled by the Axios interceptor and a
 *    403/404 will not become true on the third attempt — retrying those only
 *    delays the error the user needs to see.
 *  · `refetchOnWindowFocus` is off. snapfood is a reading and writing tool; pulling
 *    a list out from under someone who just alt-tabbed back to it is hostile, and
 *    the mutation hooks already invalidate precisely what they change.
 *  · Mutations get no retry at all — POSTing a resource twice is worse than
 *    failing once.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.medium,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
