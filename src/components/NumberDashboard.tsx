'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useMemo, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import FilterControls, { FilterState } from '@/components/FilterControls';
import NumberGrid from '@/components/NumberGrid';
import { NumberEntry, filterNumbers, cn } from '@/lib/utils';
import DashboardHeader from '@/components/DashboardHeader';
import PromoSection from '@/components/PromoSection';

type NumberDashboardProps = {
  initialNumbers: NumberEntry[];
  lastUpdated: number;
  currentType: 'ordinary' | 'special';
  totalCount: number;
};

const DEFAULT_FILTERS: FilterState = {
  include: '',
  exclude: '',
  suffix: '',
  luckyPattern: '',
  matchHk: true,
  matchMainland: true,
  location: '',
};

export default function NumberDashboard({ initialNumbers, lastUpdated, currentType, totalCount }: NumberDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // While navigating (type switch) the server refetches; clear the grid so the
  // skeleton shows until fresh data arrives. The sidebar keeps the current data.
  const numbers = useMemo(
    () => (isPending ? [] : initialNumbers),
    [isPending, initialNumbers]
  );

  const navigateType = (type: 'ordinary' | 'special') => {
    if (type === currentType) return;
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const filteredNumbers = useMemo(() => filterNumbers(numbers, filters), [numbers, filters]);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    navigateType('ordinary');
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <DashboardHeader />

        <PromoSection totalCount={totalCount} lastUpdated={lastUpdated} />

        {/* Main Content Area */}
        <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
          {/* Left Sidebar: Filters */}
          <aside className="z-10 w-full shrink-0 lg:sticky lg:top-4 lg:w-72">
            <FilterControls
              filters={filters}
              currentType={currentType}
              onTypeChange={navigateType}
              onFilterChange={handleFilterChange}
              numbers={initialNumbers}
              onReset={handleReset}
              gridClassName="lg:grid-cols-1"
            />
          </aside>

          {/* Right Content: Number Grid */}
          <div className="w-full min-w-0 flex-1 space-y-4">
            {/* Content Header */}
            <div className="flex flex-col items-center justify-between gap-4 px-1 sm:flex-row">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">可用号码</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary tabular-nums">
                  {filteredNumbers.length}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'rounded-md p-1.5 transition-all',
                    viewMode === 'grid'
                      ? 'bg-background text-foreground shadow-xs ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="网格视图"
                  aria-label="网格视图"
                  aria-pressed={viewMode === 'grid'}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-md p-1.5 transition-all',
                    viewMode === 'list'
                      ? 'bg-background text-foreground shadow-xs ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="列表视图"
                  aria-label="列表视图"
                  aria-pressed={viewMode === 'list'}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <NumberGrid
              numbers={filteredNumbers}
              loading={isPending}
              viewMode={viewMode}
              filters={{
                include: filters.include,
                suffix: filters.suffix,
                luckyPattern: filters.luckyPattern,
                matchHk: filters.matchHk,
                matchMainland: filters.matchMainland,
                location: filters.location,
              }}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
