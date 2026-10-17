import type { MetadataRoute } from 'next';

/**
 * Web app manifest — served at /manifest.webmanifest.
 * Enables "Add to Home Screen" on mobile and provides browser-level theming.
 * Next.js wires up the <link rel="manifest"> automatically when this file exists.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StreamGive',
    short_name: 'StreamGive',
    description: 'Recurring, streaming donations for verified NGOs on Stellar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0d9488',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
