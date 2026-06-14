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

function CityTag({ city, className = '' }: { city: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border ${className}`}
    >
      {city}
    </span>
  );
}

export default function NumberGrid({
  numbers,
  loading,
  viewMode = 'grid',
  filters = { include: '', luckyPattern: '' },
}: NumberGridProps) {
  if (loading && numbers.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border/50 bg-muted/50" />
        ))}
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center text-sm text-muted-foreground">
        <p>没有找到符合条件的号码</p>
        <p className="mt-1 text-xs text-muted-foreground/70">试试调整筛选条件</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 font-medium text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-xs md:px-4 md:py-3 md:text-sm">香港号码 (HK)</th>
              <th className="px-3 py-2.5 text-xs md:px-4 md:py-3 md:text-sm">内地号码 (CN)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {numbers.map((entry, i) => (
              <tr key={`${entry.hkNumber}-${i}`} className="transition-colors hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-base font-bold tracking-tight md:px-4 md:py-3 md:text-lg">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="mr-1 text-sm font-normal md:mr-2 md:text-base">🇭🇰</span>
                    <HighlightedNumber
                      number={entry.hkNumber}
                      include={filters.include}
                      luckyPattern={filters.luckyPattern}
                    />
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-base font-bold tracking-tight md:px-4 md:py-3 md:text-lg">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex items-center">
                      <span className="mr-1 text-sm font-normal md:mr-2 md:text-base">🇨🇳</span>
                      <HighlightedNumber
                        number={entry.mainlandNumber}
                        include={filters.include}
                        luckyPattern={filters.luckyPattern}
                      />
                    </div>
                    {entry.city && <CityTag city={entry.city} className="whitespace-nowrap" />}
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
    <div className="grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {numbers.map((entry, i) => (
        <div
          key={`${entry.hkNumber}-${i}`}
          className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-md"
        >
          <div className="flex flex-col gap-3">
            {/* HK Number */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" role="img" aria-label="Hong Kong">🇭🇰</span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">+852</span>
              </div>
              <span className="font-mono text-lg font-bold tracking-tight">
                <HighlightedNumber
                  number={entry.hkNumber}
                  include={filters.include}
                  luckyPattern={filters.luckyPattern}
                />
              </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />

            {/* Mainland Number */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg" role="img" aria-label="China">🇨🇳</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">+86</span>
                </div>
                <span className="font-mono text-lg font-bold tracking-tight">
                  <HighlightedNumber
                    number={entry.mainlandNumber}
                    include={filters.include}
                    luckyPattern={filters.luckyPattern}
                  />
                </span>
              </div>
              {entry.city && (
                <div className="flex justify-end">
                  <CityTag city={entry.city} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
