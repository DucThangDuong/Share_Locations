import React from 'react'
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  GripVertical,
  MapPin,
  Check
} from 'lucide-react'
import type {
  ItineraryStop,
  TripRole
} from '@/types/models/itinerary.model'
import { getCategoryBadgeStyle } from '@/utils/itineraryStyles'

interface ItineraryWishlistSectionProps {
  stops: ItineraryStop[]
  totalDays: number
  isExpanded: boolean
  currentUserRole: TripRole
  selectedStopId: string | null
  selectedBatchStopIds?: Set<string>
  isDropTarget: boolean
  onToggleExpand: () => void
  onSelectStop: (stop: ItineraryStop) => void
  onToggleSelectBatchStop?: (stopId: string) => void
  onMoveStopToDay: (toDayIdx: number, stop: ItineraryStop) => void
  onDeleteStop: (stopId: string, name: string) => void
  onQuickAddStop: (name: string) => void
  onOpenPlacePicker: () => void
  onDragStartStop: (e: React.DragEvent, stop: ItineraryStop) => void
  onDragOverWishlist: (e: React.DragEvent) => void
  onDragLeaveWishlist: (e: React.DragEvent) => void
  onDropOnWishlist: (e: React.DragEvent) => void
}

export const ItineraryWishlistSection: React.FC<ItineraryWishlistSectionProps> = ({
  stops,
  isExpanded,
  currentUserRole,
  selectedStopId,
  selectedBatchStopIds = new Set(),
  isDropTarget,
  onToggleExpand,
  onSelectStop,
  onToggleSelectBatchStop,
  onDragStartStop,
  onDragOverWishlist,
  onDragLeaveWishlist,
  onDropOnWishlist
}) => {

  const roleLower = (currentUserRole || '').toLowerCase()
  const isOwner = roleLower === 'owner'
  const isEditor = roleLower === 'editor'
  const canEdit = isOwner || isEditor

  return (
    <div
      onDragOver={canEdit ? onDragOverWishlist : undefined}
      onDragLeave={canEdit ? onDragLeaveWishlist : undefined}
      onDrop={canEdit ? onDropOnWishlist : undefined}
      className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs ${isDropTarget
        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
        : 'border-slate-200'
        }`}
    >
      <div
        onClick={onToggleExpand}
        className={`p-4 sm:p-5 transition-colors flex items-center justify-between gap-3 cursor-pointer border-b border-slate-200 ${isExpanded ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'bg-white hover:bg-slate-50/80'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
            <Bookmark size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              Kho địa điểm đã lưu
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {stops.length} địa điểm yêu thích · Kéo thả trực tiếp vào từng ngày
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
            {stops.length} địa điểm
          </span>

          <div className="p-1 text-slate-600">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-2.5">
          {stops.map((stop, sIdx) => {
            const isSelected = selectedStopId === stop.id
            const isBatchSelected = selectedBatchStopIds.has(stop.id)
            const catStyle = getCategoryBadgeStyle(stop.category)

            return (
              <div
                key={stop.id}
                draggable={canEdit}
                onDragStart={(e) => onDragStartStop(e, stop)}
                onClick={() => onSelectStop(stop)}
                className={`group p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs cursor-pointer ${isBatchSelected
                  ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/30'
                  : isSelected
                    ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelectBatchStop?.(stop.id)
                      }}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isBatchSelected
                        ? 'bg-emerald-800 border-emerald-800 text-white'
                        : 'border-slate-400 hover:border-emerald-600 bg-white shadow-2xs'
                        }`}
                      title={isBatchSelected ? 'Bỏ chọn' : 'Chọn địa điểm này'}
                    >
                      {isBatchSelected && <Check size={11} strokeWidth={3} />}
                    </button>
                  )}

                  {canEdit && (
                    <div
                      className="text-slate-400 group-hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0"
                      title="Kéo thả vào bất kỳ Ngày nào ở trên"
                    >
                      <GripVertical size={15} />
                    </div>
                  )}

                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {sIdx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {stop.name}
                      </span>

                      {stop.category && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {stop.category}
                        </span>
                      )}

                      {stop.area && (
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-semibold items-center gap-1">
                          <MapPin size={10} className="text-slate-500" />
                          <span>{stop.area}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1 flex-wrap font-medium">
                      {(stop.costEstimate || 0) > 0 && (
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          ~{(stop.costEstimate || 0).toLocaleString('vi-VN')} đ
                        </span>
                      )}

                      {stop.address && (
                        <span className="text-slate-600 font-medium truncate max-w-xs sm:max-w-sm">
                          {stop.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ItineraryWishlistSection
