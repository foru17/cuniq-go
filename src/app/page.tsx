import { getNumbers } from '@/services/numberService';
import NumberDashboard from '@/components/NumberDashboard';

// Force dynamic rendering since we fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Extract type from searchParams, default to 'ordinary'
  const resolvedSearchParams = await searchParams;
  const typeParam = resolvedSearchParams?.type;
  const type = (typeof typeParam === 'string' && typeParam === 'special') ? 'special' : 'ordinary';
  
  const { data, lastUpdated } = await getNumbers(type);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CUniq Go 月神卡 选号神器',
    url: 'https://cuniq.zuoluo.tv',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description: 'CUniq月神卡选号神器，HK$9/月持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选，数据实时同步。',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'HKD',
    },
    author: {
      '@type': 'Person',
      name: 'Luo Lei',
      url: 'https://luolei.org',
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NumberDashboard 
        initialNumbers={data} 
        lastUpdated={lastUpdated} 
        currentType={type}
      />
    </main>
  );
}
