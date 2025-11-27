'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import FilterControls, { FilterState } from '@/components/FilterControls';
import NumberGrid from '@/components/NumberGrid';
import { NumberEntry, filterNumbers } from '@/lib/utils';
import DashboardHeader from '@/components/DashboardHeader';
import PromoSection from '@/components/PromoSection';

type NumberDashboardProps = {
  initialNumbers: NumberEntry[];
  lastUpdated: number;
  currentType: 'ordinary' | 'special';
  totalCount: number;
};

export default function NumberDashboard({ initialNumbers, lastUpdated, currentType, totalCount }: NumberDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    include: '',
    exclude: '',
    suffix: '',
    luckyPattern: '',
    type: currentType,
    matchHk: true,
    matchMainland: true,
    location: ''
  });

  const [numbers, setNumbers] = useState<NumberEntry[]>(initialNumbers);
  const [loading, setLoading] = useState(false);
  
  // Sync numbers when initialNumbers prop changes (e.g. after navigation)
  useEffect(() => {
    setNumbers(initialNumbers);
    setLoading(false);
    // Also sync the filter type to match the prop
    setFilters(prev => ({ ...prev, type: currentType }));
  }, [initialNumbers, currentType]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // If type changed, navigate to new URL
    if (newFilters.type && newFilters.type !== currentType) {
      setLoading(true);
      setNumbers([]); // Clear numbers to show loading skeleton
      
      const params = new URLSearchParams(searchParams);
      params.set('type', newFilters.type);
      
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const filteredNumbers = useMemo(() => {
    return filterNumbers(numbers, filters);
  }, [numbers, filters]);

  const handleReset = () => {
    setFilters({
      include: '',
      exclude: '',
      suffix: '',
      luckyPattern: '',
      type: 'ordinary',
      matchHk: true,
      matchMainland: true,
      location: ''
    });
    
    // If we were on special, navigate back to ordinary
    if (currentType !== 'ordinary') {
       setLoading(true);
       setNumbers([]);
       const params = new URLSearchParams(searchParams);
       params.set('type', 'ordinary');
       router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <ScrollArea className="h-full w-full rounded-md">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        <DashboardHeader />
        
        <PromoSection totalCount={totalCount} lastUpdated={lastUpdated} />

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Sidebar: Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-4 z-10">
            <FilterControls 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              numbers={numbers}
              onReset={handleReset}
              className="mb-0"
              gridClassName="lg:grid-cols-1"
            />
          </aside>

          {/* Right Content: Number Grid */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* Content Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">可用号码</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {filteredNumbers.length}
                </span>
              </div>
              
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="网格视图"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="列表视图"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <NumberGrid 
              numbers={filteredNumbers} 
              loading={loading} 
              viewMode={viewMode} 
              filters={{
                include: filters.include,
                suffix: filters.suffix,
                luckyPattern: filters.luckyPattern,
                matchHk: filters.matchHk,
                matchMainland: filters.matchMainland,
                location: filters.location
              }}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
