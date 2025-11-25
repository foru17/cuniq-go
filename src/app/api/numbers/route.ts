import { NextResponse } from 'next/server';
import { getLocation } from '@/lib/location';
import { put, list } from '@vercel/blob';

// Cache configuration
const CACHE_FILENAME = 'cache.json';

type NumberEntry = {
  hkNumber: string;
  mainlandNumber: string;
  addedAt: number;
  lastSeenAt: number;
  [key: string]: any;
};

type CacheData = {
  ordinary: NumberEntry[];
  special: NumberEntry[];
  lastUpdated: number;
};

// Helper to read cache from Blob
async function getCache(): Promise<CacheData | null> {
  try {
    const { blobs } = await list({ prefix: CACHE_FILENAME, limit: 1 });
    const blob = blobs.find(b => b.pathname === CACHE_FILENAME);

    if (blob) {
      const response = await fetch(blob.url);
      if (response.ok) {
        return await response.json();
      }
    }
  } catch (error) {
    console.error('Error reading cache from blob:', error);
  }
  return null;
}

// Helper to write cache to Blob
async function setCache(data: CacheData) {
  try {
    await put(CACHE_FILENAME, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error('Error writing cache to blob:', error);
  }
}

/**
 * GET /api/numbers
 * Read-only endpoint that returns cached number data
 * Data updates are handled by POST /api/update-numbers
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'ordinary' or 'special'

  // Read cache
  let cache = await getCache();

  // Return empty data if cache doesn't exist
  if (!cache) {
    console.log('[Read API] No cache found, returning empty data');
    return NextResponse.json({
      data: [],
      lastUpdated: 0
    });
  }

  // Get requested data type
  const numbers = type === 'special' ? cache.special : cache.ordinary;
  
  // Filter active numbers (seen in last update)
  const activeNumbers = numbers.filter(n => n.lastSeenAt >= cache.lastUpdated);

  // Enrich with location data for any missing entries
  // This is a lightweight operation that only fills in gaps
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
    await setCache(cache);
  }

  return NextResponse.json({
    data: activeNumbers,
    lastUpdated: cache.lastUpdated
  });
}
