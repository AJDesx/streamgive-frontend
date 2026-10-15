'use client';

import { useState } from 'react';

import { useToast } from '@/components/toast/ToastProvider';
import { useWallet } from '@/components/wallet/WalletProvider';
import { useDonationVaultClient } from '@/lib/donationVaultClient';
import { formatAmount, formatEstimatedFee } from '@/lib/format';

type Step = 'idle' | 'checking' | 'confirming' | 'withdrawing';

const BUTTON_BASE =
  'rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50 dark:focus-visible:ring-teal-400';

export function WithdrawButton({
  streamOnChainId,
  onWithdrawn,
}: {
  streamOnChainId: string;
  onWithdrawn: () => void;
}) {
  const { address } = useWallet();
  const { client, ready } = useDonationVaultClient();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('idle');
  const [accrued, setAccrued] = useState<bigint | null>(null);
  const [nothingToWithdraw, setNothingToWithdraw] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);

  // Simulates the vault's pending_accrual view (no signature needed) so the
  // NGO sees exactly what will be paid before anything is signed.
  async function handleCheck(): Promise<void> {
    if (!address || !client) return;
    setNothingToWithdraw(false);
    setStep('checking');
    try {
      const tx = await client.pending_accrual({ stream_id: BigInt(streamOnChainId) });
      const amount = BigInt(tx.result);
      if (amount <= 0n) {
        setNothingToWithdraw(true);
        setStep('idle');
        return;
      }
      setAccrued(amount);
      setStep('confirming');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong.');
      setStep('idle');
    }
  }

  async function handleWithdraw(): Promise<void> {
    if (!address || !client) return;
    setStep('withdrawing');
    try {
      const tx = await client.withdraw({ stream_id: BigInt(streamOnChainId) });
      setEstimatedFee(formatEstimatedFee(tx.built?.fee));
      await tx.signAndSend();
      showToast('success', 'Withdrawal submitted — may take a few seconds to show below.');
      onWithdrawn();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setStep('idle');
      setAccrued(null);
      setEstimatedFee(null);
    }
  }

  if (step === 'confirming' && accrued !== null) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Withdraw {formatAmount(accrued.toString())} now?
        </span>
        <button
          type="button"
          onClick={() => void handleWithdraw()}
          className={`${BUTTON_BASE} bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200`}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('idle');
            setAccrued(null);
          }}
          className={`${BUTTON_BASE} border border-gray-300 dark:border-gray-700`}
        >
          Cancel
        </button>
      </div>
    );
  }

  const busy = step === 'checking' || step === 'withdrawing';

  return (
    <span className="inline-flex items-center gap-2">
      {nothingToWithdraw && (
        <span role="status" className="text-xs text-gray-500 dark:text-gray-400">
          Nothing to withdraw yet — funds accrue as the stream runs.
        </span>
      )}
      {step === 'withdrawing' && estimatedFee && (
        <span className="text-xs text-gray-500 dark:text-gray-400">Fee {estimatedFee}</span>
      )}
      <button
        type="button"
        onClick={() => void handleCheck()}
        disabled={busy || !ready}
        className={`${BUTTON_BASE} bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200`}
      >
        {step === 'checking'
          ? 'Checking…'
          : step === 'withdrawing'
            ? 'Withdrawing…'
            : ready
              ? 'Withdraw'
              : 'Loading…'}
      </button>
    </span>
  );
}
