
import { NumberEntry } from '@/lib/utils';
import HighlightedNumber from './HighlightedNumber';

type NumberGridProps = {
  numbers: NumberEntry[];
  loading: boolean;
  viewMode?: 'grid' | 'list';
  filters?: {
    include: string;
    luckyPattern: string;
    suffix?: string;
    matchHk?: boolean;
    matchMainland?: boolean;
    location?: string;
  };
};

export default function NumberGrid({ numbers, loading, viewMode = 'grid', filters = { include: '', luckyPattern: '' } }: NumberGridProps) {
  if (loading && numbers.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl animate-pulse bg-muted/50 border border-border/50"></div>
        ))}
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
        <p>没有找到符合条件的号码</p>
      </div>
    );
  }

  const isNew = (timestamp?: number) => {
    if (!timestamp) return false;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    return now - timestamp < oneDay;
  };

  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium">
            <tr>
              <th className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm">香港号码 (HK)</th>
              <th className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm">内地号码 (CN)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {numbers.map((entry, i) => (
              <tr key={`${entry.hkNumber}-${i}`} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-base md:text-lg font-bold tracking-tight relative">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="mr-1 md:mr-2 text-sm md:text-base font-normal">🇭🇰</span>
                    <HighlightedNumber 
                      number={entry.hkNumber} 
                      include={filters.include} 
                      luckyPattern={filters.luckyPattern} 
                    />
                  </div>
                </td>
                <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-base md:text-lg font-bold tracking-tight">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <div className="flex items-center">
                      <span className="mr-1 md:mr-2 text-sm md:text-base font-normal">🇨🇳</span>
                      <HighlightedNumber 
                        number={entry.mainlandNumber} 
                        include={filters.include} 
                        luckyPattern={filters.luckyPattern} 
                      />
                    </div>
                    {( entry.city) && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] md:text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 whitespace-nowrap dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/30">
                     {entry.city}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
      {numbers.map((entry, i) => (
        <div 
          key={`${entry.hkNumber}-${i}`} 
          className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-4 transition-all hover:shadow-md hover:border-primary/30 hover:bg-card/80"
        >

          <div className="flex flex-col gap-3">
            {/* HK Number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg" role="img" aria-label="Hong Kong">🇭🇰</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">+852</span>
              </div>
              <span className="font-mono text-lg font-bold tracking-tight transition-colors">
                <HighlightedNumber 
                  number={entry.hkNumber} 
                  include={filters.include} 
                  luckyPattern={filters.luckyPattern} 
                />
              </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50"></div>

            {/* Mainland Number */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg" role="img" aria-label="China">🇨🇳</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">+86</span>
                </div>
                <span className="font-mono text-lg font-bold tracking-tight transition-colors">
                  <HighlightedNumber 
                    number={entry.mainlandNumber} 
                    include={filters.include} 
                    luckyPattern={filters.luckyPattern} 
                  />
                </span>
              </div>
              {( entry.city) && (
                <div className="flex justify-end">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/30">
                    {entry.city}
                  </span>
                </div>
              )}
            </div>
          </div>
        
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
        </div>
      ))}
    </div>
  );
}
