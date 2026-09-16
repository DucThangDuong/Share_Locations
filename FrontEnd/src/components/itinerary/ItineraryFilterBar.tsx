import React from 'react'
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal
} from 'lucide-react'

interface ItineraryFilterBarProps {
  searchQuery: string
  selectedArea: string
  selectedCategory: string
  availableAreas: string[]
  availableCategories: string[]
  isAllExpanded: boolean
  canEdit: boolean
  onSearchChange: (q: string) => void
  onSelectArea: (area: string) => void
  onSelectCategory: (cat: string) => void
  onResetFilters: () => void
  onToggleAllDays: () => void
  onAddNewDay: () => void
}

export const ItineraryFilterBar: React.FC<ItineraryFilterBarProps> = ({
  searchQuery,
  selectedArea,
  selectedCategory,
  availableAreas,
  availableCategories,
  isAllExpanded,
  canEdit,
  onSearchChange,
  onSelectArea,
  onSelectCategory,
  onResetFilters,
  onToggleAllDays,
  onAddNewDay
}) => {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedArea !== 'all' ||
    selectedCategory !== 'all'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm nhanh địa điểm, món ăn, kinh nghiệm du lịch..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleAllDays}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isAllExpanded ? (
              <>
                <ChevronUp size={14} />
                <span>Thu gọn tất cả</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>Mở rộng tất cả</span>
              </>
            )}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onAddNewDay}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Thêm ngày mới</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold mr-1">
            <SlidersHorizontal size={14} className="text-emerald-800" />
            <span>Khoanh vùng & Lọc:</span>
          </div>

          <div className="relative">
            <select
              value={selectedArea}
              onChange={(e) => onSelectArea(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer pr-7 transition-colors"
            >
              <option value="all">Tất cả khu vực (Khoanh vùng)</option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  📍 {area}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer pr-7 transition-colors"
            >
              <option value="all">Tất cả danh mục</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  🏷️ {cat}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1 text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItineraryFilterBar
