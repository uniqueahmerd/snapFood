import toast from 'react-hot-toast';

import { getErrorMessage } from '@/services/api';

/**
 * Toast helpers.
 *
 * SECTION 10 requires a toast on both success and failure for every async
 * action, so every mutation routes through here rather than calling
 * `react-hot-toast` directly. That keeps copy and duration consistent and means
 * error normalisation happens in exactly one place.
 */

/** Confirmation of a completed action. */
export function notifySuccess(message: string): void {
  toast.success(message, { id: message });
}

/**
 * Failure notice. Accepts a raw thrown value and runs it through
 * `getErrorMessage`, so callers can pass an Axios error straight from a
 * mutation's `onError` without unwrapping it first.
 */
export function notifyError(error: unknown, fallback?: string): void {
  const message = getErrorMessage(error, fallback);
  toast.error(message, { id: message, duration: 6000 });
}

/** Neutral information, e.g. "Nothing to save". */
export function notifyInfo(message: string): void {
  toast(message, { id: message });
}

/** Ties a toast to a promise's lifecycle — used for uploads and AI actions. */
export function notifyPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error?: string },
): Promise<T> {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: (error: unknown) => getErrorMessage(error, messages.error),
  });
}

/** Dismisses every visible toast — used when navigating away mid-flight. */
export function dismissToasts(): void {
  toast.dismiss();
}
