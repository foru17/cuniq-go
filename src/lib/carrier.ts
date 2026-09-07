export type CarrierId = 'cuniq' | 'cmhk';

export type CarrierConfig = {
  id: CarrierId;
  /** Header title shown in DashboardHeader */
  appName: string;
  headerSubtitle: string;
  siteName: string;
  siteUrl: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
  /** Cache object key inside the shared R2 bucket */
  cacheFilename: string;
  /** true = one card two numbers (HK + mainland), false = HK number only */
  dualNumber: boolean;
  storeUrl: string;
  storeCtaLabel: string;
  logoSrc: string;
  logoAlt: string;
  /** Strings rendered into the generated OG/Twitter share images */
  ogImage: { brand: string; subtitle: string; tagline: string };
  /**
   * Numbers whose lastSeenAt falls within this window before the latest
   * update are still shown. 0 = only numbers seen in the latest update.
   * Split per pool because the two pools behave differently upstream:
   * a source that returns its *complete* pool every call must use 0, or
   * numbers that were sold since the last sync keep being displayed.
   */
  ordinaryWindowMs: number;
  specialWindowMs: number;
  /**
   * Max number of "seen earlier but missing from this run" numbers to
   * re-check one by one against upstream per update. 0 disables the check.
   * Only meaningful for carriers whose pool window is > 0.
   */
  verifyBudget: number;
  /** Hard ceiling on upstream HTTP calls for one update run (fetch + verify) */
  maxUpstreamCalls: number;
  /** Trigger a background data refresh from page views when cache is stale */
  selfRefresh: boolean;
  refreshIntervalMs: number;
};

const CARRIERS: Record<CarrierId, CarrierConfig> = {
  cuniq: {
    id: 'cuniq',
    appName: 'CUniq Go 月神卡 选号神器',
    headerSubtitle: '中国联通香港/内地一卡双号筛选工具',
    siteName: 'CUniq Go',
    siteUrl: 'https://cuniq.zuoluo.tv',
    metaTitle: 'CUniq Go 月神卡选号神器 - 香港联通一卡双号筛选工具',
    metaDescription:
      'CUniq月神卡选号神器，专为靓号爱好者打造。HK$9/月低成本持有香港+852与内地+86一卡双号，支持实体卡/eSIM。支持多维度靓号筛选（AABB/ABAB/连号/尾号过滤），每15分钟自动同步官网数据。',
    ogTitle: 'CUniq Go 月神卡选号神器 - HK$9/月 一卡双号',
    ogDescription:
      'HK$9/月低成本持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选，数据实时同步。',
    keywords: ['CUniq', '月神卡', '香港联通', '一卡双号', '靓号', 'eSIM', '852号码', '86号码', '选号工具', 'AABB', '连号', 'HK$9套餐', '无押金', '香港手机号', '内地身份证'],
    cacheFilename: 'cache.json',
    dualNumber: true,
    storeUrl: 'https://store.cuniq.com/tc/services-plan/cuniq-go/cuniq-go-monthly',
    storeCtaLabel: 'CUniq 网上商城',
    logoSrc: '/logo.svg',
    logoAlt: 'CUniq Logo',
    ogImage: {
      brand: 'CUniq Go',
      subtitle: '月神卡选号神器',
      tagline: 'HK$9/月 · 一卡双号 (+852/+86) · 靓号筛选工具',
    },
    // 10 batches cover most, but not all, of each cuniq pool: consecutive runs
    // saw the special pool swing between 723 and 906 numbers. A window of 0
    // made those still-on-sale numbers vanish and reappear every 15 minutes,
    // so keep three runs' worth and let the per-number re-check prune what
    // was actually sold.
    ordinaryWindowMs: 45 * 60 * 1000,
    specialWindowMs: 45 * 60 * 1000,
    verifyBudget: 40,
    maxUpstreamCalls: 60,
    selfRefresh: false,
    refreshIntervalMs: 15 * 60 * 1000,
  },
  cmhk: {
    id: 'cmhk',
    appName: 'CMHK 选号神器',
    headerSubtitle: '中国移动香港号码筛选工具',
    siteName: 'CMHK 选号神器',
    siteUrl: 'https://cmhk.zuoluo.tv',
    metaTitle: 'CMHK 选号神器 - 中国移动香港靓号筛选工具',
    metaDescription:
      'CMHK 选号神器，专为靓号爱好者打造。一站式筛选中国移动香港 (CMHK) 官网在售 +852 号码，支持 AABB/ABAB/连号/尾号过滤等多维度靓号筛选，数据自动同步官网选号池。',
    ogTitle: 'CMHK 选号神器 - 中国移动香港靓号筛选',
    ogDescription:
      '一站式筛选中国移动香港 (CMHK) 官网在售 +852 号码。支持 AABB/连号/尾号过滤等多种靓号筛选，数据自动同步。',
    keywords: ['CMHK', '中国移动香港', 'China Mobile HK', '靓号', '852号码', '香港手机号', '选号工具', 'AABB', '连号', '香港号码', 'eSIM'],
    cacheFilename: 'cmhk-cache.json',
    dualNumber: false,
    storeUrl: 'https://www.hk.chinamobile.com/component/planreNuxtHk',
    storeCtaLabel: 'CMHK 官网上台',
    logoSrc: '/cmhk-logo.svg',
    logoAlt: 'CMHK 选号神器 Logo',
    ogImage: {
      brand: 'CMHK',
      subtitle: '中国移动香港 选号神器',
      tagline: '+852 香港号码 · C/D 级靓号 · 靓号筛选工具',
    },
    // W (ordinary) comes back as a random batch of a much larger pool, so a
    // number missing from one run may well still be on sale — keep a window
    // and re-check the stragglers instead. C/D (premium) return the complete
    // list every call, so anything missing is genuinely sold: window 0.
    ordinaryWindowMs: 3 * 60 * 60 * 1000,
    specialWindowMs: 0,
    verifyBudget: 40,
    maxUpstreamCalls: 50,
    selfRefresh: true,
    refreshIntervalMs: 15 * 60 * 1000,
  },
};

const carrierId: CarrierId =
  process.env.NEXT_PUBLIC_CARRIER === 'cmhk' ? 'cmhk' : 'cuniq';

export function getCarrier(): CarrierConfig {
  return CARRIERS[carrierId];
}
