import React, { useRef, useState } from 'react'
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react'

interface ExploreSearchBarProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (val?: string) => void
  suggestions: string[]
}

export const ExploreSearchBar: React.FC<ExploreSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  suggestions
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setShowSuggestions(false)
          onSubmit(value)
        }}
        className="relative bg-white rounded-lg border border-slate-200/90 hover:border-slate-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all flex items-center pr-2"
      >
        <Search className="w-5 h-5 text-slate-400 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          value={value}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-100 p-2 z-50 animate-in zoom-in-95 duration-100 text-slate-800">
          <div className="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gợi ý tìm kiếm</span>
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={() => {
                onChange(item)
                setShowSuggestions(false)
                onSubmit(item)
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-emerald-50 hover:text-primary rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">{item}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
