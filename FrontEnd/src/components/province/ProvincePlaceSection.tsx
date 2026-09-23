import React, { useState, useEffect } from 'react'
import { LayoutGrid, List, MapPin, ChevronDown } from 'lucide-react'
import type { PlaceSummaryDto, LookupItemDto } from '@/types/models/place.model'
import { ExplorePlaceCard } from '@/components/explore/ExplorePlaceCard'

interface ProvincePlaceSectionProps {
  places: PlaceSummaryDto[]
  provinceName: string
  categories: LookupItemDto[]
  selectedCategoryId: number | null
  onSelectCategory: (id: number | null) => void
  sortBy: string
  onSortChange: (sort: string) => void
  loading?: boolean
}

const getResponsiveBatchSize = () => {
  if (typeof window === 'undefined') return 12
  const width = window.innerWidth
  if (width >= 1024) return 12 // 4 columns x 3 rows = 12
  if (width >= 768) return 9   // 3 columns x 3 rows = 9
  if (width >= 640) return 6   // 2 columns x 3 rows = 6
  return 6                     // 1 column x 6 rows = 6
}

export const ProvincePlaceSection: React.FC<ProvincePlaceSectionProps> = ({
  places,
  provinceName,
  categories,
  selectedCategoryId,
  onSelectCategory,
  sortBy,
  onSortChange,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

  // Reset visible count when category, sort, province or batch size changes
  useEffect(() => {
    setVisibleCount(batchSize)
  }, [selectedCategoryId, sortBy, provinceName, batchSize])

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

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-700 focus:outline-hidden pr-2 cursor-pointer"
            >
              <option value="rating">Đánh giá cao nhất</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
            </select>
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
                }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
                }`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
      ) : viewMode === 'grid' ? (
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
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {displayedPlaces.map((place) => (
              <ExplorePlaceCard key={place.id} place={place} viewMode="list" />
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
