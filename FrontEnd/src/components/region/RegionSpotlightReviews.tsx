import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Award, Navigation, ThumbsUp, CheckCircle2 } from 'lucide-react'
import type { RegionSpotlight, RegionReview } from '@/types/models/region.model'

interface RegionSpotlightReviewsProps {
  spotlight?: RegionSpotlight | null
  reviews?: RegionReview[]
}

export const RegionSpotlightReviews: React.FC<RegionSpotlightReviewsProps> = ({
  spotlight,
  reviews = []
}) => {
  const navigate = useNavigate()

  const handleOpenSpotlightMap = () => {
    if (spotlight?.coordinates && spotlight.coordinates.length >= 2) {
      navigate(`/map?lat=${spotlight.coordinates[0]}&lng=${spotlight.coordinates[1]}&zoom=14&highlight=${encodeURIComponent(spotlight.title)}`)
    } else if (spotlight?.title) {
      navigate(`/map?q=${encodeURIComponent(spotlight.title)}`)
    }
  }

  const handleOpenReviewMap = (review: RegionReview) => {
    if (review.coordinates && review.coordinates.length >= 2) {
      navigate(`/map?lat=${review.coordinates[0]}&lng=${review.coordinates[1]}&zoom=15&highlight=${encodeURIComponent(review.placeName)}`)
    } else {
      navigate(`/map?q=${encodeURIComponent(review.placeName)}`)
    }
  }

  if (!spotlight && (!reviews || reviews.length === 0)) return null

  return (
    <section className="my-10">
      {spotlight && (
        <div className="rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 text-white relative shadow-xl mb-10">
          <div className="absolute inset-0 z-0">
            <img
              src={spotlight.bannerUrl || ''}
              alt={spotlight.title}
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Tiêu Điểm Điểm Đến Nổi Bật</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
              {spotlight.title}
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 font-medium mb-4 leading-relaxed">
              {spotlight.subtitle}
            </p>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-6">
              {spotlight.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-stone-800 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-black leading-none">{(spotlight.avgRating || 0).toFixed(1)} / 5.0</div>
                  <div className="text-[11px] text-stone-400 mt-1">Đánh giá trung bình</div>
                </div>
              </div>

              <div className="h-8 w-px bg-stone-800" />

              <div>
                <div className="text-lg font-black leading-none">{(spotlight.totalReviews || 0).toLocaleString()}+</div>
                <div className="text-[11px] text-stone-400 mt-1">Lượt review chân thực</div>
              </div>
            </div>

            {spotlight.highlights && spotlight.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {spotlight.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    {h}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleOpenSpotlightMap}
              className="px-6 py-3 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/40 active-press"
            >
              <Navigation className="w-4 h-4" />
              <span>Khám phá tiêu điểm trên Bản đồ</span>
            </button>
          </div>
        </div>
      )}

      {reviews && reviews.length > 0 && (
        <>
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Đánh Giá Thực Tế Từ Cộng Đồng
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Trải nghiệm chân thực và những gợi ý không thể bỏ qua từ các thành viên LangThang
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      {rev.reviewerAvatar ? (
                        <img
                          src={rev.reviewerAvatar}
                          alt={rev.reviewerName}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {rev.reviewerName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                          {rev.reviewerName}
                        </h4>
                        <span className="text-[11px] text-stone-400">{rev.visitDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>

                  <div className="mb-2.5 p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center gap-1.5 text-xs font-bold text-[#C0392B]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{rev.placeName}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed line-clamp-4">
                    "{rev.content}"
                  </p>

                  {rev.images && rev.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3.5">
                      {rev.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="aspect-4/3 rounded-xl overflow-hidden bg-stone-100 relative group">
                          <img
                            src={imgUrl}
                            alt="User review"
                            className="w-full h-full object-cover transition-opacity duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-stone-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{rev.likesCount || 0} hữu ích</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReviewMap(rev)}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-[#2D6A4F] text-stone-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active-press"
                  >
                    <Navigation className="w-3 h-3 text-[#2D6A4F] hover:text-white" />
                    <span>Đến ghim địa điểm này trên Map</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
