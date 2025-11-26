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

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/10">
      <NumberDashboard 
        initialNumbers={data} 
        lastUpdated={lastUpdated} 
        currentType={type}
      />
    </main>
  );
}
