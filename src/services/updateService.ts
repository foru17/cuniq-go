import { getLocation } from '@/lib/location';
import { getCarrier } from '@/lib/carrier';
import { NumberEntry } from '@/lib/utils';
import { readCache, writeCache } from './cacheStore';
import { CacheData, RawNumber } from './types';
import { fetchCuniqData } from './sources/cuniq';
import { fetchCmhkData } from './sources/cmhk';

/**
 * Merge new numbers with cached ones.
 * Entries not present in the incoming batch are kept as long as they were
 * seen within `keepWindowMs` (their lastSeenAt is left untouched). With a
 * window of 0 (cuniq) only currently-seen numbers survive — the source
 * returns its full pool each sync. CMHK returns a random batch per call,
 * so recently-seen numbers are retained for a few hours.
 */
function mergeNumbers(
  existing: NumberEntry[],
  incoming: RawNumber[],
  updateTime: number,
  keepWindowMs: number
): NumberEntry[] {
  const existingMap = new Map(existing.map(n => [n.hkNumber, n]));
  const merged: NumberEntry[] = [];
  const mergedKeys = new Set<string>();

  for (const item of incoming) {
    const hkNumber = item.number || item.hkNumber;
    if (!hkNumber || mergedKeys.has(hkNumber)) continue;
    mergedKeys.add(hkNumber);

    // Normalize mainland number
    let mainlandNumber = item.mainlandNumber || item.mcNumber || item.mainland || item.mainland_number || '';

    // If mainland number is missing or empty, try to find it in existing cache if hkNumber matches
    if (!mainlandNumber && existingMap.has(hkNumber)) {
        mainlandNumber = existingMap.get(hkNumber)?.mainlandNumber || '';
    }

    const existingEntry = existingMap.get(hkNumber);

    if (existingEntry) {
      // Update lastSeenAt
      merged.push({
        ...existingEntry,
        mainlandNumber: mainlandNumber || existingEntry.mainlandNumber,
        level: (item.level as string) || existingEntry.level,
        lastSeenAt: updateTime,
      });
    } else {
      // New entry — spread raw payload first so the computed/normalized
      // fields below always win (a raw `hkNumber: undefined` must not clobber it).
      merged.push({
        ...item,
        hkNumber,
        mainlandNumber,
        addedAt: updateTime,
        lastSeenAt: updateTime,
      });
    }
  }

  if (keepWindowMs > 0) {
    for (const entry of existing) {
      if (mergedKeys.has(entry.hkNumber)) continue;
      if ((entry.lastSeenAt ?? 0) >= updateTime - keepWindowMs) {
        merged.push(entry);
      }
    }
  }

  return merged;
}

export type UpdateResult = {
  success: boolean;
  skipped?: boolean;
  timestamp: number;
  duration?: string;
  stats?: {
    ordinary: { previous: number; current: number; active: number; new: number };
    special: { previous: number; current: number; active: number; new: number };
    locationEnriched: number;
  };
};

/**
 * Fetch latest numbers from the carrier's upstream API and refresh the cache.
 * With force=false the run is skipped when the cache is still fresh — this is
 * how page-triggered background refreshes avoid stampeding the upstream.
 */
export async function runUpdate({ force = true }: { force?: boolean } = {}): Promise<UpdateResult> {
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

  // Use a single timestamp for this update cycle to ensure consistency
  const updateTime = Date.now();

  // 2. Fetch fresh data from the carrier API
  const { ordinary: ordinaryData, special: specialData } =
    carrier.id === 'cmhk' ? await fetchCmhkData() : await fetchCuniqData();

  // Guard: if upstream returned nothing at all, keep the old cache untouched
  if (ordinaryData.length === 0 && specialData.length === 0) {
    console.warn('[Update] Upstream returned no data, keeping existing cache');
    return { success: false, timestamp: cache.lastUpdated };
  }

  // 3. Merge with existing cache
  cache.ordinary = mergeNumbers(cache.ordinary, ordinaryData, updateTime, carrier.activeWindowMs);
  cache.special = mergeNumbers(cache.special, specialData, updateTime, carrier.activeWindowMs);
  cache.lastUpdated = updateTime;

  // 4. Active numbers (still shown after this update)
  const activeOrdinary = cache.ordinary.filter(n => (n.lastSeenAt ?? 0) >= updateTime - carrier.activeWindowMs);
  const activeSpecial = cache.special.filter(n => (n.lastSeenAt ?? 0) >= updateTime - carrier.activeWindowMs);

  // 5. Enrich with location data (mainland numbers only — dual-number carriers)
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

  // 6. Save updated cache
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
    },
  };

  console.log('[Update] Update completed:', result);
  return result;
}

export type { CacheData };
