'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import FilterControls from '@/components/FilterControls';
import NumberGrid from '@/components/NumberGrid';
import { NumberEntry, filterNumbers } from '@/lib/utils';
import { Github } from 'lucide-react';

export default function Home() {
  const [numbers, setNumbers] = useState<NumberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
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

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/numbers?type=${filters.type}`);
      const data = await res.json();
      
      if (data.data) {
        setNumbers(data.data);
        setLastUpdated(data.lastUpdated);
      } else {
        // Fallback for older API response structure if any
        setNumbers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch numbers:', error);
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, [filters.type]);

  const filteredNumbers = useMemo(() => {
    return filterNumbers(numbers, filters);
  }, [numbers, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/10">
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
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                CUniq 月神卡选号神器
              </h1>
              <p className="text-muted-foreground mt-1 text-sm font-medium">
                CUniq 香港/内地一卡双号筛选工具
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
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
                  className="w-4 h-4"
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
                  className="w-5 h-5"
                />
              </a>
            </div>

            {lastUpdated && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-xs font-mono text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                更新时间: {formatTime(lastUpdated)}
              </div>
            )}
          </div>
        </header>

        {/* Filters */}
        <FilterControls 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          numbers={numbers}
        />

        {/* Content Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">可用号码</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {filteredNumbers.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="网格视图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="列表视图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
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
    </main>
  );
}
