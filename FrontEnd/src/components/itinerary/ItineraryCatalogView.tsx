import React, { useState } from 'react'
import {
  Search,
  Star,
  X,
  CheckCircle2,
  Eye,
  Check,
  Compass,
  Plus
} from 'lucide-react'
import type { DetailedItineraryItem } from '@/types/models/itinerary.model'
import { ItineraryQuickPreviewModal } from './ItineraryQuickPreviewModal'

interface ItineraryCatalogViewProps {
  itineraries: DetailedItineraryItem[]
  searchQuery: string
  selectedRegion: string
  selectedDuration: string
  appliedItineraryIds?: Set<number>
  onSearchChange: (q: string) => void
  onClearSearch: () => void
  onSelectRegion: (reg: string) => void
  onSelectDuration: (dur: string) => void
  onApplyItinerary?: (itinerary: DetailedItineraryItem) => void
  onQuickPreview?: (itinerary: DetailedItineraryItem) => void
}

const REGIONS = ['all', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Tây Nguyên']
const DURATIONS = [
  { id: 'all', label: 'Tất cả thời lượng' },
  { id: '1', label: '1 Ngày' },
  { id: '2', label: '2N1Đ' },
  { id: '3', label: '3N2Đ' },
  { id: '4', label: '4N3Đ' },
  { id: '5', label: '5N+' }
]

export const ItineraryCatalogView: React.FC<ItineraryCatalogViewProps> = ({
  itineraries,
  searchQuery,
  selectedRegion,
  selectedDuration,
  appliedItineraryIds = new Set(),
  onSearchChange,
  onClearSearch,
  onSelectRegion,
  onSelectDuration,
  onApplyItinerary,
  onQuickPreview
}) => {
  const [previewItem, setPreviewItem] = useState<DetailedItineraryItem | null>(null)

  const handleOpenPreview = (itinerary: DetailedItineraryItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (onQuickPreview) {
      onQuickPreview(itinerary)
    } else {
      setPreviewItem(itinerary)
    }
  }

  const handleApply = (itinerary: DetailedItineraryItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (onApplyItinerary) {
      onApplyItinerary(itinerary)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Khám phá lịch trình
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tổng hợp các lộ trình du lịch tối ưu thời gian, ngân sách và tuyến đường từ cộng đồng.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Tìm theo tỉnh thành, tên chuyến đi..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-900 outline-none transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {REGIONS.map((reg) => (
            <button
              type="button"
              key={reg}
              onClick={() => onSelectRegion(reg)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${selectedRegion === reg
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              {reg === 'all' ? 'Tất cả vùng miền' : reg}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {DURATIONS.map((dur) => (
            <button
              type="button"
              key={dur.id}
              onClick={() => onSelectDuration(dur.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedDuration === dur.id
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                  : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
            >
              {dur.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {itineraries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <Compass size={36} className="text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Không tìm thấy chuyến đi nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy thử điều chỉnh lại bộ lọc vùng miền hoặc tìm kiếm với từ khóa khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => {
              const isApplied = appliedItineraryIds.has(itinerary.id)
              const totalStops = itinerary.days.reduce(
                (sum, d) => sum + d.stops.length,
                0
              )

              return (
                <div
                  key={itinerary.id}
                  onClick={() => handleOpenPreview(itinerary)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-600/70 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {itinerary.authorAvatar ? (
                          <img
                            src={itinerary.authorAvatar}
                            alt={itinerary.authorName}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {itinerary.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {itinerary.authorName}
                            </span>
                            <CheckCircle2
                              size={15}
                              className="text-emerald-500 fill-emerald-100 shrink-0"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            {itinerary.rating > 0 ? (
                              <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <Star
                                  size={12}
                                  className="fill-amber-400 text-amber-500 shrink-0"
                                />
                                <span>{itinerary.rating.toFixed(1)}</span>
                                <span className="text-slate-400 font-normal">
                                  ({itinerary.reviewCount} Reviews)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Mới đề xuất</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                        {itinerary.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {itinerary.description}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-3 sm:p-3.5 border border-slate-200/80 grid grid-cols-2 divide-x divide-slate-200">
                      <div className="pr-3 min-w-0">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 block truncate">
                          {itinerary.province}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                          {itinerary.durationDays} NGÀY {itinerary.nightsCount} ĐÊM • {totalStops} ĐIỂM
                        </span>
                      </div>

                      <div className="pl-3 sm:pl-4 min-w-0">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-800 block truncate">
                          {itinerary.estimatedBudget.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                          CHI PHÍ ƯỚC TÍNH
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleOpenPreview(itinerary, e)}
                        className="px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye size={13} className="text-slate-500" />
                        <span>Xem sơ qua</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleApply(itinerary, e)}
                        className={`px-3 py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${isApplied
                            ? 'bg-emerald-900 text-white hover:bg-emerald-950'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                          }`}
                      >
                        {isApplied ? (
                          <>
                            <Check size={13} strokeWidth={3} className="text-emerald-300" />
                            <span>Đã áp dụng</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} strokeWidth={2.5} />
                            <span>Áp dụng chuyến đi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ItineraryQuickPreviewModal
        isOpen={Boolean(previewItem)}
        itinerary={previewItem}
        isApplied={previewItem ? appliedItineraryIds.has(previewItem.id) : false}
        onClose={() => setPreviewItem(null)}
        onApply={(it) => {
          if (onApplyItinerary) onApplyItinerary(it)
        }}
      />
    </div>
  )
}

export default ItineraryCatalogView
