import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  Car,
  MapPin,
  GripVertical,
  MoreVertical,
  ArrowRightLeft,
  ArrowDownToLine,
  Check,
  Pencil,
  X
} from 'lucide-react'
import type {
  ItineraryDayData,
  ItineraryStop,
  TripRole
} from '@/types/models/itinerary.model'
import { getCategoryBadgeStyle, getDayTheme } from '@/utils/itineraryStyles'

interface ItineraryDayTimelineSectionProps {
  day: ItineraryDayData
  dayIndex: number
  totalDays: number
  isExpanded: boolean
  currentUserRole: TripRole
  selectedStopId: string | null
  selectedBatchStopIds?: Set<string>
  dragOverDayIdx: number | null
  onToggleExpand: (dayIdx: number) => void
  onSelectStop: (dayIdx: number, stop: ItineraryStop) => void
  onToggleSelectBatchStop?: (stopId: string) => void
  onOpenPlacePicker: (dayIdx: number) => void
  onDeleteDay: (dayIdx: number) => void
  onUpdateDay?: (dayIndex: number, title: string, date?: string) => void
  onDeleteStop: (stopId: string, name: string) => void
  onMoveStopToDay: (fromDayIdx: number, toDayIdx: number, stop: ItineraryStop) => void
  onMoveStopToWishlist: (fromDayIdx: number, stop: ItineraryStop) => void
  onDragStartStop: (e: React.DragEvent, sourceDayIdx: number, stop: ItineraryStop) => void
  onDragOverDay: (e: React.DragEvent, dayIdx: number) => void
  onDragLeaveDay: (e: React.DragEvent) => void
  onDropOnDay: (e: React.DragEvent, targetDayIdx: number) => void
}

export const ItineraryDayTimelineSection: React.FC<ItineraryDayTimelineSectionProps> = ({
  day,
  dayIndex,
  totalDays,
  isExpanded,
  currentUserRole,
  selectedStopId,
  selectedBatchStopIds = new Set(),
  dragOverDayIdx,
  onToggleExpand,
  onSelectStop,
  onToggleSelectBatchStop,
  onOpenPlacePicker,
  onDeleteDay,
  onUpdateDay,
  onDeleteStop,
  onMoveStopToDay,
  onMoveStopToWishlist,
  onDragStartStop,
  onDragOverDay,
  onDragLeaveDay,
  onDropOnDay
}) => {
  const [activeMenuStopId, setActiveMenuStopId] = useState<string | null>(null)
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [tempTitle, setTempTitle] = useState(day.title || `Ngày ${day.dayNumber}`)
  const [tempDate, setTempDate] = useState(day.date || '')

  const roleLower = (currentUserRole || '').toLowerCase()
  const isOwner = roleLower === 'owner'
  const isEditor = roleLower === 'editor'
  const canEdit = isOwner || isEditor
  const dayCost = day.stops.reduce((sum, s) => sum + (s.costEstimate || 0), 0)
  const isDropTarget = dragOverDayIdx === dayIndex
  const dayTheme = getDayTheme(dayIndex)

  const handleSaveDayInfo = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation()
    const trimmed = tempTitle.trim() || `Ngày ${day.dayNumber}`
    onUpdateDay?.(dayIndex, trimmed, tempDate || undefined)
    setIsEditingInfo(false)
  }

  const handleCancelDayInfo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setTempTitle(day.title || `Ngày ${day.dayNumber}`)
    setTempDate(day.date || '')
    setIsEditingInfo(false)
  }

  return (
    <div
      onDragOver={canEdit ? (e) => onDragOverDay(e, dayIndex) : undefined}
      onDragLeave={canEdit ? onDragLeaveDay : undefined}
      onDrop={canEdit ? (e) => onDropOnDay(e, dayIndex) : undefined}
      className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs ${isDropTarget
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
          : 'border-slate-200'
        }`}
    >
      <div
        onClick={() => onToggleExpand(dayIndex)}
        className={`p-4 sm:p-5 transition-colors flex items-center justify-between gap-3 cursor-pointer border-b border-slate-200 ${isExpanded ? 'bg-slate-50/90 hover:bg-slate-100/90' : 'bg-white hover:bg-slate-50/80'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl ${dayTheme.badgeBg} text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0`}
          >
            N{day.dayNumber}
          </div>
          {isEditingInfo ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 min-w-0"
            >
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder={`Ngày ${day.dayNumber}: Tiêu đề`}
                className="w-full sm:w-auto flex-1 px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDayInfo(e)
                  if (e.key === 'Escape') handleCancelDayInfo()
                }}
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveDayInfo}
                  className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                  title="Lưu thay đổi"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleCancelDayInfo}
                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Hủy"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {day.title || `Ngày ${day.dayNumber}`}
                </h3>
                {day.date && (
                  <span className="hidden sm:inline-block text-xs text-slate-600 font-semibold">
                    • {day.date}
                  </span>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTempTitle(day.title || `Ngày ${day.dayNumber}`)
                      setTempDate(day.date || '')
                      setIsEditingInfo(true)
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Đổi tên & ngày"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                <span>{day.stops.length} điểm dừng</span>
                <span className="text-slate-300">•</span>
                <span>Dự tính:</span>
                <span className="font-extrabold text-emerald-800">
                  {dayCost.toLocaleString('vi-VN')} đ
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenPlacePicker(dayIndex)
              }}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Thêm điểm</span>
            </button>
          )}

          {canEdit && totalDays > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteDay(dayIndex)
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Xóa ngày này"
            >
              <Trash2 size={15} />
            </button>
          )}

          <div className="p-1 text-slate-600">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-2.5">
          {day.stops.map((stop, sIdx) => {
            const isSelected = selectedStopId === stop.id
            const isBatchSelected = selectedBatchStopIds.has(stop.id)
            const catStyle = getCategoryBadgeStyle(stop.category)

            return (
              <div
                key={stop.id}
                draggable={canEdit}
                onDragStart={(e) => onDragStartStop(e, dayIndex, stop)}
                onClick={() => onSelectStop(dayIndex, stop)}
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
                      title="Kéo thả để sắp xếp hoặc chuyển ngày"
                    >
                      <GripVertical size={15} />
                    </div>
                  )}

                  <div
                    className={`w-6 h-6 rounded-lg ${dayTheme.badgeBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                  >
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

                    </div>

                    <div className="flex items-center gap-2 text-[11px] mt-1.5 flex-wrap">
                      {(stop.startTime || stop.time) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 font-bold text-[10px]">
                          <Clock size={11} className="text-blue-700" />
                          <span>
                            {stop.startTime || stop.time}
                            {stop.endTime ? ` - ${stop.endTime}` : ''}
                          </span>
                        </span>
                      )}

                      {stop.transportMode && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]">
                          <Car size={11} className="text-slate-500" />
                          <span>{stop.transportMode}</span>
                        </span>
                      )}

                      {stop.address && (
                        <span className="text-slate-600 font-medium text-[11px] truncate max-w-xs sm:max-w-sm flex items-center gap-1">
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span>{stop.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-extrabold text-emerald-800 text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                    {(stop.costEstimate || 0).toLocaleString('vi-VN')} đ
                  </span>

                  {canEdit && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuStopId(
                            activeMenuStopId === stop.id ? null : stop.id
                          )
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {activeMenuStopId === stop.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onMoveStopToWishlist(dayIndex, stop)
                              setActiveMenuStopId(null)
                            }}
                            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <ArrowDownToLine size={13} className="text-emerald-700" />
                            <span>Chuyển về Kho lưu trữ</span>
                          </button>

                          {Array.from({ length: totalDays }).map((_, dIdx) => {
                            if (dIdx === dayIndex) return null
                            return (
                              <button
                                key={dIdx}
                                type="button"
                                onClick={() => {
                                  onMoveStopToDay(dayIndex, dIdx, stop)
                                  setActiveMenuStopId(null)
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <ArrowRightLeft size={13} className="text-blue-600" />
                                <span>Chuyển sang Ngày {dIdx + 1}</span>
                              </button>
                            )
                          })}

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              onDeleteStop(stop.id, stop.name)
                              setActiveMenuStopId(null)
                            }}
                            className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-semibold"
                          >
                            <Trash2 size={13} />
                            <span>Xóa khỏi ngày</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {day.stops.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
              <MapPin size={24} className="mx-auto text-slate-300" />
              <p className="text-xs text-slate-600 font-bold">
                Chưa có điểm dừng nào cho Ngày {day.dayNumber}.
              </p>
              <p className="text-[11px] text-slate-500">
                Kéo thả địa điểm từ Kho lưu trữ vào đây hoặc thêm điểm mới.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default ItineraryDayTimelineSection
