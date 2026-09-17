import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import type { ProvinceItinerary } from '@/types/models/province.model'
import type { ItineraryDto, DetailedItineraryItem, ItineraryDayData } from '@/types/models/itinerary.model'
import { ItineraryQuickPreviewModal } from '@/components/itinerary/ItineraryQuickPreviewModal'
import { itineraryService } from '@/services/itineraryService'

interface ProvinceItinerarySectionProps {
  provinceName: string
  itineraries?: ProvinceItinerary[]
  initialItineraries?: ProvinceItinerary[]
}

type ItineraryItemType = ItineraryDto | ProvinceItinerary

export const ProvinceItinerarySection: React.FC<ProvinceItinerarySectionProps> = ({
  provinceName,
  itineraries,
  initialItineraries
}) => {
  const navigate = useNavigate()
  const [itineraryList, setItineraryList] = useState<ItineraryItemType[]>(itineraries || initialItineraries || [])
  const [loading, setLoading] = useState(false)
  const [previewItem, setPreviewItem] = useState<DetailedItineraryItem | null>(null)
  const [appliedItineraryIds, setAppliedItineraryIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let isMounted = true

    const fetchItinerariesForProvince = async () => {
      setLoading(true)
      try {
        const res = await itineraryService.getItineraries({
          keyword: provinceName,
          page: 1,
          pageSize: 20
        })

        if (!isMounted) return

        if (res.success && res.data && res.data.length > 0) {
          const normName = provinceName.toLowerCase()
          const matched = res.data.filter((item) => {
            const dest = (item.destination || '').toLowerCase()
            const tit = (item.title || '').toLowerCase()
            return dest.includes(normName) || tit.includes(normName) || normName.includes(dest)
          })

          if (matched.length > 0) {
            setItineraryList(matched)
          } else {
            setItineraryList(res.data)
          }
        } else if (itineraries || initialItineraries) {
          setItineraryList(itineraries || initialItineraries || [])
        }
      } catch {
        if (isMounted) {
          setItineraryList(itineraries || initialItineraries || [])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchItinerariesForProvince()

    return () => {
      isMounted = false
    }
  }, [provinceName, itineraries, initialItineraries])

  const mapToDetailedItem = (item: ItineraryItemType): DetailedItineraryItem => {
    const totalCostNumber = parseInt(item.estimatedCost?.replace(/[^0-9]/g, '') || '0', 10)
    const rawDays = (item as unknown as { days?: Array<{ dayNumber?: number; title?: string; description?: string; stops?: Array<{ placeName?: string; name?: string; activity?: string; location?: string; time?: string; note?: string; description?: string; tips?: string; costEstimate?: string | number }> }> }).days || []

    const days: ItineraryDayData[] = rawDays.map((d, dIdx) => ({
      dayNumber: d.dayNumber || dIdx + 1,
      title: d.title || `Ngày ${dIdx + 1}`,
      description: d.description || 'Lộ trình tham quan',
      stops: (d.stops || []).map((s, sIdx) => {
        const placeName = s.placeName || s.name || s.activity || s.location || `Điểm dừng ${sIdx + 1}`
        return {
          id: `stop-${item.id}-${dIdx}-${sIdx}`,
          time: s.time || '08:00',
          startTime: s.time || '08:00',
          endTime: '09:30',
          name: placeName,
          category: 'Điểm tham quan',
          address: s.location || placeName,
          note: s.note || s.description || s.tips || '',
          costEstimate: parseInt(String(s.costEstimate || '').replace(/[^0-9]/g, '') || '0', 10),
          duration: '1.5 giờ',
          transportMode: 'Xe máy' as const,
          visitOrder: sIdx + 1
        }
      })
    }))

    return {
      id: item.id,
      title: item.title,
      slug: `itinerary-${item.id}`,
      province: item.destination || provinceName,
      region: item.region,
      durationDays: item.daysCount || 1,
      nightsCount: Math.max(0, (item.daysCount || 1) - 1),
      estimatedBudget: totalCostNumber,
      privacy: 0,
      coverImg: item.coverUrl || undefined,
      authorName: item.author?.name || 'Cộng đồng',
      authorAvatar: item.author?.avatar || undefined,
      description: item.overview || 'Lịch trình du lịch đề xuất tối ưu thời gian và chi phí.',
      days,
      createdAt: new Date().toISOString()
    }
  }

  const handleOpenPreview = (itinerary: ItineraryItemType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const detailed = mapToDetailedItem(itinerary)
    setPreviewItem(detailed)
  }

  const handleApply = async (itinerary: ItineraryItemType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await itineraryService.saveItinerary(itinerary.id)
    } catch { }
    setAppliedItineraryIds((prev) => new Set(prev).add(itinerary.id))
    navigate(`/itinerary/${itinerary.id}`)
  }

  if (!loading && itineraryList.length === 0) return null

  return (
    <section className="my-12 space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Lịch Trình Khám Phá {provinceName}
          </h2>
        </div>

        <Link
          to="/itinerary"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>Xem tất cả lịch trình</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/90 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-3 bg-slate-200 rounded w-16" />
                </div>
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="h-9 bg-slate-100 rounded-xl" />
                <div className="h-9 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraryList.map((itinerary) => {
            const totalCostNumber = parseInt(itinerary.estimatedCost?.replace(/[^0-9]/g, '') || '0', 10)
            const totalStops = (itinerary as unknown as { days?: Array<{ stops?: unknown[] }> }).days
              ? (itinerary as unknown as { days: Array<{ stops: unknown[] }> }).days.reduce((sum, d) => sum + (d.stops?.length || 0), 0)
              : 0

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
                        {itinerary.destination || provinceName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block truncate mt-0.5">
                        {itinerary.daysCount || 1} NGÀY • {totalStops} ĐIỂM
                      </span>
                    </div>

                    <div className="pl-3 sm:pl-4 min-w-0">
                      <span className="text-sm sm:text-base font-extrabold text-emerald-800 block truncate">
                        {totalCostNumber > 0 ? `${totalCostNumber.toLocaleString('vi-VN')} đ` : itinerary.estimatedCost || 'Linh hoạt'}
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
                      onClick={(e) => handleApply(itinerary, e)}
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

      {previewItem && (
        <ItineraryQuickPreviewModal
          itinerary={previewItem}
          onClose={() => setPreviewItem(null)}
          onApply={(item) => {
            const origin = itineraryList.find((i) => i.id === item.id)
            if (origin) handleApply(origin)
            setPreviewItem(null)
          }}
        />
      )}
    </section>
  )
}

export default ProvinceItinerarySection
