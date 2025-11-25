
import { useMemo } from 'react';
import { getLuckyPatternRanges, getIncludedRanges, parsePatterns, HighlightRange } from '@/lib/utils';

type HighlightedNumberProps = {
  number: string;
  include: string;
  luckyPattern: string;
  className?: string;
};

export default function HighlightedNumber({ number, include, luckyPattern, className = '' }: HighlightedNumberProps) {
  const segments = useMemo(() => {
    if (!number) return [{ text: '', style: '' }];

    const ranges: HighlightRange[] = [];

    // 1. Get Lucky Pattern Ranges (Priority)
    if (luckyPattern) {
      const patternRanges = getLuckyPatternRanges(number, luckyPattern);
      ranges.push(...patternRanges);
    }

    // 2. Get Include Ranges
    if (include) {
      const includePatterns = parsePatterns(include);
      const includeRanges = getIncludedRanges(number, includePatterns);
      ranges.push(...includeRanges);
    }

    if (ranges.length === 0) {
      return [{ text: number, style: '' }];
    }

    // Sort ranges by start index
    ranges.sort((a, b) => a.start - b.start);

    // Merge overlapping ranges (simple merge: if overlap, take the one that starts earlier or is longer)
    // For simplicity, we'll just prioritize pattern over include if they overlap perfectly, 
    // but actually we want to show all highlights.
    // Let's flatten the string into characters and apply classes.
    
    const charStyles = new Array(number.length).fill(null);

    ranges.forEach(range => {
      for (let i = range.start; i < range.end; i++) {
        if (i < number.length) {
          // If already has a style, maybe combine or overwrite?
          // Pattern takes precedence over include
          if (range.type === 'pattern') {
             // Group 1: Red (AA), Group 2: Green (BB), Group 3: Orange (X)
             if (range.group === 3) {
               charStyles[i] = 'text-green-600 font-black';
             } else {
               charStyles[i] = range.group === 2 ? 'text-amber-600 font-black' : 'text-red-600 font-black';
             }
          } else if (range.type === 'include' && !charStyles[i]) {
             charStyles[i] = 'text-pink-600 font-bold';
          }
        }
      }
    });

    // Group contiguous characters with same style
    const result = [];
    let currentText = '';
    let currentStyle = charStyles[0];

    for (let i = 0; i < number.length; i++) {
      if (charStyles[i] === currentStyle) {
        currentText += number[i];
      } else {
        result.push({ text: currentText, style: currentStyle });
        currentText = number[i];
        currentStyle = charStyles[i];
      }
    }
    result.push({ text: currentText, style: currentStyle });

    return result;
  }, [number, include, luckyPattern]);

  return (
    <span className={`tabular-nums ${className}`}>
      {segments.map((seg, i) => (
        <span key={i} className={seg.style || 'text-foreground'}>
          {seg.text}
        </span>
      ))}
    </span>
  );
}
