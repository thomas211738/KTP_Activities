/**
 * Safe async handler wrapper (recommended for onPress + API calls).
 *
 * Research note:
 * ErrorUtils + promise trackers are great safety nets, but the most reliable
 * UX for button clicks and async flows is still to wrap at the call site.
 * This helper prevents the error from becoming an unhandled rejection while
 * letting you show toasts, disable buttons, etc.
 *
 * Usage examples:
 *   import { safeOnPress } from '../utils/safeAsync';
 *   <Pressable onPress={safeOnPress(async () => await apiCall())}>
 *
 *   import { safeAsync } from '../utils/safeAsync';
 *   onPress={safeAsync(async () => { ... }, (e) => Toast.show(...))}
 */

export type AsyncHandler = (...args: any[]) => Promise<any> | any;

export function safeAsync<T extends AsyncHandler>(handler: T, onError?: (error: unknown) => void) {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error('[safeAsync] caught error:', err);
      if (onError) {
        try { onError(err); } catch {}
      }
      // Swallow here — the global handlers will have already logged it.
    }
  };
}

export function safeOnPress(handler: AsyncHandler) {
  return safeAsync(handler);
}
