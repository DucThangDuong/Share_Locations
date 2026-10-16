import React, { useState, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import type { PlaceSummaryDto, LookupItemDto } from '@/types/models/place.model'
import { ExplorePlaceCard } from '@/components/explore/ExplorePlaceCard'

interface ProvincePlaceSectionProps {
  places: PlaceSummaryDto[]
  provinceName: string
  categories: LookupItemDto[]
  selectedCategoryId: number | null
  onSelectCategory: (id: number | null) => void
  loading?: boolean
}

const getResponsiveBatchSize = () => {
  if (typeof window === 'undefined') return 12
  const width = window.innerWidth
  if (width >= 1024) return 12
  if (width >= 768) return 9
  if (width >= 640) return 6
  return 6
}

export const ProvincePlaceSection: React.FC<ProvincePlaceSectionProps> = ({
  places,
  provinceName,
  categories,
  selectedCategoryId,
  onSelectCategory,
  loading = false
}) => {
  const [batchSize, setBatchSize] = useState<number>(getResponsiveBatchSize)
  const [visibleCount, setVisibleCount] = useState<number>(getResponsiveBatchSize)

  useEffect(() => {
    const handleResize = () => {
      const newBatch = getResponsiveBatchSize()
      setBatchSize(newBatch)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setVisibleCount(batchSize)
  }, [selectedCategoryId, provinceName, batchSize])

  const displayedPlaces = places.slice(0, visibleCount)
  const hasMore = places.length > visibleCount

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + batchSize)
  }

  return (
    <section className="my-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Địa Điểm Nổi Bật Tại {provinceName}
          </h2>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 ${selectedCategoryId === null
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border shrink-0 ${isSelected
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-white hover:bg-stone-100 hover:border-stone-300 text-stone-700 border-stone-200'
                  }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 bg-stone-200 rounded-2xl" />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">
            Chưa có địa điểm nào phù hợp
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Không tìm thấy địa điểm phù hợp với bộ lọc hiện tại ở {provinceName}.
          </p>
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedPlaces.map((place) => (
              <ExplorePlaceCard key={place.id} place={place} viewMode="grid" />
            ))}
          </div>

          {hasMore && (
            <div className="pt-6 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm shadow-xs hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-colors" />
                <span>Xem thêm địa điểm ({displayedPlaces.length}/{places.length})</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
