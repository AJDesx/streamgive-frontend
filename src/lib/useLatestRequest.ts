import { useCallback, useEffect, useRef } from 'react';

export type LatestRequest = {
  /** Aborted as soon as a newer request begins (or on cancel/unmount). */
  signal: AbortSignal;
  /** True only while no newer request has begun since this one did. Checked
   * before every state update, since not every fetch helper honours `signal`
   * (the signed admin calls, for one) and a mock or a slow response can
   * settle after being aborted. */
  isCurrent: () => boolean;
};

/**
 * Staleness guard for fetch-and-set-state helpers: `begin()` supersedes
 * whatever request was in flight, so only the most recently started one may
 * write state. Prevents a slow response for a previous wallet/tab from
 * landing after, and overwriting, newer data.
 */
export function useLatestRequest(): {
  begin: () => LatestRequest;
  cancel: () => void;
} {
  const latest = useRef<{ id: number; controller: AbortController | null }>({
    id: 0,
    controller: null,
  });

  const cancel = useCallback(() => {
    latest.current.controller?.abort();
    latest.current = { id: latest.current.id + 1, controller: null };
  }, []);

  const begin = useCallback((): LatestRequest => {
    latest.current.controller?.abort();
    const id = latest.current.id + 1;
    const controller = new AbortController();
    latest.current = { id, controller };
    return { signal: controller.signal, isCurrent: () => latest.current.id === id };
  }, []);

  // Nothing in flight should update state once the page is gone.
  useEffect(() => cancel, [cancel]);

  return { begin, cancel };
}
