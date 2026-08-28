/**
 * Global error handling setup.
 *
 * Research summary for Expo SDK 52 (RN 0.76, Hermes default):
 * - Error Boundaries only catch render/lifecycle errors. They do **not** catch onPress or async code.
 * - ErrorUtils.setGlobalHandler catches most synchronous JS errors (including throws inside onPress handlers).
 * - It does **not** catch unhandled promise rejections from async onPress or raw API calls.
 * - Best current practice (2025/2026): Layered approach:
 *     1. react-error-boundary (v5 recommended for SDK 52 compatibility) for render errors.
 *     2. ErrorUtils.setGlobalHandler for sync errors / button clicks.
 *     3. Hermes promise rejection tracker (or polyfill) for async/unhandled promise errors.
 *
 * We deliberately chose `react-error-boundary` v5 over `react-native-error-boundary` because:
 *   - Much more maintained and feature-rich.
 *   - Works on web too (future-proof for Expo).
 *   - v5 is the compatible version for Metro/Hermes in SDK 52 (v6 has ESM issues).
 *
 * For async errors the promise tracker is the key piece that plain ErrorUtils does not provide.
 */

// Use any-casting to avoid redeclare issues across files / global scope in Metro
const g: any = typeof global !== 'undefined' ? global : {};
const ErrorUtils: any = g.ErrorUtils;
const HermesInternal: any = g.HermesInternal;

export type GlobalErrorCallback = (error: unknown, isFatal: boolean, context?: string) => void;

let setupDone = false;

export function setupGlobalErrorHandlers(onError?: GlobalErrorCallback) {
  if (setupDone) return;
  setupDone = true;

  const report = (error: unknown, isFatal: boolean, context: string) => {
    try {
      // Always log so Metro / device logs show it
      console.error(`[GlobalError][${context}]`, error);
    } catch {}

    if (onError) {
      try {
        onError(error, isFatal, context);
      } catch {}
    }
  };

  // 2. ErrorUtils — catches synchronous errors, including most thrown inside onPress handlers
  if (typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler && ErrorUtils.setGlobalHandler) {
    const original = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      report(error, !!isFatal, 'ErrorUtils');

      // Preserve original behavior (LogBox / RedBox in dev, crash in prod)
      try {
        original?.(error, isFatal);
      } catch {}
    });
  }

  // 3. Unhandled promise rejections (async onPress, API calls without catch, etc.)
  // This is the part that is *not* covered well by ErrorUtils alone.
  if (typeof HermesInternal !== 'undefined' && HermesInternal?.enablePromiseRejectionTracker) {
    // Best path on Expo SDK 52 (Hermes)
    HermesInternal.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (id: number, error: unknown) => {
        report(error, false, `UnhandledPromiseRejection#${id}`);
      },
      onHandled: (id: number) => {
        // A previously unhandled rejection was caught later
      },
    });
  } else {
    // Fallback for JSC or environments without Hermes hook
    try {
      // @ts-ignore
      const tracking = require('promise/setimmediate/rejection-tracking');
      tracking.enable({
        allRejections: true,
        onUnhandled: (id: number, error: unknown) => {
          report(error, false, `UnhandledPromiseRejection#${id}`);
        },
      });
    } catch {
      // polyfill not present — ignore
    }
  }

  // Extra safety net for the global rejection event
  if (typeof global !== 'undefined') {
    const g: any = global;
    const previous = g.onunhandledrejection;
    g.onunhandledrejection = (event: any) => {
      report(event?.reason ?? event, false, 'onunhandledrejection');
      if (typeof previous === 'function') {
        try { previous(event); } catch {}
      }
    };
  }
}

/** Convenience helper if you want to manually surface an error to the global system */
export function reportErrorToGlobal(error: unknown, context = 'manual') {
  try {
    console.error(`[ReportedError][${context}]`, error);
  } catch {}
}
