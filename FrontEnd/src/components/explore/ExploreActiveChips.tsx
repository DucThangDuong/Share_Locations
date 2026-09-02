import React from 'react'
import { X } from 'lucide-react'

export interface ActiveChipItem {
  label: string
  onRemove: () => void
}

interface ExploreActiveChipsProps {
  chips: ActiveChipItem[]
  onResetAll: () => void
}

export const ExploreActiveChips: React.FC<ExploreActiveChipsProps> = ({
  chips,
  onResetAll
}) => {
  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/70">
      <span className="text-xs font-bold text-slate-400 uppercase mr-1">
        Đang lọc:
      </span>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
        >
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            aria-label={`Xóa bộ lọc ${chip.label}`}
            className="w-4 h-4 flex items-center justify-center text-emerald-600 hover:text-emerald-900 cursor-pointer rounded-full hover:bg-emerald-100"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onResetAll}
        className="text-xs font-bold text-red-600 hover:underline cursor-pointer ml-auto"
      >
        Xóa tất cả
      </button>
    </div>
  )
}
