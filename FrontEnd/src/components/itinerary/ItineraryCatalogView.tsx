import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  X,
  Copy,
  Check
} from 'lucide-react'
import type { ItineraryDto, DetailedItineraryItem, ExtendedItineraryDto } from '@/types/models/itinerary.model'
import { geographyService } from '@/services/geographyService'
import { ItineraryQuickPreviewModal } from './ItineraryQuickPreviewModal'

interface ItineraryCatalogViewProps {
  itineraries: ItineraryDto[]
  isLoading?: boolean
  searchQuery: string
  selectedDuration: string
  selectedBudget: string
  selectedDestination?: string
  sortBy?: string
  appliedItineraryIds?: Set<number>
  onSearchChange?: (q: string) => void
  onClearSearch?: () => void
  onSelectDuration: (dur: string) => void
  onSelectBudget: (budget: string) => void
  onSelectDestination?: (dest: string) => void
  onSelectSortBy?: (sort: string) => void
  onResetFilters: () => void
  onApplyItinerary?: (itinerary: ItineraryDto) => void
  onQuickPreview?: (itinerary: ItineraryDto) => void
}

const DEFAULT_PROVINCES = [
  { id: 1, name: 'Hà Nội' },
  { id: 2, name: 'Hồ Chí Minh' },
  { id: 3, name: 'Đà Nẵng' },
  { id: 4, name: 'Hội An' },
  { id: 5, name: 'Đà Lạt' },
  { id: 6, name: 'Phú Quốc' },
  { id: 7, name: 'Sa Pa' },
  { id: 8, name: 'Ninh Bình' },
  { id: 9, name: 'Quy Nhơn' },
  { id: 10, name: 'Hạ Long' },
  { id: 11, name: 'Huế' },
  { id: 12, name: 'Nha Trang' },
  { id: 13, name: 'Vũng Tàu' },
  { id: 14, name: 'Cần Thơ' },
  { id: 15, name: 'Hà Giang' }
]

const DURATIONS = [
  { id: 'all', label: 'Tất cả thời lượng' },
  { id: '1', label: '1 Ngày' },
  { id: '2', label: '2 Ngày 1 Đêm (2N1Đ)' },
  { id: '3', label: '3 Ngày 2 Đêm (3N2Đ)' },
  { id: '4', label: '4 Ngày 3 Đêm (4N3Đ)' },
  { id: '5', label: '5 Ngày trở lên (5N+)' }
]

const BUDGETS = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'under1m', label: 'Dưới 1 triệu' },
  { id: '1m-3m', label: '1 - 3 triệu' },
  { id: '3m-5m', label: '3 - 5 triệu' },
  { id: 'above5m', label: 'Trên 5 triệu' }
]


function cleanTripTitle(rawTitle: string): string {
  if (!rawTitle) return ''
  return rawTitle
    .replace(/^\[Chuyến\s*đi\]\s*/i, '')
    .replace(/^\[Chuyen\s*di\]\s*/i, '')
    .replace(/\s*\(\s*\d+\s*N\s*\d+\s*Đ\s*\)\s*$/i, '')
    .replace(/\s*\(\s*\d+\s*ngày\s*\d+\s*đêm\s*\)\s*$/i, '')
    .replace(/\s*-\s*\d+\s*N\s*\d+\s*Đ\s*$/i, '')
    .trim()
}

function resolveDestinationBadge(destination?: string): string {
  return destination?.trim() || 'Việt Nam'
}

function extractRouteSummary(itinerary: ItineraryDto): { summary: string; extraCount: number } {
  const stops: string[] = []
  if (itinerary.days && itinerary.days.length > 0) {
    for (const d of itinerary.days) {
      if (d.stops && d.stops.length > 0) {
        for (const s of d.stops) {
          const name = s.placeName || s.activity || s.location
          if (name && !stops.includes(name)) {
            stops.push(name)
          }
        }
      }
    }
  }

  if (stops.length === 0) {
    return { summary: 'Chưa có lộ trình chi tiết', extraCount: 0 }
  }

  const topStops = stops.slice(0, 3)
  const extraCount = Math.max(0, stops.length - 3)
  return {
    summary: topStops.join(' → '),
    extraCount
  }
}

export const ItineraryCatalogView: React.FC<ItineraryCatalogViewProps> = ({
  itineraries,
  isLoading = false,
  searchQuery,
  selectedDuration,
  selectedBudget,
  selectedDestination: controlledDestination,
  appliedItineraryIds = new Set(),
  onSearchChange,
  onClearSearch,
  onSelectDuration,
  onSelectBudget,
  onSelectDestination,
  onSelectSortBy: _onSelectSortBy,
  onResetFilters: _onResetFilters,
  onApplyItinerary,
  onQuickPreview
}) => {
  const [previewItem, setPreviewItem] = useState<DetailedItineraryItem | null>(null)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [provinces, setProvinces] = useState<{ id: number | string; name: string }[]>([])

  useEffect(() => {
    let isMounted = true
    const fetchProvinces = async () => {
      try {
        const res = await geographyService.getProvinces()
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          if (isMounted) {
            const list = res.data.map((p) => ({ id: p.id, name: p.name }))
            list.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
            setProvinces(list)
          }
        }
      } catch (err) {
        console.error('Error fetching provinces:', err)
      }
    }
    fetchProvinces()
    return () => {
      isMounted = false
    }
  }, [])

  const destinationList = useMemo(() => [
    { id: 'all', name: 'Tất cả điểm đến' },
    ...(provinces.length > 0 ? provinces : DEFAULT_PROVINCES)
  ], [provinces])

  const [internalDestination, setInternalDestination] = useState<string>('all')

  const activeDestination = controlledDestination ?? internalDestination

  const handleDestinationClick = (dest: string) => {
    if (onSelectDestination) {
      onSelectDestination(dest)
    } else {
      setInternalDestination(dest)
    }
  }



  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchChange) {
      onSearchChange(localSearch)
    }
  }

  const handleClear = () => {
    setLocalSearch('')
    if (onClearSearch) onClearSearch()
  }

  const displayItineraries = useMemo<ExtendedItineraryDto[]>(() => {
    if (!Array.isArray(itineraries) || itineraries.length === 0) {
      return []
    }

    return itineraries.map((item) => {
      const cleanTitle = cleanTripTitle(item.title)
      const destBadge = resolveDestinationBadge(item.destination)
      const rawCover = (item.coverUrl || item.coverImageUrl || '').trim()
      const cover = rawCover || null
      const rawCost = String(item.estimatedCost ?? '')
      const costNum = parseInt(rawCost.replace(/[^0-9]/g, '') || '0', 10)
      const costPerPerson = costNum > 0 ? `${costNum.toLocaleString('vi-VN')}đ` : (rawCost.trim() ? rawCost : 'Linh hoạt')

      const postedDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('vi-VN')
        : 'Gần đây'

      return {
        ...item,
        title: cleanTitle,
        destinationBadge: destBadge,
        coverUrl: cover,
        coverImageUrl: cover,
        postedDate,
        costPerPerson,
        daysCount: item.daysCount || item.days?.length || 1
      }
    })
  }, [itineraries])

  const filteredItineraries = useMemo(() => {
    if (Boolean(onSelectDestination)) {
      return displayItineraries
    }

    return displayItineraries.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = (item.title || '').toLowerCase().includes(q)
        const matchDest = (item.destination || '').toLowerCase().includes(q)
        const matchBadge = (item.destinationBadge || '').toLowerCase().includes(q)
        const matchOverview = (item.overview || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDest && !matchBadge && !matchOverview) {
          return false
        }
      }

      if (activeDestination !== 'all') {
        const destLower = activeDestination.toLowerCase().trim()
        const itemDest = (item.destination || '').toLowerCase()
        const itemBadge = (item.destinationBadge || '').toLowerCase()
        const itemTitle = (item.title || '').toLowerCase()

        if (!itemDest.includes(destLower) && !itemBadge.includes(destLower) && !itemTitle.includes(destLower)) {
          return false
        }
      }

      if (selectedDuration !== 'all') {
        const days = item.daysCount || 1
        if (selectedDuration === '1' && days !== 1) return false
        if (selectedDuration === '2' && days !== 2) return false
        if (selectedDuration === '3' && days !== 3) return false
        if (selectedDuration === '4' && days !== 4) return false
        if (selectedDuration === '5' && days < 5) return false
      }

      if (selectedBudget !== 'all') {
        const costNum = parseInt(String(item.estimatedCost ?? '').replace(/[^0-9]/g, '') || '0', 10)
        if (selectedBudget === 'under1m' && costNum >= 1000000) return false
        if (selectedBudget === '1m-3m' && (costNum < 1000000 || costNum > 3000000)) return false
        if (selectedBudget === '3m-5m' && (costNum < 3000000 || costNum > 5000000)) return false
        if (selectedBudget === 'above5m' && costNum <= 5000000) return false
      }

      return true
    })
  }, [displayItineraries, searchQuery, activeDestination, selectedDuration, selectedBudget, onSelectDestination])

  const mapDtoToDetailed = (itinerary: ItineraryDto): DetailedItineraryItem => {
    const totalCostNumber = parseInt(String(itinerary.estimatedCost ?? '').replace(/[^0-9]/g, '') || '0', 10)
    return {
      id: itinerary.id,
      title: itinerary.title,
      slug: `itinerary-${itinerary.id}`,
      province: itinerary.destination || 'Việt Nam',
      region: (itinerary.region as DetailedItineraryItem['region']) || 'Miền Bắc',
      durationDays: itinerary.daysCount || 1,
      nightsCount: Math.max(0, (itinerary.daysCount || 1) - 1),
      estimatedBudget: totalCostNumber,
      privacy: 0,
      coverImg: itinerary.coverUrl || itinerary.coverImageUrl || '',
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
          costEstimate: parseInt(String(s.costEstimate ?? '').replace(/[^0-9]/g, '') || '0', 10),
          duration: '1.5 giờ',
          transportMode: 'Xe máy',
          visitOrder: sIdx + 1
        }))
      })),
      createdAt: itinerary.createdAt || new Date().toISOString()
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-2xs space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4 space-y-4 pr-0 lg:pr-4">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Lịch trình sẵn sàng.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Tham khảo kế hoạch chuyến đi chi tiết theo từng ngày, cung đường và dự toán ngân sách từ cộng đồng.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Áp dụng ngay lộ trình yêu thích hoặc tùy chỉnh điểm dừng để tạo nên hành trình mang đậm dấu ấn cá nhân.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full pt-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm lịch trình, địa điểm, từ khóa trải nghiệm..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-20 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                    title="Xóa tìm kiếm"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Tìm
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Điểm đến
              </h3>
              {provinces.length > 0 && (
                <span className="text-[11px] font-medium text-slate-400">
                  {provinces.length} tỉnh thành
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-xs sm:text-sm">
                {destinationList.map((dest) => {
                  const active =
                    activeDestination === dest.name ||
                    (dest.id === 'all' && activeDestination === 'all')
                  return (
                    <li key={dest.id} className="truncate">
                      <button
                        type="button"
                        onClick={() =>
                          handleDestinationClick(dest.id === 'all' ? 'all' : dest.name)
                        }
                        className={`text-left transition-colors cursor-pointer truncate w-full block ${active
                          ? 'text-emerald-800 font-bold underline underline-offset-4 decoration-2'
                          : 'text-slate-700 hover:text-emerald-800 hover:underline'
                          }`}
                        title={dest.name}
                      >
                        {dest.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight mb-3">
              Thời lượng chuyến đi
            </h3>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm">
              {DURATIONS.map((dur) => {
                const active = selectedDuration === dur.id
                return (
                  <li key={dur.id}>
                    <button
                      type="button"
                      onClick={() => onSelectDuration(dur.id)}
                      className={`text-left transition-colors cursor-pointer whitespace-nowrap ${active
                        ? 'text-emerald-800 font-bold underline underline-offset-4 decoration-2'
                        : 'text-slate-700 hover:text-emerald-800 hover:underline'
                        }`}
                    >
                      {dur.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100/70">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight mb-3">
              Giá tiền ước tính
            </h3>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm">
              {BUDGETS.map((bg) => {
                const active = selectedBudget === bg.id
                return (
                  <li key={bg.id}>
                    <button
                      type="button"
                      onClick={() => onSelectBudget(bg.id)}
                      className={`text-left transition-colors cursor-pointer whitespace-nowrap ${active
                        ? 'text-emerald-800 font-bold underline underline-offset-4 decoration-2'
                        : 'text-slate-700 hover:text-emerald-800 hover:underline'
                        }`}
                    >
                      {bg.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>



      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xs p-4 animate-pulse space-y-4"
              >
                <div className="w-full aspect-[16/10] bg-slate-100 rounded-2xl" />
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                  <div className="h-3 bg-slate-200 rounded-full w-28" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded-full w-4/5" />
                  <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                </div>
                <div className="h-12 bg-slate-50 rounded-2xl border border-slate-100" />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="h-9 bg-slate-100 rounded-xl" />
                  <div className="h-9 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItineraries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-base font-extrabold text-slate-800">
              Không tìm thấy chuyến đi nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Không có lịch trình nào khớp với các tiêu chí tìm kiếm hiện tại. Bạn có thể chọn điểm đến hoặc từ khóa khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItineraries.map((itinerary) => {
              const cleanTitle = cleanTripTitle(itinerary.title)
              const totalStops = (itinerary.days || []).reduce(
                (sum, d) => sum + (d.stops?.length || 0),
                0
              )
              const routeInfo = extractRouteSummary(itinerary)

              const coverImage = (itinerary.coverUrl || itinerary.coverImageUrl || '').trim() || null

              const authorName = itinerary.author?.name || 'Cộng đồng'
              const authorAvatar = itinerary.author?.avatar
              const postedTime = itinerary.postedDate || (itinerary.createdAt ? new Date(itinerary.createdAt).toLocaleDateString('vi-VN') : 'Gần đây')
              const costText = String(itinerary.costPerPerson || itinerary.estimatedCost || 'Linh hoạt')

              return (
                <div
                  key={itinerary.id}
                  onClick={() => handleOpenPreview(itinerary)}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 hover:border-emerald-600/70 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-2xs"
                >
                  {coverImage && (
                    <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden shrink-0">
                      <img
                        src={coverImage}
                        alt={cleanTitle}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {authorAvatar ? (
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-800 truncate block">
                            {authorName}
                          </span>
                          <span className="text-slate-400 shrink-0">•</span>
                          <span className="text-slate-400 shrink-0 text-[11px]">
                            {postedTime}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                          {cleanTitle}
                        </h3>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 hover:bg-slate-100/90 transition-colors px-2.5 py-1.5 rounded-xl border border-slate-100">
                          <span className="truncate font-medium">
                            {routeInfo.summary}
                            {routeInfo.extraCount > 0 && (
                              <span className="text-emerald-800 font-bold ml-1">
                                (+{routeInfo.extraCount} nơi khác)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 grid grid-cols-2 divide-x divide-slate-200">
                        <div className="pr-3 min-w-0">
                          <span className="text-sm font-extrabold text-slate-900 block truncate">
                            {itinerary.duration || `${itinerary.daysCount} Ngày`}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                            ({totalStops || 8} địa điểm tham quan)
                          </span>
                        </div>

                        <div className="pl-3 sm:pl-4 min-w-0">
                          <span className="text-sm font-extrabold text-emerald-800 block truncate">
                            ~ {costText}
                            {!costText.includes('/ người') && (
                              <span className="text-[11px] font-semibold text-slate-500 ml-0.5">
                                / người
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                            CHI PHÍ DỰ TÍNH
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenPreview(itinerary, e)}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer shadow-2xs"
                        >
                          Xem chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onApplyItinerary) onApplyItinerary(itinerary)
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${appliedItineraryIds.has(itinerary.id)
                            ? 'bg-emerald-900 text-white ring-2 ring-emerald-600/40'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                            }`}
                        >
                          {appliedItineraryIds.has(itinerary.id) ? (
                            <>
                              <Check size={14} />
                              <span>Đã áp dụng</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Dùng lịch trình</span>
                            </>
                          )}
                        </button>
                      </div>
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
          actionLabel="Dùng lịch trình này"
          onClose={() => setPreviewItem(null)}
          onApply={(item) => {
            const originDto = displayItineraries.find((i) => i.id === item.id)
            if (originDto && onApplyItinerary) onApplyItinerary(originDto)
            setPreviewItem(null)
          }}
        />
      )}
    </div>
  )
}

export default ItineraryCatalogView
