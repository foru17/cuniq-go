import { CarrierFetchResult, RawNumber } from '../types';

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
//   W = ordinary pool (random batch of ~500 per call)
//   C / D = premium ("靓号") pools (small lists, ~10 each)
const ORDINARY_LEVEL = 'W';
const SPECIAL_LEVELS = ['C', 'D'];

// Hard caps — keep the number of upstream calls bounded per update run
const ORDINARY_BATCH_COUNT = 8;
const BATCH_DELAY_MS = 300;

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

async function fetchCmhkBatch(level: string): Promise<string[]> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        msisdnLevel: level,
        msisdnType: '1',
        orgId: 'OS01',
        msisdnCondition: '',
        prefixNum: '',
        regionId: '',
        selectNumType: '1',
        selectNum: '',
        msidnCamponFlag: buildCamponFlag(),
      }),
    });

    console.log(`[CMHK] level=${level} status=${response.status}`);

    if (!response.ok) {
      throw new Error(`CMHK API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.code !== '000000') {
      throw new Error(`CMHK API code=${json.code} message=${json.message}`);
    }

    const list: string[] = json.data?.numberList || [];
    console.log(`[CMHK] level=${level} got ${list.length} numbers`);
    return list;
  } catch (error) {
    console.error(`[CMHK] Fetch error (level=${level}):`, error);
    return [];
  }
}

export async function fetchCmhkData(): Promise<CarrierFetchResult> {
  // Ordinary pool: each call returns a random batch, so repeat and deduplicate
  const ordinary: RawNumber[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < ORDINARY_BATCH_COUNT; i++) {
    const batch = await fetchCmhkBatch(ORDINARY_LEVEL);
    let newInBatch = 0;
    for (const num of batch) {
      if (!seen.has(num)) {
        seen.add(num);
        ordinary.push({ number: num, level: ORDINARY_LEVEL });
        newInBatch++;
      }
    }
    console.log(`[CMHK] batch ${i + 1}/${ORDINARY_BATCH_COUNT}: ${batch.length} numbers, ${newInBatch} new unique`);

    if (i < ORDINARY_BATCH_COUNT - 1) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Premium pools: small lists, one call per level
  const special: RawNumber[] = [];
  const seenSpecial = new Set<string>();
  for (const level of SPECIAL_LEVELS) {
    const batch = await fetchCmhkBatch(level);
    for (const num of batch) {
      if (!seenSpecial.has(num)) {
        seenSpecial.add(num);
        special.push({ number: num, level });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
  }

  console.log(`[CMHK] Complete! ordinary=${ordinary.length} special=${special.length}`);
  return { ordinary, special };
}
