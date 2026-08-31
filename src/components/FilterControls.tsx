'use client';

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/input';
import { NumberEntry, filterNumbers, cn } from '@/lib/utils';
import { getCarrier } from '@/lib/carrier';

export type FilterState = {
  include: string;
  exclude: string;
  suffix: string;
  luckyPattern: string;
  matchHk: boolean;
  matchMainland: boolean;
  location: string;
};

type FilterControlsProps = {
  filters: FilterState;
  currentType: 'ordinary' | 'special';
  onTypeChange: (type: 'ordinary' | 'special') => void;
  onFilterChange: (filters: Partial<FilterState>) => void;
  numbers: NumberEntry[]; // Used to derive available cities & live counts
  onReset: () => void;
  className?: string;
  gridClassName?: string;
};

const carrier = getCarrier();

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
  currentType,
  onTypeChange,
  onFilterChange,
  numbers,
  onReset,
  className,
  gridClassName,
}: FilterControlsProps) {
  // Dynamically extract unique cities from numbers data
  const locations = useMemo(() => {
    const citySet = new Set<string>();
    numbers.forEach((num) => {
      if (num.city) citySet.add(num.city);
    });

    const cities = Array.from(citySet).sort();
    return [{ value: '', label: '不限' }, ...cities.map((city) => ({ value: city, label: city }))];
  }, [numbers]);

  // Calculate count for each location
  const locationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const filtered = filterNumbers(numbers, { ...filters, location: '' });

    locations.forEach((loc) => {
      if (loc.value === '') {
        counts.set('', filtered.length);
      } else {
        counts.set(
          loc.value,
          filtered.filter((n) => n.city === loc.value || n.province === loc.value).length
        );
      }
    });

    return counts;
  }, [numbers, filters, locations]);

  // Calculate count for each lucky pattern
  const luckyPatternCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const baseFiltered = filterNumbers(numbers, { ...filters, luckyPattern: '' });

    LUCKY_PATTERNS.forEach((pattern) => {
      if (pattern.value === '') {
        counts.set('', baseFiltered.length);
      } else {
        counts.set(
          pattern.value,
          filterNumbers(baseFiltered, { ...filters, luckyPattern: pattern.value }).length
        );
      }
    });

    return counts;
  }, [numbers, filters]);

  const handleChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ [key]: value });
  };

  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur-xl',
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Top Bar: Type Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex rounded-lg bg-secondary/60 p-0.5">
            <button
              onClick={() => onTypeChange('ordinary')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                currentType === 'ordinary'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              普通号码
            </button>
            <button
              onClick={() => onTypeChange('special')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                currentType === 'special'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              特殊靓号
            </button>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
            title="重置所有筛选条件"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
        </div>

        <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', gridClassName)}>
          {/* Input Filters */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">包含数字</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="如: 8, 6"
              value={filters.include}
              onChange={(e) => handleChange('include', e.target.value)}
              className="h-8 w-full text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">排除数字</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="如: 4, 7"
              value={filters.exclude}
              onChange={(e) => handleChange('exclude', e.target.value)}
              className="h-8 w-full text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">尾号匹配位数</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="如: 3 (后3位)"
              value={filters.suffix}
              onChange={(e) => handleChange('suffix', e.target.value)}
              className="h-8 w-full text-sm"
            />
          </div>

          {/* Switches (dual-number carriers only) */}
          {carrier.dualNumber && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">匹配范围</label>
              <div className="flex h-8 items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={filters.matchHk}
                    onCheckedChange={(checked) => handleChange('matchHk', checked)}
                    className="scale-75 origin-left"
                  />
                  <span className="text-xs">香港号码</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={filters.matchMainland}
                    onCheckedChange={(checked) => handleChange('matchMainland', checked)}
                    className="scale-75 origin-left"
                  />
                  <span className="text-xs">内地号码</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Location Chips (dual-number carriers only) */}
        {carrier.dualNumber && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">归属地</label>
            <div className="flex flex-wrap gap-1.5">
              {locations.map((loc) => (
                <FilterChip
                  key={loc.value}
                  label={loc.label}
                  count={locationCounts.get(loc.value) || 0}
                  active={filters.location === loc.value}
                  onClick={() => handleChange('location', loc.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lucky Pattern Chips */}
        <div className="space-y-2 border-t border-border/60 pt-3">
          <label className="text-xs font-medium text-muted-foreground">靓号模式</label>
          <div className="flex flex-wrap gap-1.5">
            {LUCKY_PATTERNS.map((pattern) => (
              <FilterChip
                key={pattern.value}
                label={pattern.label}
                count={luckyPatternCounts.get(pattern.value) || 0}
                active={filters.luckyPattern === pattern.value}
                onClick={() => handleChange('luckyPattern', pattern.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
          active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  );
}
