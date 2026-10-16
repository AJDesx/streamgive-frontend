import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type NgoProfile } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  getNgo: vi.fn(),
}));

vi.mock('@/components/donate/CreateStreamForm', () => ({
  CreateStreamForm: () => <div data-testid="stream-form" />,
}));

import { getNgo } from '@/lib/api';
import EmbedDonatePage from './page';

const baseNgo: NgoProfile = {
  id: 'ngo-1',
  name: 'Embed NGO',
  ownerAddress: 'G' + 'A'.repeat(55),
  verified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  website: null,
  description: null,
  country: null,
  stats: { totalCommitted: '0', totalWithdrawn: '0', activeStreamCount: 0, donorCount: 0 },
};

async function renderPage(ngo: NgoProfile) {
  vi.mocked(getNgo).mockResolvedValue(ngo);
  const params = Promise.resolve({ ngoId: ngo.id });
  const jsx = await EmbedDonatePage({ params });
  render(jsx as React.ReactElement);
}

describe('EmbedDonatePage', () => {
  it('shows the stream form for a verified NGO', async () => {
    await renderPage({ ...baseNgo, verified: true });
    expect(screen.getByTestId('stream-form')).toBeInTheDocument();
    expect(screen.queryByText(/not yet verified/i)).not.toBeInTheDocument();
  });

  it('shows a not-verified message instead of the form for an unverified NGO', async () => {
    await renderPage({ ...baseNgo, verified: false });
    expect(screen.getByText(/not yet verified/i)).toBeInTheDocument();
    expect(screen.queryByTestId('stream-form')).not.toBeInTheDocument();
  });
});
