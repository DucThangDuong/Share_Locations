import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Star,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import type { RankingPlaceItem } from '@/types/ranking';

interface Props {
  place: RankingPlaceItem;
}

export const RankingPlaceCard: React.FC<Props> = ({ place }) => {
  const navigate = useNavigate();
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isReviewExpanded, setIsReviewExpanded] = useState<boolean>(false);

  const descRef = useRef<HTMLParagraphElement>(null);
  const reviewRef = useRef<HTMLParagraphElement>(null);
  const [canExpandDesc, setCanExpandDesc] = useState<boolean>(false);
  const [canExpandReview, setCanExpandReview] = useState<boolean>(false);

  useLayoutEffect(() => {
    const check = () => {
      if (!isDescExpanded && descRef.current) {
        setCanExpandDesc(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
      }
      if (!isReviewExpanded && reviewRef.current) {
        setCanExpandReview(reviewRef.current.scrollHeight > reviewRef.current.clientHeight + 2);
      }
    };
    check();
    document.fonts?.ready?.then?.(check);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [place.description, place.featuredReview?.content, isDescExpanded, isReviewExpanded]);

  const handleCardClick = () => {
    navigate(`/places/${place.id}`);
  };

  return (
    <article className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-300 p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-3">
          <span
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 px-3 py-1 rounded-xl shadow-2xs ${place.rank === 1
              ? 'bg-amber-400 text-amber-950 border border-amber-500 font-extrabold'
              : place.rank === 2
                ? 'bg-slate-200 text-slate-800 border border-slate-300 font-bold'
                : place.rank === 3
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 font-semibold'
              }`}
          >
            #{place.rank}
          </span>
          <h2
            onClick={handleCardClick}
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight hover:text-emerald-800 transition-colors cursor-pointer truncate"
            title={place.name}
          >
            {place.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-800 pl-0.5">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span
            onClick={handleCardClick}
            className="hover:underline cursor-pointer truncate"
          >
            {place.address || place.provinceName}
          </span>
        </div>
      </div>

      <div
        onClick={handleCardClick}
        className="relative w-full h-72 sm:h-96 md:h-[380px] rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer shadow-inner"
      >
        {place.coverImageUrl ? (
          <img
            src={place.coverImageUrl}
            alt={place.name}
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
          {place.description && (
            <div className="space-y-1.5">
              <p
                ref={descRef}
                className={`text-slate-600 text-sm sm:text-base leading-relaxed ${!isDescExpanded ? 'line-clamp-3' : ''
                  }`}
              >
                {place.description}
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
              {Number(place.avgRating || 0).toFixed(1)}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            <span className="underline cursor-pointer hover:text-emerald-700">
              ({place.reviewCount?.toLocaleString() || 0} đánh giá)
            </span>
          </p>
        </div>
      </div>

      {place.featuredReview && (
        <div className="pt-5 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(place.featuredReview?.rating || 5)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 fill-slate-200'
                    }`}
                />
              ))}
            </div>

            <p
              ref={reviewRef}
              className={`text-slate-700 text-xs sm:text-sm leading-relaxed ${!isReviewExpanded ? 'line-clamp-2' : ''
                }`}
            >
              "{place.featuredReview.content}"
            </p>

            {canExpandReview && (
              <button
                onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
              >
                <span>{isReviewExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                {isReviewExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                  {place.featuredReview.authorAvatar ? (
                    <img
                      src={place.featuredReview.authorAvatar}
                      alt={place.featuredReview.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <span className="font-bold text-slate-800">
                  {place.featuredReview.authorName}
                </span>
              </div>
              {Boolean(place.featuredReview.likesCount) && (
                <span className="text-[11px] text-slate-400">
                  {place.featuredReview.likesCount} lượt hữu ích
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default RankingPlaceCard;
