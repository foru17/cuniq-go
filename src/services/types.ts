import { NumberEntry } from '@/lib/utils';

// Raw payload shape returned by upstream carrier APIs (loosely typed; keys vary)
export type RawNumber = {
  number?: string;
  hkNumber?: string;
  mainlandNumber?: string;
  mcNumber?: string;
  mainland?: string;
  mainland_number?: string;
  level?: string;
  [key: string]: unknown;
};

export type CacheData = {
  ordinary: NumberEntry[];
  special: NumberEntry[];
  lastUpdated: number;
};

export type CarrierFetchResult = {
  ordinary: RawNumber[];
  special: RawNumber[];
  /**
   * True when every upstream call behind `special` succeeded, i.e. the list is
   * the carrier's complete premium pool and anything missing from it is sold.
   * False after any error — the caller must then fall back to the keep window
   * rather than wiping numbers it simply failed to fetch.
   */
  specialAuthoritative: boolean;
  /** Upstream HTTP calls spent producing this result (for the per-run budget) */
  upstreamCalls: number;
};

/**
 * Outcome of re-checking one number against upstream.
 * `unknown` covers every failure mode (network error, unexpected payload) and
 * must never be treated as "sold" — we would rather show a stale number than
 * delete a live one because of a blip.
 */
export type NumberStatus = 'available' | 'gone' | 'unknown';

/** The two pools every carrier exposes */
export type PoolName = 'ordinary' | 'special';

export type VerifyResult = {
  statuses: Map<string, NumberStatus>;
  /** Upstream HTTP calls actually spent */
  calls: number;
};
