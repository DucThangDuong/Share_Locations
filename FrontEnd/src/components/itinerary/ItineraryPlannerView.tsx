import React, { useState, useMemo } from 'react'
import type {
  DetailedItineraryItem,
  ItineraryStop,
  TripRole
} from '@/types/models/itinerary.model'
import { ItineraryPlannerToolbar } from './ItineraryPlannerToolbar'
import { ItineraryFilterBar } from './ItineraryFilterBar'
import { ItineraryDayTimelineSection } from './ItineraryDayTimelineSection'
import { ItineraryWishlistSection } from './ItineraryWishlistSection'
import { ItineraryStopDetailPanel } from './ItineraryStopDetailPanel'
import { ItineraryBatchActionBar } from './ItineraryBatchActionBar'

interface ItineraryPlannerViewProps {
  itinerary: DetailedItineraryItem
  expandedDayIndices: Set<number>
  isWishlistExpanded: boolean
  selectedStopInfo: {
    dayIndex: number
    stop: ItineraryStop
    isWishlist?: boolean
  } | null
  currentUserRole: TripRole
  onBackToCatalog: () => void
  onUpdateTripTitle: (title: string) => void
  onUpdateTripProvince: (province: string) => void
  onToggleDay: (dayIdx: number) => void
  onToggleAllDays: () => void
  onToggleWishlist: () => void
  onAddNewDay: () => void
  onDeleteDay: (dayIdx: number) => void
  onOpenPlacePicker: (dayIdx?: number) => void
  onOpenMemberModal: () => void
  onSelectStop: (dayIdx: number, stop: ItineraryStop, isWishlist?: boolean) => void
  onCloseDetailPanel: () => void
  onUpdateStop: (
    dayIdx: number,
    updatedStop: ItineraryStop,
    isWishlist?: boolean
  ) => void
  onDeleteStop: (stopId: string, name: string) => void
  onMoveStopToDay: (
    fromDayIdx: number,
    toDayIdx: number,
    stop: ItineraryStop
  ) => void
  onMoveStopToWishlist: (fromDayIdx: number, stop: ItineraryStop) => void
  onMoveWishlistToDay: (toDayIdx: number, stop: ItineraryStop) => void
  onBatchMoveToDay: (targetDayIdx: number, stopIds: string[]) => void
  onBatchMoveToWishlist: (stopIds: string[]) => void
  onBatchDeleteStops: (stopIds: string[]) => void
  onQuickAddWishlistStop: (name: string) => void
  onPublishTrip: () => void
  onUpdateBudgetTarget: (newBudget: number) => void
  onViewPlaceDetails: (stop: ItineraryStop) => void
  onSaveTrip?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

export const ItineraryPlannerView: React.FC<ItineraryPlannerViewProps> = ({
  itinerary,
  expandedDayIndices,
  isWishlistExpanded,
  selectedStopInfo,
  currentUserRole,
  isSaving = false,
  hasUnsavedChanges = false,
  onBackToCatalog,
  onUpdateTripTitle,
  onUpdateTripProvince,
  onToggleDay,
  onToggleAllDays,
  onToggleWishlist,
  onAddNewDay,
  onDeleteDay,
  onOpenPlacePicker,
  onOpenMemberModal,
  onSelectStop,
  onCloseDetailPanel,
  onUpdateStop,
  onDeleteStop,
  onMoveStopToDay,
  onMoveStopToWishlist,
  onMoveWishlistToDay,
  onBatchMoveToDay,
  onBatchMoveToWishlist,
  onBatchDeleteStops,
  onQuickAddWishlistStop,
  onPublishTrip,
  onUpdateBudgetTarget,
  onViewPlaceDetails,
  onSaveTrip
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBatchStopIds, setSelectedBatchStopIds] = useState<Set<string>>(new Set())

  const [draggedStopData, setDraggedStopData] = useState<{
    sourceDayIdx: number
    stop: ItineraryStop
  } | null>(null)
  const [dragOverTargetIdx, setDragOverTargetIdx] = useState<number | null>(null)

  const canEdit = currentUserRole !== 'Viewer'

  const allStopsFlat = useMemo(() => {
    const fromDays = itinerary.days.flatMap((d) => d.stops)
    const fromWishlist = itinerary.backlogStops || []
    return [...fromDays, ...fromWishlist]
  }, [itinerary.days, itinerary.backlogStops])

  const totalStopsCount = allStopsFlat.length
  const totalTripCost = itinerary.days.reduce(
    (sum, d) =>
      sum + d.stops.reduce((sSum, s) => sSum + (s.costEstimate || 0), 0),
    0
  )

  const availableAreas = useMemo(() => {
    const areas = new Set<string>()
    allStopsFlat.forEach((s) => {
      if (s.area) areas.add(s.area)
      else if (s.address) {
        if (s.address.includes('Hoàn Kiếm')) areas.add('Khu Phố Cổ / Hoàn Kiếm')
        else if (s.address.includes('Hồ Tây')) areas.add('Khu Hồ Tây')
        else if (s.address.includes('Đà Lạt')) areas.add('Khu Trung tâm Đà Lạt')
        else if (s.address.includes('Cầu Đất')) areas.add('Khu Cầu Đất')
        else if (s.address.includes('Tuyền Lâm')) areas.add('Khu Tuyền Lâm')
      }
    })
    if (areas.size === 0) {
      areas.add('Khu Trung tâm')
      areas.add('Khu Ngoại thành')
      areas.add('Khu Điểm ngắm cảnh')
    }
    return Array.from(areas)
  }, [allStopsFlat])

  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    allStopsFlat.forEach((s) => {
      if (s.category) cats.add(s.category)
    })
    return Array.from(cats)
  }, [allStopsFlat])

  const isAllExpanded = expandedDayIndices.size === itinerary.days.length

  const filterStop = (stop: ItineraryStop) => {
    if (selectedCategory !== 'all' && stop.category !== selectedCategory) {
      return false
    }
    if (selectedArea !== 'all') {
      const matchAreaField = stop.area === selectedArea
      const matchAddr = (stop.address || '').includes(selectedArea)
      if (!matchAreaField && !matchAddr) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = stop.name.toLowerCase().includes(q)
      const matchCat = (stop.category || '').toLowerCase().includes(q)
      const matchAddr = (stop.address || '').toLowerCase().includes(q)
      const matchNote = (stop.note || '').toLowerCase().includes(q)
      return matchName || matchCat || matchAddr || matchNote
    }
    return true
  }

  const filteredDays = useMemo(() => {
    return itinerary.days.map((day) => ({
      ...day,
      stops: day.stops.filter(filterStop)
    }))
  }, [itinerary.days, searchQuery, selectedArea, selectedCategory])

  const filteredWishlist = useMemo(() => {
    return (itinerary.backlogStops || []).filter(filterStop)
  }, [itinerary.backlogStops, searchQuery, selectedArea, selectedCategory])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedArea('all')
    setSelectedCategory('all')
  }

  const handleToggleSelectBatchStop = (stopId: string) => {
    setSelectedBatchStopIds((prev) => {
      const next = new Set(prev)
      if (next.has(stopId)) {
        next.delete(stopId)
      } else {
        next.add(stopId)
      }
      return next
    })
  }

  const handleClearBatchSelection = () => {
    setSelectedBatchStopIds(new Set())
  }

  const handleExecuteBatchMoveToDay = (targetDayIdx: number) => {
    const stopIds = Array.from(selectedBatchStopIds)
    onBatchMoveToDay(targetDayIdx, stopIds)
    setSelectedBatchStopIds(new Set())
  }

  const handleExecuteBatchMoveToWishlist = () => {
    const stopIds = Array.from(selectedBatchStopIds)
    onBatchMoveToWishlist(stopIds)
    setSelectedBatchStopIds(new Set())
  }

  const handleExecuteBatchDelete = () => {
    const stopIds = Array.from(selectedBatchStopIds)
    onBatchDeleteStops(stopIds)
    setSelectedBatchStopIds(new Set())
  }

  const handleDragStartStop = (
    e: React.DragEvent,
    sourceDayIdx: number,
    stop: ItineraryStop
  ) => {
    if (!canEdit) return
    setDraggedStopData({ sourceDayIdx, stop })
    e.dataTransfer.setData('text/plain', stop.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverDay = (e: React.DragEvent, dayIdx: number) => {
    if (!canEdit) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTargetIdx !== dayIdx) {
      setDragOverTargetIdx(dayIdx)
    }
  }

  const handleDragLeave = () => {
    setDragOverTargetIdx(null)
  }

  const handleDropOnDay = (e: React.DragEvent, targetDayIdx: number) => {
    e.preventDefault()
    setDragOverTargetIdx(null)
    if (!draggedStopData || !canEdit) return

    const { sourceDayIdx, stop } = draggedStopData
    if (sourceDayIdx === -1) {
      onMoveWishlistToDay(targetDayIdx, stop)
    } else if (sourceDayIdx !== targetDayIdx) {
      onMoveStopToDay(sourceDayIdx, targetDayIdx, stop)
    }
    setDraggedStopData(null)
  }

  const handleDropOnWishlist = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverTargetIdx(null)
    if (!draggedStopData || !canEdit) return

    const { sourceDayIdx, stop } = draggedStopData
    if (sourceDayIdx !== -1) {
      onMoveStopToWishlist(sourceDayIdx, stop)
    }
    setDraggedStopData(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-28 relative">
      <ItineraryPlannerToolbar
        itinerary={itinerary}
        currentUserRole={currentUserRole}
        totalStopsCount={totalStopsCount}
        totalTripCost={totalTripCost}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onBackToCatalog={onBackToCatalog}
        onUpdateTitle={onUpdateTripTitle}
        onUpdateProvince={onUpdateTripProvince}
        onOpenMemberModal={onOpenMemberModal}
        onPublishTrip={onPublishTrip}
        onUpdateBudgetTarget={onUpdateBudgetTarget}
        onSaveTrip={onSaveTrip}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <ItineraryFilterBar
          searchQuery={searchQuery}
          selectedArea={selectedArea}
          selectedCategory={selectedCategory}
          availableAreas={availableAreas}
          availableCategories={availableCategories}
          isAllExpanded={isAllExpanded}
          canEdit={canEdit}
          onSearchChange={setSearchQuery}
          onSelectArea={setSelectedArea}
          onSelectCategory={setSelectedCategory}
          onResetFilters={handleResetFilters}
          onToggleAllDays={onToggleAllDays}
          onAddNewDay={onAddNewDay}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            className={`space-y-6 ${selectedStopInfo ? 'lg:col-span-8' : 'lg:col-span-12'
              }`}
          >
            <div className="space-y-4">
              {filteredDays.map((day, dIdx) => (
                <ItineraryDayTimelineSection
                  key={day.dayNumber}
                  day={day}
                  dayIndex={dIdx}
                  totalDays={itinerary.days.length}
                  isExpanded={expandedDayIndices.has(dIdx)}
                  currentUserRole={currentUserRole}
                  selectedStopId={selectedStopInfo?.stop.id || null}
                  selectedBatchStopIds={selectedBatchStopIds}
                  dragOverDayIdx={dragOverTargetIdx}
                  onToggleExpand={onToggleDay}
                  onSelectStop={onSelectStop}
                  onToggleSelectBatchStop={handleToggleSelectBatchStop}
                  onOpenPlacePicker={onOpenPlacePicker}
                  onDeleteDay={onDeleteDay}
                  onDeleteStop={onDeleteStop}
                  onMoveStopToDay={onMoveStopToDay}
                  onMoveStopToWishlist={onMoveStopToWishlist}
                  onDragStartStop={handleDragStartStop}
                  onDragOverDay={handleDragOverDay}
                  onDragLeaveDay={handleDragLeave}
                  onDropOnDay={handleDropOnDay}
                />
              ))}
            </div>

            <ItineraryWishlistSection
              stops={filteredWishlist}
              totalDays={itinerary.days.length}
              isExpanded={isWishlistExpanded}
              currentUserRole={currentUserRole}
              selectedStopId={selectedStopInfo?.stop.id || null}
              selectedBatchStopIds={selectedBatchStopIds}
              isDropTarget={dragOverTargetIdx === -1}
              onToggleExpand={onToggleWishlist}
              onSelectStop={(stop) => onSelectStop(-1, stop, true)}
              onToggleSelectBatchStop={handleToggleSelectBatchStop}
              onMoveStopToDay={onMoveWishlistToDay}
              onDeleteStop={onDeleteStop}
              onQuickAddStop={onQuickAddWishlistStop}
              onOpenPlacePicker={() => onOpenPlacePicker(-1)}
              onDragStartStop={(e, stop) => handleDragStartStop(e, -1, stop)}
              onDragOverWishlist={(e) => {
                e.preventDefault()
                if (dragOverTargetIdx !== -1) setDragOverTargetIdx(-1)
              }}
              onDragLeaveWishlist={handleDragLeave}
              onDropOnWishlist={handleDropOnWishlist}
            />
          </div>

          {selectedStopInfo && (
            <aside className="lg:col-span-4 sticky top-20">
              <ItineraryStopDetailPanel
                stop={selectedStopInfo.stop}
                dayIndex={selectedStopInfo.dayIndex}
                isWishlist={selectedStopInfo.isWishlist}
                currentUserRole={currentUserRole}
                availableAreas={availableAreas}
                onClose={onCloseDetailPanel}
                onUpdateStop={onUpdateStop}
                onViewPlaceDetails={onViewPlaceDetails}
              />
            </aside>
          )}
        </div>
      </main>

      <ItineraryBatchActionBar
        selectedCount={selectedBatchStopIds.size}
        totalDays={itinerary.days.length}
        canEdit={canEdit}
        onClearSelection={handleClearBatchSelection}
        onBatchMoveToDay={handleExecuteBatchMoveToDay}
        onBatchMoveToWishlist={handleExecuteBatchMoveToWishlist}
        onBatchDelete={handleExecuteBatchDelete}
      />
    </div>
  )
}

export default ItineraryPlannerView
