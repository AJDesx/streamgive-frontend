'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export type ToastAction = { label: string; url: string };
export type Toast = { id: number; type: ToastType; message: string; action?: ToastAction };

export type ToastContextValue = {
  showToast: (type: ToastType, message: string, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
const TOAST_DURATION_MS = 5000;

// bg-green-600 on white text is ~3.4:1 — under AA's 4.5:1 for normal text —
// so success uses a darker shade instead of a dark: override, since these
// are solid floating boxes rather than page background/text pairs.
const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-700 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-900 text-white',
};

export function ToastProvider({
  children,
  hideHost = false,
}: {
  children: ReactNode;
  /** Suppresses the floating toast list while still providing `useToast()`
   * context to `children` — used on the embed widget (issue #214), where a
   * fixed-position overlay inside a partner's small iframe looks broken
   * rather than helpful. */
  hideHost?: boolean;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Per-toast auto-dismiss timers, so hover/focus can pause and later
  // restart one without touching the others (WCAG 2.2.1 Timing Adjustable —
  // error messages in particular can be too long to read in 5s).
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: number) => {
      const existing = timers.current.get(id);
      if (existing) {
        clearTimeout(existing);
      }
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), TOAST_DURATION_MS),
      );
    },
    [dismissToast],
  );

  const pauseDismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, action?: ToastAction) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, type, message, action }]);
      scheduleDismiss(id);
    },
    [scheduleDismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {!hideHost && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              // Errors interrupt (assertive) since they need attention now;
              // success/info are announced without interrupting other speech.
              role={toast.type === 'error' ? 'alert' : 'status'}
              onMouseEnter={() => pauseDismiss(toast.id)}
              onMouseLeave={() => scheduleDismiss(toast.id)}
              onFocus={() => pauseDismiss(toast.id)}
              onBlur={() => scheduleDismiss(toast.id)}
              className={`flex max-w-sm items-start gap-3 rounded-md px-4 py-3 text-sm font-medium shadow-lg ${TOAST_STYLES[toast.type]}`}
            >
              <div className="flex-1">
                <p>{toast.message}</p>
                {toast.action && (
                  <a
                    href={toast.action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-100"
                  >
                    {toast.action.label}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-sm text-base leading-none opacity-80 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
