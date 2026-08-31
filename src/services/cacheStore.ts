import { uploadToR2 } from '@/lib/s3';
import { getCarrier } from '@/lib/carrier';
import { CacheData } from './types';

// Read the carrier's cache from R2 (public URL)
export async function readCache(): Promise<CacheData | null> {
  try {
    const domain = process.env.S3_DOMAIN_HOST?.replace(/\/$/, '');
    if (!domain) {
      console.warn('[cacheStore] S3_DOMAIN_HOST not set');
      return null;
    }

    const url = `${domain}/${getCarrier().cacheFilename}`;
    console.log(`[cacheStore] Fetching from: ${url}`);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'CUniq-Next-Server/1.0',
      },
    });

    if (response.ok) {
      return await response.json();
    }
    console.warn(`[cacheStore] Failed to fetch: ${response.status}`);
  } catch (error) {
    console.error('[cacheStore] Error reading cache from R2:', error);
  }
  return null;
}

// Write the carrier's cache to R2
export async function writeCache(data: CacheData) {
  await uploadToR2(getCarrier().cacheFilename, JSON.stringify(data, null, 2));
  console.log('[cacheStore] Cache saved to Cloudflare R2');
}
