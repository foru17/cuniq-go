'use client';

import { ArrowRight } from 'lucide-react';
import { track } from '@/lib/analytics';
import { getCarrier } from '@/lib/carrier';

const carrier = getCarrier();

/**
 * The "go to the carrier's store" call to action. A client component purely so
 * the click can be tracked — the link itself is a plain anchor and still works
 * (new tab, middle-click, copy link) if the tracking call never fires.
 */
export default function StoreCtaLink({ placement }: { placement: string }) {
  return (
    <a
      href={carrier.storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('store_cta_click', { placement })}
      className="group inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-95"
    >
      {carrier.storeCtaLabel}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
