import React, { useRef } from 'react'
import { Search, X } from 'lucide-react'

interface ExploreSearchBarProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (val?: string) => void
}

export const ExploreSearchBar: React.FC<ExploreSearchBarProps> = ({
  value,
  onChange,
  onSubmit
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(value)
        }}
        className="relative bg-white rounded-lg border border-slate-200/90 hover:border-slate-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all flex items-center pr-2"
      >
        <Search className="w-5 h-5 text-slate-400 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tìm kiếm theo tên địa điểm, tỉnh thành, món ăn đặc sản...."
          aria-label="Tìm kiếm địa điểm"
          className="w-full h-13 sm:h-14 pl-12 sm:pl-14 pr-12 text-sm sm:text-base rounded-lg bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              searchInputRef.current?.focus()
            }}
            aria-label="Xóa từ khóa tìm kiếm"
            className="w-8 h-8 mr-1 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 active-press hidden sm:inline-flex items-center gap-1.5"
        >
          <span>Tìm kiếm</span>
        </button>
      </form>
    </div>
  )
}
