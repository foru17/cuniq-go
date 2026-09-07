import { getCarrier } from '@/lib/carrier';

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

/**
 * Send a GA4 event. No-ops on the server and whenever gtag is absent
 * (local development, NEXT_PUBLIC_GA_ID unset, blocked by an ad blocker),
 * so callers never have to guard the call site.
 *
 * Every event carries `carrier` so the two deployments stay distinguishable
 * even if they ever share a property.
 */
export function track(event: string, params: EventParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', event, { carrier: getCarrier().id, ...params });
  } catch (error) {
    console.warn('[analytics] event dropped:', event, error);
  }
}
