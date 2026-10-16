import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useToast } from '@/components/toast/ToastProvider';

let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/wallet/WalletProvider', () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AppShell } from './AppShell';

function ShowToastOnMount() {
  const { showToast } = useToast();
  useEffect(() => {
    showToast('info', 'Hello from embed');
  }, [showToast]);
  return null;
}

describe('AppShell', () => {
  it('renders the testnet banner and route-progress chrome on an ordinary route', () => {
    mockPathname = '/ngos';
    render(<AppShell>{null}</AppShell>);

    expect(screen.getByText(/mode: transactions use test funds/i)).toBeInTheDocument();
  });

  // issue #214: the embed widget is loaded in a partner's iframe, where the
  // testnet banner and route progress bar look broken rather than helpful.
  it('hides the testnet banner on an /embed route', () => {
    mockPathname = '/embed/ngo-1';
    render(<AppShell>{null}</AppShell>);

    expect(screen.queryByText(/mode: transactions use test funds/i)).not.toBeInTheDocument();
  });

  it('still provides toast context on /embed without rendering the floating toast host', () => {
    mockPathname = '/embed/ngo-1';
    render(
      <AppShell>
        <ShowToastOnMount />
      </AppShell>,
    );

    expect(screen.queryByText('Hello from embed')).not.toBeInTheDocument();
  });

  it('renders the floating toast host on an ordinary route', () => {
    mockPathname = '/ngos';
    render(
      <AppShell>
        <ShowToastOnMount />
      </AppShell>,
    );

    expect(screen.getByText('Hello from embed')).toBeInTheDocument();
  });
});
