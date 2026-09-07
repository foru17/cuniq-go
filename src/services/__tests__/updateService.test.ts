import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheData, CarrierFetchResult } from '@/services/types';

// carrier.ts reads NEXT_PUBLIC_CARRIER at module load, so pin it before the
// module graph is pulled in.
vi.stubEnv('NEXT_PUBLIC_CARRIER', 'cmhk');

const written: CacheData[] = [];
let cache: CacheData;
let fetchResult: CarrierFetchResult;

vi.mock('@/services/cacheStore', () => ({
  readCache: async () => cache,
  writeCache: async (data: CacheData) => {
    written.push(JSON.parse(JSON.stringify(data)));
  },
}));

vi.mock('@/services/sources/cmhk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/sources/cmhk')>();
  return {
    ...actual,
    fetchCmhkData: async () => fetchResult,
    // No stragglers to re-check in these scenarios; keep the run offline.
    verifyCmhkNumbers: async () => ({ statuses: new Map(), calls: 0 }),
  };
});

const { runUpdate } = await import('@/services/updateService');
const { getCarrier } = await import('@/lib/carrier');

const HOUR = 60 * 60 * 1000;

function ordinaryPool(count: number, lastSeenAt: number) {
  return Array.from({ length: count }, (_, i) => ({
    hkNumber: `6900${String(i).padStart(4, '0')}`,
    mainlandNumber: '',
    addedAt: lastSeenAt,
    lastSeenAt,
  }));
}

beforeEach(() => {
  written.length = 0;
  const seenAt = Date.now() - HOUR;
  cache = {
    ordinary: ordinaryPool(200, seenAt),
    special: [
      { hkNumber: '51007733', mainlandNumber: '', level: 'C', addedAt: seenAt, lastSeenAt: seenAt },
      { hkNumber: '64393377', mainlandNumber: '', level: 'D', addedAt: seenAt, lastSeenAt: seenAt },
    ],
    lastUpdated: seenAt,
  };
});

describe('runUpdate — premium pool with an incomplete fetch', () => {
  it('keeps previously cached premium numbers *visible* when a level fails', async () => {
    // D answered, C did not — so the premium list is not the complete pool.
    fetchResult = {
      ordinary: ordinaryPool(200, 0).map(n => ({ number: n.hkNumber, level: 'W' })),
      special: [{ number: '64393377', level: 'D' }],
      specialAuthoritative: false,
      upstreamCalls: 10,
    };

    const result = await runUpdate({ force: true });
    expect(result.success).toBe(true);

    const saved = written.at(-1)!;
    const carrier = getCarrier();

    // Both numbers survive in the cache...
    expect(saved.special.map(n => n.hkNumber).sort()).toEqual(['51007733', '64393377']);

    // ...and, crucially, both are still inside the read-side window. With
    // specialWindowMs = 0 that only holds if their lastSeenAt was refreshed.
    const visible = saved.special.filter(
      n => (n.lastSeenAt ?? 0) >= saved.lastUpdated - carrier.specialWindowMs
    );
    expect(visible).toHaveLength(2);
    expect(result.stats?.special.active).toBe(2);
  });

  it('prunes sold premium numbers once a run can see the complete pool', async () => {
    fetchResult = {
      ordinary: ordinaryPool(200, 0).map(n => ({ number: n.hkNumber, level: 'W' })),
      special: [{ number: '64393377', level: 'D' }],
      specialAuthoritative: true,
      upstreamCalls: 10,
    };

    const result = await runUpdate({ force: true });

    const saved = written.at(-1)!;
    expect(saved.special.map(n => n.hkNumber)).toEqual(['64393377']);
    expect(result.stats?.special.active).toBe(1);
  });
});

describe('runUpdate — pool collapse guard', () => {
  // Push the cached pool outside the 3h keep window so a thin incoming batch
  // really does gut it — inside the window the retained entries carry it.
  beforeEach(() => {
    const seenAt = Date.now() - 4 * HOUR;
    cache = {
      ordinary: ordinaryPool(200, seenAt),
      special: [],
      lastUpdated: seenAt,
    };
  });

  it('refuses to persist a run that guts a healthy pool', async () => {
    fetchResult = {
      ordinary: ordinaryPool(10, 0).map(n => ({ number: n.hkNumber, level: 'W' })),
      special: [{ number: '51007733', level: 'C' }, { number: '64393377', level: 'D' }],
      specialAuthoritative: true,
      upstreamCalls: 10,
    };

    const result = await runUpdate({ force: true });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('pool_collapse');
    expect(written).toHaveLength(0);
  });

  it('writes anyway when the caller explicitly overrides the guard', async () => {
    fetchResult = {
      ordinary: ordinaryPool(10, 0).map(n => ({ number: n.hkNumber, level: 'W' })),
      special: [{ number: '51007733', level: 'C' }, { number: '64393377', level: 'D' }],
      specialAuthoritative: true,
      upstreamCalls: 10,
    };

    const result = await runUpdate({ force: true, ignoreCollapseGuard: true });

    expect(result.success).toBe(true);
    expect(written).toHaveLength(1);
  });
});
