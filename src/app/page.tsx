import type { Metadata } from 'next';
import { getNumbers, getTotalNumbersCount } from '@/services/numberService';
import NumberDashboard from '@/components/NumberDashboard';
import {
  SoftwareAppJsonLd,
  WebSiteJsonLd,
  OrganizationJsonLd,
} from '@/components/StructuredData';

// Force dynamic rendering since we fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

// 页面级元数据
export const metadata: Metadata = {
  title: 'CUniq Go 月神卡选号神器 - 香港联通一卡双号筛选工具',
  description: 'CUniq月神卡选号神器，专为靓号爱好者打造。HK$9/月低成本持有香港+852与内地+86一卡双号，支持实体卡/eSIM。支持多维度靓号筛选（AABB/ABAB/连号/尾号过滤），每15分钟自动同步官网数据。',
  alternates: {
    canonical: 'https://cuniq.zuoluo.tv',
  },
  openGraph: {
    title: 'CUniq Go 月神卡选号神器 - HK$9/月 一卡双号',
    description: 'HK$9/月低成本持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选，数据实时同步。',
    url: 'https://cuniq.zuoluo.tv',
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
        name="CUniq Go"
        url="https://cuniq.zuoluo.tv"
        description="CUniq月神卡选号神器，HK$9/月持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选。"
      />
      
      {/* 软件应用结构化数据 */}
      <SoftwareAppJsonLd
        name="CUniq Go 月神卡选号神器"
        description="CUniq月神卡选号神器，HK$9/月持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选，数据实时同步。"
        url="https://cuniq.zuoluo.tv"
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
