import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, Star } from 'lucide-react'
import { placeService } from '@/services/placeService'
import type { PlaceSummaryDto } from '@/types/models/place.model'

export const TopRatedPlacesSection: React.FC = () => {
  const navigate = useNavigate()
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchTopPlaces = async () => {
      setIsLoading(true)
      try {
        const res = await placeService.searchPlaces({
          pageSize: 4,
          sortBy: 'rating_desc'
        })
        if (res.success && res.data) {
          setPlaces(res.data)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopPlaces()
  }, [])

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=800&fit=crop&auto=format'

  if (!isLoading && places.length === 0) {
    return null
  }

  return (
    <section className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-container mb-1.5">
            <span>Được yêu thích nhất</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Điểm đến đánh giá cao nhất
          </h2>
        </div>

        <Link
          to="/explore?sort=rating_desc"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-3 animate-pulse">
              <div className="aspect-square rounded-lg skeleton-shimmer"></div>
              <div className="h-4 w-3/4 skeleton-shimmer rounded-md"></div>
              <div className="h-3 w-1/2 skeleton-shimmer rounded-md"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {places.map((place) => {
            const ratingScore = Number(place.avgRating || 0)
            const isSaved = savedIds.has(place.id)

            return (
              <div
                key={place.id}
                onClick={() => navigate(`/explore?q=${encodeURIComponent(place.name)}`)}
                className="group flex flex-col cursor-pointer select-none"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={place.thumbnailUrl || fallbackImage}
                    alt={place.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                    onError={(e) => {
                      ; (e.currentTarget as HTMLImageElement).src = fallbackImage
                    }}
                  />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none"></div>

                  <button
                    type="button"
                    onClick={(e) => toggleSave(place.id, e)}
                    aria-label={isSaved ? 'Bỏ lưu địa điểm' : 'Lưu địa điểm'}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center z-10 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-800 stroke-[2]'
                        }`}
                    />
                  </button>
                </div>

                <div className="pt-3 flex flex-col space-y-1.5">
                  <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug tracking-tight">
                    {place.name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{ratingScore > 0 ? ratingScore.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="text-slate-500 font-normal">
                      {place.reviewCount ? `${place.reviewCount} đánh giá` : 'Mới'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-medium">
                    {place.minPrice ? `Từ ${place.minPrice.toLocaleString('vi-VN')}đ` : place.provinceName || place.categoryName || 'Miễn phí'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
