import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';

/**
 * Hand-written method signatures for our two deployed Soroban contracts.
 *
 * `Client.from()` builds its methods at runtime from the contract spec it
 * fetches off the network, so TypeScript only ever sees the bare `Client`
 * base class — every contract call reads as a missing property and the
 * argument shapes go unchecked. The usual fix is generated bindings
 * (`stellar contract bindings typescript`), but that needs a deployed
 * contract id to point at, which we don't have until the testnet deploy
 * lands. These mirror the contracts' public functions in the meantime.
 *
 * Keep them in step with the contract crates' src/lib.rs in streamgive-contracts;
 * a drift here is only caught at runtime, as a failed transaction.
 */
export type DonationVaultMethods = {
  /** Returns the new stream's id. */
  create_stream(args: {
    donor: string;
    ngo: string;
    token: string;
    deposit: bigint;
    rate: bigint;
  }): Promise<AssembledTransaction<bigint>>;

  top_up(args: { stream_id: bigint; amount: bigint }): Promise<AssembledTransaction<null>>;

  cancel_stream(args: { stream_id: bigint }): Promise<AssembledTransaction<null>>;

  modify_rate(args: { stream_id: bigint; new_rate: bigint }): Promise<AssembledTransaction<null>>;

  withdraw(args: { stream_id: bigint }): Promise<AssembledTransaction<null>>;

  /** Read-only view: the amount `withdraw` would pay out right now. Read
   * `.result` off the simulated transaction; it never needs signing. */
  pending_accrual(args: { stream_id: bigint }): Promise<AssembledTransaction<bigint>>;
};

export type NgoRegistryMethods = {
  /** Requires the owner's own signature - approve_ngo fails with
    * NotRegistered until this has been called for that address. */
  register(args: { owner: string; name: string }): Promise<AssembledTransaction<null>>;

  approve_ngo(args: { ngo_owner: string }): Promise<AssembledTransaction<null>>;

  revoke_ngo(args: { ngo_owner: string }): Promise<AssembledTransaction<null>>;
};

/** Contract error codes from ngo-registry's Error enum, for the cases worth
  * handling differently rather than surfacing as a raw message. */
export const NGO_REGISTRY_ERRORS = {
  ALREADY_REGISTERED: 3,
  NOT_REGISTERED: 4,
} as const;

/**
 * Contract error codes from donation-vault's Error enum.
 *
 * These must stay in sync with the numeric discriminants in
 * streamgive-contracts/donation-vault/src/lib.rs. A mismatch is only
 * caught at runtime (the SDK surfaces them as "Error(Contract, #N)"),
 * so update both sides together whenever the Rust enum changes.
 */
export const DONATION_VAULT_ERRORS = {
  /** The vault has been administratively paused; no new streams or
   * withdrawals are accepted until it is resumed. */
  VAULT_PAUSED: 1,
  /** The caller is not the stream's original donor. */
  UNAUTHORIZED: 2,
  /** No stream exists with the given id. */
  STREAM_NOT_FOUND: 3,
  /** The stream has already been cancelled and cannot be modified. */
  STREAM_ALREADY_CANCELLED: 4,
  /** The stream has no accrued balance left to withdraw. */
  NOTHING_TO_WITHDRAW: 5,
  /** The deposit or top-up amount is zero or negative. */
  INVALID_AMOUNT: 6,
  /** The computed per-second rate would be zero (deposit too small for
   * the chosen duration). */
  RATE_TOO_LOW: 7,
  /** The NGO address is not registered or not yet verified. */
  NGO_NOT_VERIFIED: 8,
  /** The token contract is not on the vault's allow-list. */
  TOKEN_NOT_ALLOWED: 9,
  /** The donor's token balance is too low to cover the deposit. */
  INSUFFICIENT_BALANCE: 10,
} as const;

// ---------------------------------------------------------------------------
// Human-readable error messages
// ---------------------------------------------------------------------------

/** Maps every known donation-vault error code to a short, user-facing sentence. */
const DONATION_VAULT_MESSAGES: Record<number, string> = {
  [DONATION_VAULT_ERRORS.VAULT_PAUSED]:
    'The donation vault is currently paused. Please try again later.',
  [DONATION_VAULT_ERRORS.UNAUTHORIZED]:
    "You're not the owner of this stream and can't modify it.",
  [DONATION_VAULT_ERRORS.STREAM_NOT_FOUND]:
    "This stream doesn't exist on-chain. It may have already been cancelled.",
  [DONATION_VAULT_ERRORS.STREAM_ALREADY_CANCELLED]:
    'This stream has already been cancelled.',
  [DONATION_VAULT_ERRORS.NOTHING_TO_WITHDRAW]:
    'Nothing to withdraw yet — funds accrue as the stream runs.',
  [DONATION_VAULT_ERRORS.INVALID_AMOUNT]:
    'The amount must be greater than zero.',
  [DONATION_VAULT_ERRORS.RATE_TOO_LOW]:
    'The deposit is too small to stream over this duration. Try a larger amount or a shorter duration.',
  [DONATION_VAULT_ERRORS.NGO_NOT_VERIFIED]:
    'This NGO is not verified and cannot receive streams at this time.',
  [DONATION_VAULT_ERRORS.TOKEN_NOT_ALLOWED]:
    "This token isn't accepted by the donation vault.",
  [DONATION_VAULT_ERRORS.INSUFFICIENT_BALANCE]:
    'Your wallet balance is too low to cover this deposit.',
};

/** Maps ngo-registry error codes to user-facing sentences. */
const NGO_REGISTRY_MESSAGES: Record<number, string> = {
  [NGO_REGISTRY_ERRORS.ALREADY_REGISTERED]:
    'This address is already registered.',
  [NGO_REGISTRY_ERRORS.NOT_REGISTERED]:
    'This address is not registered in the NGO registry.',
};

/**
 * Parses a Stellar SDK contract error (e.g. `"Error(Contract, #9)"` or
 * `"contract error: Error(Contract, #9)"`) and returns a human-readable
 * message.
 *
 * Falls back to the raw error message for unrecognised codes or non-contract
 * errors, so callers never see a completely silent failure.
 *
 * Usage:
 * ```ts
 * catch (err) {
 *   showToast('error', describeContractError(err));
 * }
 * ```
 */
export function describeContractError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  // The Stellar SDK formats contract errors as "Error(Contract, #N)" —
  // sometimes prefixed with "contract error: " from the AssembledTransaction
  // wrapper. Match both forms.
  const match = /Error\(Contract,\s*#(\d+)\)/.exec(raw);
  if (!match) {
    return raw || 'Something went wrong.';
  }

  const code = Number(match[1]);

  // Check donation vault messages first (most common call site), then
  // registry messages, then fall back to the raw text so an unknown code
  // is still legible rather than silently swallowed.
  return (
    DONATION_VAULT_MESSAGES[code] ??
    NGO_REGISTRY_MESSAGES[code] ??
    raw
  );
}
