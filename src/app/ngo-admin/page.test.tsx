import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NgoAdminPage from './page';

const NGO_ADDRESS = 'G' + 'N'.repeat(55);

const { lookupNgoByAddress, getStreams } = vi.hoisted(() => ({
  lookupNgoByAddress: vi.fn(),
  getStreams: vi.fn(),
}));

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: () => ({ address: NGO_ADDRESS }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({ lookupNgoByAddress, getStreams }));

// Everything that isn't under test is stubbed out; EmbedSnippet stays real
// so the test counts what a verified NGO actually sees.
vi.mock('@/components/layout/Header', () => ({ Header: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/ngos/DonateQrCode', () => ({ DonateQrCode: () => null }));
vi.mock('@/components/ngoAdmin/NgoAdminStreamList', () => ({ NgoAdminStreamList: () => null }));
vi.mock('@/components/ngoAdmin/WithdrawalHistory', () => ({ WithdrawalHistory: () => null }));
vi.mock('@/components/streams/StreamDetailsModal', () => ({ StreamDetailsModal: () => null }));

describe('NgoAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lookupNgoByAddress.mockResolvedValue({
      id: 'ngo-1',
      ownerAddress: NGO_ADDRESS,
      name: 'Test NGO',
      verified: true,
    });
    getStreams.mockResolvedValue([]);
  });

  it('renders a single embed snippet for a verified NGO', async () => {
    render(<NgoAdminPage />);

    expect(
      await screen.findByRole('heading', { name: 'Embed your donate widget' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Embed your donate widget' })).toHaveLength(1);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });
});
