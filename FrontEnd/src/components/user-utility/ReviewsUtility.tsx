import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Star,
  Search,
  X,
  MapPin,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { userService } from '@/services/userService'
import type { UserReviewItem } from '@/types/models/userProfile.model'

interface ReviewsUtilityProps {
  isDrawer?: boolean
  onClose?: () => void
}

export const ReviewsUtility: React.FC<ReviewsUtilityProps> = ({
  isDrawer = false,
  onClose
}) => {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getMyReviews({ pageSize: 50 })
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data)
      } else {
        setReviews([])
      }
    } catch {
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleSelectReview = (placeId: number) => {
    onClose?.()
    navigate(`/places/${placeId}`)
  }

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          r.placeName?.toLowerCase().includes(q) ||
          r.content?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [reviews, ratingFilter, searchQuery])

  return (
    <div className={`flex flex-col ${isDrawer ? 'flex-1 overflow-hidden' : 'space-y-5'}`}>
      {/* Top filter chips and search */}
      <div className={`flex flex-col gap-2.5 ${isDrawer ? 'px-4 py-3 border-b border-slate-200 bg-white' : 'pb-3 border-b border-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRatingFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${ratingFilter === 'all'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Tất cả ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => r.rating === stars).length
            return (
              <button
                key={stars}
                type="button"
                onClick={() => setRatingFilter(stars)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${ratingFilter === stars
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{stars}</span>
                <Star size={11} className="fill-current" />
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${ratingFilter === stars ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {!isDrawer && (
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đánh giá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={isDrawer ? 'p-4 flex-1 overflow-y-auto space-y-2.5' : ''}>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={26} className="animate-spin text-amber-600" />
            <span className="text-xs">Đang tải bài đánh giá...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <Star size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Chưa có bài đánh giá nào</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Chia sẻ cảm nhận, trải nghiệm và số sao đánh giá của bạn tại các địa điểm du lịch đã đến.
            </p>
            <Link
              to="/explore"
              onClick={onClose}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Khám phá và đánh giá</span>
            </Link>
          </div>
        ) : isDrawer ? (
          /* Drawer Compact Layout */
          <div className="space-y-2.5">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                onClick={() => handleSelectReview(rev.placeId)}
                className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs bg-white"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate flex-1">
                    {rev.placeName}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
                    <Star size={12} className="fill-current" />
                    <span>{rev.rating}</span>
                  </div>
                </div>
                {rev.content && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                    {rev.content}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="text-emerald-800 font-bold">Xem địa điểm →</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Full Page Grid Layout */
          <div className="space-y-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-800" />
                    <Link
                      to={`/places/${rev.placeId}`}
                      className="font-bold text-sm text-slate-900 hover:text-emerald-800 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{rev.placeName}</span>
                      <ExternalLink size={12} className="text-slate-400" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= rev.rating ? 'fill-current' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {rev.content && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {rev.content}
                  </p>
                )}

                {rev.images && rev.images.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {rev.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Ảnh review ${i + 1}`}
                        onClick={() => setSelectedPhoto(img)}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Photo Zoom */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] p-2 bg-white rounded-3xl shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
            >
              <X size={18} />
            </button>
            <img
              src={selectedPhoto}
              alt="Ảnh phóng to"
              className="max-h-[75vh] w-auto rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsUtility
