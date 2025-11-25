
import { NextRequest, NextResponse } from 'next/server';



import fs from 'fs';
import path from 'path';
import { getLocation } from '@/lib/location';

// Cache configuration
const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'cache.json');
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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

// Helper to read cache
function getCache(): CacheData | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
}

// Helper to write cache
function setCache(data: CacheData) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

// Helper to merge new numbers with cache
function mergeNumbers(existing: NumberEntry[], incoming: any[]): NumberEntry[] {
  const now = Date.now();
  const existingMap = new Map(existing.map(n => [n.hkNumber, n]));
  const merged: NumberEntry[] = [];

  for (const item of incoming) {
    const hkNumber = item.number || item.hkNumber;
    if (!hkNumber) console.log('Missing hkNumber for item:', JSON.stringify(item));
    if (item.mcNumber) console.log('Found mcNumber:', item.mcNumber);
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
        mainlandNumber: mainlandNumber || existingEntry.mainlandNumber, // Keep existing if new is empty
        lastSeenAt: now,
      });
    } else {
      // New entry
      merged.push({
        hkNumber,
        mainlandNumber,
        addedAt: now,
        lastSeenAt: now,
        ...item, // Keep other props
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
    return data.data || []; // Assuming data.data is the list
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
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
  let cache = getCache();

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
  await Promise.all(activeNumbers.map(async (entry) => {
    if (entry.mainlandNumber && (!entry.province || !entry.city)) {
      const loc = await getLocation(entry.mainlandNumber);
      if (loc) {
        entry.province = loc.prov;
        entry.city = loc.city;
      }
    }
  }));

  // Save cache to persist any newly enriched location data
  setCache(cache);

  return NextResponse.json({
    data: activeNumbers,
    lastUpdated: cache.lastUpdated
  });
}
