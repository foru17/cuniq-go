import { uploadToR2 } from '@/lib/s3';

const LOCATION_CACHE_FILE = 'location_cache.json';
const API_URL = 'https://imobile.market.alicloudapi.com/mobile/query';
const APP_CODE = process.env.NEXT_PUBLIC_APP_CODE;

if (!APP_CODE) {
  throw new Error('NEXT_PUBLIC_APP_CODE environment variable is not set');
}

type LocationData = {
  prov: string;
  city: string;
};

type LocationCache = Record<string, LocationData>;

// In-memory cache to avoid repeated requests
let memoryCache: LocationCache | null = null;

// Load cache from R2
async function loadCache(): Promise<LocationCache> {
  try {
    const domain = process.env.S3_DOMAIN_HOST?.replace(/\/$/, '');
    if (!domain) {
      console.warn('[Location] S3_DOMAIN_HOST not set');
      return {};
    }

    const url = `${domain}/${LOCATION_CACHE_FILE}`;
    console.log(`[Location] Loading cache from: ${url}`);

    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      return await response.json();
    } else {
      console.log(`[Location] Cache not found or error: ${response.status}`);
    }
  } catch (error) {
    console.error('[Location] Error loading cache:', error);
  }
  return {};
}

// Save cache to R2
async function saveCache(cache: LocationCache) {
  try {
    console.log('[Location] Saving cache to R2...');
    await uploadToR2(LOCATION_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('[Location] Error saving cache:', error);
  }
}

export async function getLocation(number: string): Promise<LocationData | null> {
  if (!number || number.length < 7) return null;

  // Extract first 7 digits (area_num)
  const areaNum = number.substring(0, 7);

  // Initialize cache if needed
  if (!memoryCache) {
    memoryCache = await loadCache();
  }

  // Check cache
  if (memoryCache[areaNum]) {
    return memoryCache[areaNum];
  }

  // Fetch from API
  try {
    console.log(`[Location] Fetching from API for ${areaNum}...`);
    const response = await fetch(`${API_URL}?number=${number}`, {
      headers: {
        'Authorization': `APPCODE ${APP_CODE}`
      }
    });

    if (!response.ok) {
      console.error(`[Location] API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    if (json.ret === 200 && json.data) {
      const { prov, city } = json.data;
      const location = { prov, city };

      // Update cache
      if (memoryCache) {
        memoryCache[areaNum] = location;
        // Save to R2 asynchronously
        await saveCache(memoryCache);
      }
      
      return location;
    }
  } catch (error) {
    console.error('[Location] Error fetching location:', error);
  }

  return null;
}
