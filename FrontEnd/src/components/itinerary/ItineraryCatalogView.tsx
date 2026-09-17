import React, { useState, useEffect, useMemo } from 'react'
import {
  CheckCircle2,
  Compass,
  MapPin,
  Clock,
  DollarSign,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import type { ItineraryDto } from '@/types/models/itinerary.model'
import type { ProvinceDto } from '@/types/models/geography.model'
import { geographyService } from '@/services/geographyService'
import { ItineraryQuickPreviewModal } from './ItineraryQuickPreviewModal'
import type { DetailedItineraryItem } from '@/types/models/itinerary.model'

interface ItineraryCatalogViewProps {
  itineraries: ItineraryDto[]
  searchQuery: string
  selectedRegion: string | null
  selectedProvince: string | null
  selectedDuration: string
  selectedBudget: string
  appliedItineraryIds?: Set<number>
  onSelectRegion: (reg: string | null) => void
  onSelectProvince: (prov: string | null) => void
  onSelectDuration: (dur: string) => void
  onSelectBudget: (budget: string) => void
  onResetFilters: () => void
  onApplyItinerary?: (itinerary: ItineraryDto) => void
  onQuickPreview?: (itinerary: ItineraryDto) => void
}

const DURATIONS = [
  { id: 'all', label: 'Tất cả thời lượng' },
  { id: '1', label: '1 Ngày' },
  { id: '2', label: '2N1Đ' },
  { id: '3', label: '3N2Đ' },
  { id: '4', label: '4N3Đ' },
  { id: '5', label: '5N+' }
]

const BUDGETS = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'under1m', label: 'Dưới 1 triệu' },
  { id: '1m-3m', label: '1 - 3 triệu' },
  { id: '3m-5m', label: '3 - 5 triệu' },
  { id: 'above5m', label: 'Trên 5 triệu' }
]

export const ItineraryCatalogView: React.FC<ItineraryCatalogViewProps> = ({
  itineraries,
  searchQuery,
  selectedRegion,
  selectedProvince,
  selectedDuration,
  selectedBudget,
  appliedItineraryIds = new Set(),
  onSelectRegion,
  onSelectProvince,
  onSelectDuration,
  onSelectBudget,
  onResetFilters,
  onApplyItinerary,
  onQuickPreview
}) => {
  const [previewItem, setPreviewItem] = useState<DetailedItineraryItem | null>(null)
  const [provinces, setProvinces] = useState<ProvinceDto[]>([])

  useEffect(() => {
    let isMounted = true
    geographyService.getProvinces()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setProvinces(res.data)
        }
      })
      .catch(() => { })

    return () => {
      isMounted = false
    }
  }, [])

  const regions = useMemo(() => {
    const list: string[] = []
    provinces.forEach((p) => {
      if (p.regionName && !list.includes(p.regionName)) {
        list.push(p.regionName)
      }
    })
    return list.length > 0 ? list : ['Miền Bắc', 'Miền Trung', 'Miền Nam']
  }, [provinces])

  const mapDtoToDetailed = (itinerary: ItineraryDto): DetailedItineraryItem => {
    const totalCostNumber = parseInt(itinerary.estimatedCost?.replace(/[^0-9]/g, '') || '0', 10)
    return {
      id: itinerary.id,
      title: itinerary.title,
      slug: `itinerary-${itinerary.id}`,
      province: itinerary.destination,
      region: itinerary.region,
      durationDays: itinerary.daysCount || 1,
      nightsCount: Math.max(0, (itinerary.daysCount || 1) - 1),
      estimatedBudget: totalCostNumber,
      privacy: 0,
      coverImg: itinerary.coverUrl || '',
      authorName: itinerary.author?.name || 'Cộng đồng',
      authorAvatar: itinerary.author?.avatar,
      description: itinerary.overview || 'Lịch trình du lịch đề xuất tối ưu thời gian và chi phí.',
      days: (itinerary.days || []).map((d, dIdx) => ({
        dayNumber: d.dayNumber || dIdx + 1,
        title: d.title || `Ngày ${dIdx + 1}`,
        description: 'Lộ trình tham quan',
        stops: (d.stops || []).map((s, sIdx) => ({
          id: `stop-${itinerary.id}-${dIdx}-${sIdx}`,
          time: s.time || '08:00',
          startTime: s.time || '08:00',
          endTime: '09:30',
          name: s.placeName || s.activity || `Điểm dừng ${sIdx + 1}`,
          category: 'Điểm tham quan',
          address: s.location || '',
          note: s.note || s.description || s.tips || '',
          costEstimate: parseInt(s.costEstimate?.replace(/[^0-9]/g, '') || '0', 10),
          duration: '1.5 giờ',
          transportMode: 'Xe máy',
          visitOrder: sIdx + 1
        }))
      })),
      createdAt: new Date().toISOString()
    }
  }

  const handleOpenPreview = (itinerary: ItineraryDto, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (onQuickPreview) {
      onQuickPreview(itinerary)
    } else {
      setPreviewItem(mapDtoToDetailed(itinerary))
    }
  }

  const handleToggleRegion = (reg: string) => {
    if (selectedRegion === reg) {
      onSelectRegion(null)
      onSelectProvince(null)
    } else {
      onSelectRegion(reg)
      onSelectProvince(null)
    }
  }

  const handleToggleProvince = (prov: string) => {
    if (selectedProvince === prov) {
      onSelectProvince(null)
    } else {
      onSelectProvince(prov)
    }
  }

  const activeProvincesList = useMemo(() => {
    if (!selectedRegion) return []
    return provinces.filter((p) => p.regionName === selectedRegion)
  }, [provinces, selectedRegion])

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedRegion ||
    selectedProvince ||
    selectedDuration !== 'all' ||
    selectedBudget !== 'all'
  )

  const filteredItineraries = useMemo(() => {
    return itineraries.filter((item) => {
      if (selectedRegion && item.region !== selectedRegion) {
        return false
      }
      if (selectedProvince && !item.destination.toLowerCase().includes(selectedProvince.toLowerCase())) {
        return false
      }
      if (selectedDuration !== 'all') {
        const d = item.daysCount || 1
        if (selectedDuration === '1' && d !== 1) return false
        if (selectedDuration === '2' && d !== 2) return false
        if (selectedDuration === '3' && d !== 3) return false
        if (selectedDuration === '4' && d !== 4) return false
        if (selectedDuration === '5' && d < 5) return false
      }
      if (selectedBudget !== 'all') {
        const costNum = parseInt(item.estimatedCost?.replace(/[^0-9]/g, '') || '0', 10)
        if (selectedBudget === 'under1m' && costNum >= 1000000) return false
        if (selectedBudget === '1m-3m' && (costNum < 1000000 || costNum > 3000000)) return false
        if (selectedBudget === '3m-5m' && (costNum < 3000000 || costNum > 5000000)) return false
        if (selectedBudget === 'above5m' && costNum <= 5000000) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const text = `${item.title} ${item.destination} ${item.overview || ''} ${item.style}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
  }, [itineraries, selectedRegion, selectedProvince, selectedDuration, selectedBudget, searchQuery])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <MapPin size={14} className="text-emerald-700" />
            <span>Vùng miền:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {regions.map((reg) => {
              const isSelected = selectedRegion === reg
              return (
                <button
                  type="button"
                  key={reg}
                  onClick={() => handleToggleRegion(reg)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${isSelected
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-700 border-stone-200'
                    }`}
                >
                  {reg}
                </button>
              )
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {selectedRegion && activeProvincesList.length > 0 && (
          <div className="pt-3 border-t border-dashed border-slate-200 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Tỉnh thành thuộc {selectedRegion}:</span>
              <span className="text-[10px] font-normal text-slate-400">
                {selectedProvince ? `Đang chọn: ${selectedProvince}` : 'Chọn tỉnh thành để lọc chi tiết'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => onSelectProvince(null)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${selectedProvince === null
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
              >
                Tất cả {selectedRegion}
              </button>

              {activeProvincesList.map((prov) => {
                const isProvSelected = selectedProvince === prov.name
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleToggleProvince(prov.name)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer border ${isProvSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 border-slate-200 font-medium'
                      }`}
                  >
                    {prov.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Clock size={14} className="text-emerald-700" />
              <span>Thời lượng ngày:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATIONS.map((dur) => (
                <button
                  type="button"
                  key={dur.id}
                  onClick={() => onSelectDuration(dur.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer border ${selectedDuration === dur.id
                    ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                    }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <DollarSign size={14} className="text-emerald-700" />
              <span>Giá tiền ước tính:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {BUDGETS.map((bg) => (
                <button
                  type="button"
                  key={bg.id}
                  onClick={() => onSelectBudget(bg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer border ${selectedBudget === bg.id
                    ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                    }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Tìm thấy <strong className="text-slate-900 font-bold">{filteredItineraries.length}</strong> chuyến đi
          {selectedRegion ? ` tại ${selectedRegion}` : ''}
          {selectedProvince ? ` • ${selectedProvince}` : ''}
        </span>
      </div>

      <div>
        {filteredItineraries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <Compass size={40} className="text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy chuyến đi nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Không có lịch trình nào khớp với các tiêu chí tìm kiếm hiện tại. Bạn có thể thử đặt lại bộ lọc để khám phá toàn bộ chuyến đi.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItineraries.map((itinerary) => {
              const totalStops = (itinerary.days || []).reduce(
                (sum, d) => sum + (d.stops?.length || 0),
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
                        {itinerary.author?.avatar ? (
                          <img
                            src={itinerary.author.avatar}
                            alt={itinerary.author.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(itinerary.author?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {itinerary.author?.name || 'Cộng đồng'}
                            </span>
                            <CheckCircle2
                              size={15}
                              className="text-emerald-500 fill-emerald-100 shrink-0"
                            />
                          </div>

                          <span className="text-[11px] text-slate-400 font-medium block truncate">
                            {itinerary.style || 'Khám phá'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                        {itinerary.title}
                      </h3>
                      {itinerary.overview && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                          {itinerary.overview}
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-3 sm:p-3.5 border border-slate-200/80 grid grid-cols-2 divide-x divide-slate-200">
                      <div className="pr-3 min-w-0">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 block truncate">
                          {itinerary.destination}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                          {itinerary.duration || `${itinerary.daysCount} ngày`} • {totalStops} ĐIỂM
                        </span>
                      </div>

                      <div className="pl-3 sm:pl-4 min-w-0">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-800 block truncate">
                          {itinerary.estimatedCost || 'Linh hoạt'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                          CHI PHÍ DỰ TÍNH
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleOpenPreview(itinerary, e)}
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        Xem chi tiết
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onApplyItinerary) onApplyItinerary(itinerary)
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs text-center flex items-center justify-center gap-1 cursor-pointer ${appliedItineraryIds.has(itinerary.id)
                          ? 'bg-emerald-900 text-white'
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                          }`}
                      >
                        <Sparkles size={13} />
                        <span>Áp dụng</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {previewItem && (
        <ItineraryQuickPreviewModal
          itinerary={previewItem}
          onClose={() => setPreviewItem(null)}
          onApply={(item) => {
            const originDto = itineraries.find((i) => i.id === item.id)
            if (originDto && onApplyItinerary) onApplyItinerary(originDto)
            setPreviewItem(null)
          }}
        />
      )}
    </div>
  )
}

export default ItineraryCatalogView
