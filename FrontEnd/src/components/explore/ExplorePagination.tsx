import React from 'react'

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

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label="Trang trước"
        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
      >
        Trước
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          aria-label={`Đi tới trang ${num}`}
          className={`w-11 h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === num
            ? 'bg-primary text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
        >
          {num}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label="Trang tiếp theo"
        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
      >
        Sau
      </button>
    </div>
  )
}
