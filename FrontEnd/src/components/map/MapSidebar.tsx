import React, { useState, useMemo } from 'react'
import {
  Search,
  MapPin,
  Star,
  Layers,
  Loader2,
  SlidersHorizontal,
  X,
  ChevronLeft
} from 'lucide-react'
import type { PlaceMapItemDto, LookupItemDto, RegionLookupDto } from '@/types/models/place.model'
import { MapFilterSidebar } from './MapFilterSidebar'

interface MapSidebarProps {
  places: PlaceMapItemDto[]
  loading: boolean
  searchKeyword: string
  categories: LookupItemDto[]
  regions: RegionLookupDto[]
  selectedCategoryId: number
  selectedProvinceId: number
  activePlace: PlaceMapItemDto | null
  mobileView?: 'map' | 'list'
  isOpen: boolean
  onToggleSidebar: () => void
  onSearchChange: (keyword: string) => void
  onCategoryChange: (categoryId: number) => void
  onProvinceChange: (provinceId: number) => void
  onResetFilters: () => void
  onSelectPlace: (place: PlaceMapItemDto) => void
}

export const MapSidebar: React.FC<MapSidebarProps> = ({
  places,
  loading,
  searchKeyword,
  categories,
  regions,
  selectedCategoryId,
  selectedProvinceId,
  activePlace,
  mobileView = 'map',
  isOpen,
  onToggleSidebar,
  onSearchChange,
  onCategoryChange,
  onProvinceChange,
  onResetFilters,
  onSelectPlace
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  const allProvinces = useMemo(
    () => regions.flatMap((r) => r.provinces || []),
    [regions]
  )

  const activeProvince = useMemo(
    () => allProvinces.find((p) => p.id === selectedProvinceId),
    [allProvinces, selectedProvinceId]
  )

  const activeFilterCount = (selectedCategoryId > 0 ? 1 : 0) + (selectedProvinceId > 0 ? 1 : 0)

  if (!isOpen && mobileView !== 'list') {
    return null
  }

  return (
    <div
      className={`relative w-full md:w-[40%] xl:w-[38%] md:min-w-[380px] md:max-w-[540px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 overflow-hidden shadow-lg transition-all duration-300 ${
        mobileView === 'map' ? (isOpen ? 'flex' : 'hidden') : 'flex'
      }`}
    >
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm địa điểm, tỉnh thành..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 shadow-2xs text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-label="Mở bộ lọc tìm kiếm"
            title="Mở bộ lọc tìm kiếm"
            className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
              activeFilterCount > 0 || isFilterOpen
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Collapse sidebar button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Đóng giao diện bộ lọc"
            title="Đóng giao diện bộ lọc (toàn màn hình map)"
            className="hidden md:inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Horizontal Quick Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onCategoryChange(0)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 0
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => onCategoryChange(isSelected ? 0 : cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white font-bold shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 shadow-2xs'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-slate-400 font-medium">Đang lọc:</span>
            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                <span>{activeCategory.name}</span>
                <button
                  type="button"
                  onClick={() => onCategoryChange(0)}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeProvince && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                <MapPin className="w-2.5 h-2.5 text-emerald-700" />
                <span>{activeProvince.name}</span>
                <button
                  type="button"
                  onClick={() => onProvinceChange(0)}
                  className="hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-slate-400 hover:text-rose-600 underline font-medium ml-1 cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Place Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-800" />
            <span className="text-xs">Đang tải dữ liệu bản đồ...</span>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center gap-2">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">Không tìm thấy địa điểm nào</p>
            <p className="text-slate-400 max-w-xs">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc tỉnh thành/danh mục.
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors shadow-2xs cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          places.map((place) => {
            const isSelected = activePlace?.id === place.id
            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {place.imageUrl ? (
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-200/70"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 shrink-0 border border-slate-200/70">
                    <MapPin className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide truncate">
                        {place.category || 'Địa điểm'}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{place.avgRating}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate mt-0.5">{place.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>{place.address}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                    <span className="font-semibold text-emerald-800">{place.price || 'Miễn phí'}</span>
                    <span className="text-slate-400">{place.reviewCount || 0} đánh giá</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Filter Overlay Drawer */}
      <MapFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        regions={regions}
        selectedCategoryId={selectedCategoryId}
        selectedProvinceId={selectedProvinceId}
        onSelectCategory={onCategoryChange}
        onSelectProvince={onProvinceChange}
        onResetFilters={onResetFilters}
      />
    </div>
  )
}
