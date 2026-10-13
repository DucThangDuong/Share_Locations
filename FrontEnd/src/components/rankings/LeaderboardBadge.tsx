import React from 'react';
import { Crown, Trophy, Medal } from 'lucide-react';

interface Props {
  rank: number;
  badge?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const LeaderboardBadge: React.FC<Props> = ({ rank, badge, size = 'md' }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  if (rank === 1) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-extrabold text-white rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 shadow-md shadow-amber-500/25 ${
          isSm
            ? 'px-2 py-0.5 text-[10px]'
            : isLg
            ? 'px-4 py-1.5 text-sm ring-2 ring-amber-300'
            : 'px-3 py-1 text-xs'
        }`}
      >
        <Crown className={isSm ? 'w-3 h-3' : isLg ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>{badge || 'TOP 1'}</span>
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-extrabold text-slate-800 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 border border-slate-300 shadow-xs ${
          isSm
            ? 'px-2 py-0.5 text-[10px]'
            : isLg
            ? 'px-4 py-1.5 text-sm ring-2 ring-slate-200'
            : 'px-3 py-1 text-xs'
        }`}
      >
        <Medal className={isSm ? 'w-3 h-3 text-slate-600' : isLg ? 'w-4 h-4 text-slate-600' : 'w-3.5 h-3.5 text-slate-600'} />
        <span>{badge || 'TOP 2'}</span>
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-extrabold text-amber-950 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 border border-amber-300 shadow-xs ${
          isSm
            ? 'px-2 py-0.5 text-[10px]'
            : isLg
            ? 'px-4 py-1.5 text-sm ring-2 ring-amber-200'
            : 'px-3 py-1 text-xs'
        }`}
      >
        <Trophy className={isSm ? 'w-3 h-3 text-amber-800' : isLg ? 'w-4 h-4 text-amber-800' : 'w-3.5 h-3.5 text-amber-800'} />
        <span>{badge || 'TOP 3'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200/90 ${
        isSm
          ? 'w-5 h-5 text-[10px]'
          : isLg
          ? 'w-8 h-8 text-sm'
          : 'w-6 h-6 text-xs'
      }`}
    >
      #{rank}
    </span>
  );
};
