import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface ExplorePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const ExplorePagination: React.FC<ExplorePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis-r', totalPages]
    if (currentPage >= totalPages - 3) return [1, 'ellipsis-l', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, 'ellipsis-l', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-r', totalPages]
  }

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1.5 pt-8 select-none">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label="Trang trước"
        className="px-3.5 py-2 rounded-lg bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px] flex items-center gap-1 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Trước</span>
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span key={`${item}-${idx}`} className="w-9 h-10 flex items-center justify-center text-slate-400">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            )
          }

          const isActive = currentPage === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Trang ${item}`}
              aria-current={isActive ? 'page' : undefined}
              className={`w-10 h-10 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${isActive
                ? 'bg-[#004f32] text-white'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
                }`}
            >
              {item}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label="Trang sau"
        className="px-3.5 py-2 rounded-lg bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px] flex items-center gap-1 transition-all"
      >
        <span className="hidden sm:inline">Sau</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
