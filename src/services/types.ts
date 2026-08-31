import { NumberEntry } from '@/lib/utils';

// Raw payload shape returned by upstream carrier APIs (loosely typed; keys vary)
export type RawNumber = {
  number?: string;
  hkNumber?: string;
  mainlandNumber?: string;
  mcNumber?: string;
  mainland?: string;
  mainland_number?: string;
  level?: string;
  [key: string]: unknown;
};

export type CacheData = {
  ordinary: NumberEntry[];
  special: NumberEntry[];
  lastUpdated: number;
};

export type CarrierFetchResult = {
  ordinary: RawNumber[];
  special: RawNumber[];
};
