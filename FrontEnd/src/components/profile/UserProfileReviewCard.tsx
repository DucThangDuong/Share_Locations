import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  ThumbsUp,
  MapPin,
  Calendar,
} from 'lucide-react'
import { userService } from '@/services/userService'
import type { UserReviewItem } from '@/types/models/userProfile.model'

interface UserProfileReviewCardProps {
  review: UserReviewItem & {
    authorName?: string
    authorAvatar?: string | null
    title?: string | null
    placeRating?: number
    placeReviewCount?: number
    likeCount?: number
    isLiked?: boolean
  }
  onImageClick?: (imgUrl: string) => void
  showToast?: (msg: string) => void
}

export const UserProfileReviewCard: React.FC<UserProfileReviewCardProps> = ({
  review,
  onImageClick,
  showToast = () => { }
}) => {
  const [isLiked, setIsLiked] = useState(Boolean(review.isLiked))
  const [likeCount, setLikeCount] = useState(review.likeCount ?? 0)

  const handleLike = async () => {
    try {
      const res = await userService.toggleReviewLike(review.id)
      if (res.success && res.data) {
        setIsLiked(res.data.isLiked)
        setLikeCount(res.data.likeCount)
        showToast(res.data.isLiked ? 'Đã thích bài đánh giá!' : 'Đã bỏ thích bài đánh giá')
      }
    } catch {
      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1))
    }
  }

  const ratingValue = review.rating || 5

  const reviewDateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('vi-VN', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
    : 'Gần đây'

  const authorAvatar =
    review.authorAvatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
  const authorName = review.authorName || 'Người dùng'

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
      {/* ── TOP HEADER: Author + Date + Star Rating Badge ── */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">
              {authorName}
            </div>
            <div className="text-xs text-slate-400 font-medium">{reviewDateStr}</div>
          </div>
        </div>

        {/* Star Rating Badge (as shown in reference image) */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs shrink-0">
          <Star size={14} className="fill-amber-400 text-amber-500" />
          <span>{ratingValue}</span>
        </div>
      </div>

      {/* ── 5 STARS RATING ROW ── */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const isFilled = starIndex <= ratingValue
            return (
              <Star
                key={starIndex}
                size={16}
                className={
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-100 text-slate-200'
                }
              />
            )
          })}
        </div>
        <span className="text-xs font-bold text-amber-700 ml-1">{ratingValue}.0 / 5</span>
      </div>

      {/* ── REVIEW TITLE ── */}
      {review.title && (
        <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">
          {review.title}
        </h3>
      )}

      {/* ── REVIEW CONTENT / QUOTE ── */}
      {review.content && (
        <p className="text-slate-700 text-sm leading-relaxed mb-3 whitespace-pre-line font-normal">
          {review.content}
        </p>
      )}

      {/* ── DATE OF EXPERIENCE ── */}
      {review.visitDate && (
        <div className="text-xs text-slate-500 font-medium mb-3.5 flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <span>
            <strong>Ngày trải nghiệm:</strong>{' '}
            {new Date(review.visitDate).toLocaleDateString('vi-VN', {
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
      )}

      {/* ── REVIEW IMAGES (IF ANY) ── */}
      {review.images && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {review.images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => onImageClick && onImageClick(img)}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-2xs group/img"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-white/0 group-hover/img:bg-white/15 transition-colors duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* ── EMBEDDED MINI PLACE CARD ── */}
      <div className="mt-3 mb-4 p-3 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/90 transition-colors flex items-center justify-between gap-3 group">
        <Link
          to={`/places/${review.placeId}`}
          className="flex items-center gap-3.5 min-w-0 flex-1"
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0">
            <img
              src={
                review.coverImg ||
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=160&h=160&fit=crop'
              }
              alt={review.placeName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
              {review.placeName}
            </h4>

            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  {review.placeRating ? Number(review.placeRating).toFixed(1) : '4.8'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                ({(review.placeReviewCount || 128).toLocaleString()})
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              <MapPin size={11} className="text-slate-400 shrink-0" />
              <span className="truncate">{review.province || review.address || 'Việt Nam'}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── FOOTER ACTIONS (HELPFUL) ── */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={handleLike}
          className={`inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${isLiked
            ? 'text-emerald-700 bg-emerald-50 font-bold'
            : 'hover:bg-slate-100 text-slate-600'
            }`}
        >
          <ThumbsUp size={14} className={isLiked ? 'text-emerald-600 fill-emerald-600' : ''} />
          <span>Hữu ích</span>
          {likeCount > 0 && <span className="text-slate-500 font-normal">({likeCount})</span>}
        </button>
      </div>
    </div>
  )
}
