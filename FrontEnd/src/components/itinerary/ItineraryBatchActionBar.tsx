import React, { useState } from 'react'
import {
  CheckSquare,
  X,
  ArrowRight,
  ArrowDownToLine,
  Trash2,
  ChevronDown
} from 'lucide-react'

interface ItineraryBatchActionBarProps {
  selectedCount: number
  totalDays: number
  canEdit: boolean
  onClearSelection: () => void
  onBatchMoveToDay: (targetDayIdx: number) => void
  onBatchMoveToWishlist: () => void
  onBatchDelete: () => void
}

export const ItineraryBatchActionBar: React.FC<ItineraryBatchActionBarProps> = ({
  selectedCount,
  totalDays,
  canEdit,
  onClearSelection,
  onBatchMoveToDay,
  onBatchMoveToWishlist,
  onBatchDelete
}) => {
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false)

  if (selectedCount === 0 || !canEdit) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[92%] sm:w-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          <CheckSquare size={16} />
        </div>
        <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
          Đã chọn {selectedCount} địa điểm
        </span>
      </div>

      <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDayMenuOpen(!isDayMenuOpen)}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <ArrowRight size={13} className="text-emerald-400" />
            <span>Chuyển ngày</span>
            <ChevronDown size={12} />
          </button>

          {isDayMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-44 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-1 z-50 text-xs font-medium">
              {Array.from({ length: totalDays }).map((_, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  onClick={() => {
                    onBatchMoveToDay(dIdx)
                    setIsDayMenuOpen(false)
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                    N{dIdx + 1}
                  </span>
                  <span>Chuyển sang Ngày {dIdx + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onBatchMoveToWishlist}
          className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
          title="Chuyển các điểm đã chọn về Kho lưu trữ"
        >
          <ArrowDownToLine size={13} className="text-amber-400" />
          <span>Về Kho lưu</span>
        </button>

        <button
          type="button"
          onClick={onBatchDelete}
          className="px-2.5 sm:px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-red-500/30"
          title="Xóa tất cả các điểm đã chọn"
        >
          <Trash2 size={13} />
          <span>Xóa</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Bỏ chọn tất cả"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

export default ItineraryBatchActionBar
