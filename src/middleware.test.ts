import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { middleware } from './middleware';

function requestFor(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, 'https://example.com'));
}

describe('security headers middleware', () => {
  it('blocks framing on a non-embed route', () => {
    const response = middleware(requestFor('/dashboard'));

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('leaves /embed routes frameable for NGO sites', () => {
    const response = middleware(requestFor('/embed/ngo-1'));

    expect(response.headers.get('X-Frame-Options')).toBeNull();
  });

  it("sets a CSP with frame-ancestors 'none' on a non-embed route", () => {
    const csp = middleware(requestFor('/dashboard')).headers.get('Content-Security-Policy');

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('omits frame-ancestors from the CSP on /embed so NGO sites can frame it', () => {
    const csp = middleware(requestFor('/embed/ngo-1')).headers.get('Content-Security-Policy');

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('frame-ancestors');
  });

  it('allows the configured API and Soroban RPC origins in connect-src', () => {
    const csp = middleware(requestFor('/dashboard')).headers.get('Content-Security-Policy');
    const connectSrc = csp?.split('; ').find((d) => d.startsWith('connect-src '));

    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain('http://localhost:3000');
    expect(connectSrc).toContain('https://soroban-testnet.stellar.org');
  });

  it('sets HSTS and a restrictive Permissions-Policy on every route, embed included', () => {
    for (const path of ['/dashboard', '/embed/ngo-1']) {
      const response = middleware(requestFor(path));

      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=63072000; includeSubDomains',
      );

      const policy = response.headers.get('Permissions-Policy');
      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('payment=()');
    }
  });

  it('sets X-Content-Type-Options and Referrer-Policy on every route, embed included', () => {
    for (const path of ['/dashboard', '/embed/ngo-1']) {
      const response = middleware(requestFor(path));

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    }
  });
});
