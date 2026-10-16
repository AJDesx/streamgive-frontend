'use client';

import { useCopyToClipboard } from '@/lib/useCopyToClipboard';

/** Copies a link to the clipboard with a brief confirmation. Defaults to
 * the current page's URL; pass `path` to copy a link to a different page
 * instead (e.g. sharing the NGO's profile from its donate-success page). */
export function CopyLinkButton({ path }: { path?: string } = {}) {
  const { status, copy } = useCopyToClipboard();

  return (
    <>
      <button
        type="button"
        onClick={() => void copy(path ? `${window.location.origin}${path}` : window.location.href)}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
          status === 'error'
            ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
            : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
        }`}
      >
        {status === 'copied' ? 'Link copied!' : status === 'error' ? 'Copy failed' : 'Copy link'}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === 'copied' && 'Link copied to clipboard.'}
        {status === 'error' && 'Could not copy the link. Copy it from the address bar instead.'}
      </span>
    </>
  );
}
