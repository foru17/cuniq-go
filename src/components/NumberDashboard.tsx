'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import FilterControls from '@/components/FilterControls';
import NumberGrid from '@/components/NumberGrid';
import { NumberEntry, filterNumbers } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';

type NumberDashboardProps = {
  initialNumbers: NumberEntry[];
  lastUpdated: number;
  currentType: 'ordinary' | 'special';
};

export default function NumberDashboard({ initialNumbers, lastUpdated, currentType }: NumberDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
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

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // If type changed, navigate to new URL
    if (newFilters.type && newFilters.type !== currentType) {
      setLoading(true);
      setNumbers([]); // Clear numbers to show loading skeleton
      
      const params = new URLSearchParams(searchParams);
      params.set('type', newFilters.type);
      
      // Use replace or push? Push is better for history.
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-primary/5 p-2 ring-1 ring-border">
            <Image 
              src="/logo.svg" 
              alt="CUniq Logo" 
              width={48} 
              height={48} 
              className="w-full h-full object-contain dark:invert"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              CUniq Go 月神卡 选号神器
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
             中国联通香港/内地一卡双号筛选工具
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="https://x.com/luoleiorg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Follow on X"
            >
              <Image
                src="/x.svg"
                alt="X (Twitter)"
                width={16}
                height={16}
                className="w-4 h-4 dark:invert"
              />
            </a>
            <a
              href="https://github.com/foru17/cuniq-go"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="View on GitHub"
            >
              <Image
                src="/github.svg"
                alt="GitHub"
                width={20}
                height={20}
                className="w-5 h-5 dark:invert"
              />
            </a>
          </div>

          {lastUpdated > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-xs font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              更新时间: {formatTime(lastUpdated)}
            </div>
          )}
        </div>
      </header>

      {/* Promo Module */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-base text-muted-foreground leading-relaxed">
             <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">CUniq Go 月神卡</span> 是目前少数支持海外手机激活 <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">eSIM</span>，且能以<span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent font-bold">低成本</span>同时拥有<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">香港 +852</span> 和 <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent font-bold">内地 +86</span> 号码的方案。
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              本工具旨在辅助筛选心仪号码，并在 Github 上开源，<b>数据来自 CUniq 官网，每 15 分钟更新一次。</b>
            </p>
          </div>
          <div className="flex-shrink-0">
            <a
              href="https://store.cuniq.com/tc/services-plan/cuniq-go/cuniq-go-monthly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              CUniq 网上商城-月神卡 
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterControls 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        numbers={numbers}
        onReset={handleReset}
      />

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
  );
}
