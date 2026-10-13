import React from 'react';
import { Award } from 'lucide-react';

interface Props {
  year?: number | string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold-badge' | 'gold-pill' | 'white-overlay';
  className?: string;
}

export const TravelersChoiceBadge: React.FC<Props> = ({
  year = 2026,
  size = 'md',
  variant = 'gold-badge',
  className = '',
}) => {
  if (variant === 'gold-pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-md bg-amber-400 text-amber-950 px-2.5 py-1 text-xs shadow-xs tracking-wider uppercase ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-900" />
        {year}
      </span>
    );
  }

  if (variant === 'white-overlay') {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-white/95 backdrop-blur-xs text-emerald-950 font-bold px-3 py-1.5 rounded-full shadow-md border border-emerald-100 ${className}`}
      >
        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-black text-[10px]">
          {year}
        </div>
        <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-900">
          Best of the Best
        </span>
      </div>
    );
  }

  const dimensions =
    size === 'sm'
      ? 'w-10 h-10 text-[9px]'
      : size === 'lg'
      ? 'w-16 h-16 text-xs'
      : 'w-12 h-12 text-[10px]';

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-amber-950 font-black shadow-lg border-2 border-amber-200 select-none ${dimensions} ${className}`}
      title={`Travelers' Choice Awards Best of the Best ${year}`}
    >
      <Award className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className="leading-none tracking-tight font-extrabold">{year}</span>
    </div>
  );
};
