import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'StreamGive — Recurring streaming donations for verified NGOs on Stellar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default Open Graph / Twitter social-share image.
 * Generated at request time via the Edge runtime — no static PNG to commit.
 * Next.js serves it at /opengraph-image and wires it into <head> automatically
 * when `metadataBase` is set in the root layout.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            background: '#0d9488',
            marginBottom: 32,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <path
              d="M4 20 Q7 12 11 16 Q15 20 19 12 Q23 4 24 8"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="4" cy="20" r="1.5" fill="white" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          StreamGive
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#99f6e4',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Recurring, streaming donations for verified NGOs on Stellar.
        </div>
      </div>
    ),
    { ...size },
  );
}
