import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { catalogService } from '@/services/catalogService'
import type { PlaceTypeDto } from '@/types/models/place.model'

export const PlaceTypeQuickNav: React.FC = () => {
  const [placeTypes, setPlaceTypes] = useState<PlaceTypeDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadPlaceTypes = async () => {
      setIsLoading(true)
      try {
        const res = await catalogService.getPlaceTypes()
        if (res.success && res.data) {
          setPlaceTypes(res.data)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }
    loadPlaceTypes()
  }, [])

  if (!isLoading && placeTypes.length === 0) {
    return null
  }

  return (
    <section className="py-10 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bạn đang tìm kiếm điều gì?
            </h2>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <span>Xem tất cả trải nghiệm</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="aspect-[4/3] rounded-lg skeleton-shimmer"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {placeTypes.map((item) => {
              const hasImage = Boolean(item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/')))

              return (
                <Link
                  key={item.id}
                  to={`/explore?placeTypeId=${item.id}&q=${encodeURIComponent(item.name)}`}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 select-none block bg-slate-900"
                >
                  {hasImage ? (
                    <img
                      src={item.imageUrl!}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 flex items-center justify-center">
                      <Compass className="w-10 h-10 text-white/25 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent group-hover:from-slate-950/90 transition-colors duration-300"></div>

                  <div className="absolute bottom-0 inset-x-0 p-3 sm:p-3.5 flex flex-col justify-end text-center">
                    <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-white tracking-tight drop-shadow-md line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
