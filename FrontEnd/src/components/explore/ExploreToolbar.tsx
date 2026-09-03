import React, { useState } from 'react'
import { ChevronDown, CheckCircle2, Grid3x3, List } from 'lucide-react'
import { SORT_OPTIONS } from './explore.types'

interface ExploreToolbarProps {
  totalElements: number
  sortBy: string
  onSortChange: (newSort: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export const ExploreToolbar: React.FC<ExploreToolbarProps> = ({
  totalElements,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange
}) => {
  const [sortOpen, setSortOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-lg border border-slate-200/70">
      <div className="text-xs text-slate-500 font-medium">
        Tìm thấy <strong className="text-slate-900 font-bold">{totalElements}</strong> địa điểm
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            aria-expanded={sortOpen}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer min-h-[36px]"
          >
            <span>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Được đề xuất hàng đầu'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-lg border border-slate-100 py-1.5 z-30 animate-in zoom-in-95">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSortChange(opt.value)
                    setSortOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${sortBy === opt.value
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.value && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => onViewModeChange('grid')}
            aria-label="Chế độ xem dạng lưới"
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${viewMode === 'grid'
              ? 'bg-white text-primary font-bold'
              : 'text-slate-400 hover:text-slate-700'
              }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            aria-label="Chế độ xem dạng danh sách"
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${viewMode === 'list'
              ? 'bg-white text-primary font-bold'
              : 'text-slate-400 hover:text-slate-700'
              }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
