import React from 'react'
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'

interface ItineraryFilterBarProps {
  searchQuery: string
  isAllExpanded: boolean
  canEdit: boolean
  onSearchChange: (q: string) => void
  onToggleAllDays: () => void
  onAddNewDay: () => void
}

export const ItineraryFilterBar: React.FC<ItineraryFilterBarProps> = ({
  searchQuery,
  isAllExpanded,
  canEdit,
  onSearchChange,
  onToggleAllDays,
  onAddNewDay
}) => {
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
    </div>
  )
}

export default ItineraryFilterBar
