'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STATUS_RESET_MS = 2000;

export type CopyStatus = 'idle' | 'copied' | 'error';

/** Copies text to the clipboard and exposes the outcome as `status`, which
 * returns to `idle` after a short delay. The reset timer is cleared on
 * unmount and whenever a new copy starts, so it never fires on a stale
 * component or cuts a later confirmation short. */
export function useCopyToClipboard(): {
  status: CopyStatus;
  copy: (text: string) => Promise<void>;
} {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      clearTimer();
      try {
        await navigator.clipboard.writeText(text);
        setStatus('copied');
      } catch {
        // Clipboard access can be denied by the browser.
        setStatus('error');
      }
      timer.current = setTimeout(() => setStatus('idle'), STATUS_RESET_MS);
    },
    [clearTimer],
  );

  return { status, copy };
}
