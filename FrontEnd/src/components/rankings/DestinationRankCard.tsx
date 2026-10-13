import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import type { DestinationRankingItem } from '@/types/ranking';

interface Props {
  destination: DestinationRankingItem;
  onSelectProvince?: (id: number) => void;
}

export const DestinationRankCard: React.FC<Props> = ({ destination, onSelectProvince }) => {
  const navigate = useNavigate();
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [canExpandDesc, setCanExpandDesc] = useState<boolean>(false);

  useLayoutEffect(() => {
    const check = () => {
      if (!isDescExpanded && descRef.current) {
        setCanExpandDesc(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
      }
    };
    check();
    document.fonts?.ready?.then?.(check);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [destination.description, destination.tagline, isDescExpanded]);

  const handleDestinationClick = () => {
    if (onSelectProvince) {
      onSelectProvince(destination.id);
    }
  };

  return (
    <article className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-300 p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-3">
          <span
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 px-3 py-1 rounded-xl shadow-2xs ${destination.rank === 1
              ? 'bg-amber-400 text-amber-950 border border-amber-500 font-extrabold'
              : destination.rank === 2
                ? 'bg-slate-200 text-slate-800 border border-slate-300 font-bold'
                : destination.rank === 3
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 font-semibold'
              }`}
          >
            #{destination.rank}
          </span>
          <h2
            onClick={handleDestinationClick}
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight hover:text-emerald-800 transition-colors cursor-pointer truncate"
            title={destination.name}
          >
            {destination.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-800 pl-0.5">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span
            onClick={handleDestinationClick}
            className="hover:underline cursor-pointer truncate"
          >
            {destination.regionName}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 text-xs font-normal">{destination.totalPlaces || 0} địa điểm</span>
        </div>
      </div>

      <div
        onClick={handleDestinationClick}
        className="relative w-full h-72 sm:h-96 md:h-[380px] rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer shadow-inner"
      >
        {destination.imageUrl ? (
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover group-hover:opacity-85 transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 text-slate-400 gap-2">
            <ImageIcon className="w-12 h-12 text-slate-300" />
            <span className="text-xs font-medium">Chưa có hình ảnh đại diện</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
        <div className="md:col-span-2 space-y-4">
          {(destination.description || destination.tagline) && (
            <div className="space-y-1.5">
              <p
                ref={descRef}
                className={`text-slate-600 text-sm sm:text-base leading-relaxed ${!isDescExpanded ? 'line-clamp-3' : ''
                  }`}
              >
                {destination.description || destination.tagline}
              </p>
              {canExpandDesc && (
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
                >
                  <span>{isDescExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                  {isDescExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-1 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-start space-y-2">
          <div className="flex items-center gap-1.5">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {Number(destination.avgRating || 0).toFixed(1)}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            <span>({destination.totalReviews?.toLocaleString() || 0} đánh giá)</span>
          </p>
        </div>
      </div>

      {(destination.greatThingsToDo?.length > 0 || destination.awardWinningPlaces?.length > 0) && (
        <div className="pt-5 border-t border-slate-100 space-y-4">
          {destination.awardWinningPlaces && destination.awardWinningPlaces.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>Top địa điểm tại {destination.name}</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {destination.awardWinningPlaces.slice(0, 3).map((place) => (
                  <div
                    key={place.id}
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="group cursor-pointer rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-white p-2.5 flex items-center gap-3 transition-all"
                  >
                    <img
                      src={place.thumbnailUrl || '/placeholder.png'}
                      alt={place.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                        {place.name}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-bold text-slate-800">{Number(place.avgRating || 0).toFixed(1)}</span>
                        <span>({place.reviewCount || 0})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default DestinationRankCard;
