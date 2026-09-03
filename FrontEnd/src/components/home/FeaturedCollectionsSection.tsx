import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { catalogService } from '@/services/catalogService'
import type { CollectionDto } from '@/types/models/place.model'

export const FeaturedCollectionsSection: React.FC = () => {
  const [collections, setCollections] = useState<CollectionDto[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadFeaturedCollections = async () => {
      setIsLoading(true)
      try {
        const res = await catalogService.getFeaturedCollections(6)
        if (res.success && res.data) {
          setCollections(res.data)
        }
      } catch {
      } finally {
        setIsLoading(false)
      }
    }
    loadFeaturedCollections()
  }, [])

  if (!isLoading && collections.length === 0) {
    return null
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&h=600&fit=crop&auto=format'

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-container mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi ý độc quyền</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Bộ sưu tập điểm đến nổi bật
            </h2>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <span>Xem tất cả bộ sưu tập</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[380px] rounded-3xl bg-slate-200/60 animate-pulse skeleton-shimmer"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((col) => (
              <Link
                key={col.id}
                to={`/explore?q=${encodeURIComponent(col.title)}`}
                className="group relative h-[380px] rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-end p-6 border border-slate-200/60"
              >
                <img
                  src={col.coverUrl || fallbackImage}
                  alt={col.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = fallbackImage
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent"></div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none z-10"></div>

                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-slate-950 text-[10px] font-black tracking-wider uppercase">
                      Bộ sưu tập tuyển chọn
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">
                      {col.placeCount > 0 ? `${col.placeCount} địa điểm` : 'Nhiều điểm đến'}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors">
                    {col.title}
                  </h3>

                  {col.description && (
                    <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed font-normal">
                      {col.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                    <span>Khám phá ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
