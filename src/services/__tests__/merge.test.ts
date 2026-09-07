import { describe, expect, it } from 'vitest';
import { NumberEntry } from '@/lib/utils';
import {
  KEEP_ALL,
  applyVerification,
  isPoolCollapse,
  mergeNumbers,
  unseenSince,
} from '@/services/merge';
import { NumberStatus, RawNumber } from '@/services/types';

const HOUR = 60 * 60 * 1000;

function makeEntry(overrides: Partial<NumberEntry> & { hkNumber: string }): NumberEntry {
  return {
    mainlandNumber: '',
    ...overrides,
  };
}

describe('mergeNumbers', () => {
  it('keepWindowMs = 0: drops anything missing from incoming, incoming entries get lastSeenAt = updateTime', () => {
    const updateTime = 1_000_000;
    const existing: NumberEntry[] = [
      makeEntry({
        hkNumber: '67023311',
        mainlandNumber: '',
        lastSeenAt: updateTime - 76 * 60 * 1000, // 76 minutes ago
        addedAt: updateTime - 76 * 60 * 1000,
      }),
    ];
    const incoming: RawNumber[] = [{ number: '51234567' }];

    const result = mergeNumbers(existing, incoming, updateTime, 0);

    expect(result.find(e => e.hkNumber === '67023311')).toBeUndefined();
    expect(result).toHaveLength(1);
    expect(result[0].hkNumber).toBe('51234567');
    expect(result[0].lastSeenAt).toBe(updateTime);
  });

  it('keepWindowMs = 3h: keeps entries seen within the window untouched, drops older ones', () => {
    const updateTime = 1_000_000;
    const seenTwoHoursAgo = makeEntry({
      hkNumber: '61111111',
      lastSeenAt: updateTime - 2 * HOUR,
      addedAt: updateTime - 10 * HOUR,
    });
    const seenFourHoursAgo = makeEntry({
      hkNumber: '62222222',
      lastSeenAt: updateTime - 4 * HOUR,
      addedAt: updateTime - 10 * HOUR,
    });
    const existing: NumberEntry[] = [seenTwoHoursAgo, seenFourHoursAgo];
    const incoming: RawNumber[] = [];

    const result = mergeNumbers(existing, incoming, updateTime, 3 * HOUR);

    const kept = result.find(e => e.hkNumber === '61111111');
    expect(kept).toBeDefined();
    expect(kept?.lastSeenAt).toBe(updateTime - 2 * HOUR); // untouched
    expect(result.find(e => e.hkNumber === '62222222')).toBeUndefined();
  });

  it('KEEP_ALL: keeps entries missing from incoming no matter how old', () => {
    const updateTime = 1_000_000;
    const tenDaysAgo = updateTime - 10 * 24 * HOUR;
    const existing: NumberEntry[] = [
      makeEntry({ hkNumber: '69999999', lastSeenAt: tenDaysAgo, addedAt: tenDaysAgo }),
    ];
    const incoming: RawNumber[] = [];

    const result = mergeNumbers(existing, incoming, updateTime, KEEP_ALL);

    expect(result.find(e => e.hkNumber === '69999999')).toBeDefined();
  });

  it('sets addedAt/lastSeenAt for new numbers and preserves addedAt for existing ones', () => {
    const updateTime = 1_000_000;
    const originalAddedAt = updateTime - 5 * HOUR;
    const existing: NumberEntry[] = [
      makeEntry({ hkNumber: '63333333', lastSeenAt: updateTime - HOUR, addedAt: originalAddedAt }),
    ];
    const incoming: RawNumber[] = [
      { number: '63333333' }, // existing, seen again
      { number: '64444444' }, // brand new
    ];

    const result = mergeNumbers(existing, incoming, updateTime, 0);

    const existingEntry = result.find(e => e.hkNumber === '63333333');
    expect(existingEntry?.addedAt).toBe(originalAddedAt);
    expect(existingEntry?.lastSeenAt).toBe(updateTime);

    const newEntry = result.find(e => e.hkNumber === '64444444');
    expect(newEntry?.addedAt).toBe(updateTime);
    expect(newEntry?.lastSeenAt).toBe(updateTime);
  });

  it('does not let a raw hkNumber: undefined clobber the normalized number, and dedupes incoming', () => {
    const updateTime = 1_000_000;
    const existing: NumberEntry[] = [];
    const incoming: RawNumber[] = [
      { number: '65555555', hkNumber: undefined, mainlandNumber: '13800000000' },
      { number: '65555555', hkNumber: undefined, mainlandNumber: '13800000001' }, // duplicate, should be ignored
    ];

    const result = mergeNumbers(existing, incoming, updateTime, 0);

    expect(result).toHaveLength(1);
    expect(result[0].hkNumber).toBe('65555555');
    expect(result[0].mainlandNumber).toBe('13800000000');
  });
});

describe('unseenSince', () => {
  it('returns only entries older than updateTime, sorted oldest first', () => {
    const updateTime = 1_000_000;
    const entries: NumberEntry[] = [
      makeEntry({ hkNumber: 'a', lastSeenAt: updateTime }), // seen this run, excluded
      makeEntry({ hkNumber: 'b', lastSeenAt: updateTime - 3 * HOUR }),
      makeEntry({ hkNumber: 'c', lastSeenAt: updateTime - HOUR }),
      makeEntry({ hkNumber: 'd', lastSeenAt: updateTime - 5 * HOUR }),
    ];

    const result = unseenSince(entries, updateTime);

    expect(result.map(e => e.hkNumber)).toEqual(['d', 'b', 'c']);
  });
});

describe('applyVerification', () => {
  it('removes gone, refreshes available, leaves unknown and unmentioned entries untouched', () => {
    const updateTime = 1_000_000;
    const gone = makeEntry({ hkNumber: 'gone1', lastSeenAt: updateTime - 5 * HOUR });
    const available = makeEntry({ hkNumber: 'avail1', lastSeenAt: updateTime - 5 * HOUR });
    const unknown = makeEntry({ hkNumber: 'unknown1', lastSeenAt: updateTime - 5 * HOUR });
    const untouched = makeEntry({ hkNumber: 'untouched1', lastSeenAt: updateTime - 5 * HOUR });

    const statuses = new Map<string, NumberStatus>([
      ['gone1', 'gone'],
      ['avail1', 'available'],
      ['unknown1', 'unknown'],
    ]);

    const { entries, removed, confirmed } = applyVerification(
      [gone, available, unknown, untouched],
      statuses,
      updateTime
    );

    expect(entries.map(e => e.hkNumber).sort()).toEqual(['avail1', 'untouched1', 'unknown1'].sort());
    expect(removed).toBe(1);
    expect(confirmed).toBe(1);

    const availEntry = entries.find(e => e.hkNumber === 'avail1');
    expect(availEntry?.lastSeenAt).toBe(updateTime);

    const unknownEntry = entries.find(e => e.hkNumber === 'unknown1');
    expect(unknownEntry?.lastSeenAt).toBe(updateTime - 5 * HOUR);

    const untouchedEntry = entries.find(e => e.hkNumber === 'untouched1');
    expect(untouchedEntry?.lastSeenAt).toBe(updateTime - 5 * HOUR);
  });

  it('never deletes an entry for any status other than gone', () => {
    const updateTime = 1_000_000;
    const entries: NumberEntry[] = [
      makeEntry({ hkNumber: 'a', lastSeenAt: 1 }),
      makeEntry({ hkNumber: 'b', lastSeenAt: 1 }),
    ];
    const statuses = new Map<string, NumberStatus>([
      ['a', 'available'],
      ['b', 'unknown'],
    ]);

    const { entries: kept, removed } = applyVerification(entries, statuses, updateTime);

    expect(removed).toBe(0);
    expect(kept).toHaveLength(2);
  });
});

describe('isPoolCollapse', () => {
  it('trips when a large pool drops by more than 70%', () => {
    expect(isPoolCollapse(3000, 500)).toBe(true);
  });

  it('does not trip on a moderate drop', () => {
    expect(isPoolCollapse(3000, 2500)).toBe(false);
  });

  it('does not trip when the previous pool was too small to be meaningful', () => {
    expect(isPoolCollapse(20, 3)).toBe(false);
  });

  it('does not trip on all-zero input', () => {
    expect(isPoolCollapse(0, 0)).toBe(false);
  });
});
