import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type NumberEntry = {
  hkNumber: string;
  mainlandNumber: string;
  addedAt?: number; // Timestamp when first seen
  province?: string;
  city?: string;
  [key: string]: any;
};

export function parsePatterns(value: string): string[] {
  return value
    .split(/[,，\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function matchesAny(target: string, patterns: string[]): boolean {
  return patterns.some((pattern) => target.includes(pattern));
}

export function hasLuckyPattern(number: string | number, pattern: string): boolean {
  if (!pattern || !number) return true;

  const str = number.toString();

  switch (pattern) {
    case 'AAAA':
      return /(.)\1{3,}/.test(str);
    case 'AABB':
      return /(.)\1(.)\2/.test(str);
    case 'ABAB':
      return /(.)(.)\1\2/.test(str);
    case 'AAAB':
      return /(.)\1\1(.)/.test(str);
    case 'ABBB':
      return /(.)(.)\2\2/.test(str);
    case 'AAXBB':
      return hasAAXBBPattern(str);
    case 'ascending':
      return hasAscendingSequence(str);
    case 'descending':
      return hasDescendingSequence(str);
    case 'any':
      return (
        /(.)\1{3,}/.test(str) || // AAAA
        /(.)\1(.)\2/.test(str) || // AABB
        /(.)(.)\1\2/.test(str) || // ABAB
        /(.)\1\1(.)/.test(str) || // AAAB
        /(.)(.)\2\2/.test(str) || // ABBB
        hasAAXBBPattern(str) || // AAXBB
        hasAscendingSequence(str) ||
        hasDescendingSequence(str)
      );
    default:
      return true;
  }
}

function hasAscendingSequence(str: string): boolean {
  for (let i = 0; i <= str.length - 3; i++) {
    let isSequence = true;
    for (let j = i; j < i + 2; j++) {
      const current = parseInt(str[j]);
      const next = parseInt(str[j + 1]);
      if (next !== current + 1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence) return true;
  }
  return false;
}

function hasDescendingSequence(str: string): boolean {
  for (let i = 0; i <= str.length - 3; i++) {
    let isSequence = true;
    for (let j = i; j < i + 2; j++) {
      const current = parseInt(str[j]);
      const next = parseInt(str[j + 1]);
      if (next !== current - 1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence) return true;
  }
  return false;
}

function hasAAXBBPattern(str: string): boolean {
  // AAXBB: AA (same) + X (diff) + BB (same, diff from AA)
  for (let i = 0; i <= str.length - 5; i++) {
    const a = str[i];
    const a2 = str[i + 1];
    const x = str[i + 2];
    const b = str[i + 3];
    const b2 = str[i + 4];

    if (a === a2 && b === b2 && a !== b && x !== a && x !== b) {
      return true;
    }
  }
  return false;
}

export type HighlightRange = {
  start: number;
  end: number;
  type: 'pattern' | 'include';
  group?: number; // For lucky patterns, to distinguish AA vs BB
};

export function getLuckyPatternRanges(number: string | number, pattern: string): HighlightRange[] {
  if (!pattern || !number) return [];
  const str = number.toString();
  const ranges: HighlightRange[] = [];

  switch (pattern) {
    case 'AAAA': {
      const regex = /(.)\1{3,}/g;
      let match;
      while ((match = regex.exec(str)) !== null) {
        ranges.push({ start: match.index, end: match.index + match[0].length, type: 'pattern' });
      }
      break;
    }
    case 'AABB': {
      const regex = /(.)\1(.)\2/g;
      let match;
      while ((match = regex.exec(str)) !== null) {
        // AA
        ranges.push({ start: match.index, end: match.index + 2, type: 'pattern', group: 1 });
        // BB
        ranges.push({ start: match.index + 2, end: match.index + 4, type: 'pattern', group: 2 });
      }
      break;
    }
    case 'ABAB': {
      const regex = /(.)(.)\1\2/g;
      let match;
      while ((match = regex.exec(str)) !== null) {
        // A (1st)
        ranges.push({ start: match.index, end: match.index + 1, type: 'pattern', group: 1 });
        // B (1st)
        ranges.push({ start: match.index + 1, end: match.index + 2, type: 'pattern', group: 2 });
        // A (2nd)
        ranges.push({ start: match.index + 2, end: match.index + 3, type: 'pattern', group: 1 });
        // B (2nd)
        ranges.push({ start: match.index + 3, end: match.index + 4, type: 'pattern', group: 2 });
      }
      break;
    }
    case 'AAAB': {
      const regex = /(.)\1\1(.)/g;
      let match;
      while ((match = regex.exec(str)) !== null) {
        // AAA
        ranges.push({ start: match.index, end: match.index + 3, type: 'pattern', group: 1 });
        // B
        ranges.push({ start: match.index + 3, end: match.index + 4, type: 'pattern', group: 2 });
      }
      break;
    }
    case 'ABBB': {
      const regex = /(.)(.)\2\2/g;
      let match;
      while ((match = regex.exec(str)) !== null) {
        // A
        ranges.push({ start: match.index, end: match.index + 1, type: 'pattern', group: 1 });
        // BBB
        ranges.push({ start: match.index + 1, end: match.index + 4, type: 'pattern', group: 2 });
      }
      break;
    }
    case 'AAXBB': {
      // Custom logic for AAXBB - iterate all positions
      for (let i = 0; i <= str.length - 5; i++) {
        const a = str[i];
        const a2 = str[i + 1];
        const x = str[i + 2];
        const b = str[i + 3];
        const b2 = str[i + 4];
        if (a === a2 && b === b2 && a !== b && x !== a && x !== b) {
          // AA
          ranges.push({ start: i, end: i + 2, type: 'pattern', group: 1 });
          // X - Group 3 for distinct color
          ranges.push({ start: i + 2, end: i + 3, type: 'pattern', group: 3 });
          // BB
          ranges.push({ start: i + 3, end: i + 5, type: 'pattern', group: 2 });
          // Don't break, find all
        }
      }
      break;
    }
    case 'ascending':
    case 'descending': {
      // Find ALL sequences >= 3
      for (let i = 0; i <= str.length - 3; i++) {
        let len = 1;
        for (let j = i; j < str.length - 1; j++) {
          const curr = parseInt(str[j]);
          const next = parseInt(str[j+1]);
          if (pattern === 'ascending' ? next === curr + 1 : next === curr - 1) {
            len++;
          } else {
            break;
          }
        }
        if (len >= 3) {
          // Check if this sequence is already covered by a longer one starting earlier?
          // Actually, if we just find maximal sequences starting at i.
          // But if we have 1234, i=0 gives 1234. i=1 gives 234.
          // We should skip indices that are part of a found sequence.
          ranges.push({ start: i, end: i + len, type: 'pattern' });
          i += len - 1; // Skip the rest of this sequence
        }
      }
      break;
    }
  }
  return ranges;
}

export function getIncludedRanges(number: string | number, includePatterns: string[]): HighlightRange[] {
  if (!includePatterns.length || !number) return [];
  const str = number.toString();
  const ranges: HighlightRange[] = [];

  includePatterns.forEach(pattern => {
    // Simple digit matching
    for (let i = 0; i < str.length; i++) {
      if (str.substring(i).startsWith(pattern)) {
        ranges.push({ start: i, end: i + pattern.length, type: 'include' });
      }
    }
  });

  return ranges;
}

export function findSuffixGroups(
  allNumbers: NumberEntry[],
  digits: number,
  matchHK: boolean,
  matchMainland: boolean
): Set<number> {
  if (!digits || digits < 1) return new Set();

  const suffixMap = new Map<string, number[]>();

  allNumbers.forEach((entry, index) => {
    const numbers: string[] = [];
    if (matchHK && entry.hkNumber) numbers.push(String(entry.hkNumber));
    if (matchMainland && entry.mainlandNumber) numbers.push(String(entry.mainlandNumber));

    numbers.forEach((number) => {
      if (number && number.length >= digits) {
        const suffix = number.slice(-digits);
        if (!suffixMap.has(suffix)) {
          suffixMap.set(suffix, []);
        }
        suffixMap.get(suffix)?.push(index);
      }
    });
  });

  const duplicateIndices = new Set<number>();
  suffixMap.forEach((indices) => {
    if (indices.length > 1) {
      indices.forEach((index) => duplicateIndices.add(index));
    }
  });

  return duplicateIndices;
}

export function shouldInclude(
  entry: NumberEntry,
  includePatterns: string[],
  excludePatterns: string[],
  matchHK: boolean,
  matchMainland: boolean,
  luckyPattern: string
): boolean {
  const hk = String(entry.hkNumber || '');
  const mainland = String(entry.mainlandNumber || '');

  const targets = [
    matchHK ? hk : null,
    matchMainland ? mainland : null,
  ].filter(Boolean) as string[];

  if (targets.length === 0) {
    return true;
  }

  // Lucky Pattern
  if (luckyPattern) {
    const hasLucky = targets.some((value) => hasLuckyPattern(value, luckyPattern));
    if (!hasLucky) return false;
  }

  // Exclude
  if (excludePatterns.length) {
    const hasExcluded = targets.some((value) => matchesAny(value, excludePatterns));
    if (hasExcluded) return false;
  }

  // Include
  if (includePatterns.length) {
    const hasIncluded = targets.some((value) => matchesAny(value, includePatterns));
    if (!hasIncluded) return false;
  }

  return true;
}

export function filterNumbers(
  allNumbers: NumberEntry[],
  filters: {
    include: string;
    exclude: string;
    suffix: string;
    luckyPattern: string;
    matchHk: boolean;
    matchMainland: boolean;
    location?: string;
  }
): NumberEntry[] {
  if (!allNumbers.length) return [];

  const includePatterns = parsePatterns(filters.include);
  const excludePatterns = parsePatterns(filters.exclude);
  const suffixDigits = parseInt(filters.suffix) || 0;
  const locationFilter = filters.location ? filters.location.trim() : '';

  let result = allNumbers;

  // 1. Suffix Group Filtering (if enabled)
  if (suffixDigits > 0) {
    const suffixFilterIndices = findSuffixGroups(
      allNumbers, 
      suffixDigits, 
      filters.matchHk, 
      filters.matchMainland
    );
    result = result.filter((_, index) => suffixFilterIndices.has(index));
  }

  // 2. Pattern Filtering
  result = result.filter((entry) => 
    shouldInclude(
      entry,
      includePatterns,
      excludePatterns,
      filters.matchHk,
      filters.matchMainland,
      filters.luckyPattern
    )
  );

  // 3. Location Filtering
  if (locationFilter) {
    result = result.filter((entry) => {
      const prov = entry.province || '';
      const city = entry.city || '';
      return prov.includes(locationFilter) || city.includes(locationFilter);
    });
  }

  return result;
}
