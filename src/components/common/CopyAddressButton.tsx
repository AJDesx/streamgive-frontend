'use client';

import { useCopyToClipboard } from '@/lib/useCopyToClipboard';

/** A small button that copies a full address to the clipboard, showing a
 * brief label change as confirmation instead of a toast. The result is also
 * announced through a polite live region for screen readers. */
export function CopyAddressButton({ address }: { address: string }) {
  const { status, copy } = useCopyToClipboard();

  return (
    <>
      <button
        type="button"
        onClick={() => void copy(address)}
        title={address}
        // The full address is only part of the name while idle; otherwise the
        // static label would hide the visible "Copied!" / "Copy failed" text.
        aria-label={status === 'idle' ? `Copy address ${address}` : undefined}
        className={`rounded-md border px-2 py-1 text-xs font-medium ${
          status === 'error'
            ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
            : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
        }`}
      >
        {status === 'copied' ? 'Copied!' : status === 'error' ? 'Copy failed' : 'Copy'}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === 'copied' && 'Address copied to clipboard.'}
        {status === 'error' && 'Could not copy the address. Copy it manually instead.'}
      </span>
    </>
  );
}
