import { after } from 'next/server';
import { getLocation } from '@/lib/location';
import { getCarrier } from '@/lib/carrier';
import { readCache, writeCache } from './cacheStore';
import { CacheData } from './types';
import { runUpdate } from './updateService';

export type { CacheData };

// Per-instance guard so one lambda doesn't queue overlapping refreshes
let refreshInFlight = false;

// For carriers without an external cron (cmhk), page views trigger a
// background refresh once the cache goes stale. runUpdate re-checks
// freshness itself, so concurrent instances stay mostly idempotent.
function maybeScheduleRefresh(cache: CacheData | null) {
  const carrier = getCarrier();
  if (!carrier.selfRefresh || refreshInFlight) return;

  const lastUpdated = cache?.lastUpdated ?? 0;
  if (Date.now() - lastUpdated < carrier.refreshIntervalMs) return;

  refreshInFlight = true;
  after(async () => {
    try {
      await runUpdate({ force: false });
    } catch (error) {
      console.error('[numberService] Background refresh failed:', error);
    } finally {
      refreshInFlight = false;
    }
  });
}

export async function getNumbers(type: 'ordinary' | 'special' = 'ordinary') {
  const carrier = getCarrier();

  // Read cache
  const cache = await readCache();

  maybeScheduleRefresh(cache);

  // Return empty data if cache doesn't exist
  if (!cache) {
    console.log('[numberService] No cache found, returning empty data');
    return {
      data: [],
      lastUpdated: 0
    };
  }

  // Get requested data type
  const numbers = type === 'special' ? cache.special : cache.ordinary;

  // Filter active numbers (seen recently — window is 0 for cuniq)
  const activeNumbers = numbers.filter(
    n => (n.lastSeenAt ?? 0) >= cache.lastUpdated - carrier.activeWindowMs
  );

  // Enrich with location data for any missing entries (dual-number carriers only)
  if (carrier.dualNumber) {
    let hasUpdates = false;

    await Promise.all(activeNumbers.map(async (entry) => {
      if (entry.mainlandNumber && (!entry.province || !entry.city)) {
        const loc = await getLocation(entry.mainlandNumber);
        if (loc) {
          entry.province = loc.prov;
          entry.city = loc.city;
          hasUpdates = true;
        }
      }
    }));

    // Save cache to persist any newly enriched location data
    if (hasUpdates) {
      // Fire-and-forget so the response isn't blocked
      writeCache(cache).catch(err => console.error('Background cache update failed:', err));
    }
  }

  return {
    data: activeNumbers,
    lastUpdated: cache.lastUpdated
  };
}

export async function getTotalNumbersCount() {
  const carrier = getCarrier();
  const cache = await readCache();
  if (!cache) return 0;

  const threshold = cache.lastUpdated - carrier.activeWindowMs;
  const activeOrdinary = cache.ordinary.filter(n => (n.lastSeenAt ?? 0) >= threshold);
  const activeSpecial = cache.special.filter(n => (n.lastSeenAt ?? 0) >= threshold);

  return activeOrdinary.length + activeSpecial.length;
}
