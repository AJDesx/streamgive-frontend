import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  getNgos: vi.fn(async () => []),
}));

describe('sitemap', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses the configured APP_URL origin for all sitemap entries', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://streamgive.example.com');

    // Import after stubbing so @/lib/config picks up the new env value.
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\/streamgive\.example\.com/);
      expect(entry.url).not.toMatch(/localhost/);
    }
  });
});
