import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react'
import type { UserReviewItem } from '@/types/models/userProfile.model'

interface UserReviewsSectionProps {
  reviews: UserReviewItem[]
}

export const UserReviewsSection: React.FC<UserReviewsSectionProps> = ({
  reviews
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const ratingParam = searchParams.get('rating')
  const ratingFilter: number | 'all' =
    ratingParam && [1, 2, 3, 4, 5].includes(Number(ratingParam))
      ? Number(ratingParam)
      : 'all'

  const setRatingFilter = (val: number | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (val === 'all') {
      newParams.delete('rating')
    } else {
      newParams.set('rating', String(val))
    }
    setSearchParams(newParams, { replace: true })
  }

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter === 'all') return true
    return r.rating === ratingFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => setRatingFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${ratingFilter === 'all'
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${ratingFilter === stars
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-current" />
              <span>({count})</span>
            </button>
          )
        })}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Chưa có bài đánh giá nào
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Khám phá các địa điểm và viết cảm nhận chân thực để chia sẻ kinh nghiệm cùng cộng đồng du lịch nhé!
          </p>
          <Link
            to="/explore"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>Khám phá địa điểm ngay</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const thumbImg = rev.coverImg
            const photoList = rev.images || []

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    {thumbImg && (
                      <img
                        src={thumbImg}
                        alt={rev.placeName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div>
                      <Link
                        to={`/places/${rev.placeId}`}
                        className="text-sm font-bold text-slate-900 hover:text-emerald-800 transition-colors flex items-center gap-1.5"
                      >
                        <span>{rev.placeName}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        {rev.province && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{rev.province}</span>
                          </span>
                        )}
                        {rev.category && (
                          <>
                            <span>·</span>
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              {rev.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{rev.rating}.0 / 5.0</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </span>
                </div>

                {rev.content && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {rev.content}
                  </p>
                )}

                {photoList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {photoList.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                      >
                        <img src={photo} alt="Review" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <img src={selectedPhoto} alt="Review full" className="w-full h-full object-contain" />
            <button type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
