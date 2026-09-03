import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Star, MapPin, ArrowRight } from 'lucide-react'
import { placeService } from '@/services/placeService'
import type { PlaceSummaryDto } from '@/types/models/place.model'

export const TopRatedPlacesSection: React.FC = () => {
  const navigate = useNavigate()
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchTopPlaces = async () => {
      setIsLoading(true)
      try {
        const res = await placeService.searchPlaces({
          pageSize: 6,
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

  const fallbackImage = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=500&fit=crop&auto=format'

  if (!isLoading && places.length === 0) {
    return null
  }

  return (
    <section className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-container mb-1.5">
            <Award className="w-3.5 h-3.5" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-3xl bg-white p-4 border border-slate-200/60 space-y-3 animate-pulse">
              <div className="aspect-16/10 rounded-2xl skeleton-shimmer"></div>
              <div className="h-4 w-3/4 skeleton-shimmer rounded-md"></div>
              <div className="h-3 w-1/2 skeleton-shimmer rounded-md"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place) => (
            <div
              key={place.id}
              onClick={() => navigate(`/explore?q=${encodeURIComponent(place.name)}`)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 transition-colors duration-300 flex flex-col cursor-pointer"
            >
              <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                <img
                  src={place.thumbnailUrl || fallbackImage}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = fallbackImage
                  }}
                />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none"></div>
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {place.categoryName && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                      {place.categoryName}
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-slate-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(place.avgRating || 0).toFixed(1)}</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 space-y-2.5">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{place.provinceName ? `${place.provinceName}, ${place.regionName}` : place.address}</span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                  {place.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                  {place.description || place.address}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
                  <span className="text-slate-400">
                    {place.reviewCount > 0 ? `${place.reviewCount} đánh giá` : 'Mới cập nhật'}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {place.minPrice ? `Từ ${place.minPrice.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
