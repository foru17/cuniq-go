import { getLocation } from '@/lib/location';
import { uploadToR2 } from '@/lib/s3';
import { NumberEntry } from '@/lib/utils';

// Cache configuration
const CACHE_FILENAME = 'cache.json';

export type CacheData = {
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
    
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'CUniq-Next-Server/1.0'
      }
    });
    
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

export async function getNumbers(type: 'ordinary' | 'special' = 'ordinary') {
  // Read cache
  let cache = await getCache();

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
  
  // Filter active numbers (seen in last update)
  const activeNumbers = numbers.filter(n => n.lastSeenAt >= cache!.lastUpdated);

  // Enrich with location data for any missing entries
  // This is a lightweight operation that only fills in gaps
  let hasUpdates = false;
  
  // We process location updates in background or await them?
  // For RSC, we probably want to await to show correct data, 
  // but we don't want to block too long.
  // Given the previous implementation awaited, we will await here too.
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
    // We can fire-and-forget this update to not block the response
    setCache(cache).catch(err => console.error('Background cache update failed:', err));
  }

  return {
    data: activeNumbers,
    lastUpdated: cache.lastUpdated
  };
}
