import { getLocation } from '@/lib/location';
import { getCarrier } from '@/lib/carrier';
import { NumberEntry } from '@/lib/utils';
import { readCache, writeCache } from './cacheStore';
import { CacheData, NumberStatus } from './types';
import { applyVerification, isPoolCollapse, KEEP_ALL, mergeNumbers, unseenSince } from './merge';
import { fetchCuniqData } from './sources/cuniq';
import { fetchCmhkData, MAX_UPSTREAM_CALLS_PER_RUN, verifyCmhkNumbers } from './sources/cmhk';

export type UpdateResult = {
  success: boolean;
  skipped?: boolean;
  /** Why the run refused to write, when it did */
  reason?: 'upstream_empty' | 'pool_collapse';
  timestamp: number;
  duration?: string;
  stats?: {
    ordinary: { previous: number; current: number; active: number; new: number };
    special: { previous: number; current: number; active: number; new: number };
    locationEnriched: number;
    /** One-by-one upstream re-checks of numbers this run did not see */
    verification: { checked: number; confirmed: number; removed: number };
    upstreamCalls: number;
  };
};

type Verifier = (numbers: string[], budget: number) => Promise<{
  statuses: Map<string, NumberStatus>;
  calls: number;
}>;

function activeCount(entries: NumberEntry[], reference: number, windowMs: number): number {
  return entries.filter(n => (n.lastSeenAt ?? 0) >= reference - windowMs).length;
}

/**
 * Fetch latest numbers from the carrier's upstream API and refresh the cache.
 * With force=false the run is skipped when the cache is still fresh — this is
 * how page-triggered background refreshes avoid stampeding the upstream.
 */
export async function runUpdate({
  force = true,
  ignoreCollapseGuard = false,
}: { force?: boolean; ignoreCollapseGuard?: boolean } = {}): Promise<UpdateResult> {
  const carrier = getCarrier();
  const startTime = Date.now();
  console.log(`[Update] Starting data update for carrier=${carrier.id}...`);

  // 1. Load existing cache
  let cache = await readCache();
  if (!cache) {
    cache = { ordinary: [], special: [], lastUpdated: 0 };
  }

  if (!force && Date.now() - cache.lastUpdated < carrier.refreshIntervalMs) {
    console.log('[Update] Cache still fresh, skipping');
    return { success: true, skipped: true, timestamp: cache.lastUpdated };
  }

  const previousCount = {
    ordinary: cache.ordinary.length,
    special: cache.special.length,
  };
  const previousActive = {
    ordinary: activeCount(cache.ordinary, cache.lastUpdated, carrier.ordinaryWindowMs),
    special: activeCount(cache.special, cache.lastUpdated, carrier.specialWindowMs),
  };

  // Use a single timestamp for this update cycle to ensure consistency
  const updateTime = Date.now();

  // 2. Fetch fresh data from the carrier API
  const {
    ordinary: ordinaryData,
    special: specialData,
    specialAuthoritative,
    upstreamCalls: fetchCalls,
  } = carrier.id === 'cmhk' ? await fetchCmhkData() : await fetchCuniqData();
  let upstreamCalls = fetchCalls;

  // Guard: if upstream returned nothing at all, keep the old cache untouched
  if (ordinaryData.length === 0 && specialData.length === 0) {
    console.warn('[Update] Upstream returned no data, keeping existing cache');
    return { success: false, reason: 'upstream_empty', timestamp: cache.lastUpdated };
  }

  // 3. Merge with existing cache.
  //    A premium pool we could not fetch in full is no evidence of a sale, so
  //    fall back to keeping everything until a clean run can prune it.
  cache.ordinary = mergeNumbers(cache.ordinary, ordinaryData, updateTime, carrier.ordinaryWindowMs);
  cache.special = mergeNumbers(
    cache.special,
    specialData,
    updateTime,
    specialAuthoritative ? carrier.specialWindowMs : KEEP_ALL
  );

  if (!specialAuthoritative) {
    console.warn('[Update] Premium pool incomplete — keeping previously cached premium numbers');
    // Retaining them in the cache is not enough: readers filter by the same
    // zero-width window, which would hide every number this run failed to
    // re-fetch. "Could not check" has to read as "still seen", so the next
    // successful run is what prunes the pool.
    cache.special = cache.special.map(entry => ({ ...entry, lastSeenAt: updateTime }));
  }

  // 4. Re-check the numbers this run did not see. Only worth doing for pools
  //    kept alive by a window; a zero-window pool has no survivors to check.
  const verification = { checked: 0, confirmed: 0, removed: 0 };
  const verifier: Verifier | null = carrier.id === 'cmhk' ? verifyCmhkNumbers : null;

  if (verifier && carrier.verifyBudget > 0 && carrier.ordinaryWindowMs > 0) {
    const budget = Math.max(0, Math.min(carrier.verifyBudget, MAX_UPSTREAM_CALLS_PER_RUN - upstreamCalls));
    const candidates = unseenSince(cache.ordinary, updateTime).slice(0, budget);

    if (candidates.length > 0) {
      const { statuses, calls } = await verifier(candidates.map(n => n.hkNumber), budget);
      upstreamCalls += calls;
      const applied = applyVerification(cache.ordinary, statuses, updateTime);
      cache.ordinary = applied.entries;
      verification.checked = statuses.size;
      verification.confirmed = applied.confirmed;
      verification.removed = applied.removed;
    }
  }

  cache.lastUpdated = updateTime;

  // 5. Active numbers (still shown after this update)
  const activeOrdinary = cache.ordinary.filter(n => (n.lastSeenAt ?? 0) >= updateTime - carrier.ordinaryWindowMs);
  const activeSpecial = cache.special.filter(n => (n.lastSeenAt ?? 0) >= updateTime - carrier.specialWindowMs);

  // 6. Refuse to persist a run that would gut a previously healthy pool.
  //    If a carrier genuinely shrinks its pool by more than 70%, every run
  //    would keep refusing — `ignoreCollapseGuard` is the manual way out.
  const collapsed =
    isPoolCollapse(previousActive.ordinary, activeOrdinary.length) ||
    isPoolCollapse(previousActive.special, activeSpecial.length);

  if (collapsed && !ignoreCollapseGuard) {
    console.error(
      `[Update] Pool collapse guard tripped — not writing cache. ` +
      `ordinary ${previousActive.ordinary}->${activeOrdinary.length}, ` +
      `special ${previousActive.special}->${activeSpecial.length}. ` +
      `Re-run with ?ignore_collapse=1 if the pool really did shrink.`
    );
    return { success: false, reason: 'pool_collapse', timestamp: cache.lastUpdated };
  }

  if (collapsed) {
    console.warn('[Update] Pool collapse guard bypassed on request');
  }

  // 7. Enrich with location data (mainland numbers only — dual-number carriers)
  let locationEnriched = 0;
  if (carrier.dualNumber) {
    const allActive = [...activeOrdinary, ...activeSpecial];
    await Promise.all(allActive.map(async (entry) => {
      if (entry.mainlandNumber && (!entry.province || !entry.city)) {
        const loc = await getLocation(entry.mainlandNumber);
        if (loc) {
          entry.province = loc.prov;
          entry.city = loc.city;
          locationEnriched++;
        }
      }
    }));
  }

  // 8. Save updated cache
  await writeCache(cache);

  const duration = Date.now() - startTime;
  const result: UpdateResult = {
    success: true,
    timestamp: cache.lastUpdated,
    duration: `${duration}ms`,
    stats: {
      ordinary: {
        previous: previousCount.ordinary,
        current: cache.ordinary.length,
        active: activeOrdinary.length,
        new: cache.ordinary.filter(n => n.addedAt === updateTime).length,
      },
      special: {
        previous: previousCount.special,
        current: cache.special.length,
        active: activeSpecial.length,
        new: cache.special.filter(n => n.addedAt === updateTime).length,
      },
      locationEnriched,
      verification,
      upstreamCalls,
    },
  };

  console.log('[Update] Update completed:', result);
  return result;
}

export type { CacheData };
