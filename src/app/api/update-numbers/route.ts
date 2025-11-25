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
      allowOverwrite: true,
    });
    console.log('Cache saved to Vercel Blob');
  } catch (error) {
    console.error('Error writing cache to blob:', error);
    throw error;
  }
}

// Helper to merge new numbers with cache
function mergeNumbers(existing: NumberEntry[], incoming: any[], updateTime: number): NumberEntry[] {
  const existingMap = new Map(existing.map(n => [n.hkNumber, n]));
  const merged: NumberEntry[] = [];

  for (const item of incoming) {
    const hkNumber = item.number || item.hkNumber;
    if (!hkNumber) continue;
    
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
        lastSeenAt: updateTime,
      });
    } else {
      // New entry
      merged.push({
        hkNumber,
        mainlandNumber,
        addedAt: updateTime,
        lastSeenAt: updateTime,
        ...item,
      });
    }
  }

  return merged;
}

const ORDINARY_URL = "https://store.cuniq.com/mall/betternumber/shopChooseNum?queryNum=&queryFlag=4&maxNum=160&goodsMonthPlanId=9003031&lang=1&scenesType=1&noToken=true&busType=1&contractPriceId=105900476&tenantId=2&application=1&langId=1";
const SPECIAL_URL = "https://store.cuniq.com/mall/betternumber/shopChooseNum?queryNum=&queryFlag=4&maxNum=160&goodsMonthPlanId=900300&lang=1&scenesType=1&noToken=true&busType=1&contractPriceId=1053103&tenantId=2&application=1&langId=1";

const ORDINARY_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
  "Connection": "keep-alive",
  "DNT": "1",
  "Referer": "https://store.cuniq.com/tc/services-plan/order",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "application": "1",
  "lang": "1",
  "langId": "1",
  "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "tenantId": "2",
  "Cookie": "i18n_redirected=tc; __jsluid_s=2980da5b9ca006e6692e58ba116e605d; Hm_lvt_93858445f695a7fd8fc3548a6103521a=1761318148; _gcl_au=1.1.6602458.1761318149; _ga=GA1.2.1660847679.1761318149; _ga_108WQGHE60=GS2.1.s1761318148$o1$g1$t1761319489$j60$l0$h0; fromPath=%2Ftc%2Fservices-plan%2Fcuniq-go%2Fcuniq-go-monthly; plan=2025112513051410221107; JSESSIONID=BA9850E8666AD0848813B4D2F07A0F71"
};

const SPECIAL_HEADERS = {
  ...ORDINARY_HEADERS,
  "Cookie": "__jsluid_s=2980da5b9ca006e6692e58ba116e605d; Hm_lvt_93858445f695a7fd8fc3548a6103521a=1761318148; _gcl_au=1.1.6602458.1761318149; _ga=GA1.2.1660847679.1761318149; _ga_108WQGHE60=GS2.1.s1761318148$o1$g1$t1761319489$j60$l0$h0; i18n_redirected=tc; plan=2025112514213610221179; fromPath=%2Ftc%2Fservices-plan%2Fcuniq-go%2Fcuniq-go-monthly; JSESSIONID=E694D6A92CA7E54042FC6E0598029FBF"
};

async function fetchFromCUniq(url: string, headers: Record<string, string>) {
  console.log(`Fetching from CUniq: ${url}`);
  try {
    const response = await fetch(url, {
      headers: headers,
      method: "GET",
    });

    console.log(`CUniq Response Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`CUniq API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`CUniq Data Length: ${data.data?.length || 0}`);
    return data.data || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

// Batch fetching configuration
const BATCH_COUNT = 10; // Number of requests per update
const BATCH_DELAY_MS = 200; // Delay between requests in milliseconds

/**
 * Fetch multiple batches of numbers to get more complete data
 * Makes multiple requests and deduplicates the results
 */
async function fetchMultipleBatches(
  url: string,
  headers: Record<string, string>,
  batchCount: number = BATCH_COUNT,
  delayMs: number = BATCH_DELAY_MS
): Promise<any[]> {
  const allNumbers: any[] = [];
  const seenHkNumbers = new Set<string>();
  
  console.log(`[Batch Fetch] Starting ${batchCount} requests...`);
  
  for (let i = 0; i < batchCount; i++) {
    console.log(`[Batch ${i + 1}/${batchCount}] Fetching...`);
    
    const batch = await fetchFromCUniq(url, headers);
    
    let newInBatch = 0;
    // Deduplicate within all batches
    batch.forEach((item: any) => {
      const hkNumber = item.number || item.hkNumber;
      if (hkNumber && !seenHkNumbers.has(hkNumber)) {
        seenHkNumbers.add(hkNumber);
        allNumbers.push(item);
        newInBatch++;
      }
    });
    
    console.log(`[Batch ${i + 1}/${batchCount}] Got ${batch.length} numbers, ${newInBatch} new unique`);
    
    // Add delay between requests to avoid rate limiting
    if (i < batchCount - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`[Batch Fetch] Complete! Total unique numbers: ${allNumbers.length}`);
  return allNumbers;
}

/**
 * POST /api/update-numbers
 * Updates the number cache by fetching latest data from CUniq API
 * This endpoint should be called by backend scheduled tasks, not by frontend users
 * Requires Bearer token authentication
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('[Update API] Starting data update...');

  // Authentication check
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.UPDATE_API_TOKEN;

  if (!expectedToken) {
    console.error('[Update API] UPDATE_API_TOKEN not configured');
    return NextResponse.json(
      {
        success: false,
        error: 'Server configuration error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Update API] Missing or invalid authorization header');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Bearer token required',
        timestamp: Date.now()
      },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (token !== expectedToken) {
    console.warn('[Update API] Invalid token provided');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Invalid token',
        timestamp: Date.now()
      },
      { status: 401 }
    );
  }

  console.log('[Update API] Authentication successful');

  try {
    // 1. Load existing cache
    let cache = await getCache();
    if (!cache) {
      cache = { ordinary: [], special: [], lastUpdated: 0 };
    }

    const previousCount = {
      ordinary: cache.ordinary.length,
      special: cache.special.length
    };

    // Use a single timestamp for this update cycle to ensure consistency
    const updateTime = Date.now();

    // 2. Fetch fresh data from CUniq API using multiple batches
    console.log('[Update API] Fetching multiple batches from CUniq...');
    const [ordinaryData, specialData] = await Promise.all([
      fetchMultipleBatches(ORDINARY_URL, ORDINARY_HEADERS),
      fetchMultipleBatches(SPECIAL_URL, SPECIAL_HEADERS)
    ]);

    // 3. Merge with existing cache
    console.log('[Update API] Merging data...');
    cache.ordinary = mergeNumbers(cache.ordinary, ordinaryData, updateTime);
    cache.special = mergeNumbers(cache.special, specialData, updateTime);
    cache.lastUpdated = updateTime;

    // 4. Filter active numbers (seen in this update)
    const activeOrdinary = cache.ordinary.filter(n => n.lastSeenAt >= cache.lastUpdated);
    const activeSpecial = cache.special.filter(n => n.lastSeenAt >= cache.lastUpdated);

    // 5. Enrich with location data
    console.log('[Update API] Enriching with location data...');
    const allActive = [...activeOrdinary, ...activeSpecial];
    
    let locationEnriched = 0;
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

    // 6. Save updated cache
    console.log('[Update API] Saving cache...');
    await setCache(cache);

    const duration = Date.now() - startTime;
    const result = {
      success: true,
      timestamp: cache.lastUpdated,
      duration: `${duration}ms`,
      stats: {
        ordinary: {
          previous: previousCount.ordinary,
          current: cache.ordinary.length,
          active: activeOrdinary.length,
          new: cache.ordinary.filter(n => n.addedAt === cache.lastUpdated).length
        },
        special: {
          previous: previousCount.special,
          current: cache.special.length,
          active: activeSpecial.length,
          new: cache.special.filter(n => n.addedAt === cache.lastUpdated).length
        },
        locationEnriched
      }
    };

    console.log('[Update API] Update completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[Update API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
