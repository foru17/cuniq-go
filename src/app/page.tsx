import type { Metadata } from 'next';
import { getNumbers, getTotalNumbersCount } from '@/services/numberService';
import { getCarrier } from '@/lib/carrier';
import NumberDashboard from '@/components/NumberDashboard';
import {
  SoftwareAppJsonLd,
  WebSiteJsonLd,
  OrganizationJsonLd,
} from '@/components/StructuredData';

// Force dynamic rendering since we fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

const carrier = getCarrier();

// 页面级元数据
export const metadata: Metadata = {
  title: carrier.metaTitle,
  description: carrier.metaDescription,
  alternates: {
    canonical: carrier.siteUrl,
  },
  openGraph: {
    title: carrier.ogTitle,
    description: carrier.ogDescription,
    url: carrier.siteUrl,
    type: 'website',
  },
};

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
  const totalCount = await getTotalNumbersCount();

  // 格式化日期为 ISO 格式
  const dateModified = lastUpdated 
    ? new Date(lastUpdated).toISOString() 
    : new Date().toISOString();
  const datePublished = '2024-01-01T00:00:00Z'; // 项目发布日期

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/10 flex flex-col">
      {/* 组织结构化数据 */}
      <OrganizationJsonLd />
      
      {/* 网站结构化数据 */}
      <WebSiteJsonLd
        name={carrier.siteName}
        url={carrier.siteUrl}
        description={carrier.ogDescription}
      />

      {/* 软件应用结构化数据 */}
      <SoftwareAppJsonLd
        name={carrier.metaTitle}
        description={carrier.metaDescription}
        url={carrier.siteUrl}
        authorName="Luo Lei"
        authorUrl="https://luolei.org"
        datePublished={datePublished}
        dateModified={dateModified}
      />
      
      <NumberDashboard 
        initialNumbers={data} 
        lastUpdated={lastUpdated} 
        currentType={type}
        totalCount={totalCount}
      />
    </main>
  );
}
