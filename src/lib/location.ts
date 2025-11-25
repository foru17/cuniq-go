import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'location_cache.json');
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

// Load cache from disk
function loadCache(): LocationCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading location cache:', error);
  }
  return {};
}

// Save cache to disk
function saveCache(cache: LocationCache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error saving location cache:', error);
  }
}

// In-memory cache to avoid repeated file reads
let memoryCache: LocationCache | null = null;

export async function getLocation(number: string): Promise<LocationData | null> {
  if (!number || number.length < 7) return null;

  // Extract first 7 digits (area_num)
  const areaNum = number.substring(0, 7);

  if (!memoryCache) {
    memoryCache = loadCache();
  }

  // Check cache
  if (memoryCache[areaNum]) {
    return memoryCache[areaNum];
  }

  // Fetch from API
  try {
    console.log(`Fetching location for ${areaNum}...`);
    const response = await fetch(`${API_URL}?number=${number}`, {
      headers: {
        'Authorization': `APPCODE ${APP_CODE}`
      }
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    if (json.ret === 200 && json.data) {
      const { prov, city } = json.data;
      const location = { prov, city };

      // Update cache
      if (memoryCache) {
        memoryCache[areaNum] = location;
        saveCache(memoryCache);
      }
      
      return location;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
  }

  return null;
}
