import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import type {
  DetailedItineraryItem,
  ItineraryStop,
  TripRole,
  TransportType,
  ItineraryDayData,
  ItineraryDto
} from '@/types/models/itinerary.model'
import {
  ItineraryCatalogView,
  ItineraryPlannerView,
  ItineraryMemberModal
} from '@/components/itinerary'
import { itineraryService } from '@/services/itineraryService'
import { tripService } from '@/services/tripService'
import type { TripDetailDto } from '@/types/models/trip.model'

export const ItineraryPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ id?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [catalogItineraries, setCatalogItineraries] = useState<ItineraryDto[]>([])
  const [plannerTrip, setPlannerTrip] = useState<DetailedItineraryItem | null>(null)
  const [viewMode, setViewMode] = useState<'catalog' | 'planner'>('catalog')

  const [appliedItineraryIds, setAppliedItineraryIds] = useState<Set<number>>(new Set())

  const [expandedDayIndices, setExpandedDayIndices] = useState<Set<number>>(new Set([0, 1, 2]))
  const [isWishlistExpanded, setIsWishlistExpanded] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<TripRole>('Owner')
  const [isSavingTrip, setIsSavingTrip] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedStopInfo, setSelectedStopInfo] = useState<{
    dayIndex: number
    stop: ItineraryStop
    isWishlist?: boolean
  } | null>(null)

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2500)
  }

  const mapCatalogDtoToDetailed = (dto: ItineraryDto): DetailedItineraryItem => {
    const totalCostNumber = parseInt(dto.estimatedCost?.replace(/[^0-9]/g, '') || '0', 10)
    const days: ItineraryDayData[] = (dto.days || []).map((d, dIdx) => {
      const cleanDayTitle = (d.title || `Ngày ${dIdx + 1}`).replace(/^Ngày\s*\d+\s*:\s*/i, '').trim() || `Lộ trình ngày ${dIdx + 1}`
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
      province: dto.destination,
      region: (dto.region as DetailedItineraryItem['region']) || 'Miền Bắc',
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
      members: dto.author?.name ? [
        {
          id: 1,
          name: dto.author.name,
          avatar: dto.author.avatar || '',
          email: '',
          role: 'Owner'
        }
      ] : [],
      createdAt: new Date().toISOString().split('T')[0]
    }
  }

  const mapTripDetailDtoToDetailed = (dto: TripDetailDto): DetailedItineraryItem => {
    const days: ItineraryDayData[] = (dto.days || []).map((d) => ({
      dayNumber: d.dayNumber,
      title: d.dayTitle || `Ngày ${d.dayNumber}`,
      date: d.date,
      description: 'Lộ trình tham quan',
      stops: (d.stops || []).map((s) => ({
        id: String(s.id),
        time: s.startTime || '08:00',
        startTime: s.startTime || '08:00',
        endTime: s.endTime || '09:30',
        name: s.name,
        category: s.category || 'Điểm tham quan',
        address: s.address,
        lat: s.latitude || undefined,
        lng: s.longitude || undefined,
        note: s.note || '',
        costEstimate: Number(s.estimatedCost || 0),
        duration: '1.5 giờ',
        transportMode: (s.transportMode as TransportType) || 'Xe máy',
        visitOrder: s.visitOrder,
        img: s.imageUrl || ''
      }))
    }))

    return {
      id: Number(dto.id),
      title: dto.title,
      slug: `chuyen-di-${dto.id}`,
      province: dto.province || 'Việt Nam',
      region: (dto.region as DetailedItineraryItem['region']) || 'Miền Bắc',
      durationDays: dto.durationDays || 1,
      nightsCount: dto.nightsCount || 0,
      estimatedBudget: Number(dto.estimatedBudget || 0),
      budgetTarget: dto.budgetTarget ? Number(dto.budgetTarget) : undefined,
      startDate: dto.startDate,
      endDate: dto.endDate,
      privacy: dto.privacy as DetailedItineraryItem['privacy'],
      coverImg: dto.coverImageUrl || '',
      authorName: 'Bạn',
      authorAvatar: '',
      tags: [],
      description: dto.description || '',
      days,
      backlogStops: [],
      members: (dto.members || []).map((m) => ({
        id: Number(m.userId),
        name: m.fullName,
        avatar: m.avatarUrl || '',
        email: m.email || '',
        role: (m.role as TripRole) || 'Viewer'
      })),
      createdAt: new Date().toISOString().split('T')[0]
    }
  }

  const appliedFilters = useMemo(() => {
    const q = searchParams.get('q') || searchParams.get('keyword') || ''
    const duration = searchParams.get('duration') || 'all'
    const budget = searchParams.get('budget') || 'all'

    return {
      search: q,
      duration,
      budget
    }
  }, [searchParams])

  const handleSearchChange = (q: string) => {
    const p = new URLSearchParams(searchParams)
    if (q.trim()) {
      p.set('q', q.trim())
    } else {
      p.delete('q')
      p.delete('keyword')
    }
    setSearchParams(p)
  }

  const handleClearSearch = () => {
    const p = new URLSearchParams(searchParams)
    p.delete('q')
    p.delete('keyword')
    setSearchParams(p)
  }

  const handleSelectDuration = (dur: string) => {
    const p = new URLSearchParams(searchParams)
    if (dur && dur !== 'all') {
      p.set('duration', dur)
    } else {
      p.delete('duration')
    }
    setSearchParams(p)
  }

  const handleSelectBudget = (bg: string) => {
    const p = new URLSearchParams(searchParams)
    if (bg && bg !== 'all') {
      p.set('budget', bg)
    } else {
      p.delete('budget')
    }
    setSearchParams(p)
  }

  const handleResetFilters = () => {
    setSearchParams({})
  }

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await itineraryService.getItineraries({
        duration: appliedFilters.duration === 'all' ? undefined : appliedFilters.duration,
        keyword: appliedFilters.search.trim() || undefined,
        page: 1,
        pageSize: 50
      })
      if (res.success && Array.isArray(res.data)) {
        setCatalogItineraries(res.data)
      } else {
        setCatalogItineraries([])
      }
    } catch {
      setCatalogItineraries([])
    }
  }, [appliedFilters])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    const mode = searchParams.get('mode')

    if (mode === 'create' || params.id === 'new') {
      const blankTrip: DetailedItineraryItem = {
        id: Date.now(),
        title: 'Chuyến đi của tôi',
        slug: 'chuyen-di-moi',
        province: 'Việt Nam',
        region: 'Miền Bắc',
        durationDays: 1,
        nightsCount: 0,
        estimatedBudget: 0,
        privacy: 1,
        coverImg: '',
        authorName: 'Bạn',
        authorAvatar: '',
        tags: [],
        description: 'Lên kế hoạch và lưu lại các địa điểm yêu thích.',
        days: [
          {
            dayNumber: 1,
            title: 'Ngày 1: Bắt đầu hành trình',
            description: 'Lộ trình tham quan',
            stops: []
          }
        ],
        backlogStops: [],
        members: [],
        createdAt: new Date().toISOString().split('T')[0]
      }
      setPlannerTrip(blankTrip)
      setCurrentUserRole('Owner')
      setExpandedDayIndices(new Set([0]))
      setIsWishlistExpanded(true)
      setSelectedStopInfo(null)
      setViewMode('planner')
      setHasUnsavedChanges(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (params.id) {
      const parsedId = Number(params.id)
      if (parsedId) {
        tripService.getTripDetail(parsedId)
          .then((res) => {
            if (res.success && res.data) {
              const mapped = mapTripDetailDtoToDetailed(res.data)
              setPlannerTrip(mapped)
              setCurrentUserRole((res.data.currentUserRole as TripRole) || 'Owner')
              setExpandedDayIndices(new Set(mapped.days.map((_, idx) => idx)))
              setIsWishlistExpanded(true)
              setSelectedStopInfo(null)
              setViewMode('planner')
              setHasUnsavedChanges(false)
            }
          })
          .catch(() => { })
        return
      }
    }

    if (
      location.pathname === '/itinerary' ||
      location.pathname === '/itineraries' ||
      location.pathname === '/hanh-trinh'
    ) {
      setViewMode('catalog')
      fetchCatalog()
    }
  }, [location.pathname, params.id, searchParams, fetchCatalog])

  const handleSaveTrip = async () => {
    if (!plannerTrip) return
    setIsSavingTrip(true)

    try {
      const isTemporaryId = !plannerTrip.id || plannerTrip.id > 1000000000000

      if (isTemporaryId) {
        const createRes = await tripService.createTrip({
          title: plannerTrip.title || 'Chuyến đi của tôi',
          description: plannerTrip.description,
          coverImageUrl: plannerTrip.coverImg,
          startDate: plannerTrip.startDate,
          endDate: plannerTrip.endDate,
          privacy: plannerTrip.privacy,
          days: plannerTrip.days.map((day) => ({
            dayNumber: day.dayNumber,
            dayTitle: day.title,
            date: day.date,
            stops: day.stops.map((s, sIdx) => ({
              placeId: s.placeId || Number(s.id.split('-')[1]) || 1,
              visitOrder: sIdx + 1,
              startTime: s.startTime,
              endTime: s.endTime,
              estimatedCost: s.costEstimate,
              transportMode: s.transportMode,
              note: s.note
            }))
          }))
        })

        if (createRes.success && createRes.data?.id) {
          const newId = createRes.data.id
          setPlannerTrip((prev) => (prev ? { ...prev, id: newId } : null))
          setHasUnsavedChanges(false)
          showToast('Đã lưu toàn bộ lịch trình chuyến đi thành công!')
          navigate(`/itinerary/${newId}`, { replace: true })
          return
        }
      }

      await tripService.updateTrip(plannerTrip.id, {
        title: plannerTrip.title,
        description: plannerTrip.description,
        coverImageUrl: plannerTrip.coverImg,
        startDate: plannerTrip.startDate,
        endDate: plannerTrip.endDate,
        privacy: plannerTrip.privacy,
        budgetTarget: plannerTrip.budgetTarget
      })

      const updatedDays = await Promise.all(
        plannerTrip.days.map(async (day) => {
          const updatedStops = await Promise.all(
            day.stops.map(async (stop, idx) => {
              const stopNumId = Number(stop.id)
              if (stopNumId && !isNaN(stopNumId) && stopNumId < 1000000000000) {
                try {
                  await tripService.updateTripPlace(stopNumId, {
                    visitOrder: idx + 1,
                    startTime: stop.startTime,
                    endTime: stop.endTime,
                    estimatedCost: stop.costEstimate,
                    transportMode: stop.transportMode,
                    note: stop.note
                  })
                } catch {
                }
                return { ...stop, visitOrder: idx + 1 }
              } else {
                const extractedPlaceId = stop.placeId || Number(stop.id.split('-')[1]) || 1
                try {
                  const res = await tripService.addTripPlace(plannerTrip.id, day.dayNumber, {
                    placeId: extractedPlaceId,
                    visitOrder: idx + 1,
                    startTime: stop.startTime,
                    endTime: stop.endTime,
                    estimatedCost: stop.costEstimate,
                    transportMode: stop.transportMode,
                    note: stop.note
                  })
                  if (res.success && res.data?.id) {
                    return { ...stop, id: String(res.data.id), placeId: extractedPlaceId, visitOrder: idx + 1 }
                  }
                } catch {
                }
                return { ...stop, visitOrder: idx + 1 }
              }
            })
          )
          return { ...day, stops: updatedStops }
        })
      )

      setPlannerTrip((prev) => (prev ? { ...prev, days: updatedDays } : null))
      setHasUnsavedChanges(false)
      showToast('Đã lưu toàn bộ lịch trình chuyến đi thành công!')
    } catch {
      showToast('Không thể kết nối đến máy chủ để lưu lịch trình.')
    } finally {
      setIsSavingTrip(false)
    }
  }

  const handleBackToCatalog = async () => {
    if (hasUnsavedChanges && plannerTrip) {
      try {
        await handleSaveTrip()
      } catch {
      }
    }
    navigate('/itinerary')
    setViewMode('catalog')
    setSelectedStopInfo(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleApplyItinerary = async (dto: ItineraryDto) => {
    const itinerary = mapCatalogDtoToDetailed(dto)
    try {
      const res = await tripService.createTrip({
        title: `[Chuyến đi] ${itinerary.title}`,
        description: itinerary.description,
        sourceTripId: itinerary.id,
        privacy: 1
      })

      if (res.success && res.data?.id) {
        setAppliedItineraryIds((prev) => new Set(prev).add(itinerary.id))
        showToast(`Đã áp dụng lịch trình "${itinerary.title}" vào Chuyến đi của bạn!`)
        navigate(`/itinerary/${res.data.id}`)
        return
      }
    } catch {
    }

    const newTripId = Date.now()
    const clonedTrip: DetailedItineraryItem = {
      ...itinerary,
      id: newTripId,
      title: `[Chuyến đi] ${itinerary.title}`,
      privacy: 1,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setPlannerTrip(clonedTrip)
    setAppliedItineraryIds((prev) => new Set(prev).add(itinerary.id))
    showToast(`Đã áp dụng lịch trình "${itinerary.title}"!`)
    navigate(`/itinerary/${newTripId}`)
  }

  const handlePublishTrip = async () => {
    if (!plannerTrip) return
    const nextPrivacy = plannerTrip.privacy === 0 ? 1 : 0
    setPlannerTrip((prev) => prev ? { ...prev, privacy: nextPrivacy } : null)
    setHasUnsavedChanges(true)

    try {
      await tripService.updateTrip(plannerTrip.id, {
        title: plannerTrip.title,
        privacy: nextPrivacy
      })
    } catch {
    }

    if (nextPrivacy === 1) {
      showToast('Đã chuyển chuyến đi về chế độ riêng tư (Hủy xuất bản).')
    } else {
      showToast('Đã xuất bản chuyến đi công khai!')
    }
  }

  const handleUpdateTripTitle = async (title: string) => {
    if (!plannerTrip) return
    setPlannerTrip((prev) => prev ? { ...prev, title } : null)
    setHasUnsavedChanges(true)
    try {
      await tripService.updateTrip(plannerTrip.id, { title })
    } catch {
    }
  }

  const handleUpdateTripProvince = async (province: string) => {
    if (!plannerTrip) return
    setPlannerTrip((prev) => prev ? { ...prev, province } : null)
    setHasUnsavedChanges(true)
  }

  const toggleDay = (index: number) => {
    setExpandedDayIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleAllDays = () => {
    if (!plannerTrip) return
    setExpandedDayIndices((prev) =>
      prev.size === plannerTrip.days.length
        ? new Set()
        : new Set(plannerTrip.days.map((_, idx) => idx))
    )
  }

  const toggleWishlist = () => {
    setIsWishlistExpanded((prev) => !prev)
  }

  const handleSelectStop = (
    dayIndex: number,
    stop: ItineraryStop,
    isWishlist?: boolean
  ) => {
    setSelectedStopInfo({ dayIndex, stop: { ...stop }, isWishlist })
  }

  const handleCloseDetailPanel = () => {
    setSelectedStopInfo(null)
  }

  const handleUpdateStop = async (
    dayIdx: number,
    updatedStop: ItineraryStop,
    isWishlist?: boolean
  ) => {
    setSelectedStopInfo({ dayIndex: dayIdx, stop: updatedStop, isWishlist })
    setHasUnsavedChanges(true)
    if (!plannerTrip) return

    if (!isWishlist && dayIdx !== -1) {
      const stopNumId = Number(updatedStop.id)
      if (stopNumId) {
        try {
          await tripService.updateTripPlace(stopNumId, {
            visitOrder: updatedStop.visitOrder,
            startTime: updatedStop.startTime,
            endTime: updatedStop.endTime,
            estimatedCost: updatedStop.costEstimate,
            transportMode: updatedStop.transportMode,
            note: updatedStop.note
          })
        } catch {
        }
      }
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      if (isWishlist || dayIdx === -1) {
        const updatedWishlist = (prev.backlogStops || []).map((s) =>
          s.id === updatedStop.id ? updatedStop : s
        )
        return { ...prev, backlogStops: updatedWishlist }
      }
      const updatedDays = prev.days.map((day, dIdx) => {
        if (dIdx === dayIdx) {
          const updatedStops = day.stops.map((s) =>
            s.id === updatedStop.id ? updatedStop : s
          )
          return { ...day, stops: updatedStops }
        }
        return day
      })
      const newTotal = updatedDays.reduce(
        (sum, d) =>
          sum + d.stops.reduce((sSum, s) => sSum + (s.costEstimate || 0), 0),
        0
      )
      return { ...prev, days: updatedDays, estimatedBudget: newTotal }
    })
  }

  const handleDeleteStop = async (stopId: string, name: string) => {
    if (currentUserRole === 'Viewer') {
      showToast('Bạn chỉ có quyền xem (Viewer).')
      return
    }

    const stopNumId = Number(stopId)
    if (stopNumId) {
      try {
        await tripService.deleteTripPlace(stopNumId)
      } catch {
      }
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedWishlist = (prev.backlogStops || []).filter((s) => s.id !== stopId)
      const updatedDays = prev.days.map((day) => {
        const remaining = day.stops.filter((s) => s.id !== stopId)
        return { ...day, stops: remaining }
      })
      const newTotal = updatedDays.reduce(
        (sum, d) =>
          sum + d.stops.reduce((sSum, s) => sSum + (s.costEstimate || 0), 0),
        0
      )
      return {
        ...prev,
        days: updatedDays,
        backlogStops: updatedWishlist,
        estimatedBudget: newTotal
      }
    })

    if (selectedStopInfo?.stop.id === stopId) {
      setSelectedStopInfo(null)
    }
    setHasUnsavedChanges(true)
    showToast(`Đã xóa "${name}".`)
  }

  const handleMoveStopToDay = (
    fromDayIdx: number,
    toDayIdx: number,
    stop: ItineraryStop
  ) => {
    if (fromDayIdx === toDayIdx || !plannerTrip) return
    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedDays = prev.days.map((day, dIdx) => {
        if (dIdx === fromDayIdx) {
          return { ...day, stops: day.stops.filter((s) => s.id !== stop.id) }
        }
        if (dIdx === toDayIdx) {
          return {
            ...day,
            stops: [...day.stops, { ...stop, visitOrder: day.stops.length + 1 }]
          }
        }
        return day
      })
      return { ...prev, days: updatedDays }
    })
    setHasUnsavedChanges(true)
    if (selectedStopInfo?.stop.id === stop.id) {
      setSelectedStopInfo({ dayIndex: toDayIdx, stop, isWishlist: false })
    }
    showToast(`Đã chuyển "${stop.name}" sang Ngày ${toDayIdx + 1}`)
  }

  const handleMoveStopToWishlist = (fromDayIdx: number, stop: ItineraryStop) => {
    if (!plannerTrip) return
    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedDays = prev.days.map((day, dIdx) => {
        if (dIdx === fromDayIdx) {
          return { ...day, stops: day.stops.filter((s) => s.id !== stop.id) }
        }
        return day
      })
      const updatedWishlist = [...(prev.backlogStops || []), stop]
      return { ...prev, days: updatedDays, backlogStops: updatedWishlist }
    })
    setHasUnsavedChanges(true)
    if (selectedStopInfo?.stop.id === stop.id) {
      setSelectedStopInfo({ dayIndex: -1, stop, isWishlist: true })
    }
    showToast(`Đã chuyển "${stop.name}" về Kho lưu trữ`)
  }

  const handleMoveWishlistToDay = (toDayIdx: number, stop: ItineraryStop) => {
    if (!plannerTrip) return
    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedWishlist = (prev.backlogStops || []).filter((s) => s.id !== stop.id)
      const updatedDays = prev.days.map((day, dIdx) => {
        if (dIdx === toDayIdx) {
          return {
            ...day,
            stops: [...day.stops, { ...stop, visitOrder: day.stops.length + 1 }]
          }
        }
        return day
      })
      return { ...prev, days: updatedDays, backlogStops: updatedWishlist }
    })
    setHasUnsavedChanges(true)
    if (selectedStopInfo?.stop.id === stop.id) {
      setSelectedStopInfo({ dayIndex: toDayIdx, stop, isWishlist: false })
    }
    showToast(`Đã xếp "${stop.name}" vào Ngày ${toDayIdx + 1}`)
  }

  const handleBatchMoveToDay = (targetDayIdx: number, stopIds: string[]) => {
    if (stopIds.length === 0 || !plannerTrip) return
    const idSet = new Set(stopIds)
    setPlannerTrip((prev) => {
      if (!prev) return null
      const movedStops: ItineraryStop[] = []
      const updatedWishlist = (prev.backlogStops || []).filter((s) => {
        if (idSet.has(s.id)) {
          movedStops.push(s)
          return false
        }
        return true
      })
      const updatedDays = prev.days.map((day, dIdx) => {
        if (dIdx === targetDayIdx) {
          const currentFiltered = day.stops.filter((s) => {
            if (idSet.has(s.id)) {
              movedStops.push(s)
              return false
            }
            return true
          })
          return { ...day, stops: [...currentFiltered, ...movedStops] }
        }
        return {
          ...day,
          stops: day.stops.filter((s) => {
            if (idSet.has(s.id)) {
              movedStops.push(s)
              return false
            }
            return true
          })
        }
      })
      return { ...prev, days: updatedDays, backlogStops: updatedWishlist }
    })
    setHasUnsavedChanges(true)
    showToast(`Đã chuyển ${stopIds.length} địa điểm sang Ngày ${targetDayIdx + 1}`)
  }

  const handleBatchMoveToWishlist = (stopIds: string[]) => {
    if (stopIds.length === 0 || !plannerTrip) return
    const idSet = new Set(stopIds)
    setPlannerTrip((prev) => {
      if (!prev) return null
      const movedStops: ItineraryStop[] = []
      const updatedDays = prev.days.map((day) => ({
        ...day,
        stops: day.stops.filter((s) => {
          if (idSet.has(s.id)) {
            movedStops.push(s)
            return false
          }
          return true
        })
      }))
      const updatedWishlist = [...(prev.backlogStops || []), ...movedStops]
      return { ...prev, days: updatedDays, backlogStops: updatedWishlist }
    })
    setHasUnsavedChanges(true)
    showToast(`Đã chuyển ${stopIds.length} địa điểm về Kho lưu trữ`)
  }

  const handleBatchDeleteStops = (stopIds: string[]) => {
    if (stopIds.length === 0 || !plannerTrip) return
    const idSet = new Set(stopIds)
    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedWishlist = (prev.backlogStops || []).filter((s) => !idSet.has(s.id))
      const updatedDays = prev.days.map((day) => ({
        ...day,
        stops: day.stops.filter((s) => !idSet.has(s.id))
      }))
      const newTotal = updatedDays.reduce(
        (sum, d) =>
          sum + d.stops.reduce((sSum, s) => sSum + (s.costEstimate || 0), 0),
        0
      )
      return {
        ...prev,
        days: updatedDays,
        backlogStops: updatedWishlist,
        estimatedBudget: newTotal
      }
    })
    setHasUnsavedChanges(true)
    showToast(`Đã xóa ${stopIds.length} địa điểm khỏi lịch trình`)
  }

  const handleQuickAddWishlistStop = (name: string) => {
    if (!plannerTrip) return
    const wishlistCount = plannerTrip.backlogStops?.length || 0

    const newStop: ItineraryStop = {
      id: `wishlist-${Date.now()}`,
      name,
      category: 'Tham quan di tích',
      area: 'Khu Trung tâm',
      time: '09:00',
      startTime: '09:00',
      endTime: '10:30',
      costEstimate: 50000,
      duration: '1.5 giờ',
      transportMode: 'Xe máy',
      visitOrder: wishlistCount + 1,
      note: 'Lưu vào kho chờ xếp lịch',
      img: ''
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedWishlist = [...(prev.backlogStops || []), newStop]
      return { ...prev, backlogStops: updatedWishlist }
    })
    setHasUnsavedChanges(true)
    setSelectedStopInfo({ dayIndex: -1, stop: newStop, isWishlist: true })
    showToast(`Đã lưu "${name}" vào Kho lưu trữ`)
  }

  const handleAddNewDay = async () => {
    if (currentUserRole === 'Viewer' || !plannerTrip) {
      showToast('Bạn chỉ có quyền xem (Viewer).')
      return
    }
    const nextDayNum = plannerTrip.days.length + 1
    const lastDay = plannerTrip.days[plannerTrip.days.length - 1]
    let nextDate: string | undefined = undefined
    if (lastDay?.date) {
      try {
        const d = new Date(lastDay.date)
        d.setDate(d.getDate() + 1)
        nextDate = d.toISOString().split('T')[0]
      } catch {
      }
    } else if (plannerTrip.startDate) {
      try {
        const d = new Date(plannerTrip.startDate)
        d.setDate(d.getDate() + (nextDayNum - 1))
        nextDate = d.toISOString().split('T')[0]
      } catch {
      }
    }

    const dayTitle = `Ngày ${nextDayNum}: Tiếp tục hành trình`
    const newDay: ItineraryDayData = {
      dayNumber: nextDayNum,
      title: dayTitle,
      date: nextDate,
      description: 'Chặng khám phá mới',
      stops: []
    }
    setPlannerTrip((prev) => {
      if (!prev) return null
      return {
        ...prev,
        durationDays: nextDayNum,
        nightsCount: Math.max(0, nextDayNum - 1),
        days: [...prev.days, newDay]
      }
    })
    setHasUnsavedChanges(true)
    const newIdx = plannerTrip.days.length
    setExpandedDayIndices((prev) => new Set([...prev, newIdx]))

    if (plannerTrip.id && plannerTrip.id < 1000000000000) {
      try {
        await tripService.addTripDay(plannerTrip.id, {
          dayTitle,
          date: nextDate
        })
      } catch {
      }
    }

    showToast(`Đã thêm Ngày ${nextDayNum}`)
  }

  const handleUpdateDay = async (
    dayIndex: number,
    title: string,
    date?: string
  ) => {
    if (currentUserRole === 'Viewer' || !plannerTrip) {
      showToast('Bạn chỉ có quyền xem (Viewer).')
      return
    }

    const targetDay = plannerTrip.days[dayIndex]
    if (!targetDay) return

    setPlannerTrip((prev) => {
      if (!prev) return null
      const updatedDays = prev.days.map((day, idx) => {
        if (idx === dayIndex) {
          return {
            ...day,
            title: title.trim(),
            date: date || undefined
          }
        }
        return day
      })
      return { ...prev, days: updatedDays }
    })
    setHasUnsavedChanges(true)

    if (plannerTrip.id && plannerTrip.id < 1000000000000) {
      try {
        await tripService.updateTripDay(plannerTrip.id, targetDay.dayNumber, {
          dayTitle: title.trim(),
          date: date || undefined
        })
      } catch {
      }
    }

    showToast(`Đã cập nhật thông tin Ngày ${targetDay.dayNumber}.`)
  }

  const handleDeleteDay = async (dayIdx: number) => {
    if (currentUserRole !== 'Owner' || !plannerTrip) {
      showToast('Chỉ Owner mới có quyền xóa ngày.')
      return
    }
    if (plannerTrip.days.length <= 1) {
      showToast('Chuyến đi cần tối thiểu 1 ngày.')
      return
    }

    const targetDay = plannerTrip.days[dayIdx]
    const targetDayNumber = targetDay?.dayNumber ?? dayIdx + 1
    const targetDate = targetDay?.date

    if (plannerTrip.id && plannerTrip.id < 1000000000000) {
      try {
        await tripService.deleteTripDay(plannerTrip.id, targetDayNumber)
      } catch {
      }
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      const filtered = prev.days.filter((_, idx) => idx !== dayIdx)
      const renumbered = filtered.map((d, idx) => {
        const newDayNum = idx + 1
        let updatedTitle = d.title
        if (updatedTitle) {
          updatedTitle = updatedTitle.replace(/^Ngày\s*\d+/, `Ngày ${newDayNum}`)
        } else {
          updatedTitle = `Ngày ${newDayNum}`
        }
        let updatedDate = d.date
        if (idx >= dayIdx && d.date && targetDate) {
          try {
            const prevD = new Date(d.date)
            prevD.setDate(prevD.getDate() - 1)
            updatedDate = prevD.toISOString().split('T')[0]
          } catch {
          }
        }
        return {
          ...d,
          dayNumber: newDayNum,
          title: updatedTitle,
          date: updatedDate
        }
      })
      return {
        ...prev,
        durationDays: renumbered.length,
        nightsCount: Math.max(0, renumbered.length - 1),
        days: renumbered
      }
    })
    setHasUnsavedChanges(true)
    setSelectedStopInfo(null)
    showToast('Đã xóa ngày khỏi lịch trình. Các ngày sau đã được tự động đánh số lại.')
  }

  const handleAddPlaceFromLibrary = async (
    place: {
      id: number
      name: string
      location: string
      category: string
      priceMax?: number
      image?: string
      desc?: string
      rating?: number
    },
    targetDayIdx: number = -1
  ) => {
    if (!plannerTrip) return
    const isWishlist = targetDayIdx === -1
    const dayNumber = targetDayIdx + 1
    const nextVisitOrder = targetDayIdx >= 0 ? (plannerTrip.days[targetDayIdx]?.stops?.length || 0) + 1 : 1

    let createdId = `place-${place.id}-${isWishlist ? 'w' : dayNumber}-${Date.now()}`

    if (!isWishlist && plannerTrip.id && plannerTrip.id < 1000000000000) {
      try {
        const res = await tripService.addTripPlace(plannerTrip.id, dayNumber, {
          placeId: place.id,
          visitOrder: nextVisitOrder,
          startTime: '09:00',
          endTime: '10:30',
          estimatedCost: place.priceMax || 50000,
          transportMode: 'Xe máy',
          note: place.desc
        })
        if (res.success && res.data?.id) {
          createdId = String(res.data.id)
        }
      } catch {
      }
    }

    const newStop: ItineraryStop = {
      id: createdId,
      placeId: place.id,
      time: '09:00',
      startTime: '09:00',
      endTime: '10:30',
      name: place.name,
      category: place.category || 'Tham quan di tích',
      area: 'Khu Trung tâm',
      address: place.location,
      note: place.desc || 'Trải nghiệm điểm đến',
      costEstimate: place.priceMax || 50000,
      duration: '1.5 giờ',
      transportMode: 'Xe máy',
      visitOrder: nextVisitOrder,
      img: place.image || '',
      rating: place.rating
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      if (isWishlist) {
        return { ...prev, backlogStops: [...(prev.backlogStops || []), newStop] }
      }
      const updatedDays = prev.days.map((day, dIdx) => {
        if (dIdx === targetDayIdx) {
          return { ...day, stops: [...day.stops, newStop] }
        }
        return day
      })
      const newTotal = updatedDays.reduce(
        (sum, d) =>
          sum + d.stops.reduce((sSum, s) => sSum + (s.costEstimate || 0), 0),
        0
      )
      return { ...prev, days: updatedDays, estimatedBudget: newTotal }
    })
    setHasUnsavedChanges(true)

    setSelectedStopInfo({
      dayIndex: targetDayIdx,
      stop: newStop,
      isWishlist
    })
    showToast(
      isWishlist
        ? `Đã thêm "${place.name}" vào Kho lưu trữ`
        : `Đã thêm "${place.name}" vào Ngày ${targetDayIdx + 1}`
    )
  }

  const handleInviteMember = async (email: string, role: TripRole) => {
    if (!plannerTrip) return
    try {
      await tripService.inviteMember(plannerTrip.id, { email, role })
    } catch {
    }

    const newMember = {
      id: Date.now(),
      name: email.split('@')[0] || 'Thành viên',
      avatar: '',
      role,
      email
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      return {
        ...prev,
        members: [...(prev.members || []), newMember]
      }
    })
    setHasUnsavedChanges(true)
    showToast(`Đã thêm thành viên: ${email}`)
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!plannerTrip) return
    if (currentUserRole !== 'Owner') {
      showToast('Chỉ Owner mới có quyền xóa thành viên.')
      return
    }

    if (plannerTrip.id && plannerTrip.id < 1000000000000) {
      try {
        await tripService.removeMember(plannerTrip.id, memberId)
      } catch {
      }
    }

    setPlannerTrip((prev) => {
      if (!prev) return null
      return {
        ...prev,
        members: (prev.members || []).filter((m) => m.id !== memberId)
      }
    })
    setHasUnsavedChanges(true)
    showToast('Đã xóa thành viên.')
  }

  const handleUpdateBudgetTarget = async (newBudget: number) => {
    if (!plannerTrip) return
    setPlannerTrip((prev) => prev ? { ...prev, budgetTarget: newBudget } : null)
    setHasUnsavedChanges(true)
    if (plannerTrip.id && plannerTrip.id < 1000000000000) {
      try {
        await tripService.updateTrip(plannerTrip.id, { budgetTarget: newBudget })
      } catch {
      }
    }
    showToast(`Đã cài đặt ngân sách đề ra: ${newBudget.toLocaleString('vi-VN')} đ`)
  }

  const handleViewPlaceDetails = (stop: ItineraryStop) => {
    navigate(`/explore?q=${encodeURIComponent(stop.name)}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {viewMode === 'planner' && plannerTrip ? (
        <ItineraryPlannerView
          itinerary={plannerTrip}
          expandedDayIndices={expandedDayIndices}
          isWishlistExpanded={isWishlistExpanded}
          selectedStopInfo={selectedStopInfo}
          currentUserRole={currentUserRole}
          isSaving={isSavingTrip}
          hasUnsavedChanges={hasUnsavedChanges}
          onSaveTrip={handleSaveTrip}
          onBackToCatalog={handleBackToCatalog}
          onUpdateTripTitle={handleUpdateTripTitle}
          onUpdateTripProvince={handleUpdateTripProvince}
          onToggleDay={toggleDay}
          onToggleAllDays={toggleAllDays}
          onToggleWishlist={toggleWishlist}
          onAddNewDay={handleAddNewDay}
          onDeleteDay={handleDeleteDay}
          onUpdateDay={handleUpdateDay}
          onOpenMemberModal={() => setIsMemberModalOpen(true)}
          onSelectStop={handleSelectStop}
          onCloseDetailPanel={handleCloseDetailPanel}
          onUpdateStop={handleUpdateStop}
          onDeleteStop={handleDeleteStop}
          onMoveStopToDay={handleMoveStopToDay}
          onMoveStopToWishlist={handleMoveStopToWishlist}
          onMoveWishlistToDay={handleMoveWishlistToDay}
          onBatchMoveToDay={handleBatchMoveToDay}
          onBatchMoveToWishlist={handleBatchMoveToWishlist}
          onBatchDeleteStops={handleBatchDeleteStops}
          onQuickAddWishlistStop={handleQuickAddWishlistStop}
          onPublishTrip={handlePublishTrip}
          onUpdateBudgetTarget={handleUpdateBudgetTarget}
          onViewPlaceDetails={handleViewPlaceDetails}
          onAddPlaceFromLibrary={handleAddPlaceFromLibrary}
        />
      ) : (
        <ItineraryCatalogView
          itineraries={catalogItineraries}
          searchQuery={appliedFilters.search}
          selectedDuration={appliedFilters.duration}
          selectedBudget={appliedFilters.budget}
          appliedItineraryIds={appliedItineraryIds}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onSelectDuration={handleSelectDuration}
          onSelectBudget={handleSelectBudget}
          onResetFilters={handleResetFilters}
          onApplyItinerary={handleApplyItinerary}
          onCreateTrip={() => navigate('/itinerary?mode=create')}
        />
      )}

      <ItineraryMemberModal
        isOpen={isMemberModalOpen}
        members={plannerTrip?.members || []}
        currentUserRole={currentUserRole}
        onClose={() => setIsMemberModalOpen(false)}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  )
}

export default ItineraryPage
