import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  Send,
  Lock,
  Pencil,
  DollarSign,
  AlertTriangle,
  Check,
  Save,
  Loader2,
  Calendar,
  X
} from 'lucide-react'
import type {
  DetailedItineraryItem,
  TripRole
} from '@/types/models/itinerary.model'

interface ItineraryPlannerToolbarProps {
  itinerary: DetailedItineraryItem
  currentUserRole: TripRole
  totalStopsCount: number
  totalTripCost: number
  isSaving?: boolean
  hasUnsavedChanges?: boolean
  onBackToCatalog: () => void
  onUpdateTitle: (title: string) => void
  onOpenMemberModal: () => void
  onPublishTrip: () => void
  onUpdateBudgetTarget: (newBudget: number) => void
  onUpdateDates?: (newStartDate?: string, newEndDate?: string) => void
  onSaveTrip?: () => void
}

const BUDGET_PRESETS = [3000000, 5000000, 8000000, 10000000, 15000000, 20000000]

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

const computeEndDateFromStart = (startStr: string, daysCount: number): string => {
  if (!startStr || daysCount <= 0) return ''
  try {
    const d = new Date(startStr)
    d.setDate(d.getDate() + Math.max(0, daysCount - 1))
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export const ItineraryPlannerToolbar: React.FC<ItineraryPlannerToolbarProps> = ({
  itinerary,
  currentUserRole,
  totalStopsCount,
  totalTripCost,
  isSaving = false,
  hasUnsavedChanges = false,
  onBackToCatalog,
  onUpdateTitle,
  onOpenMemberModal,
  onPublishTrip,
  onUpdateBudgetTarget,
  onUpdateDates,
  onSaveTrip
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [customBudgetString, setCustomBudgetString] = useState(
    String(itinerary.budgetTarget || 5000000)
  )

  const [isEditingDates, setIsEditingDates] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(itinerary.startDate || '')
  const [tempEndDate, setTempEndDate] = useState(
    itinerary.endDate || computeEndDateFromStart(itinerary.startDate || '', itinerary.days.length)
  )

  useEffect(() => {
    setTempStartDate(itinerary.startDate || '')
    setTempEndDate(
      itinerary.endDate || computeEndDateFromStart(itinerary.startDate || '', itinerary.days.length)
    )
  }, [itinerary.startDate, itinerary.endDate, itinerary.days.length])

  const roleLower = (currentUserRole || '').toLowerCase()
  const isPublished = itinerary.privacy === 0 || String(itinerary.privacy).toLowerCase() === 'public'
  const canEdit = !isPublished && (roleLower === 'owner' || roleLower === 'editor')
  const budgetTarget = itinerary.budgetTarget || 5000000
  const members = itinerary.members || []

  const percentUsed = budgetTarget > 0 ? Math.round((totalTripCost / budgetTarget) * 100) : 0
  const isOverBudget = totalTripCost > budgetTarget
  const remainingBudget = Math.max(0, budgetTarget - totalTripCost)

  const handleSaveBudget = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const parsed = parseInt(customBudgetString.replace(/\D/g, ''), 10) || 0
    onUpdateBudgetTarget(Math.max(0, parsed))
    setIsEditingBudget(false)
  }

  const handleStartDateChange = (newStart: string) => {
    setTempStartDate(newStart)
    const computedEnd = computeEndDateFromStart(newStart, itinerary.days.length)
    setTempEndDate(computedEnd)
  }

  const handleSaveDates = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    onUpdateDates?.(tempStartDate || undefined, tempEndDate || undefined)
    setIsEditingDates(false)
  }

  const handleQuickSetToday = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    handleStartDateChange(todayStr)
  }

  const handleQuickSetTomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    handleStartDateChange(d.toISOString().split('T')[0])
  }

  const handleQuickSetNextWeekend = () => {
    const d = new Date()
    const dayOfWeek = d.getDay()
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7
    d.setDate(d.getDate() + daysUntilSaturday)
    handleStartDateChange(d.toISOString().split('T')[0])
  }

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBackToCatalog}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách chuyến đi"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <input
                type="text"
                disabled={!canEdit}
                value={itinerary.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                placeholder="Nhập tên chuyến đi..."
                className="font-extrabold text-base sm:text-xl text-slate-900 bg-transparent outline-none focus:bg-slate-50 rounded-lg transition-all w-full tracking-tight truncate disabled:cursor-default"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              onClick={onOpenMemberModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
              title="Xem danh sách thành viên trong chuyến đi & Mời bạn bè"
            >
              <div className="flex items-center -space-x-2 overflow-hidden">
                {members.slice(0, 3).map((m) =>
                  m.avatar ? (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt={m.name}
                      className="w-6 h-6 rounded-full object-cover border-2 border-white ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white ring-1 ring-slate-200 shrink-0"
                    >
                      {(m.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                <Users size={13} className="text-slate-500" />
                <span>{members.length} người</span>
              </div>
            </div>

            {canEdit && onSaveTrip && (
              <button
                type="button"
                onClick={onSaveTrip}
                disabled={isSaving}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${isSaving
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                title="Lưu lại toàn bộ lịch trình và địa điểm đã chọn"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-emerald-600" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} className={hasUnsavedChanges ? 'text-white' : 'text-slate-500'} />
                    <span>{hasUnsavedChanges ? 'Lưu thay đổi *' : 'Đã lưu'}</span>
                  </>
                )}
              </button>
            )}

            {isPublished ? (
              <button
                type="button"
                disabled
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed select-none shadow-none"
                title="Chuyến đi đã xuất bản ở chế độ chỉ xem"
              >
                <Lock size={13} />
                <span>Đã xuất bản</span>
              </button>
            ) : (
              roleLower === 'owner' && (
                <button
                  type="button"
                  onClick={onPublishTrip}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer bg-emerald-800 hover:bg-emerald-900 text-white"
                  title="Xuất bản chuyến đi công khai cho cộng đồng"
                >
                  <Send size={13} />
                  <span>Xuất bản chuyến đi</span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Tổng điểm dừng:</span>
              <span className="font-bold text-slate-900">{totalStopsCount} điểm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Chi phí dự tính:</span>
              <span className="font-extrabold text-emerald-800">
                {totalTripCost.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="relative">
              <div
                onClick={() => canEdit && setIsEditingBudget(!isEditingBudget)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-colors ${canEdit ? 'cursor-pointer hover:bg-slate-50' : ''
                  } ${isOverBudget
                    ? 'border-red-200 bg-red-50/40 text-red-800'
                    : 'border-slate-200 bg-white text-slate-800'
                  }`}
                title={canEdit ? 'Nhấn để cài đặt ngân sách đề ra cho chuyến đi' : undefined}
              >
                <DollarSign size={13} className={isOverBudget ? 'text-red-600' : 'text-emerald-700'} />
                <span className="text-slate-500 font-medium">Ngân sách đề ra:</span>
                <span className="font-bold">
                  {budgetTarget.toLocaleString('vi-VN')} đ
                </span>

                {canEdit && (
                  <Pencil size={11} className="text-slate-400 hover:text-slate-700 ml-0.5" />
                )}

                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden ml-1 hidden sm:block">
                  <div
                    className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-600'
                      }`}
                    style={{
                      width: `${Math.min(100, percentUsed)}%`
                    }}
                  />
                </div>

                <span className={`text-[11px] font-bold ${isOverBudget ? 'text-red-600' : 'text-slate-500'}`}>
                  {percentUsed}%
                </span>

                {isOverBudget ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <AlertTriangle size={10} />
                    <span>Vượt {(totalTripCost - budgetTarget).toLocaleString('vi-VN')} đ</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded hidden lg:inline">
                    Còn {remainingBudget.toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>

              {isEditingBudget && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cài đặt ngân sách đề ra</span>
                    <span className="text-[11px] text-slate-400">VNĐ</span>
                  </div>

                  <form onSubmit={handleSaveBudget} className="space-y-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        step={500000}
                        min={0}
                        autoFocus
                        value={customBudgetString}
                        onChange={(e) => setCustomBudgetString(e.target.value)}
                        placeholder="Nhập mức ngân sách..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none pr-8"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        đ
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {BUDGET_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setCustomBudgetString(String(preset))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${parseInt(customBudgetString, 10) === preset
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                          {(preset / 1000000).toLocaleString('vi-VN')} triệu
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check size={13} />
                        <span>Lưu ngân sách</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingBudget(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <div
                onClick={() => canEdit && setIsEditingDates(!isEditingDates)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-colors ${canEdit ? 'cursor-pointer hover:bg-slate-50' : ''
                  } ${itinerary.startDate
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700'
                  }`}
                title={canEdit ? 'Nhấn để điều chỉnh ngày khởi hành & kết thúc của chuyến đi' : undefined}
              >
                <Calendar
                  size={13}
                  className={itinerary.startDate ? 'text-emerald-700' : 'text-slate-400'}
                />
                <span className="text-slate-500 font-medium">Thời gian:</span>
                <span className="font-bold">
                  {itinerary.startDate
                    ? `${formatDateDisplay(itinerary.startDate)} - ${formatDateDisplay(
                      itinerary.endDate ||
                      computeEndDateFromStart(itinerary.startDate, itinerary.days.length)
                    )}`
                    : 'Chưa đặt ngày'}
                </span>

                {canEdit && (
                  <Pencil size={11} className="text-slate-400 hover:text-slate-700 ml-0.5" />
                )}

                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                  {itinerary.days.length} ngày
                </span>
              </div>

              {isEditingDates && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Calendar size={14} className="text-emerald-700" />
                      <span>Thời gian chuyến đi ({itinerary.days.length} ngày)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingDates(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDates} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Ngày bắt đầu (Khởi hành) <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="date"
                        autoFocus
                        value={tempStartDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                        <span>Ngày kết thúc (Dự tính)</span>
                        <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-1 rounded">
                          Tự động tính
                        </span>
                      </label>
                      <input
                        type="date"
                        disabled
                        value={tempEndDate}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        * Tự động tính theo {itinerary.days.length} ngày của lịch trình.
                      </p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Chọn nhanh:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={handleQuickSetToday}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
                        >
                          Hôm nay
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickSetTomorrow}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
                        >
                          Ngày mai
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickSetNextWeekend}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-colors cursor-pointer"
                        >
                          Cuối tuần này
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check size={13} />
                        <span>Cập nhật ngày</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleStartDateChange('')
                          onUpdateDates?.(undefined, undefined)
                          setIsEditingDates(false)
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer"
                        title="Xóa ngày"
                      >
                        Xóa ngày
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItineraryPlannerToolbar
