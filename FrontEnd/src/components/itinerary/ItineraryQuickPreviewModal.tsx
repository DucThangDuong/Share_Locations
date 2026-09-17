import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  MapPin,
  CheckCircle2,
  Plus,
  Compass,
  Sparkles
} from 'lucide-react'
import type { DetailedItineraryItem } from '@/types/models/itinerary.model'

interface ItineraryQuickPreviewModalProps {
  isOpen?: boolean
  itinerary: DetailedItineraryItem | null
  isApplied?: boolean
  onClose: () => void
  onApply: (itinerary: DetailedItineraryItem) => void
}

export const ItineraryQuickPreviewModal: React.FC<ItineraryQuickPreviewModalProps> = ({
  isOpen = true,
  itinerary,
  isApplied = false,
  onClose,
  onApply
}) => {
  useEffect(() => {
    if (!isOpen) return
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !itinerary) return null

  const totalStops = itinerary.days.reduce((acc, d) => acc + d.stops.length, 0)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 font-sans">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {itinerary.authorAvatar ? (
                <img
                  src={itinerary.authorAvatar}
                  alt={itinerary.authorName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {itinerary.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {itinerary.authorName}
                  </span>
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 fill-emerald-100 shrink-0"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {itinerary.authorRank || 'Chuyên gia hành trình'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Dự toán trọn gói
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-800">
                  {itinerary.estimatedBudget.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-700" />
              <span>Tóm tắt lịch trình</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {itinerary.description}
            </p>
            {itinerary.tags && itinerary.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {itinerary.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={13} className="text-emerald-700" />
                <span>Lộ trình {itinerary.days.length} ngày ({totalStops} điểm dừng)</span>
              </h3>
              <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <MapPin size={12} />
                {itinerary.province}
              </span>
            </div>

            <div className="space-y-3">
              {itinerary.days.map((day) => (
                <div
                  key={day.dayNumber}
                  className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Ngày {day.dayNumber}: {day.title.replace(/^Ngày\s*\d+\s*:\s*/i, '').trim()}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {day.stops.length} địa điểm
                    </span>
                  </div>

                  {day.stops.length > 0 ? (
                    <div className="space-y-1.5">
                      {day.stops.map((stop, sIdx) => (
                        <div
                          key={stop.id || sIdx}
                          className="flex items-center justify-between text-xs bg-white rounded-xl p-2 border border-slate-200/60 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {sIdx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate">
                                {stop.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {stop.time || stop.startTime} • {stop.category}
                                {stop.note && stop.note !== stop.name ? ` • ${stop.note}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="text-[11px] font-bold text-emerald-800">
                              {stop.costEstimate > 0
                                ? `${stop.costEstimate.toLocaleString('vi-VN')} đ`
                                : 'Miễn phí'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Chưa có điểm dừng nào được chỉ định.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Đóng</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onApply(itinerary)
              onClose()
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isApplied ? (
              <>
                <CheckCircle2 size={14} />
                <span>Đã áp dụng</span>
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={2.5} />
                <span>Áp dụng chuyến đi này</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ItineraryQuickPreviewModal
