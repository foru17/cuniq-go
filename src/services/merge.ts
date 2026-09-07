import { NumberEntry } from '@/lib/utils';
import { NumberStatus, RawNumber } from './types';

/** Keep every cached entry regardless of age — used when upstream was unreliable */
export const KEEP_ALL = Number.POSITIVE_INFINITY;

/**
 * Merge new numbers with cached ones.
 * Entries not present in the incoming batch are kept as long as they were
 * seen within `keepWindowMs` (their lastSeenAt is left untouched). With a
 * window of 0 only currently-seen numbers survive — correct when the source
 * returns its full pool each sync, since anything missing has been sold.
 * Sources that return a random slice per call need a window instead, or the
 * pool would collapse to whatever the last batch happened to contain.
 */
export function mergeNumbers(
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

/** Entries the current run did not see — candidates for a one-by-one re-check */
export function unseenSince(entries: NumberEntry[], updateTime: number): NumberEntry[] {
  return entries
    .filter(n => (n.lastSeenAt ?? 0) < updateTime)
    .sort((a, b) => (a.lastSeenAt ?? 0) - (b.lastSeenAt ?? 0)); // oldest first: most likely sold
}

/**
 * Drop numbers upstream confirmed as gone and refresh the ones it confirmed
 * as still on sale. `unknown` (and anything unchecked) is left untouched —
 * a failed check must never delete a live number.
 */
export function applyVerification(
  entries: NumberEntry[],
  statuses: Map<string, NumberStatus>,
  updateTime: number
): { entries: NumberEntry[]; removed: number; confirmed: number } {
  let removed = 0;
  let confirmed = 0;

  const kept = entries.filter(entry => {
    const status = statuses.get(entry.hkNumber);
    if (status === 'gone') {
      removed++;
      return false;
    }
    if (status === 'available') {
      entry.lastSeenAt = updateTime;
      confirmed++;
    }
    return true;
  });

  return { entries: kept, removed, confirmed };
}

/**
 * Guard against wiping a healthy pool because upstream had a bad day.
 * Only trips when there was a substantial pool to begin with.
 */
export function isPoolCollapse(previousActive: number, currentActive: number): boolean {
  return previousActive > 50 && currentActive < previousActive * 0.3;
}
