import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadPlatformImpact } from './impact';

const OWNER = 'GA4Z4GPSO3FKPMQJ3WCMU5D5WE25SDXZS47YDF3J3NWF65ILGCVJVWIJ';

const NGOS = ['ngo-1', 'ngo-2', 'ngo-3'].map((id) => ({
  id,
  ownerAddress: OWNER,
  name: `NGO ${id}`,
  verified: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}));

type FakeStats = Record<string, string | number>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Routes a stubbed fetch to /ngos and /ngos/:id the way api.ts calls them.
 * A numeric profile entry is served as that HTTP status, so a test can
 * simulate a 404 (which getNgo maps to null) without a hard failure.
 */
function stubNgoApi({
  listStatus = 200,
  profiles = {},
}: { listStatus?: number; profiles?: Record<string, FakeStats | number> } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/ngos')) {
        return Promise.resolve(jsonResponse(NGOS, listStatus));
      }
      const id = url.slice(url.lastIndexOf('/') + 1);
      const profile = profiles[id];
      if (typeof profile === 'number') {
        return Promise.resolve(new Response('stubbed failure', { status: profile }));
      }
      return Promise.resolve(
        jsonResponse({
          ...NGOS.find((ngo) => ngo.id === id),
          stats: {
            totalCommitted: '0',
            totalWithdrawn: '0',
            activeStreamCount: 0,
            donorCount: 0,
            ...profile,
          },
        }),
      );
    }),
  );
}

describe('loadPlatformImpact', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sums every NGO profile into platform totals', async () => {
    stubNgoApi({
      profiles: {
        'ngo-1': {
          totalCommitted: '1000000000',
          totalWithdrawn: '300000000',
          activeStreamCount: 2,
        },
        'ngo-2': { totalCommitted: '2500000000', activeStreamCount: 1 },
        'ngo-3': { totalCommitted: '50000000', totalWithdrawn: '50000000' },
      },
    });

    await expect(loadPlatformImpact()).resolves.toEqual({
      totalCommitted: 3550000000n,
      totalWithdrawn: 350000000n,
      activeStreams: 3,
      ngoCount: 3,
    });
  });

  it('skips an NGO whose profile 404s instead of failing the whole aggregation', async () => {
    stubNgoApi({
      profiles: {
        'ngo-1': { totalCommitted: '1000000000', activeStreamCount: 2 },
        'ngo-2': 404,
        'ngo-3': { totalCommitted: '50000000', activeStreamCount: 1 },
      },
    });

    await expect(loadPlatformImpact()).resolves.toMatchObject({
      totalCommitted: 1050000000n,
      activeStreams: 3,
      // The list still had three NGOs; only its missing stats are omitted.
      ngoCount: 3,
    });
  });

  it('skips an NGO profile that 5xxs instead of failing the whole aggregation', async () => {
    stubNgoApi({
      profiles: {
        'ngo-1': { totalCommitted: '1000000000', activeStreamCount: 2 },
        'ngo-2': 503,
        'ngo-3': { totalCommitted: '50000000', activeStreamCount: 1 },
      },
    });

    await expect(loadPlatformImpact()).resolves.toMatchObject({
      totalCommitted: 1050000000n,
      activeStreams: 3,
      ngoCount: 3,
    });
  });

  it('rejects when the NGO list cannot be fetched, so callers can hide degraded UI', async () => {
    stubNgoApi({ listStatus: 503 });

    await expect(loadPlatformImpact()).rejects.toThrow(/Failed to fetch NGOs/);
  });

  it('rejects when the API is unreachable at the network level', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
    );

    await expect(loadPlatformImpact()).rejects.toThrow(TypeError);
  });
});
