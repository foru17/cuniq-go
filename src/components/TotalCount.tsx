'use client';

import { useEffect, useState, useRef } from 'react';

function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: easeOutExpo
      const easeOutExpo = (x: number): number => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      };

      const currentCount = Math.floor(easeOutExpo(percentage) * end);
      
      if (currentCount !== countRef.current) {
        setCount(currentCount);
        countRef.current = currentCount;
      }

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export default function TotalCount({ count, lastUpdated }: { count: number; lastUpdated: number }) {
  const animatedCount = useCounter(count);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full relative overflow-hidden rounded-2xl border border-primary/10 bg-background/50 p-4 shadow-sm backdrop-blur-sm hover:border-primary/20 transition-colors group flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex flex-row xl:flex-col items-center gap-6 xl:gap-3 px-2">
        {/* Count Section */}
        <div className="flex flex-col items-center">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
            当前号码数量
          </h3>
          <div className="flex items-baseline gap-1.5 min-w-[100px] justify-center">
            <span className="text-3xl font-black bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent tabular-nums tracking-tight">
              {animatedCount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-muted-foreground/80">个</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border/60 xl:w-12 xl:h-px xl:bg-border/40" />

        {/* Time Section */}
        <div className="flex flex-col items-start xl:items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              更新时间
            </span>
          </div>
          <span className="text-sm font-mono font-medium text-foreground/90">
            {lastUpdated > 0 ? formatTime(lastUpdated) : '--:--'}
          </span>
        </div>
      </div>
    </div>
  );
}
