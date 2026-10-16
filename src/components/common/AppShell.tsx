'use client';

import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { EnvironmentBanner } from '@/components/common/EnvironmentBanner';
import { RouteProgressBar } from '@/components/common/RouteProgressBar';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { WalletProvider } from '@/components/wallet/WalletProvider';

/**
 * Wraps every route with the app's persistent chrome (testnet banner, route
 * progress bar, toast host) and the wallet/toast providers -- except on
 * `/embed/*`, which is meant to be loaded in an `<iframe>` on a partner's
 * own site (issue #214). The amber banner eats vertical space and the
 * fixed-position progress bar/toast host look broken inside a small,
 * auto-resized widget, so those three are skipped there. `WalletProvider`
 * and `ToastProvider`'s context still wrap the embed route's children --
 * only the host chrome around it is conditional -- since the embed donate
 * form depends on both.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEmbed = pathname?.startsWith('/embed') ?? false;

  return (
    <>
      {!isEmbed && <EnvironmentBanner />}
      {!isEmbed && (
        // RouteProgressBar reads useSearchParams(), which requires a
        // Suspense boundary — see NgoExplorer's own use of this pattern.
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
      )}
      <ToastProvider hideHost={isEmbed}>
        <WalletProvider>{children}</WalletProvider>
      </ToastProvider>
    </>
  );
}
