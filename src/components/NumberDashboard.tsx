'use client';

import { useState, useMemo } from 'react';
import FilterControls from '@/components/FilterControls';
import NumberGrid from '@/components/NumberGrid';
import { NumberEntry, filterNumbers } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';

type NumberDashboardProps = {
  initialNumbers: NumberEntry[];
  lastUpdated: number;
};

export default function NumberDashboard({ initialNumbers, lastUpdated }: NumberDashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    include: '',
    exclude: '',
    suffix: '',
    luckyPattern: '',
    type: 'ordinary' as 'ordinary' | 'special',
    matchHk: true,
    matchMainland: true,
    location: ''
  });

  // We use initialNumbers directly. 
  // If we wanted to support "refresh" or switching types (ordinary/special) without page reload,
  // we might need to fetch here. 
  // But for now, let's assume switching types might be a navigation or we fetch.
  // The original page fetched on type change.
  // Let's keep it simple: if type changes, we might need to fetch new data or 
  // we can just reload the page with a query param? 
  // Or we can keep the client-side fetch for type switching?
  // A better RSC approach is to use URL search params for type, so switching type is a navigation.
  // But to preserve the exact behavior of the original page (SPA-like), we might need to fetch.
  // However, the original page re-fetched on type change.
  // Let's implement client-side fetching for type switching to maintain UX, 
  // but initialize with server data.
  
  const [numbers, setNumbers] = useState<NumberEntry[]>(initialNumbers);
  const [loading, setLoading] = useState(false);
  const [currentLastUpdated, setCurrentLastUpdated] = useState(lastUpdated);

  // If type changes, we need to fetch new data if it's not the initial type.
  // Actually, let's just use the props for now. 
  // If the user changes the type filter, we should probably trigger a router.push 
  // to `/?type=special` so the server can render it? 
  // Or we can keep the client-side fetch for that specific interaction.
  // Let's keep the client-side fetch for type switching for now to avoid full page reloads,
  // but use initialNumbers for the first render.

  const handleFilterChange = async (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // If type changed, fetch new data
    if (newFilters.type && newFilters.type !== filters.type) {
      setLoading(true);
      try {
        const res = await fetch(`/api/numbers?type=${newFilters.type}`);
        const data = await res.json();
        if (data.data) {
          setNumbers(data.data);
          setCurrentLastUpdated(data.lastUpdated);
        }
      } catch (error) {
        console.error('Failed to fetch numbers:', error);
      } finally {
        setLoading(false);
      }
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
    // If we were on special, reset to ordinary? 
    // The original reset set type to ordinary.
    if (filters.type !== 'ordinary') {
       // Trigger fetch for ordinary
       handleFilterChange({ type: 'ordinary' });
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

          {currentLastUpdated > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-xs font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              更新时间: {formatTime(currentLastUpdated)}
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
