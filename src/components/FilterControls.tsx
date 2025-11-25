
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/input';
import { NumberEntry, filterNumbers } from '@/lib/utils';

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
    <section className="card p-6 mb-6 glass">
      <div className="flex flex-col gap-6">
        {/* Top Bar: Type Selection */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">筛选条件</h2>
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => handleChange('type', 'ordinary')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filters.type === 'ordinary'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                普通号码
              </button>
              <button
                onClick={() => handleChange('type', 'special')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filters.type === 'special'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                特殊靓号
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Input Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">包含数字</label>
            <Input
              type="text"
              placeholder="如: 8, 6 (逗号分隔)"
              value={filters.include}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('include', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">排除数字</label>
            <Input
              type="text"
              placeholder="如: 4, 7"
              value={filters.exclude}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('exclude', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">尾号匹配 (位数)</label>
            <Input
              type="text"
              placeholder="如: 3 (匹配后3位相同)"
              value={filters.suffix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('suffix', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">归属地</label>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => handleChange('location', loc.value)}
                  className={`
                    relative px-3 py-1.5 pr-8 rounded-full text-sm font-medium transition-all border
                    ${filters.location === loc.value
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }
                  `}
                >
                  {loc.label}
                  <span className={`
                    absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center
                    rounded-full text-xs font-semibold
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

          {/* Switches */}
          <div className="space-y-2">
            <label className="text-sm font-medium block mb-2">匹配范围</label>
            <div className="flex items-center gap-6 h-[42px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={filters.matchHk}
                  onCheckedChange={(checked) => handleChange('matchHk', checked)}
                />
                <span className="text-sm">香港号码</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={filters.matchMainland}
                  onCheckedChange={(checked) => handleChange('matchMainland', checked)}
                />
                <span className="text-sm">内地号码</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lucky Pattern Chips */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <label className="text-sm font-medium">靓号模式</label>
          <div className="flex flex-wrap gap-2">
            {LUCKY_PATTERNS.map((pattern) => (
              <button
                key={pattern.value}
                onClick={() => handleChange('luckyPattern', pattern.value)}
                className={`
                  relative px-3 py-1.5 pr-8 rounded-full text-sm font-medium transition-all border
                  ${filters.luckyPattern === pattern.value
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }
                `}
              >
                {pattern.label}
                <span className={`
                  absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center
                  rounded-full text-xs font-semibold
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

