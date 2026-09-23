import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import type { ProvinceItinerary } from '@/types/models/province.model'
import type { ItineraryDto, DetailedItineraryItem, ItineraryDayData } from '@/types/models/itinerary.model'
import { ItineraryQuickPreviewModal } from '@/components/itinerary/ItineraryQuickPreviewModal'
import { itineraryService } from '@/services/itineraryService'
import { tripService } from '@/services/tripService'

interface ProvinceItinerarySectionProps {
  provinceName: string
  itineraries?: ProvinceItinerary[]
  initialItineraries?: ProvinceItinerary[]
}

const cleanName = (name: string) =>
  (name || '')
    .toLowerCase()
    .replace(/^(tp|thành phố|tỉnh)\.?\s+/i, '')
    .trim()

export const ProvinceItinerarySection: React.FC<ProvinceItinerarySectionProps> = ({
  provinceName,
  itineraries,
  initialItineraries
}) => {
  const navigate = useNavigate()
  const [itineraryList, setItineraryList] = useState<ItineraryDto[]>([])
  const [loading, setLoading] = useState(false)
  const [previewItem, setPreviewItem] = useState<DetailedItineraryItem | null>(null)
  const [appliedItineraryIds, setAppliedItineraryIds] = useState<Set<number>>(new Set())

  const mapCatalogDtoToDetailed = (dto: ItineraryDto): DetailedItineraryItem => {
    const totalCostNumber = parseInt(dto.estimatedCost?.replace(/[^0-9]/g, '') || '0', 10)
    const days: ItineraryDayData[] = (dto.days || []).map((d, dIdx) => {
      const cleanDayTitle =
        (d.title || `Ngày ${dIdx + 1}`).replace(/^Ngày\s*\d+\s*:\s*/i, '').trim() ||
        `Lộ trình ngày ${dIdx + 1}`
      return {
        dayNumber: d.dayNumber || dIdx + 1,
        title: cleanDayTitle,
        description: 'Lộ trình tham quan',
        stops: (d.stops || []).map((s, sIdx) => {
          const placeName = s.placeName || s.activity || s.location || `Điểm dừng chân ${sIdx + 1}`
          return {
            id: `catalog-stop-${dto.id}-${dIdx}-${sIdx}`,
            time: s.time || '08:00',
            startTime: s.time || '08:00',
            endTime: '09:30',
            name: placeName,
            category: 'Điểm tham quan',
            address: s.location || placeName,
            note: s.note || s.description || s.tips || '',
            costEstimate: parseInt(s.costEstimate?.replace(/[^0-9]/g, '') || '0', 10),
            duration: '1.5 giờ',
            transportMode: 'Xe máy',
            visitOrder: sIdx + 1,
            img: ''
          }
        })
      }
    })

    return {
      id: dto.id,
      title: dto.title,
      slug: `itinerary-${dto.id}`,
      province: dto.destination || provinceName,
      region: (dto.region as DetailedItineraryItem['region']) || 'Miền Trung',
      durationDays: dto.daysCount || 1,
      nightsCount: Math.max(0, (dto.daysCount || 1) - 1),
      estimatedBudget: totalCostNumber,
      privacy: 0,
      coverImg: dto.coverUrl || '',
      authorName: dto.author?.name || 'Cộng đồng',
      authorAvatar: dto.author?.avatar || '',
      tags: [],
      description: dto.overview || '',
      days,
      backlogStops: [],
      members: dto.author?.name
        ? [
            {
              id: 1,
              name: dto.author.name,
              avatar: dto.author.avatar || '',
              email: '',
              role: 'Owner'
            }
          ]
        : [],
      createdAt: new Date().toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchItinerariesForProvince = async () => {
      setLoading(true)
      try {
        const res = await itineraryService.getItineraries({
          page: 1,
          pageSize: 50
        })

        if (!isMounted) return

        if (res.success && Array.isArray(res.data)) {
          const allDtos = res.data
          const target = cleanName(provinceName)

          // 1. First priority: match by destination or title with province name
          let matched = allDtos.filter((item) => {
            const dest = cleanName(item.destination || '')
            const tit = cleanName(item.title || '')
            return dest.includes(target) || tit.includes(target) || target.includes(dest)
          })

          // 2. Second priority: match with initialItineraries IDs if present
          if (matched.length === 0 && (initialItineraries || itineraries)?.length) {
            const initials = initialItineraries || itineraries || []
            const initialIds = new Set(initials.map((i) => i.id))
            const enriched = allDtos.filter((d) => initialIds.has(d.id))
            if (enriched.length > 0) {
              matched = enriched
            } else {
              matched = initials.map((init) => ({
                id: init.id,
                title: init.title,
                destination: init.destination || provinceName,
                region: init.region,
                duration: init.duration,
                daysCount: init.daysCount,
                style: init.style,
                estimatedCost: init.estimatedCost,
                coverUrl: init.coverUrl,
                author: init.author,
                overview: init.overview,
                isSaved: false,
                days: []
              }))
            }
          }

          setItineraryList(matched)
        } else if (initialItineraries || itineraries) {
          const initials = initialItineraries || itineraries || []
          setItineraryList(
            initials.map((init) => ({
              id: init.id,
              title: init.title,
              destination: init.destination || provinceName,
              region: init.region,
              duration: init.duration,
              daysCount: init.daysCount,
              style: init.style,
              estimatedCost: init.estimatedCost,
              coverUrl: init.coverUrl,
              author: init.author,
              overview: init.overview,
              isSaved: false,
              days: []
            }))
          )
        }
      } catch {
        if (isMounted) {
          const initials = initialItineraries || itineraries || []
          setItineraryList(
            initials.map((init) => ({
              id: init.id,
              title: init.title,
              destination: init.destination || provinceName,
              region: init.region,
              duration: init.duration,
              daysCount: init.daysCount,
              style: init.style,
              estimatedCost: init.estimatedCost,
              coverUrl: init.coverUrl,
              author: init.author,
              overview: init.overview,
              isSaved: false,
              days: []
            }))
          )
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

  const handleOpenPreview = (itinerary: ItineraryDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const detailed = mapCatalogDtoToDetailed(itinerary)
    setPreviewItem(detailed)
  }

  const handleApply = async (dto: ItineraryDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const itinerary = mapCatalogDtoToDetailed(dto)
    try {
      const res = await tripService.createTrip({
        title: `[Chuyến đi] ${itinerary.title}`,
        description: itinerary.description,
        sourceTripId: itinerary.id,
        privacy: 1
      })
      if (res.success && res.data?.id) {
        setAppliedItineraryIds((prev) => new Set(prev).add(dto.id))
        navigate(`/itinerary/${res.data.id}`)
        return
      }
    } catch { }
    navigate('/itinerary')
  }

  if (!loading && itineraryList.length === 0) return null

  return (
    <section className="my-12 space-y-6 font-sans">
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
                      onClick={(e) => handleApply(itinerary, e)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs text-center flex items-center justify-center gap-1 cursor-pointer ${appliedItineraryIds.has(itinerary.id)
                        ? 'bg-emerald-900 text-white'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        }`}
                    >
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
          isApplied={appliedItineraryIds.has(previewItem.id)}
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
