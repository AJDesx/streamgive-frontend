import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DashboardPage from './page';
import * as WalletProviderMod from '@/components/wallet/WalletProvider';
import * as ApiMod from '@/lib/api';
import type { Stream } from '@/lib/api';

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'stream-1',
    onChainId: '1',
    tokenAddress: 'CTOKEN',
    rate: '10',
    balance: '1000',
    withdrawn: '0',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    donor: { address: 'G123' },
    ngo: { id: 'ngo-1', name: 'Test NGO', ownerAddress: 'GNGO' },
    ...overrides,
  };
}

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getStreams: vi.fn(),
}));

vi.mock('@/lib/csv', () => ({
  buildDonationHistoryCsv: vi.fn(),
}));

vi.mock('@/components/dashboard/StreamControls', () => ({
  StreamControls: () => null,
}));

describe('DashboardPage', () => {
  it('shows empty state when donor has no streams', async () => {
    vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
      address: 'G123',
      connecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      signMessage: vi.fn(),
    });

    vi.spyOn(ApiMod, 'getStreams').mockResolvedValue([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/you haven't started any streams yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explore ngos/i })).toHaveAttribute('href', '/ngos');
    });
  });

  it('does not render the empty state before the first fetch resolves', async () => {
    vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
      address: 'G123',
      connecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      signMessage: vi.fn(),
    });

    let resolveFetch: (streams: Stream[]) => void = () => {};
    vi.spyOn(ApiMod, 'getStreams').mockReturnValue(
      new Promise<Stream[]>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<DashboardPage />);

    expect(screen.getByText(/loading your streams/i)).toBeInTheDocument();
    expect(screen.queryByText(/you haven't started any streams yet/i)).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch([]);
    });

    expect(screen.getByText(/you haven't started any streams yet/i)).toBeInTheDocument();
  });

  it('shows a neutral loading state, not the connect prompt, while the wallet session restores', () => {
    vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
      address: null,
      connecting: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      signMessage: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(screen.queryByRole('button', { name: /connect wallet/i })).not.toBeInTheDocument();
  });

  describe('stream ID search', () => {
    // Cancelled so StreamControls (which needs a ToastProvider/contract
    // client this test file doesn't set up) never renders — irrelevant
    // to search, which only cares about onChainId.
    const streamOne = makeStream({ id: 's1', onChainId: '101', status: 'CANCELLED' });
    const streamTwo = makeStream({ id: 's2', onChainId: '202', status: 'CANCELLED' });

    it('filters the list by on-chain stream ID', async () => {
      vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
        address: 'G123',
        connecting: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      });
      vi.spyOn(ApiMod, 'getStreams').mockResolvedValue([streamOne, streamTwo]);

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(screen.getAllByText('Test NGO')).toHaveLength(2));

      const search = screen.getByPlaceholderText('Search by stream ID…');
      await user.type(search, '101');

      expect(screen.getAllByText('Test NGO')).toHaveLength(1);
      expect(screen.queryByText(/no streams match/i)).not.toBeInTheDocument();

      await user.clear(search);

      expect(screen.getAllByText('Test NGO')).toHaveLength(2);
    });

    it('shows a no-match message for a stream ID that does not exist', async () => {
      vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
        address: 'G123',
        connecting: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      });
      vi.spyOn(ApiMod, 'getStreams').mockResolvedValue([streamOne, streamTwo]);

      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(screen.getAllByText('Test NGO')).toHaveLength(2));
      await user.type(screen.getByPlaceholderText('Search by stream ID…'), '999');

      expect(await screen.findByText('No streams match stream ID "999".')).toBeInTheDocument();
    });
  });

  describe('load more', () => {
    // Cancelled so StreamControls (which needs a ToastProvider/contract
    // client this test file doesn't set up) never renders. 25 streams is
    // two full pages (PAGE_SIZE 10) plus a partial third.
    const manyStreams = Array.from({ length: 25 }, (_, i) =>
      makeStream({ id: `s${i + 1}`, onChainId: String(i + 1), status: 'CANCELLED' }),
    );

    function setup() {
      vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
        address: 'G123',
        connecting: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      });
      vi.spyOn(ApiMod, 'getStreams').mockResolvedValue(manyStreams);
      render(<DashboardPage />);
    }

    const rows = () => screen.getAllByRole('button', { name: 'View details' });

    it('shows one page at a time and hides "Load more" once everything is visible', async () => {
      const user = userEvent.setup();
      setup();

      await waitFor(() => expect(rows()).toHaveLength(10));

      await user.click(screen.getByRole('button', { name: 'Load more' }));
      expect(rows()).toHaveLength(20);

      await user.click(screen.getByRole('button', { name: 'Load more' }));
      expect(rows()).toHaveLength(25);
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    });

    it('derives "Load more" from the filtered list, not the full one', async () => {
      const user = userEvent.setup();
      setup();
      await waitFor(() => expect(rows()).toHaveLength(10));

      // IDs containing "2": 2, 12, 20-25 = 8 matches, under one page, even
      // though 25 streams exist in total.
      await user.type(screen.getByPlaceholderText('Search by stream ID…'), '2');

      expect(rows()).toHaveLength(8);
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    });

    it('goes back to the first page when the filter or search changes', async () => {
      const user = userEvent.setup();
      setup();
      await waitFor(() => expect(rows()).toHaveLength(10));

      await user.click(screen.getByRole('button', { name: 'Load more' }));
      expect(rows()).toHaveLength(20);
      await user.click(screen.getByRole('button', { name: 'Cancelled' }));
      expect(rows()).toHaveLength(10);

      await user.click(screen.getByRole('button', { name: 'Load more' }));
      expect(rows()).toHaveLength(20);
      // "1" matches 1, 10-19, 21 = 12 streams: more than one page.
      await user.type(screen.getByPlaceholderText('Search by stream ID…'), '1');
      expect(rows()).toHaveLength(10);
      expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
    });
  });

  describe('background polling', () => {
    function mockConnectedWallet() {
      vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
        address: 'G123',
        connecting: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      });
    }

    it('re-fetches streams every 30 seconds while the tab is visible', async () => {
      vi.useFakeTimers();
      try {
        mockConnectedWallet();
        const getStreamsMock = vi.spyOn(ApiMod, 'getStreams').mockResolvedValue([]);

        render(<DashboardPage />);
        await act(async () => {
          await Promise.resolve();
        });
        expect(getStreamsMock).toHaveBeenCalledTimes(1);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(30_000);
        });
        expect(getStreamsMock).toHaveBeenCalledTimes(2);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(30_000);
        });
        expect(getStreamsMock).toHaveBeenCalledTimes(3);
      } finally {
        vi.useRealTimers();
      }
    });

    it('stops polling while the tab is hidden and catches up immediately once visible again', async () => {
      vi.useFakeTimers();
      try {
        mockConnectedWallet();
        const getStreamsMock = vi.spyOn(ApiMod, 'getStreams').mockResolvedValue([]);

        render(<DashboardPage />);
        await act(async () => {
          await Promise.resolve();
        });
        expect(getStreamsMock).toHaveBeenCalledTimes(1);

        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));

        // The interval is stopped outright (not just skipping a tick), so
        // no amount of elapsed time while hidden triggers another fetch.
        await act(async () => {
          await vi.advanceTimersByTimeAsync(90_000);
        });
        expect(getStreamsMock).toHaveBeenCalledTimes(1);

        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
        await act(async () => {
          document.dispatchEvent(new Event('visibilitychange'));
          await Promise.resolve();
        });
        expect(getStreamsMock).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('sort options', () => {
    const streamOldest = makeStream({
      id: 's1',
      onChainId: '101',
      createdAt: '2026-01-01T00:00:00.000Z',
      balance: '100',
      withdrawn: '0', // committed: 100
      rate: '1', // 100s remaining
      ngo: { id: 'ngo-1', name: 'NGO Jan (Oldest)', ownerAddress: 'G1' },
    });
    const streamMiddle = makeStream({
      id: 's2',
      onChainId: '202',
      createdAt: '2026-02-01T00:00:00.000Z',
      balance: '500',
      withdrawn: '1500', // committed: 2000 (largest)
      rate: '50', // 10s remaining (ending soonest)
      ngo: { id: 'ngo-2', name: 'NGO Feb (Largest & Ending Soonest)', ownerAddress: 'G2' },
    });
    const streamNewest = makeStream({
      id: 's3',
      onChainId: '303',
      createdAt: '2026-03-01T00:00:00.000Z',
      balance: '300',
      withdrawn: '200', // committed: 500
      rate: '2', // 150s remaining
      ngo: { id: 'ngo-3', name: 'NGO Mar (Newest)', ownerAddress: 'G3' },
    });

    function setupStreams() {
      vi.spyOn(WalletProviderMod, 'useWallet').mockReturnValue({
        address: 'G123',
        connecting: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      });
      vi.spyOn(ApiMod, 'getStreams').mockResolvedValue([streamOldest, streamMiddle, streamNewest]);
    }

    it('sorts by newest by default', async () => {
      setupStreams();
      render(<DashboardPage />);

      await waitFor(() => expect(screen.getAllByRole('link', { name: /NGO / })).toHaveLength(3));
      const names = screen.getAllByRole('link', { name: /NGO / }).map((el) => el.textContent);
      expect(names).toEqual([
        'NGO Mar (Newest)',
        'NGO Feb (Largest & Ending Soonest)',
        'NGO Jan (Oldest)',
      ]);
    });

    it('sorts by oldest', async () => {
      setupStreams();
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(screen.getAllByRole('link', { name: /NGO / })).toHaveLength(3));
      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelect, 'oldest');

      const names = screen.getAllByRole('link', { name: /NGO / }).map((el) => el.textContent);
      expect(names).toEqual([
        'NGO Jan (Oldest)',
        'NGO Feb (Largest & Ending Soonest)',
        'NGO Mar (Newest)',
      ]);
    });

    it('sorts by largest committed', async () => {
      setupStreams();
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(screen.getAllByRole('link', { name: /NGO / })).toHaveLength(3));
      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelect, 'largest-committed');

      const names = screen.getAllByRole('link', { name: /NGO / }).map((el) => el.textContent);
      expect(names).toEqual([
        'NGO Feb (Largest & Ending Soonest)', // 2000 committed
        'NGO Mar (Newest)', // 500 committed
        'NGO Jan (Oldest)', // 100 committed
      ]);
    });

    it('sorts by ending soonest', async () => {
      setupStreams();
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(screen.getAllByRole('link', { name: /NGO / })).toHaveLength(3));
      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelect, 'ending-soonest');

      const names = screen.getAllByRole('link', { name: /NGO / }).map((el) => el.textContent);
      expect(names).toEqual([
        'NGO Feb (Largest & Ending Soonest)', // 10s remaining
        'NGO Jan (Oldest)', // 100s remaining
        'NGO Mar (Newest)', // 150s remaining
      ]);
    });
  });
});
