'use client';

import { useState, useEffect, useMemo } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/input';
import { NumberEntry, filterNumbers, cn } from '@/lib/utils';

export type FilterState = {
  include: string;
  exclude: string;
  suffix: string;
  luckyPattern: string;
  matchHk: boolean;
  matchMainland: boolean;
  type: 'ordinary' | 'special';
  location: string;
};

type FilterControlsProps = {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  numbers: NumberEntry[]; // Add numbers prop to extract cities dynamically
  onReset: () => void;
  className?: string;
  gridClassName?: string;
};

const LUCKY_PATTERNS = [
  { value: '', label: '不限' },
  { value: 'AAAA', label: 'AAAA' },
  { value: 'AABB', label: 'AABB' },
  { value: 'ABAB', label: 'ABAB' },
  { value: 'AAAB', label: 'AAAB' },
  { value: 'ABBB', label: 'ABBB' },
  { value: 'AAXBB', label: 'AAXBB' },
  { value: 'ascending', label: '连号 (123)' },
  { value: 'descending', label: '倒序 (321)' },
  { value: 'any', label: '任意靓号' },
];

export default function FilterControls({
  filters,
  onFilterChange,
  numbers,
  onReset,
  className,
  gridClassName,
}: FilterControlsProps) {
  // Dynamically extract unique cities from numbers data
  const locations = useMemo(() => {
    const citySet = new Set<string>();
    numbers.forEach(num => {
      if (num.city) {
        citySet.add(num.city);
      }
    });
    
    const cities = Array.from(citySet).sort();
    return [
      { value: '', label: '不限' },
      ...cities.map(city => ({ value: city, label: city }))
    ];
  }, [numbers]);

  // Calculate count for each location
  const locationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    // Apply all filters except location
    const tempFilters = { ...filters, location: '' };
    const filtered = filterNumbers(numbers, tempFilters);
    
    // Count for each location
    locations.forEach(loc => {
      if (loc.value === '') {
        counts.set('', filtered.length);
      } else {
        const count = filtered.filter(n => 
          n.city === loc.value || n.province === loc.value
        ).length;
        counts.set(loc.value, count);
      }
    });
    
    return counts;
  }, [numbers, filters, locations]);

  // Calculate count for each lucky pattern
  const luckyPatternCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    // Apply all filters except luckyPattern
    const tempFilters = { ...filters, luckyPattern: '' };
    const baseFiltered = filterNumbers(numbers, tempFilters);
    
    LUCKY_PATTERNS.forEach(pattern => {
      if (pattern.value === '') {
        counts.set('', baseFiltered.length);
      } else {
        const count = filterNumbers(baseFiltered, { 
          ...tempFilters, 
          luckyPattern: pattern.value 
        }).length;
        counts.set(pattern.value, count);
      }
    });
    
    return counts;
  }, [numbers, filters]);

  const handleChange = (key: keyof FilterState, value: any) => {
    onFilterChange({ [key]: value });
  };

  return (
    <section className={cn("card p-4 mb-4 glass", className)}>
      <div className="flex flex-col gap-4">
        {/* Top Bar: Type Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        
          <div className="flex items-center gap-3">
            <div className="flex bg-secondary/50 rounded-lg p-0.5">
              <button
                onClick={() => handleChange('type', 'ordinary')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filters.type === 'ordinary'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                普通号码
              </button>
              <button
                onClick={() => handleChange('type', 'special')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filters.type === 'special'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                特殊靓号
              </button>
            </div>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title="重置所有筛选条件"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>
            重置
          </button>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", gridClassName)}>
          {/* Input Filters */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">包含数字</label>
            <Input
              type="text"
              placeholder="如: 8, 6"
              value={filters.include}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('include', e.target.value)}
              className="w-full h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">排除数字</label>
            <Input
              type="text"
              placeholder="如: 4, 7"
              value={filters.exclude}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('exclude', e.target.value)}
              className="w-full h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">尾号匹配位数</label>
            <Input
              type="text"
              placeholder="如: 3 (后3位)"
              value={filters.suffix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('suffix', e.target.value)}
              className="w-full h-8 text-sm"
            />
          </div>

          {/* Switches */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">匹配范围</label>
            <div className="flex items-center gap-4 h-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={filters.matchHk}
                  onCheckedChange={(checked) => handleChange('matchHk', checked)}
                  className="scale-75 origin-left"
                />
                <span className="text-xs">香港号码</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={filters.matchMainland}
                  onCheckedChange={(checked) => handleChange('matchMainland', checked)}
                  className="scale-75 origin-left"
                />
                <span className="text-xs">内地号码</span>
              </label>
            </div>
          </div>
        </div>

        {/* Location Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">归属地</label>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((loc) => (
              <button
                key={loc.value}
                onClick={() => handleChange('location', loc.value)}
                className={`
                  relative px-2.5 py-1 pr-6 rounded-full text-xs font-medium transition-all border
                  ${filters.location === loc.value
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }
                `}
              >
                {loc.label}
                <span className={`
                  absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center
                  rounded-full text-[10px] font-semibold
                  ${filters.location === loc.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {locationCounts.get(loc.value) || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lucky Pattern Chips */}
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <label className="text-xs font-medium text-muted-foreground">靓号模式</label>
          <div className="flex flex-wrap gap-1.5">
            {LUCKY_PATTERNS.map((pattern) => (
              <button
                key={pattern.value}
                onClick={() => handleChange('luckyPattern', pattern.value)}
                className={`
                  relative px-2.5 py-1 pr-6 rounded-full text-xs font-medium transition-all border
                  ${filters.luckyPattern === pattern.value
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }
                `}
              >
                {pattern.label}
                <span className={`
                  absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center
                  rounded-full text-[10px] font-semibold
                  ${filters.luckyPattern === pattern.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {luckyPatternCounts.get(pattern.value) || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
