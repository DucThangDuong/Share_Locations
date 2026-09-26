import React from 'react'
import {
  X,
  ExternalLink,
  Clock,
  Car,
  MapPin,
  DollarSign,
  FileText
} from 'lucide-react'
import type {
  ItineraryStop,
  TransportType,
  TripRole
} from '@/types/models/itinerary.model'
import { getDayTheme } from '@/utils/itineraryStyles'

interface ItineraryStopDetailPanelProps {
  stop: ItineraryStop | null
  dayIndex: number
  isWishlist?: boolean
  currentUserRole: TripRole
  onClose: () => void
  onUpdateStop: (
    dayIdx: number,
    updatedStop: ItineraryStop,
    isWishlist?: boolean
  ) => void
  onViewPlaceDetails: (stop: ItineraryStop) => void
}

const TRANSPORT_OPTIONS: TransportType[] = [
  'Xe máy',
  'Ô tô',
  'Đi bộ',
  'Taxi',
  'Xe buýt',
  'Tàu hỏa',
  'Máy bay'
]

export const ItineraryStopDetailPanel: React.FC<ItineraryStopDetailPanelProps> = ({
  stop,
  dayIndex,
  isWishlist = false,
  currentUserRole,
  onClose,
  onUpdateStop,
  onViewPlaceDetails
}) => {

  if (!stop) return null

  const roleLower = (currentUserRole || '').toLowerCase()
  const isOwner = roleLower === 'owner'
  const isEditor = roleLower === 'editor'
  const canEdit = isOwner || isEditor
  const dayTheme = getDayTheme(dayIndex >= 0 ? dayIndex : 0)

  const handleChangeField = <K extends keyof ItineraryStop>(
    field: K,
    value: ItineraryStop[K]
  ) => {
    if (!canEdit) return
    const updated = { ...stop, [field]: value }
    onUpdateStop(dayIndex, updated, isWishlist)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full sticky top-20">
      <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg ${isWishlist ? 'bg-amber-500' : dayTheme.badgeBg
              } text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs`}
          >
            {isWishlist ? '★' : `#${dayIndex + 1}`}
          </div>
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider truncate">
            {isWishlist ? 'Địa điểm trong Kho lưu' : `Chi tiết Ngày ${dayIndex + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewPlaceDetails(stop)}
            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Xem trang thông tin địa điểm"
          >
            <span>Trang địa điểm</span>
            <ExternalLink size={12} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Đóng thanh chi tiết"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)] text-xs text-slate-700">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Tên điểm đến
          </label>
          <input
            type="text"
            disabled={!canEdit}
            value={stop.name}
            onChange={(e) => handleChangeField('name', e.target.value)}
            placeholder="Tên địa điểm..."
            className="w-full text-base sm:text-lg font-bold text-slate-900 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock size={12} className="text-emerald-700" />
              <span>Giờ đến</span>
            </label>
            <input
              type="time"
              disabled={!canEdit}
              value={stop.startTime || stop.time || '08:00'}
              onChange={(e) => {
                handleChangeField('startTime', e.target.value)
                handleChangeField('time', e.target.value)
              }}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-900 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock size={12} className="text-emerald-700" />
              <span>Giờ đi</span>
            </label>
            <input
              type="time"
              disabled={!canEdit}
              value={stop.endTime || '09:30'}
              onChange={(e) => handleChangeField('endTime', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-900 font-bold outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-700" />
              <span>Chi phí dự tính (VNĐ)</span>
            </label>
            <input
              type="number"
              step={10000}
              min={0}
              disabled={!canEdit}
              placeholder="0"
              value={stop.costEstimate ? stop.costEstimate : ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '') {
                  handleChangeField('costEstimate', 0)
                } else {
                  const parsed = parseInt(val, 10)
                  handleChangeField('costEstimate', isNaN(parsed) ? 0 : Math.max(0, parsed))
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-emerald-900 font-extrabold text-sm outline-none"
            />
          </div>

          <div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Car size={12} className="text-emerald-700" />
                <span>Phương tiện</span>
              </label>
              <select
                disabled={!canEdit}
                value={stop.transportMode || 'Xe máy'}
                onChange={(e) =>
                  handleChangeField('transportMode', e.target.value as TransportType)
                }
                className="w-full px-2.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-800 font-semibold outline-none cursor-pointer text-xs"
              >
                {TRANSPORT_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <MapPin size={12} className="text-red-500" />
            <span>Địa chỉ cụ thể</span>
          </label>
          <input
            type="text"
            disabled={!canEdit}
            value={stop.address || ''}
            onChange={(e) => handleChangeField('address', e.target.value)}
            placeholder="Nhập địa chỉ..."
            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <FileText size={12} className="text-slate-500" />
            <span>Ghi chú kinh nghiệm du lịch</span>
          </label>
          <textarea
            rows={3}
            disabled={!canEdit}
            value={stop.note || ''}
            onChange={(e) => handleChangeField('note', e.target.value)}
            placeholder="Món ngon nên gọi, thời điểm chụp ảnh đẹp, lưu ý gửi xe, giá vé..."
            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-slate-800 outline-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}

export default ItineraryStopDetailPanel
