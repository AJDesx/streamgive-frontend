'use client';

import { useEffect } from 'react';

import './globals.css';

/** Last-resort boundary for errors thrown by the root layout itself. It
 * replaces the layout, so it renders its own <html>/<body> and cannot use
 * the wallet or toast providers (or anything that depends on them, like
 * the Header). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <main
          id="main"
          className="flex min-h-screen items-center justify-center px-6 py-20 text-center sm:px-12"
        >
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-400">
              Something went wrong
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              StreamGive hit a critical error.
            </h1>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-400">
              The app couldn’t be loaded right now. Please try again.
            </p>
            {error.digest && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Error reference: <code className="font-mono">{error.digest}</code>
              </p>
            )}
            <button
              type="button"
              onClick={() => reset()}
              className="mt-8 inline-flex rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
