import { CarrierFetchResult, NumberStatus, PoolName, RawNumber, VerifyResult } from '../types';

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

// Batch fetching configuration (hard caps — keep bounded per update run)
const BATCH_COUNT = 10; // Number of requests per update
const BATCH_DELAY_MS = 200; // Delay between requests in milliseconds
const REQUEST_TIMEOUT_MS = 10_000; // A hung request must not eat the function budget

// Verification pacing — the store's number picker is a public endpoint
const VERIFY_CONCURRENCY = 3;
const VERIFY_DELAY_MS = 200;

async function fetchFromCUniq(url: string, headers: Record<string, string>) {
  console.log(`Fetching from CUniq: ${url}`);
  try {
    const response = await fetch(url, {
      headers: headers,
      method: "GET",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

/**
 * Fetch multiple batches of numbers to get more complete data
 * Makes multiple requests and deduplicates the results
 */
async function fetchMultipleBatches(
  url: string,
  headers: Record<string, string>,
  batchCount: number = BATCH_COUNT,
  delayMs: number = BATCH_DELAY_MS
): Promise<RawNumber[]> {
  const allNumbers: RawNumber[] = [];
  const seenHkNumbers = new Set<string>();

  console.log(`[Batch Fetch] Starting ${batchCount} requests...`);

  for (let i = 0; i < batchCount; i++) {
    console.log(`[Batch ${i + 1}/${batchCount}] Fetching...`);

    const batch = await fetchFromCUniq(url, headers);

    let newInBatch = 0;
    // Deduplicate within all batches
    batch.forEach((item: RawNumber) => {
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

export async function fetchCuniqData(): Promise<CarrierFetchResult> {
  const [ordinary, special] = await Promise.all([
    fetchMultipleBatches(ORDINARY_URL, ORDINARY_HEADERS),
    fetchMultipleBatches(SPECIAL_URL, SPECIAL_HEADERS),
  ]);
  // An empty special result means all 10 batches failed, not that the pool
  // emptied — reporting it as non-authoritative makes the caller keep the
  // previously cached premium numbers instead of wiping them.
  return {
    ordinary,
    special,
    specialAuthoritative: special.length > 0,
    upstreamCalls: BATCH_COUNT * 2,
  };
}

/**
 * Re-check individual numbers against the store.
 *
 * `queryNum=<8 digits>` turns the picker into an exact lookup: the number
 * comes back while it is still on sale and the list is empty once it is
 * taken. The two pools sit behind different plan ids, so a number has to be
 * checked against the same URL it was listed from.
 */
export async function verifyCuniqNumbers(
  numbers: string[],
  budget: number,
  pool: PoolName
): Promise<VerifyResult> {
  const baseUrl = pool === 'special' ? SPECIAL_URL : ORDINARY_URL;
  const headers = pool === 'special' ? SPECIAL_HEADERS : ORDINARY_HEADERS;

  const statuses = new Map<string, NumberStatus>();
  const targets = numbers.slice(0, Math.max(0, budget));
  let calls = 0;
  let aborted = false;

  for (let i = 0; i < targets.length; i += VERIFY_CONCURRENCY) {
    if (aborted) break;
    const slice = targets.slice(i, i + VERIFY_CONCURRENCY);

    await Promise.all(
      slice.map(async (num) => {
        const url = baseUrl.replace('queryNum=', `queryNum=${encodeURIComponent(num)}`);
        calls++;
        try {
          const response = await fetch(url, {
            headers,
            method: 'GET',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
          if (!response.ok) throw new Error(`CUniq API error: ${response.status}`);

          const json = await response.json();
          // A missing list is a malformed answer, not "this number is gone"
          if (!Array.isArray(json.data)) throw new Error('CUniq API returned no data array');

          const found = json.data.some(
            (item: RawNumber) => (item.hkNumber || item.number) === num
          );
          statuses.set(num, found ? 'available' : 'gone');
        } catch (error) {
          console.error(`[CUniq] Verify error for ${num}:`, error);
          // Upstream is unhappy — stop spending the budget on doomed calls
          aborted = true;
          statuses.set(num, 'unknown');
        }
      })
    );

    if (!aborted && i + VERIFY_CONCURRENCY < targets.length) {
      await new Promise((resolve) => setTimeout(resolve, VERIFY_DELAY_MS));
    }
  }

  const gone = [...statuses.values()].filter(s => s === 'gone').length;
  console.log(
    `[CUniq] Verified ${statuses.size}/${targets.length} ${pool} numbers in ${calls} calls: ` +
    `${gone} gone${aborted ? ' (aborted early after an upstream error)' : ''}`
  );

  return { statuses, calls };
}
