import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlatformAdminPage from './page';

const ADMIN_ADDRESS = 'G' + 'A'.repeat(55);
const signMessage = vi.fn();

const APPLICATION = {
  id: 'app-1',
  ownerAddress: 'G' + 'N'.repeat(55),
  name: 'Test NGO',
  description: 'A test NGO.',
  website: null,
  contactEmail: 'ngo@example.com',
  country: null,
  status: 'PENDING' as const,
  reviewNote: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const { listNgoApplications, reviewNgoApplication, getNgos } = vi.hoisted(() => ({
  listNgoApplications: vi.fn(),
  reviewNgoApplication: vi.fn(),
  getNgos: vi.fn(),
}));

vi.mock('@/components/layout/Header', () => ({ Header: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: () => ({ address: ADMIN_ADDRESS, signMessage, signTransaction: vi.fn() }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/ngoRegistryClient', () => ({
  useNgoRegistryClient: () => ({ client: null, ready: false }),
}));

vi.mock('@/lib/adminApi', () => ({ listNgoApplications, reviewNgoApplication }));
vi.mock('@/lib/api', () => ({ getNgos }));

describe('PlatformAdminPage reject flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNgos.mockResolvedValue([]);
  });

  it('asks for confirmation, then calls reviewNgoApplication with reject and refreshes the list', async () => {
    listNgoApplications.mockResolvedValueOnce([APPLICATION]).mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<PlatformAdminPage />);

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    expect(reviewNgoApplication).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Yes, reject' }));

    expect(reviewNgoApplication).toHaveBeenCalledWith(
      ADMIN_ADDRESS,
      signMessage,
      APPLICATION.id,
      'reject',
      undefined,
    );
    expect(await screen.findByText('No pending applications.')).toBeInTheDocument();
    expect(listNgoApplications).toHaveBeenCalledTimes(2);
  });
});
