import { NextResponse } from 'next/server';
import { getLocation } from '@/lib/location';
import { uploadToR2 } from '@/lib/s3';

// Cache configuration
const CACHE_FILENAME = 'cache.json';

// Cache the response for 60 seconds to reduce R2/S3 operations
export const revalidate = 60;

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

// Helper to read cache from R2 (Public URL)
async function getCache(): Promise<CacheData | null> {
  try {
    const domain = process.env.S3_DOMAIN_HOST?.replace(/\/$/, '');
    if (!domain) {
      console.warn('[getCache] S3_DOMAIN_HOST not set');
      return null;
    }

    const url = `${domain}/${CACHE_FILENAME}`;
    console.log(`[getCache] Fetching from: ${url}`);
    
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      return await response.json();
    } else {
      console.warn(`[getCache] Failed to fetch: ${response.status}`);
    }
  } catch (error) {
    console.error('Error reading cache from R2:', error);
  }
  return null;
}

// Helper to write cache to R2 (used for location enrichment)
async function setCache(data: CacheData) {
  try {
    await uploadToR2(CACHE_FILENAME, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cache to R2:', error);
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
