import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_UPSTREAM_CALLS_PER_RUN,
  ORDINARY_BATCH_COUNT,
  VERIFY_BUDGET,
  verifyCmhkNumbers,
} from '@/services/sources/cmhk';

type FetchInit = { body?: string };

function conditionFromInit(init?: FetchInit): string {
  if (!init?.body) return '';
  try {
    return JSON.parse(init.body).msisdnCondition ?? '';
  } catch {
    return '';
  }
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe('verifyCmhkNumbers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('maps a number present in the upstream list to available, and an empty list to gone', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: FetchInit) => {
      const condition = conditionFromInit(init);
      if (condition === '12345678') {
        return jsonResponse({ code: '000000', data: { numberList: ['12345678'], total: 1 } });
      }
      return jsonResponse({ code: '000000', data: { numberList: [], total: 0 } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const promise = verifyCmhkNumbers(['12345678', '87654321']);
    await vi.runAllTimersAsync();
    const { statuses } = await promise;

    expect(statuses.get('12345678')).toBe('available');
    expect(statuses.get('87654321')).toBe('gone');
  });

  it('marks a number unknown (not gone) on fetch rejection and aborts remaining requests', async () => {
    const numbers = Array.from({ length: 10 }, (_, i) => (i === 0 ? 'FAIL' : `n${i}`));
    const fetchMock = vi.fn(async (_url: string, init?: FetchInit) => {
      const condition = conditionFromInit(init);
      if (condition === 'FAIL') {
        throw new Error('network down');
      }
      return jsonResponse({ code: '000000', data: { numberList: [], total: 0 } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const promise = verifyCmhkNumbers(numbers);
    await vi.runAllTimersAsync();
    const { statuses, calls } = await promise;

    expect(statuses.get('FAIL')).toBe('unknown');
    expect(calls).toBeLessThan(numbers.length);
    // Numbers past the aborted concurrent batch must never have been requested.
    expect(statuses.has('n7')).toBe(false);
    expect(statuses.has('n8')).toBe(false);
    expect(statuses.has('n9')).toBe(false);
  });

  it('marks a number unknown (not gone) on HTTP 500 and aborts remaining requests', async () => {
    const numbers = Array.from({ length: 10 }, (_, i) => (i === 0 ? 'BOOM' : `m${i}`));
    const fetchMock = vi.fn(async (_url: string, init?: FetchInit) => {
      const condition = conditionFromInit(init);
      if (condition === 'BOOM') {
        return jsonResponse({}, false, 500);
      }
      return jsonResponse({ code: '000000', data: { numberList: [], total: 0 } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const promise = verifyCmhkNumbers(numbers);
    await vi.runAllTimersAsync();
    const { statuses, calls } = await promise;

    expect(statuses.get('BOOM')).toBe('unknown');
    expect(calls).toBeLessThan(numbers.length);
  });

  it('honours the budget: fetch is called at most `budget` times for 100 candidate numbers', async () => {
    const numbers = Array.from({ length: 100 }, (_, i) => `x${i}`);
    const budget = 40;
    const fetchMock = vi.fn(async () =>
      jsonResponse({ code: '000000', data: { numberList: [], total: 0 } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const promise = verifyCmhkNumbers(numbers, budget);
    await vi.runAllTimersAsync();
    const { calls } = await promise;

    expect(calls).toBeLessThanOrEqual(budget);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(budget);
  });
});

describe('cmhk upstream call budget', () => {
  it('keeps ordinary + special + verify calls within the per-run cap', () => {
    // ORDINARY_BATCH_COUNT ordinary batches + 2 special levels (C, D) + the
    // verify budget must never exceed the hard per-run cap.
    expect(ORDINARY_BATCH_COUNT + 2 + VERIFY_BUDGET).toBeLessThanOrEqual(MAX_UPSTREAM_CALLS_PER_RUN);
  });
});
