import { CarrierFetchResult, NumberStatus, RawNumber, VerifyResult } from '../types';

const API_URL =
  'https://omniapi.hk.chinamobile.com/api/omni-channel-service-personal/rest/choicePhoneNum/resQueryBatchNumber';

const HEADERS: Record<string, string> = {
  'acc-lang': 'zh-HK',
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'zh-HK',
  'channelid': 'WWW',
  'cmhkchannel': 'WWW',
  'content-type': 'application/json',
  'origin': 'https://www.hk.chinamobile.com',
  'referer': 'https://www.hk.chinamobile.com/component/planreNuxtHk',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
};

// msisdnLevel tiers observed on the CMHK web store:
//   W = ordinary pool (random batch of ~500 per call, drawn from a larger pool)
//   C / D = premium ("靓号") pools — every call returns the complete list
const ORDINARY_LEVEL = 'W';
const SPECIAL_LEVELS = ['C', 'D'];

// Hard caps — keep the number of upstream calls bounded per update run.
// MAX_UPSTREAM_CALLS_PER_RUN is the contract the whole update honours:
// ORDINARY_BATCH_COUNT + SPECIAL_LEVELS.length + VERIFY_BUDGET must fit in it.
export const ORDINARY_BATCH_COUNT = 8;
export const VERIFY_BUDGET = 40;
export const MAX_UPSTREAM_CALLS_PER_RUN = 50;
const BATCH_DELAY_MS = 300;
// A hung upstream request must not eat the whole 60s function budget
const REQUEST_TIMEOUT_MS = 10_000;

// Verification pacing — the endpoint is a public number picker, so stay polite
const VERIFY_CONCURRENCY = 3;
const VERIFY_DELAY_MS = 300;

type BatchResult = { ok: boolean; list: string[] };

// e.g. "QrBBBpRB66NPEKpHYy" + "2026831231310" (y M d H m s, no padding)
function buildCamponFlag(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 18; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  const now = new Date();
  const ts = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  return random + ts;
}

function buildBody(level: string, msisdnCondition = ''): string {
  return JSON.stringify({
    msisdnLevel: level,
    msisdnType: '1',
    orgId: 'OS01',
    msisdnCondition,
    prefixNum: '',
    regionId: '',
    selectNumType: '1',
    selectNum: '',
    msidnCamponFlag: buildCamponFlag(),
  });
}

/**
 * One upstream query. `ok: false` means we could not reach a definitive answer
 * — the caller must not conclude that the missing numbers are sold.
 */
async function fetchCmhkBatch(level: string, msisdnCondition = ''): Promise<BatchResult> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: buildBody(level, msisdnCondition),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`CMHK API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.code !== '000000') {
      throw new Error(`CMHK API code=${json.code} message=${json.message}`);
    }

    // An absent list is a malformed answer, not "no numbers left" — treating
    // it as an empty pool would delete every number it was asked about.
    if (!Array.isArray(json.data?.numberList)) {
      throw new Error('CMHK API returned no numberList array');
    }

    const list: string[] = json.data.numberList;
    if (!msisdnCondition) {
      console.log(`[CMHK] level=${level} got ${list.length} numbers`);
    }
    return { ok: true, list };
  } catch (error) {
    console.error(`[CMHK] Fetch error (level=${level} condition=${msisdnCondition}):`, error);
    return { ok: false, list: [] };
  }
}

export async function fetchCmhkData(): Promise<CarrierFetchResult> {
  let upstreamCalls = 0;

  // Ordinary pool: each call returns a random batch, so repeat and deduplicate
  const ordinary: RawNumber[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < ORDINARY_BATCH_COUNT; i++) {
    const { list } = await fetchCmhkBatch(ORDINARY_LEVEL);
    upstreamCalls++;
    let newInBatch = 0;
    for (const num of list) {
      if (!seen.has(num)) {
        seen.add(num);
        ordinary.push({ number: num, level: ORDINARY_LEVEL });
        newInBatch++;
      }
    }
    console.log(`[CMHK] batch ${i + 1}/${ORDINARY_BATCH_COUNT}: ${list.length} numbers, ${newInBatch} new unique`);

    if (i < ORDINARY_BATCH_COUNT - 1) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Premium pools: each call returns the level's complete list. Only when
  // every level answered can we treat the result as the authoritative pool.
  const special: RawNumber[] = [];
  const seenSpecial = new Set<string>();
  let specialAuthoritative = true;

  for (const level of SPECIAL_LEVELS) {
    const { ok, list } = await fetchCmhkBatch(level);
    upstreamCalls++;
    if (!ok) {
      specialAuthoritative = false;
      console.warn(`[CMHK] special level=${level} failed — keeping previous premium numbers`);
    }
    for (const num of list) {
      if (!seenSpecial.has(num)) {
        seenSpecial.add(num);
        special.push({ number: num, level });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
  }

  console.log(
    `[CMHK] Complete! ordinary=${ordinary.length} special=${special.length} ` +
    `specialAuthoritative=${specialAuthoritative} calls=${upstreamCalls}`
  );
  return { ordinary, special, specialAuthoritative, upstreamCalls };
}

/**
 * Re-check individual numbers against upstream.
 *
 * Passing the full 8-digit number as `msisdnCondition` turns the batch
 * endpoint into an exact lookup: the number comes back if it is still on
 * sale, and the list is empty once it has been taken. Anything else — a
 * transport error, a non-success code — is reported as `unknown` and leaves
 * the cached entry alone.
 */
export async function verifyCmhkNumbers(
  numbers: string[],
  budget: number = VERIFY_BUDGET
): Promise<VerifyResult> {
  const statuses = new Map<string, NumberStatus>();
  const targets = numbers.slice(0, Math.max(0, budget));
  let calls = 0;
  let aborted = false;

  for (let i = 0; i < targets.length; i += VERIFY_CONCURRENCY) {
    if (aborted) break;
    const slice = targets.slice(i, i + VERIFY_CONCURRENCY);

    await Promise.all(
      slice.map(async (num) => {
        const { ok, list } = await fetchCmhkBatch(ORDINARY_LEVEL, num);
        calls++;
        if (!ok) {
          // Upstream is unhappy — stop spending the budget on doomed calls
          aborted = true;
          statuses.set(num, 'unknown');
          return;
        }
        statuses.set(num, list.includes(num) ? 'available' : 'gone');
      })
    );

    if (!aborted && i + VERIFY_CONCURRENCY < targets.length) {
      await new Promise((resolve) => setTimeout(resolve, VERIFY_DELAY_MS));
    }
  }

  const gone = [...statuses.values()].filter(s => s === 'gone').length;
  console.log(
    `[CMHK] Verified ${statuses.size}/${targets.length} numbers in ${calls} calls: ` +
    `${gone} gone${aborted ? ' (aborted early after an upstream error)' : ''}`
  );

  return { statuses, calls };
}
