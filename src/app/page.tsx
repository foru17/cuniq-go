import { getNumbers } from '@/services/numberService';
import NumberDashboard from '@/components/NumberDashboard';

// Force dynamic rendering since we fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // We can support initial type via search params if we want
  // const type = typeof searchParams.type === 'string' && searchParams.type === 'special' ? 'special' : 'ordinary';
  
  // For now, default to ordinary as per original logic, 
  // but we could pass the type from URL to the service.
  // Let's stick to the default behavior for the initial load.
  const { data, lastUpdated } = await getNumbers('ordinary');

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/10">
      <NumberDashboard initialNumbers={data} lastUpdated={lastUpdated} />
    </main>
  );
}
