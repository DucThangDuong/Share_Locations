import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Utensils, Star, Clock } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { catalogService } from '@/services/catalogService'
import type { PlaceSummaryDto } from '@/types/models/place.model'

export const CuisineSection: React.FC = () => {
  const navigate = useNavigate()
  const [places, setPlaces] = useState<PlaceSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchCuisinePlaces = async () => {
      setIsLoading(true)
      try {
        let categoryId: number | undefined
        const catRes = await catalogService.getCategories()
        if (catRes.success && catRes.data) {
          const cuisineCat = catRes.data.find(
            (c) =>
              c.name.toLowerCase().includes('ẩm thực') ||
              c.name.toLowerCase().includes('quán ăn') ||
              c.name.toLowerCase().includes('món ngon')
          )
          if (cuisineCat) categoryId = cuisineCat.id
        }

        const res = await placeService.searchPlaces({
          categoryId,
          keyword: categoryId ? undefined : 'ẩm thực',
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

    fetchCuisinePlaces()
  }, [])

  const fallbackImage = 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&h=600&fit=crop&auto=format'

  if (!isLoading && places.length === 0) {
    return null
  }

  return (
    <section id="amthuc" className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 scroll-mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <span className="text-xs font-bold text-secondary-container uppercase tracking-widest bg-secondary-container/10 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5">
            <Utensils className="w-3 h-3" /> Hương vị bản địa
          </span>
          <h2 className="text-3xl md:text-4xl text-slate-900 font-extrabold tracking-tight mb-2">
            Ẩm thực 3 miền
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl">
            Mỗi món ăn là một câu chuyện văn hóa, hòa quyện giữa tinh hoa đất trời và bàn tay khéo léo của người Việt.
          </p>
        </div>

        <Link
          to="/explore?cat=Quán ăn"
          className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
        >
          Xem tất cả quán ngon &rarr;
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3 animate-pulse">
              <div className="aspect-4/3 rounded-xl skeleton-shimmer"></div>
              <div className="h-4 w-3/4 skeleton-shimmer rounded-md"></div>
              <div className="h-3 w-1/2 skeleton-shimmer rounded-md"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {places.map((place) => {
            const priceDisplay = place.minPrice && place.maxPrice
              ? `${place.minPrice.toLocaleString('vi-VN')}đ – ${place.maxPrice.toLocaleString('vi-VN')}đ`
              : place.minPrice
                ? `Từ ${place.minPrice.toLocaleString('vi-VN')}đ`
                : 'Giá bình dân'

            return (
              <div
                key={place.id}
                onClick={() => navigate(`/explore?q=${encodeURIComponent(place.name)}`)}
                className="group rounded-2xl overflow-hidden border border-slate-200/80 bg-white transition-colors duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
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
                  <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    {place.provinceName || place.regionName || 'Đặc sản'}
                  </span>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-bold text-slate-800">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{Number(place.avgRating || 0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                      {place.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-normal">
                      {place.description || place.address}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{place.openingHours || 'Mở cả ngày'}</span>
                    </span>
                    <span className="text-emerald-800 font-bold">
                      {priceDisplay}
                    </span>
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
