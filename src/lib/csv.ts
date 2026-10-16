import type { Stream } from './api';
import { formatTokenAmount } from './format';
import { getNativeAssetAddress } from './stellar';

const CSV_HEADERS = ['NGO', 'Token', 'Status', 'Committed', 'Withdrawn', 'Created'];

// There's no symbol/name resolution for arbitrary tokens — only the native
// asset's contract address is derivable client-side.
function tokenLabel(tokenAddress: string): string {
  return tokenAddress === getNativeAssetAddress() ? 'XLM' : tokenAddress;
}

function escapeCsvField(value: string): string {
  // A field starting with =, +, - or @ runs as a formula when opened in a
  // spreadsheet — prefix it with a single quote so it's read as literal
  // text instead (the standard CSV injection mitigation).
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** Builds a CSV of a donor's streams for the dashboard's "Export CSV"
 * button — one row per stream, amounts run through formatTokenAmount. */
export function buildDonationHistoryCsv(streams: Stream[]): string {
  const rows = streams.map((stream) => {
    const committed = BigInt(stream.balance) + BigInt(stream.withdrawn);
    return [
      stream.ngo.name,
      tokenLabel(stream.tokenAddress),
      stream.status === 'ACTIVE' ? 'Active' : 'Cancelled',
      formatTokenAmount(committed.toString(), stream.tokenAddress),
      formatTokenAmount(stream.withdrawn, stream.tokenAddress),
      new Date(stream.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }),
    ].map(escapeCsvField);
  });

  return [CSV_HEADERS, ...rows].map((row) => row.join(',')).join('\n');
}
