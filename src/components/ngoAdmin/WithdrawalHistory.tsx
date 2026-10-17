'use client';

import { useEffect, useState } from 'react';

import { getWithdrawals, type Withdrawal } from '@/lib/api';
import { formatAmount } from '@/lib/format';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * Past withdrawal transactions for an NGO, so admins can reconcile their
 * records against what they've actually pulled out of StreamGive.
 * Fetches once on mount and again if `ngoId` changes.
 */
export function WithdrawalHistory({ ngoId }: { ngoId: string }) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  // Incrementing retryKey re-runs the fetch effect without changing ngoId.
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setLoadError(false);
    getWithdrawals(ngoId, controller.signal)
      .then((data) => {
        if (!cancelled) {
          setWithdrawals(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ngoId, retryKey]);

  return (
    <div className="mt-8">
      <h2 className="font-semibold">Transaction history</h2>

      {loading && (
        <p role="status" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Loading withdrawals…
        </p>
      )}

      {!loading && loadError && (
        <div className="mt-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load withdrawal history. Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="mt-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && withdrawals !== null && withdrawals.length === 0 && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No withdrawals yet.
        </p>
      )}

      {!loading && !loadError && withdrawals !== null && withdrawals.length > 0 && (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th scope="col" className="pb-2 font-medium">
                Date
              </th>
              <th scope="col" className="pb-2 font-medium">
                Stream
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-2 text-gray-600 dark:text-gray-400">
                  {formatDate(withdrawal.createdAt)}
                </td>
                <td className="py-2">#{withdrawal.streamId}</td>
                <td className="py-2 text-right font-medium">{formatAmount(withdrawal.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
