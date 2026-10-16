import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NotFound from './not-found';

vi.mock('@/components/wallet/WalletProvider', () => ({
  useWallet: () => ({
    address: null,
    connecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
    networkMismatch: false,
  }),
}));

describe('NotFound', () => {
  it('renders the #main target the skip link points at', () => {
    const { container } = render(<NotFound />);
    const skipLink = container.querySelector('a[href="#main"]');
    expect(skipLink).not.toBeNull();
    expect(container.querySelector('main#main')).not.toBeNull();
  });
});
