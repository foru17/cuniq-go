import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_CARRIER', 'cuniq');

import { verifyCuniqNumbers } from '@/services/sources/cuniq';

function queryNumFrom(url: string): string {
  return new URL(url).searchParams.get('queryNum') ?? '';
}

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('verifyCuniqNumbers', () => {
  it('maps a hit to available and an empty list to gone', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const num = queryNumFrom(url);
      return jsonResponse(
        num === '66608914'
          ? { data: [{ hkNumber: '66608914', mcNumber: '13172008914' }] }
          : { data: [] }
      );
    }));

    const { statuses } = await verifyCuniqNumbers(['66608914', '66600000'], 10, 'special');

    expect(statuses.get('66608914')).toBe('available');
    expect(statuses.get('66600000')).toBe('gone');
  });

  it('queries the pool the number was listed from', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      return jsonResponse({ data: [] });
    }));

    await verifyCuniqNumbers(['66608914'], 10, 'ordinary');
    await verifyCuniqNumbers(['66608914'], 10, 'special');

    // The two pools sit behind different plan ids
    expect(urls[0]).toContain('goodsMonthPlanId=9003031');
    expect(urls[1]).toContain('goodsMonthPlanId=900300');
    expect(urls.every(u => queryNumFrom(u) === '66608914')).toBe(true);
  });

  it.each([
    ['a rejected request', async () => { throw new Error('socket hang up'); }],
    ['an HTTP 500', async () => ({ ok: false, status: 500, json: async () => ({}) } as unknown as Response)],
    ['a malformed payload', async () => jsonResponse({ data: null })],
  ])('reports %s as unknown, never gone, and stops early', async (_label, impl) => {
    vi.stubGlobal('fetch', vi.fn(impl));

    const numbers = Array.from({ length: 30 }, (_, i) => `6660${String(i).padStart(4, '0')}`);
    const { statuses, calls } = await verifyCuniqNumbers(numbers, 30, 'ordinary');

    expect([...statuses.values()]).not.toContain('gone');
    expect([...statuses.values()].every(s => s === 'unknown')).toBe(true);
    expect(calls).toBeLessThan(numbers.length);
  });

  it('never spends more calls than the budget allows', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const numbers = Array.from({ length: 100 }, (_, i) => `6660${String(i).padStart(4, '0')}`);
    const { calls } = await verifyCuniqNumbers(numbers, 40, 'special');

    expect(calls).toBeLessThanOrEqual(40);
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });
});
