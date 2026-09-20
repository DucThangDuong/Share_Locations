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
import { ItineraryPlacePickerDrawer, type PlaceItem } from './ItineraryPlacePickerDrawer'

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
  onUpdateDay?: (dayIndex: number, title: string, date?: string) => void
  onOpenPlacePicker?: (dayIdx?: number) => void
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
  onAddPlaceFromLibrary?: (place: PlaceItem, targetDayIdx: number) => void
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
  onUpdateDay,
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
  onAddPlaceFromLibrary,
  onSaveTrip
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatchStopIds, setSelectedBatchStopIds] = useState<Set<string>>(new Set())
  const [dragOverTargetIdx, setDragOverTargetIdx] = useState<number | null>(null)
  const [explorerTargetDayIdx, setExplorerTargetDayIdx] = useState<number>(-1)

  const canEdit = currentUserRole !== 'Viewer'
  const isAllExpanded = expandedDayIndices.size === itinerary.days.length

  const allStops = useMemo(() => {
    const fromDays = itinerary.days.flatMap((d) => d.stops)
    const fromWishlist = itinerary.backlogStops || []
    return [...fromDays, ...fromWishlist]
  }, [itinerary])

  const totalStopsCount = allStops.length
  const totalTripCost = itinerary.days.reduce(
    (sum, d) =>
      sum + d.stops.reduce((sSum, s) => sSum + (s.costEstimate || 0), 0),
    0
  )

  const filterStop = (stop: ItineraryStop) => {
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
    return itinerary.days.map((d) => ({
      ...d,
      stops: d.stops.filter(filterStop)
    }))
  }, [itinerary.days, searchQuery])

  const filteredWishlist = useMemo(() => {
    return (itinerary.backlogStops || []).filter(filterStop)
  }, [itinerary.backlogStops, searchQuery])

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
    if (selectedBatchStopIds.size === 0) return
    const stopIds = Array.from(selectedBatchStopIds)
    onBatchMoveToDay(targetDayIdx, stopIds)
    setSelectedBatchStopIds(new Set())
  }

  const handleExecuteBatchMoveToWishlist = () => {
    if (selectedBatchStopIds.size === 0) return
    const stopIds = Array.from(selectedBatchStopIds)
    onBatchMoveToWishlist(stopIds)
    setSelectedBatchStopIds(new Set())
  }

  const handleExecuteBatchDelete = () => {
    if (selectedBatchStopIds.size === 0) return
    const stopIds = Array.from(selectedBatchStopIds)
    onBatchDeleteStops(stopIds)
    setSelectedBatchStopIds(new Set())
  }

  const handleDragStartStop = (
    e: React.DragEvent,
    fromDayIdx: number,
    stop: ItineraryStop
  ) => {
    if (!canEdit) return
    e.dataTransfer.setData('text/plain', JSON.stringify({ fromDayIdx, stop }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverDay = (e: React.DragEvent, dIdx: number) => {
    if (!canEdit) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTargetIdx !== dIdx) {
      setDragOverTargetIdx(dIdx)
    }
  }

  const handleDragLeave = () => {
    setDragOverTargetIdx(null)
  }

  const handleDropOnDay = (e: React.DragEvent, toDayIdx: number) => {
    e.preventDefault()
    setDragOverTargetIdx(null)
    if (!canEdit) return
    try {
      const dataStr = e.dataTransfer.getData('text/plain')
      if (!dataStr) return
      const { fromDayIdx, stop } = JSON.parse(dataStr) as {
        fromDayIdx: number
        stop: ItineraryStop
      }
      if (fromDayIdx === -1) {
        onMoveWishlistToDay(toDayIdx, stop)
      } else if (fromDayIdx !== toDayIdx) {
        onMoveStopToDay(fromDayIdx, toDayIdx, stop)
      }
    } catch {
    }
  }

  const handleDropOnWishlist = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverTargetIdx(null)
    if (!canEdit) return
    try {
      const dataStr = e.dataTransfer.getData('text/plain')
      if (!dataStr) return
      const { fromDayIdx, stop } = JSON.parse(dataStr) as {
        fromDayIdx: number
        stop: ItineraryStop
      }
      if (fromDayIdx !== -1) {
        onMoveStopToWishlist(fromDayIdx, stop)
      }
    } catch {
    }
  }

  const handleTriggerOpenPlacePicker = (dayIdx: number = -1) => {
    setExplorerTargetDayIdx(dayIdx)
    onOpenPlacePicker?.(dayIdx)
    const el = document.getElementById('itinerary-place-explorer')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased pb-28 relative">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <ItineraryFilterBar
          searchQuery={searchQuery}
          isAllExpanded={isAllExpanded}
          canEdit={canEdit}
          onSearchChange={setSearchQuery}
          onToggleAllDays={onToggleAllDays}
          onAddNewDay={onAddNewDay}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            className={`space-y-6 transition-all duration-300 ${selectedStopInfo ? 'lg:col-span-8' : 'lg:col-span-12'
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
                  onOpenPlacePicker={() => handleTriggerOpenPlacePicker(dIdx)}
                  onDeleteDay={onDeleteDay}
                  onUpdateDay={onUpdateDay}
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
              onOpenPlacePicker={() => handleTriggerOpenPlacePicker(-1)}
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
                onClose={onCloseDetailPanel}
                onUpdateStop={onUpdateStop}
                onViewPlaceDetails={onViewPlaceDetails}
              />
            </aside>
          )}
        </div>

        <div className="w-full pt-2">
          <ItineraryPlacePickerDrawer
            targetDayIndex={explorerTargetDayIdx}
            days={itinerary.days.map((d) => ({
              dayNumber: d.dayNumber,
              title: d.title || `Ngày ${d.dayNumber}`
            }))}
            onAddPlace={(place, targetIdx) => {
              onAddPlaceFromLibrary?.(place, targetIdx)
            }}
          />
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
